import "dotenv/config";
import axios from "axios";
import db from "@repo/database";
import { solicitations, SolicitationInsert, SolicitationInsertSchema,
   topics, TopicInsert, TopicInsertSchema, subtopics, SubtopicInsert, SubtopicInsertSchema } from "@repo/database";
import { sql } from "drizzle-orm/sql";

async function fetchSolicitationsByPagination(start: number, rows: number) {
  // Fetch solicitations with pagination
  // Start and rows order does matter and may time out if reversed
  const url = `https://api.www.sbir.gov/public/api/solicitations?start=${start}&rows=${rows}`;

  try {
    const response = await axios.get(url); 
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 404) {
        console.warn(`No results found for start=${start}, rows=${rows}. Proceeding with remaining data.`);
        return []; // Return an empty array to continue processing
      } else if (error.response?.status === 504) {
        console.error(`Request timed out for start=${start}, rows=${rows}. Logging and proceeding.`);
        return []; // Log and continue for 504 errors
      } else if (error.response?.status === 502) {
        console.error(`Bad Gateway for start=${start}, rows=${rows}. Logging and proceeding.`);
        return []; // Log and continue for 502 errors
      } else {
        console.error(`Unexpected status code ${error.response?.status} for start=${start}, rows=${rows}. Logging and proceeding.`);
        return []; // Log and continue for unknown status codes
      }
    }

    console.error("Error fetching solicitations:", error);
    throw error; // Re-throw other errors
  }
}

async function fetchAllSolicitations() {
  const allSolicitations: any = []; // We will validate this later
  const rows = 10 // Only 10 despite documentation saying 50 max
  const rowLimit = 10000 // Change limits based on testing needs!
  const concurrencyLimit = 5 // Adjust based on API rate limits and system capacity

  const fetchQueue: { promise: Promise<any>, isFulfilled: boolean }[] = []
  let activePromises = 0
  let stopFetching = false // Flag to stop fetching when 404 is encountered

  for (let start = 0; start < rowLimit && !stopFetching; start += rows) {
    // Wait if active promises reach the concurrency limit
    while (activePromises >= concurrencyLimit) {
      await Promise.race(fetchQueue.map((item) => item.promise));
      const fulfilledIndex = fetchQueue.findIndex((item) => item.isFulfilled);
      if (fulfilledIndex !== -1) fetchQueue.splice(fulfilledIndex, 1);
    }

    const fetchPromise = (async () => {
      activePromises++;
      try {
        const data = await fetchSolicitationsByPagination(start, rows);

        if (!data || data.length === 0) {
          console.log(`Offset = ${start}, received ${data.length}, current solicitation count: ${allSolicitations.length}`);
          console.log("No more data to fetch, stopping further requests.");
          stopFetching = true; // Stop further fetching
          return [];
        }

        allSolicitations.push(...data);
        console.log(`Offset = ${start}, received ${data.length}, current solicitation count: ${allSolicitations.length}`);

        return data;
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 404) {
          console.warn(`No results found for offset = ${start}, rows=${rows}. Logging and continuing.`);
          return []; // Log and continue fetching
        }
        console.error(`Error occurred for offset = ${start}, rows=${rows}. Logging and continuing.`);
        return []; // Log and continue fetching for other errors
      } finally {
        activePromises--;
      }
    })();

    const wrappedPromise = {
      promise: fetchPromise,
      isFulfilled: false,
    };

    fetchQueue.push(wrappedPromise);
    fetchPromise.then(() => (wrappedPromise.isFulfilled = true));
  }

  const results = await Promise.all(fetchQueue.map((item) => item.promise));
  results.forEach((data) => allSolicitations.push(...data));

  console.log(`Total solicitations received: ${allSolicitations.length}`); // Log the total count

  return allSolicitations;
}


async function main() {

  // Fetch all data with pagination
  const solData = await fetchAllSolicitations();

  // Delete all existing data
  // Faster than db.delete for our needs
  await db.execute(sql`TRUNCATE TABLE subtopics, topics, solicitations RESTART IDENTITY CASCADE`);

  for (const s of solData) {
    try {
      // Insert solicitation
      const solicitationData = {
        solicitationId: s.solicitation_id,
        solicitationTitle: s.solicitation_title,
        solicitationNumber: s.solicitation_number,
        program: s.program,
        phase: s.phase,
        agency: s.agency,
        branch: s.branch,
        solicitationYear: s.solicitation_year,
        releaseDate: s.release_date,
        openDate: s.open_date,
        closeDate: s.close_date,
        applicationDueDate: s.application_due_date,
        occurrence_number: s.occurrence_number,
        solicitationAgencyURL: s.solicitation_agency_url,
        currentStatus: s.current_status,
      }

      const parsedSol = SolicitationInsertSchema.safeParse(solicitationData);
      if (!parsedSol.success) {
        console.warn("Skipping invalid solicitation:", s, parsedSol.error.format());
        continue;
      }

      const [solicitationRow] = await db.insert(solicitations).values(solicitationData).returning({ id: solicitations.id });

      for (const t of s.solicitation_topics ?? []) {
        try {
          // Insert topic
          const topicData = {
            solicitationFK: solicitationRow.id,
            topicTitle: t.topic_title,
            topicNumber: t.topic_number,
            branch: t.branch,
            topicOpenDate: t.topic_open_date,
            topicClosedDate: t.topic_closed_date,
            topicDescription: t.topic_description,
            sbirTopicLink: t.sbir_topic_link,
          }

          const parsedTopic = TopicInsertSchema.safeParse(topicData);
          if (!parsedTopic.success) {
            console.warn("Skipping invalid topic:", t, parsedTopic.error.format());
            continue;
          }

          const [topicRow] = await db.insert(topics).values(topicData).returning({ id: topics.id });
         
          // Skip if subtopics is null, not an array, has length 0, or the first value is an empty object
          // Why? Because this is valid: [{}]
          if (!t.subtopics || !Array.isArray(t.subtopics) || t.subtopics.length === 0 || (t.subtopics.length === 1 && Object.keys(t.subtopics[0]).length === 0)) {
            continue;
          }

          for (const st of t.subtopics) {
            try {
              // Insert subtopic
              const subtopicData = {
                topicFK: topicRow.id,
                subtopicTitle: st.subtopic_title,
                branch: st.branch,
                subtopicNumber: st.subtopic_number,
                subtopicDescription: st.subtopic_description,
                sbirSubtopicLink: st.sbir_subtopic_link,
              }
              const parsedSubtopic = SubtopicInsertSchema.safeParse(subtopicData);
              if (!parsedSubtopic.success) {
                console.warn("Skipping invalid subtopic:", st, parsedSubtopic.error.format());
                continue;
              }
              await db.insert(subtopics).values(subtopicData).returning({ id: subtopics.id });
            } catch (subtopicError) {
              console.error("Failed to insert subtopic:", st, subtopicError);
            }
          }
        } catch (topicError) {
          console.error("Failed to insert topic:", t, topicError);
        }
      }
    } catch (solicitationError) {
      console.error("Failed to insert solicitation:", s, solicitationError);
    }
  }

  console.log("Data successfully inserted into the database.");
}

main().catch((error) => {
  console.error("Error in ETL process:", error);
})