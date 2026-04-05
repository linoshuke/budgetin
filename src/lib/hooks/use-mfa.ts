import { useCallback, useState } from "react";

type EnrollResponse = {
    factorId: string;
    qr: string;
    secret: string;
};

export function useMfa() {
    const [factorId, setFactorId] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const enroll = useCallback(async (): Promise<EnrollResponse | null> => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch("/api/auth/mfa", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action: "enroll" }),
            });
            const json = await res.json();
            if (!res.ok) {
                setError(json?.error ?? "Gagal membuat MFA.");
                return null;
            }
            setFactorId(json.factorId);
            return json as EnrollResponse;
        } finally {
            setLoading(false);
        }
    }, []);

    const verify = useCallback(
        async (code: string) => {
            if (!factorId) {
                setError("Factor ID belum tersedia.");
                return false;
            }
            setLoading(true);
            setError(null);
            try {
                const res = await fetch("/api/auth/mfa", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ action: "verify", code, factorId }),
                });
                const json = await res.json();
                if (!res.ok) {
                    setError(json?.error ?? "Verifikasi MFA gagal.");
                    return false;
                }
                return true;
            } finally {
                setLoading(false);
            }
        },
        [factorId],
    );

    return { enroll, verify, loading, error, factorId };
}
