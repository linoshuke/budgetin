import { supabase } from "@/lib/supabase";
import { NextResponse } from "next/server";

// GET /api/wallets - ambil semua dompet
export async function GET() {
  const { data, error } = await supabase
    .from("wallets")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) {
    const missingTable = error.code === "42P01";
    if (missingTable) {
      return NextResponse.json([]);
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const wallets = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    isDefault: row.is_default,
  }));

  return NextResponse.json(wallets);
}

// POST /api/wallets - tambah dompet baru
export async function POST(request: Request) {
  const body = await request.json();
  const name = String(body.name ?? "").trim();

  if (!name) {
    return NextResponse.json({ error: "Nama dompet wajib diisi." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("wallets")
    .insert({
      name,
      is_default: false,
    })
    .select()
    .single();

  if (error) {
    const missingTable = error.code === "42P01";
    if (missingTable) {
      return NextResponse.json(
        { error: "Tabel wallets belum tersedia. Jalankan schema terbaru di Supabase." },
        { status: 500 },
      );
    }

    const normalized = error.message.toLowerCase();
    const duplicate = normalized.includes("duplicate") || normalized.includes("unique");

    return NextResponse.json(
      { error: duplicate ? "Nama dompet sudah digunakan." : error.message },
      { status: duplicate ? 409 : 500 },
    );
  }

  const wallet = {
    id: data.id,
    name: data.name,
    isDefault: data.is_default,
  };

  return NextResponse.json(wallet, { status: 201 });
}
