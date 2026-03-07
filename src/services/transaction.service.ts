import type { SupabaseClient } from "@supabase/supabase-js";
import type { Transaction } from "@/types/transaction";
import {
    type CreateTransactionDTO,
    type UpdateTransactionDTO,
    mapRowToTransaction,
    mapRowsToTransactions,
    mapCreateDTOToInsertRow,
    mapUpdateDTOToUpdateRow,
} from "@/models/transaction.model";
import { ServiceError } from "@/lib/service-error";

export async function getAllTransactions(
    supabase: SupabaseClient,
    userId: string,
): Promise<Transaction[]> {
    const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

    if (error) {
        throw new ServiceError(error.message);
    }

    return mapRowsToTransactions(data ?? []);
}

export async function getTransactionById(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<Transaction> {
    const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single();

    if (error) {
        const notFound = error.code === "PGRST116";
        throw new ServiceError(
            notFound ? "Transaksi tidak ditemukan." : error.message,
            notFound ? 404 : 500,
        );
    }

    return mapRowToTransaction(data);
}

export async function getTransactionsByFilter(
    supabase: SupabaseClient,
    userId: string,
    options: {
        walletId?: string;
        categoryId?: string;
        dateFrom?: string;
        dateTo?: string;
    },
): Promise<Transaction[]> {
    let query = supabase
        .from("transactions")
        .select("*")
        .eq("user_id", userId)
        .order("date", { ascending: false });

    if (options.walletId) {
        query = query.eq("wallet_id", options.walletId);
    }
    if (options.categoryId) {
        query = query.eq("category_id", options.categoryId);
    }
    if (options.dateFrom) {
        query = query.gte("date", options.dateFrom);
    }
    if (options.dateTo) {
        query = query.lte("date", options.dateTo);
    }

    const { data, error } = await query;

    if (error) {
        throw new ServiceError(error.message);
    }

    return mapRowsToTransactions(data ?? []);
}

export async function createTransaction(
    supabase: SupabaseClient,
    userId: string,
    dto: CreateTransactionDTO,
): Promise<Transaction> {
    const insertRow = {
        ...mapCreateDTOToInsertRow(dto),
        user_id: userId,
    };

    const { data, error } = await supabase
        .from("transactions")
        .insert(insertRow)
        .select()
        .single();

    if (error) {
        throw new ServiceError(error.message);
    }

    return mapRowToTransaction(data);
}

export async function updateTransaction(
    supabase: SupabaseClient,
    userId: string,
    id: string,
    dto: UpdateTransactionDTO,
): Promise<Transaction> {
    const updateRow = mapUpdateDTOToUpdateRow(dto);

    const { data, error } = await supabase
        .from("transactions")
        .update(updateRow)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single();

    if (error) {
        throw new ServiceError(error.message);
    }

    return mapRowToTransaction(data);
}

export async function deleteTransaction(
    supabase: SupabaseClient,
    userId: string,
    id: string,
): Promise<void> {
    const { error } = await supabase
        .from("transactions")
        .delete()
        .eq("id", id)
        .eq("user_id", userId);

    if (error) {
        throw new ServiceError(error.message);
    }
}
