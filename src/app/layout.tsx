import type { Metadata } from "next";
import type { ReactNode } from "react";
import { TextSizeInit } from "@/components/text-size-init";
import { ThemeInit } from "@/components/theme-init";
import "./globals.css";

export const metadata: Metadata = {
  title: "Koinonia Lite",
  description: "Radar pastoral simples para células, encontros e presença.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" data-theme="light" data-text-size="normal" suppressHydrationWarning>
      <body>
        <TextSizeInit />
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
