import type { Metadata } from "next";
import localFont from "next/font/local";
import { Suspense } from "react";
import Providers from "./providers";
import "./globals.css";

const geistSans = localFont({
  src: "../fonts/GeistVF.woff2",
  variable: "--font-geist-sans",
  display: "swap",
});

const geistMono = localFont({
  src: "../fonts/GeistMonoVF.woff2",
  variable: "--font-geist-mono",
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
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Suspense
          fallback={
            <div className="flex min-h-screen items-center justify-center">
              <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-300/30 border-t-indigo-400" />
            </div>
          }
        >
          <Providers>{children}</Providers>
        </Suspense>
      </body>
    </html>
  );
}
