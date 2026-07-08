import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

function generateRoomCode(): string {
  const chars = "BCDFGHJKLMNPQRSTVWXYZ";
  let code = "";
  for (let i = 0; i < 4; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function generateHostToken(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let token = "";
  for (let i = 0; i < 32; i++) {
    token += chars[Math.floor(Math.random() * chars.length)];
  }
  return token;
}

export async function POST(req: NextRequest) {
  const body = await req.json() as { firstName: string; lastName: string; token?: string };
  const { firstName, lastName, token } = body;

  if (!firstName?.trim() || !lastName?.trim()) {
    return NextResponse.json({ error: "First and last name are required." }, { status: 400 });
  }

  // Sweep rooms older than 1 day — abandoned sessions where the host never disconnected
  // cleanly (no explicit disband, no PartyKit timeout). Time-based only; does not check
  // for active players.
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  await supabase
    .from("hosts")
    .update({ active: false })
    .eq("active", true)
    .lt("created_at", oneDayAgo);

  // Generate a room code that isn't already active
  let roomCode = generateRoomCode();
  for (let i = 0; i < 10; i++) {
    const { data } = await supabase
      .from("hosts")
      .select("id")
      .eq("room_code", roomCode)
      .eq("active", true)
      .limit(1)
      .single();
    if (!data) break;
    roomCode = generateRoomCode();
  }

  const hostToken = generateHostToken();

  const { error } = await supabase.from("hosts").insert({
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    token: token?.trim() || null,
    host_token: hostToken,
    room_code: roomCode,
    active: true,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ error: "Failed to save host record." }, { status: 500 });
  }

  return NextResponse.json({ roomCode, hostToken });
}
