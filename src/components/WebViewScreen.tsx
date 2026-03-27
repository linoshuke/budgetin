"use client";

import { useState } from "react";

interface WebViewScreenProps {
  url: string;
  title?: string;
}

export default function WebViewScreen({ url, title }: WebViewScreenProps) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-white/10 bg-[var(--bg-card)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm">
        <span className="font-medium text-[var(--text-primary)]">{title ?? "Web"}</span>
        <a href={url} target="_blank" rel="noreferrer" className="text-[var(--accent-indigo)]">
          Buka tab baru
        </a>
      </div>
      <div className={"h-1 w-full " + (loading ? "bg-[var(--accent-indigo)]/50" : "bg-transparent")}>
        {loading ? <div className="h-1 w-1/3 animate-pulse bg-[var(--accent-indigo)]" /> : null}
      </div>
      <iframe
        src={url}
        className="h-[60vh] w-full rounded-b-2xl"
        onLoad={() => setLoading(false)}
        title={title ?? "WebView"}
      />
    </div>
  );
}
