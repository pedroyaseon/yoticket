"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { api } from "@/lib/api";
import { formatDate, formatTime, type PublicEvent } from "@/lib/event";

type Ticket = {
  id: string;
  code: string;
  status: "VALID" | "USED" | "CANCELLED";
  event: PublicEvent;
};

const statusLabels = {
  VALID: "Válido",
  USED: "Utilizado",
  CANCELLED: "Cancelado",
};

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Ticket[]>("/tickets/me")
      .then(setTickets)
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar seus ingressos.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      <SiteHeader />
      <main className="mx-auto min-h-[70vh] max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-wrap items-end justify-between gap-5 border-b border-[#29292d] pb-9">
          <div>
            <p className="font-mono text-xs tracking-[.2em] text-[#ff5c35]">
              CARTEIRA DIGITAL
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight">
              Meus ingressos
            </h1>
            <p className="mt-4 text-[#9e9990]">
              Acesse o QR Code e compartilhe seus ingressos.
            </p>
          </div>
          <Link
            href="/events"
            className="bg-[#ff5c35] px-5 py-3 font-semibold text-black"
          >
            Comprar ingressos
          </Link>
        </div>
        {loading && (
          <div className="mt-10 space-y-4">
            {Array.from({ length: 2 }, (_, index) => (
              <div
                key={index}
                className="h-48 animate-pulse border border-[#29292d] bg-[#141416]"
              />
            ))}
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="mt-10 border border-amber-400/30 bg-amber-950/20 p-6"
          >
            <p className="text-amber-100">{error}</p>
            <Link
              href="/login"
              className="mt-4 inline-block font-semibold text-[#ff7a59]"
            >
              Entrar como cliente →
            </Link>
          </div>
        )}
        {!loading && !error && tickets.length === 0 && (
          <div className="mt-10 border border-[#29292d] bg-[#141416] p-12 text-center">
            <p className="font-mono text-xs tracking-[.2em] text-[#ff5c35]">
              SUA CARTEIRA ESTÁ VAZIA
            </p>
            <h2 className="mt-4 text-3xl font-semibold">
              Que tal escolher sua próxima sessão?
            </h2>
            <p className="mx-auto mt-3 max-w-xl text-[#9e9990]">
              Quando o pagamento for aprovado, seus ingressos aparecerão aqui
              imediatamente.
            </p>
            <Link
              href="/events"
              className="mt-7 inline-block bg-[#ff5c35] px-5 py-3 font-semibold text-black"
            >
              Ver eventos
            </Link>
          </div>
        )}
        {!loading && !error && tickets.length > 0 && (
          <div className="mt-10 space-y-5">
            {tickets.map((ticket) => (
              <Link
                href={`/my-tickets/${ticket.id}`}
                key={ticket.id}
                className="group grid overflow-hidden border border-[#303034] bg-[#141416] hover:border-[#ff5c35] sm:grid-cols-[150px_minmax(0,1fr)_160px]"
              >
                <div className="relative hidden min-h-48 bg-[#202024] sm:block">
                  {ticket.event.posterUrl && (
                    <Image
                      src={ticket.event.posterUrl}
                      alt=""
                      fill
                      sizes="150px"
                      className="object-cover opacity-80 transition group-hover:opacity-100"
                    />
                  )}
                </div>
                <div className="p-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <span
                      className={`px-2.5 py-1 text-xs ${ticket.status === "VALID" ? "bg-emerald-950 text-emerald-300" : "bg-[#252529] text-[#9e9990]"}`}
                    >
                      {statusLabels[ticket.status]}
                    </span>
                    <span className="font-mono text-[10px] tracking-[.12em] text-[#6f6b65]">
                      {ticket.code.slice(0, 12).toUpperCase()}
                    </span>
                  </div>
                  <h2 className="mt-4 text-2xl font-semibold">
                    {ticket.event.title}
                  </h2>
                  <div className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm text-[#9e9990]">
                    <p>
                      {formatDate(ticket.event.startsAt)} ·{" "}
                      {formatTime(ticket.event.startsAt)}
                    </p>
                    <p>{ticket.event.location}</p>
                  </div>
                </div>
                <div className="relative grid place-items-center border-t border-dashed border-[#45454a] p-6 sm:border-l sm:border-t-0">
                  <span className="absolute -left-3 -top-3 hidden h-6 w-6 rounded-full bg-[#0b0b0c] sm:block" />
                  <span className="absolute -bottom-3 -left-3 hidden h-6 w-6 rounded-full bg-[#0b0b0c] sm:block" />
                  <div className="text-center">
                    <span className="font-mono text-xs text-[#ff5c35]">
                      ABRIR INGRESSO
                    </span>
                    <p className="mt-2 text-2xl">→</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
