import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET /api/categories — ambil semua kategori
export async function GET() {
    const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("created_at", { ascending: true });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const categories = (data ?? []).map((row) => ({
        id: row.id,
        name: row.name,
        icon: row.icon,
        color: row.color,
        type: row.type,
        isDefault: row.is_default,
    }));

    return NextResponse.json(categories);
}

// POST /api/categories — tambah kategori baru
export async function POST(request: Request) {
    const body = await request.json();

    const { data, error } = await supabase
        .from("categories")
        .insert({
            name: body.name,
            icon: body.icon ?? "MISC",
            color: body.color ?? "#64748b",
            type: body.type,
            is_default: false,
        })
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const category = {
        id: data.id,
        name: data.name,
        icon: data.icon,
        color: data.color,
        type: data.type,
        isDefault: data.is_default,
    };

    return NextResponse.json(category, { status: 201 });
}
