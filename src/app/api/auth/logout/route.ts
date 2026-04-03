import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { withNoStore } from "@/lib/http";

export async function POST() {
  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: withNoStore() },
    );
  }

  return NextResponse.json({ ok: true }, { status: 200, headers: withNoStore() });
}
