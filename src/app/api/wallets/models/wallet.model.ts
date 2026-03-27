import type { Wallet } from "@/types/wallet";

export interface WalletRow {
    id: string;
    user_id: string;
    name: string;
    is_default: boolean;
    created_at: string;
}

export interface CreateWalletDTO {
    name: string;
}

export function mapRowToWallet(row: WalletRow): Wallet {
    return {
        id: row.id,
        name: row.name,
        isDefault: row.is_default,
    };
}

export function mapRowsToWallets(rows: WalletRow[]): Wallet[] {
    return rows.map(mapRowToWallet);
}

export function mapDTOToInsertRow(dto: CreateWalletDTO): Omit<WalletRow, "id" | "user_id" | "created_at"> {
    return {
        name: dto.name,
        is_default: false,
    };
}
