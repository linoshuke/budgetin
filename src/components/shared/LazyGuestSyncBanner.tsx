"use client";

import dynamic from "next/dynamic";

const GuestSyncBanner = dynamic(
  () => import("@/components/shared/GuestSyncBanner"),
  { ssr: false },
);

export default function LazyGuestSyncBanner() {
  return <GuestSyncBanner />;
}
