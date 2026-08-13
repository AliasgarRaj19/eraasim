import type { Metadata } from "next";
import "./globals.css";
import { PublicFooter, PublicHeader } from "@/components/public-shell";
import { getPublicTheme, themeStyle } from "@/src/theme";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Eraasim",
  description: "Stories of culture, food and places.",
};

export default async function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const theme = await getPublicTheme();
  return (
    <html lang="en" style={themeStyle(theme)}>
      <body><a className="skip-link" href="#main-content">Skip to content</a><PublicHeader /><main id="main-content">{children}</main><PublicFooter /></body>
    </html>
  );
}
