import type { Metadata } from "next";
import { Onest, Unbounded } from "next/font/google";
import { Suspense } from "react";
import Providers from "./providers";
import "./globals.css";

const displayFont = Unbounded({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["400", "600", "700"],
  display: "swap",
});

const bodyFont = Onest({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Budgetin",
  description: "Budget tracker modern dengan Supabase + Realtime.",
  icons: {
    icon: "/Budgetin.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent-indigo)]/30 border-t-[var(--accent-indigo)]" />
            </div>
          }
        >
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
