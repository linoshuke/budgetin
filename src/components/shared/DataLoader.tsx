"use client";

import { budgetActions, useBudgetStore } from "@/store/budgetStore";
import { useEffect, useRef } from "react";

export default function DataLoader() {
    const loading = useBudgetStore((s) => s.loading);
    const didLoad = useRef(false);

    useEffect(() => {
        if (didLoad.current) return;
        didLoad.current = true;
        budgetActions.loadFromApi();
    }, []);

    if (!loading) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[var(--bg-base)]">
            <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-500 border-t-transparent" />
                <p className="text-sm text-[var(--text-dimmed)]">Memuat data…</p>
            </div>
        </div>
    );
}
