import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Suspense } from "react";
import Providers from "./providers";
import "./globals.css";
import { headers } from "next/headers";

const headlineFont = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-headline",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

const bodyFont = Inter({
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headerList = await headers();
  const csp = headerList.get("content-security-policy") ?? "";
  const nonceMatch = csp.match(/'nonce-([^']+)'/);
  const nonce = nonceMatch ? nonceMatch[1] : "";

  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {nonce ? <meta name="csp-nonce" content={nonce} /> : null}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=block"
        />
      </head>
      <body className={`${headlineFont.variable} ${bodyFont.variable} antialiased`}>
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
