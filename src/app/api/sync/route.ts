import { NextResponse } from "next/server";
import { handleServiceError, ServiceError } from "@/lib/service-error";
import { getAuthUser } from "@/lib/auth";
import { SyncGuestSchema } from "@/lib/validators";

export async function POST(request: Request) {
  try {
    const { supabase } = await getAuthUser();
    const raw = await request.json();
    const dto = SyncGuestSchema.parse(raw);

    const { data, error } = await supabase.rpc("sync_guest_data", {
      payload: dto,
    });

    if (error) {
      throw new ServiceError(error.message, 500);
    }

    return NextResponse.json(data ?? { status: "ok" });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      return NextResponse.json(
        { error: (error as import("zod").ZodError).issues.map((i) => i.message).join(", ") },
        { status: 400 },
      );
    }
    const { body, status } = handleServiceError(error);
    return NextResponse.json(body, { status });
  }
}
