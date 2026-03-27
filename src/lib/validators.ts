import { z } from "zod";

export const CreateTransactionSchema = z.object({
    type: z.enum(["income", "expense"], {
        message: "Tipe transaksi harus 'income' atau 'expense'.",
    }),
    amount: z.number({ message: "Jumlah harus berupa angka." }).positive("Jumlah harus lebih dari 0."),
    categoryId: z.string().uuid("Category ID harus berupa UUID yang valid."),
    walletId: z.string().uuid("Wallet ID harus berupa UUID yang valid."),
    date: z.string().date("Format tanggal harus YYYY-MM-DD."),
    note: z.string().max(500, "Catatan maksimal 500 karakter.").optional().default(""),
});

export const UpdateTransactionSchema = CreateTransactionSchema;

export const CreateCategorySchema = z.object({
    name: z.string().min(1, "Nama kategori wajib diisi.").max(100, "Nama kategori maksimal 100 karakter."),
    icon: z.string().max(20).optional().default("MISC"),
    color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Format warna harus hex (#RRGGBB).").optional().default("#64748b"),
    type: z.enum(["income", "expense", "both"], {
        message: "Tipe kategori harus 'income', 'expense', atau 'both'.",
    }),
});

export const CreateWalletSchema = z.object({
    name: z.string().min(1, "Nama dompet wajib diisi.").max(100, "Nama dompet maksimal 100 karakter."),
    category: z.string().min(1, "Kategori dompet wajib diisi.").max(50, "Kategori dompet maksimal 50 karakter."),
    location: z.string().min(1, "Lokasi dompet wajib diisi.").max(50, "Lokasi dompet maksimal 50 karakter."),
});

export const UpdateWalletSchema = z.object({
    name: z.string().min(1, "Nama dompet wajib diisi.").max(100, "Nama dompet maksimal 100 karakter."),
    category: z.string().min(1, "Kategori dompet wajib diisi.").max(50, "Kategori dompet maksimal 50 karakter.").optional(),
    location: z.string().min(1, "Lokasi dompet wajib diisi.").max(50, "Lokasi dompet maksimal 50 karakter.").optional(),
});

export const UpdateProfileSchema = z.object({
    name: z.string().min(1, "Nama tidak boleh kosong.").max(100, "Nama maksimal 100 karakter.").optional(),
    email: z.string().email("Format email tidak valid.").optional(),
    theme: z.enum(["light", "dark"], {
        message: "Tema harus 'light' atau 'dark'.",
    }).optional(),
});

export const SyncGuestSchema = z.object({
    categories: z.array(
        z.object({
            clientId: z.string().uuid("Client ID kategori harus UUID."),
            name: z.string().min(1, "Nama kategori wajib diisi.").max(100),
            icon: z.string().max(20).optional().default("MISC"),
            color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional().default("#64748b"),
            type: z.enum(["income", "expense", "both"]),
        }),
    ).default([]),
    wallets: z.array(
        z.object({
            clientId: z.string().uuid("Client ID dompet harus UUID."),
            name: z.string().min(1, "Nama dompet wajib diisi.").max(100),
            category: z.string().min(1).max(50).optional().default("Umum"),
            location: z.string().min(1).max(50).optional().default("Lokal"),
        }),
    ).default([]),
    transactions: z.array(
        z.object({
            clientId: z.string().uuid("Client ID transaksi harus UUID."),
            type: z.enum(["income", "expense"], {
                message: "Tipe transaksi harus 'income' atau 'expense'.",
            }),
            amount: z.number().positive("Jumlah harus lebih dari 0."),
            categoryName: z.string().min(1, "Nama kategori wajib diisi."),
            categoryType: z.enum(["income", "expense", "both"]),
            walletName: z.string().optional().default(""),
            date: z.string().date("Format tanggal harus YYYY-MM-DD."),
            note: z.string().max(500, "Catatan maksimal 500 karakter.").optional().default(""),
        }),
    ).default([]),
});
