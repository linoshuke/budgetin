import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { handleServiceError } from "@/lib/service-error";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const { user, supabase } = await getAuthUser();
    const { id } = await context.params;
    const raw = (await request.json().catch(() => ({}))) as {
      name?: string;
      targetAmount?: number;
      currentAmount?: number;
      targetDate?: string | null;
    };

    const updates: Record<string, unknown> = {};
    if (raw.name !== undefined) updates.name = raw.name;
    if (raw.targetAmount !== undefined) updates.target_amount = raw.targetAmount;
    if (raw.currentAmount !== undefined) updates.current_amount = raw.currentAmount;
    if (raw.targetDate !== undefined) updates.target_date = raw.targetDate;

    const { data, error } = await supabase
      .from("goals")
      .update(updates)
      .eq("id", id)
      .eq("user_id", user.id)
      .select("id, user_id, name, target_amount, current_amount, target_date, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  try {
    const { user, supabase } = await getAuthUser();
    const { id } = await context.params;

    const { error } = await supabase
      .from("goals")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (error) {
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}
