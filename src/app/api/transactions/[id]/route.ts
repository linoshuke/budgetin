import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

interface RouteContext {
    params: Promise<{ id: string }>;
}

// PUT /api/transactions/:id — update transaksi
export async function PUT(request: Request, context: RouteContext) {
    const { id } = await context.params;
    const body = await request.json();

    const { data, error } = await supabase
        .from("transactions")
        .update({
            type: body.type,
            amount: body.amount,
            category_id: body.categoryId,
            date: body.date,
            note: body.note ?? "",
        })
        .eq("id", id)
        .select()
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const transaction = {
        id: data.id,
        type: data.type,
        amount: Number(data.amount),
        categoryId: data.category_id,
        date: data.date,
        note: data.note ?? "",
    };

    return NextResponse.json(transaction);
}

// DELETE /api/transactions/:id — hapus transaksi
export async function DELETE(_request: Request, context: RouteContext) {
    const { id } = await context.params;

    const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
}
