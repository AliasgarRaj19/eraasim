import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eraasim",
  description: "Stories of culture, food and places.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
