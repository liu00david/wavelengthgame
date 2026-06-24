import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const roomCode = code.toUpperCase();

  const { error } = await supabase
    .from("hosts")
    .update({ active: false })
    .eq("room_code", roomCode)
    .eq("active", true);

  if (error) {
    console.error("Supabase deactivate error:", error);
    return NextResponse.json({ error: "Failed to deactivate room." }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
