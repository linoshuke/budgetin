import { NextResponse } from "next/server";
import { handleServiceError } from "@/lib/service-error";
import { getAuthUser } from "@/lib/auth";
import { deleteWallet, updateWallet } from "@/app/api/wallets/service/wallet.service";
import { UpdateWalletSchema } from "@/lib/validators";

export async function PUT(request: Request, context: { params: { id: string } }) {
  try {
    const { user, supabase } = await getAuthUser();
    const raw = await request.json();
    const dto = UpdateWalletSchema.parse(raw);
    const wallet = await updateWallet(supabase, user.id, context.params.id, dto);
    return NextResponse.json(wallet);
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: (error as import("zod").ZodError).issues.map(i => i.message).join(", ") }, { status: 400 });
    }
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(_: Request, context: { params: { id: string } }) {
  try {
    const { user, supabase } = await getAuthUser();
    await deleteWallet(supabase, user.id, context.params.id);
    return NextResponse.json({ status: "deleted" }, { status: 200 });
  } catch (error) {
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}
