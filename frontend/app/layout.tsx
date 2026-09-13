/**
 * Root layout: the HTML shell wrapped around every page.
 *
 * Next.js renders this once and swaps only the `children` when you navigate,
 * which is why the navbar does not flicker between pages.
 */

import type { Metadata } from "next";

import Navbar from "@/components/Navbar";

import "./globals.css";

export const metadata: Metadata = {
  title: "SpartanMatch",
  description:
    "Match student organization members to club projects with a transparent, explainable score.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
        <Navbar />
        <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      </body>
    </html>
  );
}
