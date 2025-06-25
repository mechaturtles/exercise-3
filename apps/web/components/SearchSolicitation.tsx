"use client";

import { useState, useEffect } from "react";
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";
import { Card, CardHeader, CardContent, CardTitle } from "@repo/ui/components/card";
import { Dialog, DialogContent, DialogOverlay, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from "@repo/ui/components/dialog";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@repo/ui/components/select";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@repo/ui/components/pagination"
import { useAPI } from "trpc/hooks";
import { SolicitationSearchRes, TopicsSearchRes } from "@repo/api-server";

function SolicitationCard({ solicitation, onClick }: { solicitation: SolicitationSearchRes[number]; onClick: () => void }) {
  return (
    <Card onClick={onClick} style={{ cursor: "pointer" }}>
      <CardHeader>
        <CardTitle>{solicitation.solicitationTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>ID: {solicitation.id}</p>
        <p>{solicitation.solicitationYear}</p>
        <p>Open date: {solicitation.openDate} Close date: {solicitation.closeDate}</p>
        <p>Agency: {solicitation.agency ? `${AGENCY_DICTIONARY[solicitation.agency] || solicitation.agency}` : "N/A"}</p>
      </CardContent>
    </Card>
  );
}

function TopicCard({ topic, onClick }: { topic: TopicsSearchRes[number]; onClick: () => void }) {
  return (
    <Card onClick={onClick} style={{ cursor: "pointer" }}>
      <CardHeader>
        <CardTitle>{topic.topicTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>{topic.topicDescription?.slice(0, 100)}{topic.topicDescription && topic.topicDescription.length > 100 ? "..." : ""}</p>
        <p>Agency: {topic.solicitation?.agency ? `${AGENCY_DICTIONARY[topic.solicitation.agency] || topic.solicitation.agency}` : "N/A"}</p>
        <p>Branch: {topic.branch}</p>
        <p>Open date: {topic.solicitation?.openDate} Closed date: {topic.solicitation?.closeDate}</p>
        <p>Topic number: {topic.topicNumber}</p>
        <p>ID: {topic.id}</p>
        <p>Solicitation: {topic.solicitation?.solicitationTitle}</p>
      </CardContent>
    </Card>
  );
}

const AGENCY_DICTIONARY: Record<string, string> = {
  DOD: "Department of Defense",
  HHS: "Department of Health and Human Services",
  NASA: "National Aeronautics and Space Administration",
  NSF: "National Science Foundation",
  DOE: "Department of Energy",
  USDA: "United States Department of Agriculture",
  EPA: "Environmental Protection Agency",
  DOC: "Department of Commerce",
  ED: "Department of Education",
  DOT: "Department of Transportation",
  DHS: "Department of Homeland Security",
};

function TopicDialog({ topic, onClose }: { topic: TopicsSearchRes[number]; onClose: () => void }) {
  const reusableStyles = {
    sectionTitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      marginBottom: '8px',
      color: 'var(--text-primary)'
    },
    descriptionBox: {
      fontSize: '1.2rem',
      lineHeight: '1.6',
      color: 'var(--text-primary)',
      backgroundColor: 'var(--background-light)',
      padding: '12px 20px',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    timeline: {
      display: 'flex',
      justifyContent: 'space-between',
      marginTop: '12px',
      padding: '8px 12px',
      backgroundColor: 'var(--background-light)',
      borderRadius: '8px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
    },
    timelineItem: {
      textAlign: 'center' as 'center',
      flex: 1
    }
  };

  return (
    <Dialog open={!!topic} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="min-w-3/4" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
        <DialogHeader>
          <DialogTitle style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            marginBottom: '12px',
            color: 'var(--text-primary)'
          }}>{topic?.topicTitle}</DialogTitle>

          {/* Parent Solicitation Details Section */}
          {topic?.solicitation && (
            <div style={{ marginBottom: '16px' }}>
              <h2 style={reusableStyles.sectionTitle}>Solicitation Details</h2>
              <div style={reusableStyles.descriptionBox}>
                <p><strong>Solicitation Number:</strong> {topic.solicitation.solicitationNumber}</p>
                <p><strong>Program:</strong> {topic.solicitation.program}</p>
                <p><strong>Phase:</strong> {topic.solicitation.phase}</p>
                <p><strong>Agency:</strong> {topic.solicitation.agency ? `${AGENCY_DICTIONARY[topic.solicitation.agency] || topic.solicitation.agency}` : topic.solicitation.agency}</p>
                <p><strong>Branch:</strong> {topic.solicitation.branch}</p>
                <p><strong>Year:</strong> {topic.solicitation.solicitationYear}</p>
                <p><strong>Title:</strong> {topic.solicitation.solicitationTitle}</p>
              </div>

              {/* Timeline Section */}
              <div style={reusableStyles.timeline}>
                <div style={reusableStyles.timelineItem}>
                  <strong>Release Date</strong>
                  <p>{topic.solicitation.releaseDate || 'N/A'}</p>
                </div>
                <div style={reusableStyles.timelineItem}>
                  <strong>Open Date</strong>
                  <p>{topic.solicitation.openDate || 'N/A'}</p>
                </div>
                <div style={reusableStyles.timelineItem}>
                  <strong>Close Date</strong>
                  <p>{topic.solicitation.closeDate || 'N/A'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Description Section */}
          <h2 style={reusableStyles.sectionTitle}>Description</h2>
          <DialogDescription style={reusableStyles.descriptionBox}>
            {topic?.topicDescription}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button onClick={onClose}>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function SearchSolicitation() {
  const api = useAPI();

  // Filters
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [keywords, setKeywords] = useState("");
  const [selectTopicOrSolicitation, setSelectTopicOrSolicitation] = useState<"topic" | "solicitation">("topic");
  const [agency, setAgency] = useState("");
  const [branch, setBranch] = useState("");

  // Search results
  const [solicitationSearchResult, setSearchResult] = useState<SolicitationSearchRes>([]);
  const [topicSearchResult, setTopicSearchResult] = useState<TopicsSearchRes>([]);

  // Select a topic or solicitation
  const [selectedSolicitation, setSelectedSolicitation] = useState<SolicitationSearchRes[number] | null>(null);
  const [selectedTopic, setSelectedTopic] = useState<TopicsSearchRes[number] | null>(null);

  const handleSearch = async () => {
    const res = await api.solicitation.searchTopics.query({ limit, offset, keywords, solicitation: { agency } });
    setTopicSearchResult(res);
  };

  const handlePagination = async (newOffset: number) => {
    setOffset(newOffset);
    await handleSearch();
  };

  const handleCardClick = async (solicitation: SolicitationSearchRes[number]) => {
    setSelectedSolicitation(solicitation);
  };

  const handleTopicCardClick = async (topic: TopicsSearchRes[number]) => {
    setSelectedSolicitation(null);
    setSelectedTopic(topic);
  };
  
  const closeDialog = () => {
    setSelectedSolicitation(null);
  };

  useEffect(() => {
    handleSearch();
  }, []);

  return (
    <div>
      <div style={{
        position: 'sticky',
        backgroundColor: 'var(--background)',
        top: 0,
        zIndex: 50, // Lower the zIndex to ensure it does not stay in focus over dialogs
        padding: '16px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        alignItems: 'center',
      }}>
        <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold' }}>SBIR Topic Search</h1>
        <div style={{ display: 'flex', gap: '8px', width: '100%', maxWidth: '600px' }}>
          <Input
            placeholder="Enter keyword"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                handleSearch();
              }
            }}
            style={{ flex: 1 }}
          />
          <Select value={agency} onValueChange={(value) => setAgency(value)}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select an agency" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Agencies</SelectLabel>
                {Object.entries(AGENCY_DICTIONARY).map(([key, value]) => (
                  <SelectItem key={key} value={key}>[{key}] {value}</SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
          <Button onClick={handleSearch}>Search</Button>
        </div>
      </div>

      {/* {searchResult.length > 0 && (
        <div>
          {searchResult.map((solicitation) => (
            <SolicitationCard
              key={solicitation.id}
              solicitation={solicitation}
              onClick={() => handleCardClick(solicitation)}
            />
          ))}
        </div>
      )} */}

      {solicitationSearchResult.length > 0 && (
        <div>
          {solicitationSearchResult.map((solicitation) => (
            <SolicitationCard
              key={solicitation.id}
              solicitation={solicitation}
              onClick={() => handleCardClick(solicitation)}
            />
          ))}
        </div>
      )}
      
      {topicSearchResult.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {topicSearchResult.map((topic) => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onClick={() => handleTopicCardClick(topic)}
            />
          ))}
        </div>
      )}

      {selectedTopic && (
        <TopicDialog
          topic={selectedTopic}
          onClose={() => setSelectedTopic(null)}
        />
      )}

      <Pagination>
        <PaginationPrevious  onClick={() => handlePagination(Math.max(0, offset - limit))}> Previous </PaginationPrevious>
        <PaginationContent>
          { offset !== 0 && (
            <PaginationItem>
              <PaginationLink>{offset/limit}</PaginationLink>
            </PaginationItem>
          )}
          <PaginationItem>
            <PaginationLink isActive>{offset/limit + 1}</PaginationLink>
          </PaginationItem>
          <PaginationItem>
            <PaginationLink>{offset/limit + 2}</PaginationLink>
          </PaginationItem>
          { offset === 0 && (
            <PaginationItem>
              <PaginationLink>{offset/limit + 3}</PaginationLink>
            </PaginationItem>
          )}
        </PaginationContent>
        <PaginationNext onClick={() => handlePagination(offset + limit)}></PaginationNext>
      </Pagination>
    </div>
  );
}
