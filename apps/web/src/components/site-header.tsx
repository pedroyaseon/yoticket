"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/events", label: "Eventos" },
  { href: "/my-tickets", label: "Meus ingressos" },
];

export function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-[#29292d] bg-[#0b0b0c]/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-3"
          aria-label="YoTicket — início"
        >
          <span className="grid h-8 w-8 place-items-center bg-[#ff5c35] font-black text-[#0b0b0c]">
            Y
          </span>
          <span className="hidden font-mono text-sm font-semibold tracking-[.18em] min-[420px]:inline">
            YOTICKET
          </span>
        </Link>
        <nav
          aria-label="Navegação principal"
          className="flex items-center gap-4 text-sm sm:gap-7"
        >
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${link.href === "/my-tickets" ? "hidden sm:block" : ""} ${pathname.startsWith(link.href) ? "text-[#ff5c35]" : "text-[#b9b4aa] hover:text-white"}`}
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <Link
          href="/login"
          className="border border-[#3a3a40] px-4 py-2 text-sm font-medium hover:border-[#ff5c35] hover:text-[#ff5c35]"
        >
          Entrar
        </Link>
      </div>
    </header>
  );
}
