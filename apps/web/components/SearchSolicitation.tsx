"use client";

import { useState } from "react";
import { Input } from "@repo/ui/components/input";
import { Button } from "@repo/ui/components/button";
import { Card, CardHeader, CardContent, CardTitle } from "@repo/ui/components/card";
import { useAPI } from "trpc/hooks";
import { SolicitationGetByIdRes } from "@repo/api-server";

function SolicitationCard({ solicitation }: { solicitation: SolicitationGetByIdRes }) {
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

  const [solicitationId, setSolicitationId] = useState("");
  const [result, setResult] = useState<SolicitationGetByIdRes>();

  const handleSearch = async () => {
    const res = await api.solicitation.getById.query({ id: parseInt(solicitationId, 10) });
    setResult(res);
  };

  return (
    <div>
      <Input
        placeholder="Enter Solicitation ID"
        value={solicitationId}
        onChange={(e) => setSolicitationId(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSearch();
          }
        }}
      />
      <Button onClick={handleSearch}>Search</Button>

      {result && <SolicitationCard solicitation={result} />}
    </div>
  );
}
