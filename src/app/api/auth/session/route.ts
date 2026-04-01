import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";

export async function GET() {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  return NextResponse.json({ user: data.user ?? null }, { status: 200 });
}
