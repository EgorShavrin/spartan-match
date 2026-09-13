"use client";

/**
 * Top navigation, shown on every page through app/layout.tsx.
 *
 * usePathname() tells us the current URL so the active link can be
 * underlined. Reading the URL is browser-only state, which is why this file
 * is a Client Component.
 */

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/members", label: "Members" },
  { href: "/projects", label: "Projects" },
];

export default function Navbar() {
  const pathname = usePathname();

  function isActive(href: string) {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  }

  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <Link href="/" className="flex items-baseline gap-2">
          <span className="text-base font-semibold tracking-tight text-slate-900">
            SpartanMatch
          </span>
          <span className="hidden text-sm text-slate-500 sm:inline">
            Member and project matching
          </span>
        </Link>

        <nav className="flex gap-5">
          {LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                isActive(link.href)
                  ? "border-b-2 border-green-700 pb-0.5 text-sm font-medium text-slate-900"
                  : "border-b-2 border-transparent pb-0.5 text-sm text-slate-600 hover:text-slate-900"
              }
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
