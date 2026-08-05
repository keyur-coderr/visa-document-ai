import type { Metadata } from "next";
import "./globals.css";

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
      <body>{children}</body>
    </html>
  );
}
