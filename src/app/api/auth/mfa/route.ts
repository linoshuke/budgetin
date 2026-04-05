import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase-server";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";

const GENERIC_ERROR = { error: "Permintaan MFA tidak dapat diproses." };

export async function POST(request: Request) {
  // Align with WAF/CDN playbook defaults: 6 req / 5m.
  const limiter = await rateLimit({ request, key: "auth:mfa", limit: 6, windowMs: 300_000 });
  if (!limiter.ok) {
    return NextResponse.json(
      { error: "Terlalu banyak permintaan MFA. Coba lagi sebentar." },
      { status: 429, headers: withNoStore(limiter.headers) },
    );
  }

  const supabase = await createServerSupabase();
  const { action, code, factorId } = (await request.json().catch(() => ({}))) as {
    action?: "enroll" | "verify";
    code?: string;
    factorId?: string;
  };

  if (action === "enroll") {
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error || !data?.id) {
      return NextResponse.json(GENERIC_ERROR, { status: 400, headers: withNoStore(limiter.headers) });
    }
    return NextResponse.json(
      { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret },
      { status: 200, headers: withNoStore(limiter.headers) },
    );
  }

  if (action === "verify") {
    if (!factorId || !code) {
      return NextResponse.json(
        { error: "Kode atau faktor MFA tidak valid." },
        { status: 400, headers: withNoStore(limiter.headers) },
      );
    }
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code });
    if (error) {
      return NextResponse.json(
        { error: "Kode MFA salah atau kedaluwarsa." },
        { status: 401, headers: withNoStore(limiter.headers) },
      );
    }
    await supabase.auth.updateUser({
      data: {
        mfa_enrolled: true,
        mfa_factor_id: factorId,
        mfa_verified_at: Date.now(),
      },
    });
    const response = NextResponse.json({ ok: true }, { status: 200, headers: withNoStore(limiter.headers) });
    response.cookies.set("mfa_enrolled", "true", {
      sameSite: "lax",
      secure: true,
      httpOnly: false,
      path: "/",
    });
    return response;
  }

  return NextResponse.json(GENERIC_ERROR, { status: 400, headers: withNoStore(limiter.headers) });
}
