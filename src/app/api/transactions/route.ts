import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET /api/transactions — ambil semua transaksi
export async function GET() {
    const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map snake_case → camelCase agar sesuai dengan type Transaction
    const transactions = (data ?? []).map((row) => ({
        id: row.id,
        type: row.type,
        amount: Number(row.amount),
        categoryId: row.category_id,
        date: row.date,
        note: row.note ?? "",
    }));

    return NextResponse.json(transactions);
}

// POST /api/transactions — tambah transaksi baru
export async function POST(request: Request) {
    const body = await request.json();

    const { data, error } = await supabase
        .from("transactions")
        .insert({
            type: body.type,
            amount: body.amount,
            category_id: body.categoryId,
            date: body.date,
            note: body.note ?? "",
        })
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

    return NextResponse.json(transaction, { status: 201 });
}
