import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter } from "next/font/google";
import { SiteChrome } from "@/components/site/site-chrome";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["200", "300", "400"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Rivera",
  description: "Easy-mode for product launch.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${inter.className} h-full antialiased`}>
      <body className="min-h-full bg-[#0c0a10] text-[#f4f2f0]">
        <ClerkProvider>
          <SiteChrome>{children}</SiteChrome>
        </ClerkProvider>
      </body>
    </html>
  );
}