import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { handleServiceError } from "@/lib/service-error";
import { assertRegisteredUser } from "@/lib/anonymous";

export async function GET() {
  try {
    const { user, supabase } = await getAuthUser();
    assertRegisteredUser(user, "Fitur goals hanya tersedia untuk akun terdaftar.");
    const { data, error } = await supabase
      .from("goals")
      .select("id, user_id, name, target_amount, current_amount, target_date, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return NextResponse.json(data ?? []);
  } catch (error) {
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}

export async function POST(request: Request) {
  try {
    const { user, supabase } = await getAuthUser();
    assertRegisteredUser(user, "Fitur goals hanya tersedia untuk akun terdaftar.");
    const raw = (await request.json().catch(() => ({}))) as {
      name?: string;
      targetAmount?: number;
      currentAmount?: number;
      targetDate?: string | null;
    };

    if (!raw.name || !raw.targetAmount) {
      return NextResponse.json({ error: "Nama dan target wajib diisi." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("goals")
      .insert({
        user_id: user.id,
        name: raw.name,
        target_amount: raw.targetAmount,
        current_amount: raw.currentAmount ?? 0,
        target_date: raw.targetDate ?? null,
      })
      .select("id, user_id, name, target_amount, current_amount, target_date, created_at")
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error) {
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}
