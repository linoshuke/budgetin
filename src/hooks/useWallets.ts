import { useEffect, useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useWalletStore } from "@/stores/walletStore";
import type { Wallet } from "@/types";
import { guestWallets } from "@/utils/sample-data";

export function useWallets() {
  const { user, isGuest } = useAuth();
  const queryClient = useQueryClient();
  const { wallets, selectedWalletIds, setWallets, setTotalBalance } = useWalletStore();

  const query = useQuery({
    queryKey: ["wallets", user?.id ?? "guest"],
    queryFn: async () => {
      if (!user) return guestWallets;
      const { data, error } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return (data ?? []) as Wallet[];
    },
  });

  useEffect(() => {
    if (query.data) {
      setWallets(query.data);
    }
  }, [query.data, setWallets]);

  useEffect(() => {
    const ids = selectedWalletIds.length ? selectedWalletIds : wallets.map((wallet) => wallet.id);
    const total = wallets
      .filter((wallet) => ids.includes(wallet.id))
      .reduce((acc, wallet) => acc + Number(wallet.balance ?? 0), 0);
    setTotalBalance(total);
  }, [wallets, selectedWalletIds, setTotalBalance]);

  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("wallets")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "wallets", filter: `user_id=eq.${user.id}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["wallets", user.id] });
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, user]);

  const createWallet = async (payload: Pick<Wallet, "name" | "category" | "location">) => {
    if (!user) return;
    const { error } = await supabase.from("wallets").insert({
      user_id: user.id,
      name: payload.name,
      category: payload.category,
      location: payload.location,
      balance: 0,
    });
    if (error) throw error;
  };

  const deleteWallet = async (walletId: string) => {
    if (!user) return;
    const { error } = await supabase.from("wallets").delete().eq("id", walletId);
    if (error) throw error;
  };

  const updateWallet = async (walletId: string, changes: Partial<Wallet>) => {
    if (!user) return;
    const { error } = await supabase.from("wallets").update(changes).eq("id", walletId);
    if (error) throw error;
  };

  const selectedWallets = useMemo(() => {
    if (!selectedWalletIds.length) return wallets;
    return wallets.filter((wallet) => selectedWalletIds.includes(wallet.id));
  }, [selectedWalletIds, wallets]);

  return {
    wallets,
    selectedWallets,
    selectedWalletIds,
    isGuest,
    query,
    createWallet,
    deleteWallet,
    updateWallet,
  };
}
