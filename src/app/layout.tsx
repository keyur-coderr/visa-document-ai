import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AppProviders } from "@/components/layout/AppProviders";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });

export const metadata: Metadata = {
  title: {
    default: "Visa Document AI",
    template: "%s | Visa Document AI",
  },
  description:
    "AI documentation assistance software for Canadian immigration professionals. Not a law firm and not a source of legal advice.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.variable}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
