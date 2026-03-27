"use client";

import MobileBottomNav from "@/app/_components/MobileBottomNav";
import MobileHome from "@/app/_components/MobileHome";
import MobileHistory from "@/app/_components/MobileHistory";
import MobileWallets from "@/app/_components/MobileWallets";
import MobileStats from "@/app/_components/MobileStats";
import MobileMore from "@/app/_components/MobileMore";
import { useState } from "react";

const tabs = [
  { key: "home", component: MobileHome },
  { key: "history", component: MobileHistory },
  { key: "wallets", component: MobileWallets },
  { key: "stats", component: MobileStats },
  { key: "more", component: MobileMore },
];

export default function MobileAppShell({ initialIndex = 0 }: { initialIndex?: number }) {
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  return (
    <div className="min-h-screen">
      {tabs.map((tab, index) => {
        const Component = tab.component;
        const hidden = index !== activeIndex;
        return (
          <div key={tab.key} className={hidden ? "hidden" : "block"}>
            {tab.key === "more" ? (
              <Component onGoHome={() => setActiveIndex(0)} />
            ) : (
              <Component />
            )}
          </div>
        );
      })}

      <MobileBottomNav activeIndex={activeIndex} onSelect={setActiveIndex} />
    </div>
  );
}
