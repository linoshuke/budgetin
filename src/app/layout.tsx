import type { Metadata } from "next";
import DataLoader from "@/components/shared/DataLoader";
import GuestSyncBanner from "@/components/shared/GuestSyncBanner";
import ThemeSync from "@/components/shared/ThemeSync";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Budgetin",
  description: "Rancangan kasar aplikasi budget tracker Budgetin.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeSync />
        <DataLoader />
        <GuestSyncBanner />
        {children}
      </body>
    </html>
  );
}
