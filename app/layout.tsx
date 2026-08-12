import type { Metadata } from "next";
import "./globals.css";
import { PublicFooter, PublicHeader } from "@/components/public-shell";

export const metadata: Metadata = {
  title: "Eraasim",
  description: "Stories of culture, food and places.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><a className="skip-link" href="#main-content">Skip to content</a><PublicHeader /><main id="main-content">{children}</main><PublicFooter /></body>
    </html>
  );
}
