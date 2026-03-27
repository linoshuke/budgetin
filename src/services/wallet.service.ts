import type { SupabaseClient } from "@supabase/supabase-js";
import type { Wallet } from "@/types/wallet";
import {
    type CreateWalletDTO,
    mapRowToWallet,
    mapRowsToWallets,
    mapDTOToInsertRow,
} from "@/models/wallet.model";
import { ServiceError } from "@/lib/service-error";

export async function getAllWallets(
    supabase: SupabaseClient,
    userId: string,
): Promise<Wallet[]> {
    const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });

    if (error) {
        throw new ServiceError(error.message);
    }

    return mapRowsToWallets(data ?? []);
}

export async function getWalletById(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<Wallet> {
    const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

    if (error) {
        const notFound = error.code === "PGRST116";
        throw new ServiceError(
            notFound ? "Dompet tidak ditemukan." : error.message,
            notFound ? 404 : 500,
        );
    }

    return mapRowToWallet(data);
}

export async function createWallet(
    supabase: SupabaseClient,
    userId: string,
    dto: CreateWalletDTO,
): Promise<Wallet> {
    const name = dto.name?.trim();
    if (!name) {
        throw new ServiceError("Nama dompet wajib diisi.", 400);
    }

    const insertRow = {
        ...mapDTOToInsertRow({ name }),
        user_id: userId,
    };

    const { data, error } = await supabase
        .from("wallets")
        .insert(insertRow)
        .select()
        .single();

    if (error) {
        const normalized = error.message.toLowerCase();
        const isDuplicate = normalized.includes("duplicate") || normalized.includes("unique");
        if (isDuplicate) {
            throw new ServiceError("Nama dompet sudah digunakan.", 409);
        }
        throw new ServiceError(error.message);
    }

    return mapRowToWallet(data);
}

export async function deleteWallet(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<void> {
    const existing = await getWalletById(supabase, userId, id);
    if (existing.isDefault) {
        throw new ServiceError("Dompet default tidak dapat dihapus.", 400);
    }

    const { error } = await supabase
        .from("wallets")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

    if (error) {
        throw new ServiceError(error.message);
    }
}
