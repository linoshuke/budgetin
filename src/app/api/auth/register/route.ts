import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";
import { validatePassword } from "@/lib/validators";
import { GENERIC_REQUEST_ERROR } from "@/lib/auth-errors";

export async function POST(request: Request) {
  const limiter = await rateLimit({ request, key: "auth:register", limit: 3, windowMs: 60_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak percobaan pendaftaran. Coba lagi sebentar." },
      { status: 429, headers: withNoStore(limiter.headers) },
    );
  }

  const supabase = await createServerSupabase();
  const { email, password, metadata } = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
    metadata?: Record<string, string>;
  };

  if (!email || !password) {
    return NextResponse.json(
      { error: "Email dan password wajib diisi." },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  if (!validatePassword(password)) {
    return NextResponse.json(
      { error: "Kata sandi minimal 8 karakter dengan huruf besar, huruf kecil, dan angka." },
      { status: 400, headers: withNoStore(limiter.headers) },
    );
  }

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: metadata ? { data: metadata } : undefined,
  });

  if (error) {
    console.error("Register failed:", error.message);
    return NextResponse.json(GENERIC_REQUEST_ERROR, {
      status: 400,
      headers: withNoStore(limiter.headers),
    });
  }

  return NextResponse.json(
    { user: data.user ?? null },
    { status: 200, headers: withNoStore(limiter.headers) },
  );
}
