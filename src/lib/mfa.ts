import { ServiceError } from "@/lib/service-error";
import type { User } from "@supabase/supabase-js";

export const MFA_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

export function requireRecentMfa(user: User) {
    const verifiedAt = Number(user.user_metadata?.mfa_verified_at ?? 0);
    const enrolled = Boolean(user.user_metadata?.mfa_enrolled);
    const now = Date.now();

    if (!enrolled) {
        throw new ServiceError("MFA_REQUIRED", 403);
    }

    if (!verifiedAt || now - verifiedAt > MFA_MAX_AGE_MS) {
        throw new ServiceError("MFA_REQUIRED", 403);
    }
}
