import type { Metadata } from "next";
import localFont from "next/font/local";
import DataLoader from "@/components/shared/DataLoader";
import LazyGuestSyncBanner from "@/components/shared/LazyGuestSyncBanner";
import ThemeSync from "@/components/shared/ThemeSync";
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
  description: "Rancangan kasar aplikasi budget tracker Budgetin.",
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
        <ThemeSync />
        <DataLoader />
        <LazyGuestSyncBanner />
        {children}
      </body>
    </html>
  );
}
