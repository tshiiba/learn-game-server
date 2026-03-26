"use client";

import { useMemo, useState } from "react";

type HelloResponse =
  | { message: string }
  | {
      error: string;
    };

export default function HelloClient() {
  const [name, setName] = useState("world");
  const [token, setToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<HelloResponse | null>(null);

  const url = useMemo(() => {
    const params = new URLSearchParams();
    if (name) params.set("name", name);
    return `/api/hello?${params.toString()}`;
  }, [name]);

  async function run(withAuthorization: boolean) {
    setLoading(true);
    try {
      const headers = new Headers();
      const authorization = withAuthorization ? toAuthorizationHeader(token) : null;
      if (authorization) {
        headers.set("Authorization", authorization);
      }

      const res = await fetch(url, {
        cache: "no-store",
        headers,
      });
      const json = (await res.json()) as HelloResponse;
      setData(json);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">name</label>
        <input
          className="h-10 w-full rounded-md border border-zinc-200 px-3 text-sm dark:border-zinc-800 dark:bg-black"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-4">
          <label className="text-sm font-medium">Access token</label>
          <span className="text-xs text-zinc-500">
            `admin-cognito` で取得した token を貼り付け
          </span>
        </div>
        <textarea
          className="min-h-40 w-full rounded-md border border-zinc-200 px-3 py-2 text-xs dark:border-zinc-800 dark:bg-black"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
          spellCheck={false}
        />
      </div>

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <button
          className="h-10 rounded-md border border-zinc-300 px-4 text-sm font-medium text-zinc-900 disabled:opacity-60 dark:border-zinc-700 dark:text-zinc-50"
          onClick={() => void run(false)}
          disabled={loading}
        >
          {loading ? "Calling..." : "Call without auth"}
        </button>
        <button
          className="h-10 rounded-md bg-black px-4 text-sm font-medium text-white disabled:opacity-60 dark:bg-white dark:text-black"
          onClick={() => void run(true)}
          disabled={loading}
        >
          {loading ? "Calling..." : "Call with auth"}
        </button>
      </div>

      <div className="rounded-md border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
        <div className="mb-2 font-medium">Response</div>
        <pre className="overflow-auto">{data ? JSON.stringify(data, null, 2) : "-"}</pre>
      </div>

      <p className="text-xs text-zinc-500">
        Next Route Handler が `Authorization` header を Go gRPC metadata に転送します。
      </p>
    </div>
  );
}

function toAuthorizationHeader(token: string): string | null {
  const value = token.trim();
  if (!value) {
    return null;
  }

  if (value.startsWith("Bearer ")) {
    return value;
  }

  return `Bearer ${value}`;
}
