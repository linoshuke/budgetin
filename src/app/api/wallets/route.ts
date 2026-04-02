import { NextResponse } from "next/server";
import { handleServiceError } from "@/lib/service-error";
import { getAuthUser } from "@/lib/auth";
import { getAllWallets, createWallet } from "@/app/api/wallets/service/wallet.service";
import { CreateWalletSchema } from "@/lib/validators";
import { ANON_LIMITS, enforceAnonCountLimit } from "@/lib/anonymous";

export async function GET() {
  try {
    const { user, supabase } = await getAuthUser();
    const wallets = await getAllWallets(supabase, user.id);
    return NextResponse.json(wallets);
  } catch (error) {
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await getAuthUser();
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
