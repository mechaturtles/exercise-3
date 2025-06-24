"use client";

import { useState } from "react";
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";
import { Card, CardHeader, CardContent, CardTitle } from "@repo/ui/components/card";
import { useAPI } from "trpc/hooks";
import { SolicitationSearchRes } from "@repo/api-server";

function SolicitationCard({ solicitation }: { solicitation: SolicitationSearchRes[number] }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{solicitation.solicitationTitle}</CardTitle>
      </CardHeader>
      <CardContent>
        <p>ID: {solicitation.id}</p>
        <p>{solicitation.solicitationYear}</p>
        <p>Open date: {solicitation.openDate} Close date: {solicitation.closeDate}</p>
      </CardContent>
    </Card>
  );
}

export default function SearchSolicitation() {
  const api = useAPI();

  const [keywords, setKeywords] = useState("");
  const [searchResult, setSearchResult] = useState<SolicitationSearchRes>([]);

  const handleSearch = async () => {
    const res = await api.solicitation.search.query({ keywords });
    setSearchResult(res);
  };

  return (
    <div>
      <Input
        placeholder="Enter solicitation keywords"
        value={keywords}
        onChange={(e) => setKeywords(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearch();
          }
        }}
      />
      <Button onClick={handleSearch}>Search</Button>

      {searchResult.length > 0 && (
        <div>
          {searchResult.map((solicitation) => (
            <SolicitationCard key={solicitation.id} solicitation={solicitation} />
          ))}
        </div>
      )}
    </div>
  );
}
