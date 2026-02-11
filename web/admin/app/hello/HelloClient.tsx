"use client";

import { useEffect, useMemo, useState } from "react";

type HelloResponse =
  | { message: string }
  | {
      error: string;
    };

export default function HelloClient() {
  const [name, setName] = useState("world");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HelloResponse | null>(null);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (name) params.set("name", name);
    return `/api/hello?${params.toString()}`;
  }, [name]);

  async function run() {
    setLoading(true);
    try {
      const res = await fetch(url, { cache: "no-store" });
      const json = (await res.json()) as HelloResponse;
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <label className="text-sm font-medium">name</label>
        <input
          className="h-10 rounded-md border border-zinc-200 px-3 text-sm dark:border-zinc-800 dark:bg-black"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button
          className="h-10 rounded-md bg-black px-4 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
          onClick={() => void run()}
          disabled={loading}
        >
          {loading ? "Calling..." : "Call Hello"}
        </button>
      </div>

      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-2 font-medium">Response</div>
        <pre className="overflow-auto">{data ? JSON.stringify(data, null, 2) : "-"}</pre>
      </div>

      <p className="text-xs text-zinc-500">
        gRPC endpoint: <code>ADMIN_GRPC_ADDR</code> (default: 127.0.0.1:50051)
      </p>
    </div>
  );
}
