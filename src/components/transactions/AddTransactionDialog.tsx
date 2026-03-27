"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { supabase } from "@/lib/supabase/client";
import { useUIStore } from "@/stores/uiStore";

const schema = z.object({
  description: z.string().min(1, "Deskripsi wajib diisi"),
  amount: z.coerce.number().positive("Nominal harus lebih dari 0"),
  type: z.enum(["income", "expense"]),
});

type FormValues = z.infer<typeof schema>;

interface AddTransactionDialogProps {
  walletId: string;
  walletBalance: number;
}

export default function AddTransactionDialog({ walletId, walletBalance }: AddTransactionDialogProps) {
  const open = useUIStore((state) => state.modals.addTransaction);
  const closeModal = useUIStore((state) => state.closeModal);
  const pushToast = useUIStore((state) => state.pushToast);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { type: "expense" },
  });

  const typeValue = watch("type");

  const onSubmit = async (values: FormValues) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const user = userData.user;
      if (!user) throw new Error("Anda harus login.");

      const delta = values.type === "expense" ? -values.amount : values.amount;
      const newBalance = Number(walletBalance) + delta;
      const date = new Date();

      const { error: trxError } = await supabase.from("transactions").insert({
        wallet_id: walletId,
        user_id: user.id,
        description: values.description,
        amount: values.amount,
        type: values.type,
        date: date.toISOString().slice(0, 10),
      });
      if (trxError) throw trxError;

      const { error: walletError } = await supabase
        .from("wallets")
        .update({ balance: newBalance })
        .eq("id", walletId);
      if (walletError) throw walletError;

      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const { data: existing } = await supabase
        .from("monthly_summary")
        .select("*")
        .eq("user_id", user.id)
        .eq("wallet_id", walletId)
        .eq("year", year)
        .eq("month", month)
        .maybeSingle();

      if (existing) {
        const total_income = Number(existing.total_income ?? 0) + (values.type === "income" ? values.amount : 0);
        const total_expense = Number(existing.total_expense ?? 0) + (values.type === "expense" ? values.amount : 0);
        await supabase
          .from("monthly_summary")
          .update({ total_income, total_expense })
          .eq("id", existing.id);
      } else {
        await supabase.from("monthly_summary").insert({
          user_id: user.id,
          wallet_id: walletId,
          year,
          month,
          total_income: values.type === "income" ? values.amount : 0,
          total_expense: values.type === "expense" ? values.amount : 0,
        });
      }

      pushToast({ title: "Transaksi tersimpan", variant: "success" });
      reset();
      closeModal("addTransaction");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Terjadi kesalahan";
      pushToast({ title: "Gagal menambah transaksi", description: message, variant: "error" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => closeModal("addTransaction")}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transaksi Baru</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-xs text-[var(--text-dimmed)]">Deskripsi</label>
            <Input placeholder="Contoh: Belanja groceries" {...register("description")} />
            {errors.description ? (
              <p className="mt-1 text-xs text-rose-300">{errors.description.message}</p>
            ) : null}
          </div>
          <div>
            <label className="text-xs text-[var(--text-dimmed)]">Nominal</label>
            <Input type="number" inputMode="numeric" {...register("amount")} />
            {errors.amount ? (
              <p className="mt-1 text-xs text-rose-300">{errors.amount.message}</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant={typeValue === "expense" ? "primary" : "outline"}
              onClick={() => setValue("type", "expense")}
              className="flex-1"
            >
              Pengeluaran
            </Button>
            <Button
              type="button"
              variant={typeValue === "income" ? "primary" : "outline"}
              onClick={() => setValue("type", "income")}
              className="flex-1"
            >
              Pemasukan
            </Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" type="button" onClick={() => closeModal("addTransaction")}>
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
