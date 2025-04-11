"use client";

import { useState } from "react";

import { useAPI } from "trpc/hooks";
import { HelloWorldPingRes } from "@repo/api-server";

interface HelloProps {
  example: string;
}

export default function Hello(_props: HelloProps) {
  const api = useAPI();

  const [state, setState] = useState<HelloWorldPingRes>();

  const ping = async () => {
    const res = await api.helloWorld.ping.query({ hello: "hi" });
    setState(res);
  };

  return (
    <div>
      <div className="text-xl font-semibold">And I am client-rendered</div>
      <button
        onClick={ping}
        className="border border-gray-200 rounded-sm px-2 py-1 cursor-pointer"
      >
        Ping
      </button>
      {state ? (
        <div>Pong: {state.pong}</div>
      ) : (
        <div>(empty, click button above to execute API call)</div>
      )}
    </div>
  );
}
