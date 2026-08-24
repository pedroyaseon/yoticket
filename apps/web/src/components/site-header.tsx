"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const links = [
    { href: "/events", label: "Filmes", visible: true },
    { href: "/venues", label: "Locais", visible: true },
    {
      href: "/organizer/events",
      label: "Meus eventos",
      visible: user?.role === "ORGANIZER",
    },
    {
      href: "/my-tickets",
      label: "Meus ingressos",
      visible: !user || user.role === "CUSTOMER",
    },
    {
      href: "/organizer/events/new",
      label: "Adicionar sessão",
      visible: user?.role === "ORGANIZER",
    },
    { href: "/gate", label: "Portaria", visible: user?.role === "GATE" },
  ];
  const roleLabel =
    user?.role === "CUSTOMER"
      ? "Cliente"
      : user?.role === "ORGANIZER"
        ? "Organizador"
        : "Portaria";

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
          {links
            .filter((link) => link.visible)
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`${link.href === "/my-tickets" ? "hidden lg:block" : ""} ${pathname.startsWith(link.href) ? "text-[#ff5c35]" : "text-[#b9b4aa] hover:text-white"}`}
              >
                {link.label}
              </Link>
            ))}
        </nav>
        {loading ? (
          <div className="h-10 w-24 animate-pulse bg-[#1b1b1e]" />
        ) : user ? (
          <details className="group relative">
            <summary
              aria-label={`Perfil conectado: ${user.email}`}
              className="flex cursor-pointer list-none items-center gap-3 border border-[#343439] px-2.5 py-2 hover:border-[#ff5c35]"
            >
              <span className="relative grid h-7 w-7 place-items-center rounded-full bg-[#ff5c35] text-xs font-bold text-black">
                {user.email.slice(0, 1).toUpperCase()}
                <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#0b0b0c] bg-emerald-400" />
              </span>
              <span className="hidden max-w-36 text-left sm:block">
                <span className="block truncate text-xs font-medium">
                  {user.email.split("@")[0]}
                </span>
                <span className="block text-[10px] text-emerald-400">
                  Conectado
                </span>
              </span>
              <span className="text-xs text-[#77736d]">⌄</span>
            </summary>
            <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-64 border border-[#343439] bg-[#141416] p-4 shadow-2xl">
              <p className="truncate text-sm font-medium">{user.email}</p>
              <p className="mt-1 text-xs text-[#8f8a82]">Perfil: {roleLabel}</p>
              <div className="my-4 border-t border-[#29292d]" />
              {user.role === "CUSTOMER" && (
                <>
                  <Link
                    href="/my-tickets"
                    className="block py-2 text-sm hover:text-[#ff5c35]"
                  >
                    Minha carteira de ingressos
                  </Link>
                </>
              )}
              {user.role === "ORGANIZER" && (
                <>
                  <Link
                    href="/organizer/events"
                    className="block py-2 text-sm hover:text-[#ff5c35]"
                  >
                    Gerenciar meus eventos
                  </Link>
                  <Link
                    href="/organizer/events/new"
                    className="block py-2 text-sm hover:text-[#ff5c35]"
                  >
                    Adicionar nova sessão
                  </Link>
                </>
              )}
              <button
                type="button"
                onClick={() => {
                  signOut();
                  router.push("/events");
                }}
                className="mt-2 w-full border border-[#343439] px-3 py-2 text-left text-sm text-[#aaa59c] hover:border-[#ff5c35] hover:text-white"
              >
                Sair da conta
              </button>
            </div>
          </details>
        ) : (
          <Link
            href="/login"
            className="border border-[#3a3a40] px-4 py-2 text-sm font-medium hover:border-[#ff5c35] hover:text-[#ff5c35]"
          >
            Entrar
          </Link>
        )}
      </div>
    </header>
  );
}
