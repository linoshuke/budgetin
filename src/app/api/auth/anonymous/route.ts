import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_ALLOW_ANONYMOUS !== "true") {
    return NextResponse.json(
      { user: null, disabled: true },
      { status: 200, headers: withNoStore() },
    );
  }

  const limiter = await rateLimit({ request, key: "auth:anonymous", limit: 10, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
      { status: 429, headers: withNoStore(limiter.headers) },
    );
  }
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  return NextResponse.json(
    { user: data.user ?? null },
    { status: 200, headers: withNoStore(limiter.headers) },
  );
}
