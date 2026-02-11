import Link from "next/link";

import HelloClient from "./HelloClient";

export default function HelloPage() {
  return (
    <div className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900 dark:bg-black dark:text-zinc-50">
      <main className="mx-auto w-full max-w-3xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-2xl font-semibold">SampleService.Hello</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Next.js Route Handler → Go gRPC (api.admin.v1.SampleService/Hello)
          </p>
          <Link className="text-sm underline" href="/">
            ← Home
          </Link>
        </header>

        <HelloClient />
      </main>
    </div>
  );
}
