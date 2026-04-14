import { NextRequest, NextResponse } from "next/server";

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "127.0.0.1:1999";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const protocol = PARTYKIT_HOST.startsWith("localhost") || PARTYKIT_HOST.startsWith("127.") ? "http" : "https";
  try {
    const res = await fetch(`${protocol}://${PARTYKIT_HOST}/parties/main/${code.toUpperCase()}`);
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "upstream_unavailable" }, { status: 502 });
  }
}
