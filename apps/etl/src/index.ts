import "dotenv/config";
import axios from "axios";
import db from "@repo/database";
import { solicitations, SolicitationInsert, SolicitationInsertSchema,
   topics, TopicInsert, TopicInsertSchema, subtopics, SubtopicInsert, SubtopicInsertSchema } from "@repo/database";
import { eq } from "drizzle-orm";

async function fetchSolicitationsByPagination(start: number, rows: number) {
  // No query strings because wrong order such as
  // https://api.www.sbir.gov/public/api/solicitations?rows=10&start=0
  // times out

  const url = `https://api.www.sbir.gov/public/api/solicitations?start=${start}&rows=${rows}`;

  try {
    const response = await axios.get(url, { timeout: 5000 }); 
    return response.data;
  } catch (error) {
    console.error("Error fetching solicitations:", error);
    throw error;
  }
}

async function fetchAllSolicitations() {
  const allSolicitations: any = []; // We will validate this later
  let start = 0;
  const rows = 10; // Only 10 despite documentation saying 50 max
  const rowLimit = 100; // Limits for testing only

  while (start < rowLimit) {
    const data = await fetchSolicitationsByPagination(start, rows);
    console.log(`Fetched ${data.length} solicitations from start=${start}`);

    if (!data && data.length > 0) {
      console.error("No data returned or empty array");
      break; // Exit if no data is returned
    }

    allSolicitations.push(...data);
    start += rows;
  }

  return allSolicitations;
}


async function main() {
  // Delete all existing data
  await db.delete(subtopics);
  await db.delete(topics);
  await db.delete(solicitations);

  // Fetch all data with pagination
  const solData = await fetchAllSolicitations();

  for (const s of solData) {
    try {
      // Insert solicitation
      const [solicitationRow] = await db.insert(solicitations).values({
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
      }).returning({ id: solicitations.id });

      for (const t of s.solicitation_topics ?? []) {
        try {
          // Insert topic
          const [topicRow] = await db.insert(topics).values({
            solicitationFK: solicitationRow.id,
            topicTitle: t.topic_title,
            topicNumber: t.topic_number,
            branch: t.branch,
            topicOpenDate: t.topic_open_date,
            topicClosedDate: t.topic_closed_date,
            topicDescription: t.topic_description,
            sbirTopicLink: t.sbir_topic_link,
          }).returning({ id: topics.id });
         
          // Skip if subtopics is null, not an array, has length 0, or the first value is an empty object
          // Why? Because this is valid: [{}]
          if (!t.subtopics || !Array.isArray(t.subtopics) || t.subtopics.length === 0 || (t.subtopics.length === 1 && Object.keys(t.subtopics[0]).length === 0)) {
            continue;
          }

          for (const st of t.subtopics) {
            try {
              // Insert subtopic
              await db.insert(subtopics).values({
                topicFK: topicRow.id, 
                subtopicTitle: st.subtopic_title,
                branch: st.branch,
                subtopicNumber: st.subtopic_number,
                subtopicDescription: st.subtopic_description,
                sbirSubtopicLink: st.sbir_subtopic_link,
              });
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