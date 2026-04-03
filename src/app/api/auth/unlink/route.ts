import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";

export async function POST(request: Request) {
  const limiter = await rateLimit({ request, key: "auth:unlink-identity", limit: 5, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan. Coba lagi sebentar." },
      { status: 429, headers: withNoStore(limiter.headers) },
    );
  }

  const { identityId } = (await request.json().catch(() => ({}))) as {
    identityId?: string;
  };

  if (!identityId) {
    return NextResponse.json(
      { error: "Identitas tidak ditemukan." },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  const supabase = await createServerSupabase();
  const { error } = await supabase.auth.unlinkIdentity({ identity_id: identityId });

  if (error) {
    return NextResponse.json(
      { error: error.message },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  return NextResponse.json(
    { ok: true },
    { status: 200, headers: withNoStore(limiter.headers) },
  );
}
