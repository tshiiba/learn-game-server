import { NextResponse } from "next/server";

import { callHello } from "@/lib/sampleGrpc";

export const runtime = "nodejs";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name") ?? undefined;

  try {
    const result = await callHello(name);
    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
