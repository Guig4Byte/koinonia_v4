import type { Metadata } from "next";
import { DM_Sans, Lora } from "next/font/google";
import type { ReactNode } from "react";
import { TextSizeInit } from "@/components/layout/text-size-init";
import { ThemeInit } from "@/components/layout/theme-init";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  variable: "--font-lora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Koinonia Lite",
  description: "Radar pastoral simples para células, encontros e presença.",
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt-BR" data-theme="light" data-text-size="normal" suppressHydrationWarning>
      <body className={`${dmSans.variable} ${lora.variable}`}>
        <TextSizeInit />
        <ThemeInit />
        {children}
      </body>
    </html>
  );
}
