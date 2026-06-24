import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST ?? "127.0.0.1:1999";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const roomCode = code.toUpperCase();

  // Check Supabase for whether this room code was ever registered and is still active
  const { data: hostRow } = await supabase
    .from("hosts")
    .select("active")
    .eq("room_code", roomCode)
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  // Room was never registered, or was deactivated
  const active = hostRow?.active ?? false;

  // Also check PartyKit in-memory state for live host presence
  const protocol = PARTYKIT_HOST.startsWith("localhost") || PARTYKIT_HOST.startsWith("127.") ? "http" : "https";
  try {
    const res = await fetch(`${protocol}://${PARTYKIT_HOST}/parties/main/${roomCode}`);
    const data = await res.json() as { exists: boolean; hostActive: boolean; inProgress: boolean; playerNicknames: string[] };
    return NextResponse.json({ ...data, active });
  } catch {
    return NextResponse.json({ exists: false, hostActive: false, inProgress: false, playerNicknames: [], active });
  }
}
