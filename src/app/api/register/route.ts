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

export async function POST(req: NextRequest) {
  const body = await req.json() as { firstName: string; lastName: string; token: string };
  const { firstName, lastName, token } = body;

  if (!firstName?.trim() || !lastName?.trim() || !token?.trim()) {
    return NextResponse.json({ error: "All fields required." }, { status: 400 });
  }

  // For now, any non-empty token is accepted
  const roomCode = generateRoomCode();

  const { error } = await supabase.from("hosts").insert({
    first_name: firstName.trim(),
    last_name: lastName.trim(),
    room_code: roomCode,
    created_at: new Date().toISOString(),
  });

  if (error) {
    console.error("Supabase insert error:", error);
    return NextResponse.json({ error: "Failed to save host record." }, { status: 500 });
  }

  return NextResponse.json({ roomCode });
}
