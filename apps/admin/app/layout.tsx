import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Eraasim Admin",
  description: "Administrative access for Eraasim.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
