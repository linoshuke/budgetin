import { useMemo } from "react";
import { useAuthStore } from "@/stores/authStore";
import { getUserAvatarUrl, getUserDisplayName, getUserInitials } from "@/lib/user-profile";

export function useAuth() {
  const { user, session, loading } = useAuthStore();
  const isAnonymous = Boolean(user?.is_anonymous);
  const isGuest = !user;

  const displayName = useMemo(() => getUserDisplayName(user), [user]);
  const avatarUrl = useMemo(() => getUserAvatarUrl(user), [user]);
  const initials = useMemo(() => getUserInitials(displayName, user?.email ?? ""), [displayName, user?.email]);

  return { user, session, loading, isGuest, isAnonymous, displayName, avatarUrl, initials };
}
