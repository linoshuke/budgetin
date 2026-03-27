import { useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";

export function useAuth() {
  const { user, session, loading } = useAuthStore();
  const isGuest = !user;

  const displayName = useMemo(() => {
    if (!user) return "Tamu";
    return (
      (user.user_metadata?.display_name as string | undefined) ||
      (user.user_metadata?.username as string | undefined) ||
      user.email?.split("@")[0] ||
      "Pengguna"
    );
  }, [user]);

  return { user, session, loading, isGuest, displayName };
}
