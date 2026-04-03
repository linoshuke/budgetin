import { NextResponse } from "next/server";
import { handleServiceError } from "@/lib/service-error";
import { getAuthUser } from "@/lib/auth";
import { getAllWallets, createWallet } from "@/app/api/wallets/service/wallet.service";
import { CreateWalletSchema } from "@/lib/validators";
import { ANON_LIMITS, enforceAnonCountLimit } from "@/lib/anonymous";
import { rateLimit } from "@/lib/rate-limit";
import { withNoStore } from "@/lib/http";

export async function GET() {
  try {
    const { user, supabase } = await getAuthUser();
    const wallets = await getAllWallets(supabase, user.id);
    return NextResponse.json(wallets, {
      headers: {
        "Cache-Control": "private, max-age=30, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await getAuthUser();
    const limiter = await rateLimit({
      request,
      key: `wallets:create:${user.id}`,
      limit: 10,
      windowMs: 60_000,
    });
    if (!limiter.ok) {
      return NextResponse.json(
        { error: "Terlalu banyak permintaan. Coba lagi sebentar." },
        { status: 429, headers: withNoStore(limiter.headers) },
      );
    }
    await enforceAnonCountLimit({
      supabase,
      user,
      table: "wallets",
      limit: ANON_LIMITS.wallets,
      message: `Akun anonim dibatasi hingga ${ANON_LIMITS.wallets} dompet. Masuk untuk menambah lebih banyak.`,
    });
    const raw = await request.json();
    const dto = CreateWalletSchema.parse(raw);
    const wallet = await createWallet(supabase, user.id, dto);
    return NextResponse.json(wallet, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: (error as import("zod").ZodError).issues.map(i => i.message).join(", ") }, { status: 400 });
    }
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}
