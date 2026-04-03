import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";

export async function POST(request: Request) {
  const limiter = await rateLimit({ request, key: "auth:login", limit: 5, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan login. Coba lagi sebentar." },
      { status: 429, headers: withNoStore(limiter.headers) },
    );
  }

  const supabase = await createServerSupabase();
  const { email, password } = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email dan password wajib diisi." },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 401, headers: withNoStore(limiter.headers) },
    );
  }

  return NextResponse.json(
    { user: data.user ?? null },
    { status: 200, headers: withNoStore(limiter.headers) },
  );
}
