import { NextResponse } from "next/server";
import { handleServiceError } from "@/lib/service-error";
import { getAuthUser } from "@/lib/auth";
import { getAllTransactions, createTransaction } from "@/services/transaction.service";
import { CreateTransactionSchema } from "@/lib/validators";

export async function GET() {
  try {
    const { user, supabase } = await getAuthUser();
    const transactions = await getAllTransactions(supabase, user.id);
    return NextResponse.json(transactions);
  } catch (error) {
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await getAuthUser();
    const raw = await request.json();
    const dto = CreateTransactionSchema.parse(raw);
    const transaction = await createTransaction(supabase, user.id, dto);
    return NextResponse.json(transaction, { status: 201 });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json({ error: (error as import("zod").ZodError).issues.map(i => i.message).join(", ") }, { status: 400 });
    }
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}
