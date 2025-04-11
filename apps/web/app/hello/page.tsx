"use server";

import Hello from "./Hello";

export default async function HelloPage() {
  return (
    <div className="flex justify-center">
      <div className="mt-4 container mx-auto">
        <div className="text-4xl font-semibold">Hello, world.</div>
        <div className="text-gray-600">I am server-rendered</div>
        <Hello example="prop" />
      </div>
    </div>
  );
}
