import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

// ID profil default (single-user, belum ada auth)
const DEFAULT_PROFILE_ID = "00000000-0000-4000-8000-000000000001";

// GET /api/profiles — ambil profil user
export async function GET() {
    const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", DEFAULT_PROFILE_ID)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        name: data.name,
        email: data.email,
        theme: data.theme,
    });
}

// PUT /api/profiles — update profil user
export async function PUT(request: Request) {
    const body = await request.json();

    const updatePayload: Record<string, unknown> = {};
    if (body.name !== undefined) updatePayload.name = body.name;
    if (body.email !== undefined) updatePayload.email = body.email;
    if (body.theme !== undefined) updatePayload.theme = body.theme;

    const { data, error } = await supabase
        .from("profiles")
        .update(updatePayload)
        .eq("id", DEFAULT_PROFILE_ID)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
        name: data.name,
        email: data.email,
        theme: data.theme,
    });
}
