"use client";

import { useState } from "react";

interface WebViewScreenProps {
  url: string;
  title?: string;
}

export default function WebViewScreen({ url, title }: WebViewScreenProps) {
  const [loading, setLoading] = useState(true);

  return (
    <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[var(--bg-card)]">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 text-sm">
        <span className="font-medium text-[var(--text-primary)]">{title ?? "Web"}</span>
        <a href={url} target="_blank" rel="noreferrer" className="text-indigo-300">
          Buka tab baru
        </a>
      </div>
      {loading ? <div className="h-1 w-full bg-indigo-500/40" /> : <div className="h-1" />}
      <iframe
        src={url}
        className="h-[60vh] w-full rounded-b-2xl"
        onLoad={() => setLoading(false)}
        title={title ?? "WebView"}
      />
    </div>
  );
}
