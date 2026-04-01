"use client";

import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
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
      const date = new Date();

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          walletId,
          categoryId: null,
          type: values.type,
          amount: values.amount,
          note: values.description,
          date: date.toISOString().slice(0, 10),
        }),
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error((payload as { error?: string }).error ?? `HTTP ${response.status}`);
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
