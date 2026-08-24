"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/event";

type SharedTicket = {
  code: string;
  status: "VALID" | "USED" | "CANCELLED";
  event: { title: string; location: string; startsAt: string };
};

export default function SharedTicketPage() {
  const { code } = useParams<{ code: string }>();
  const [ticket, setTicket] = useState<SharedTicket | null>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    api<SharedTicket>(`/tickets/shared/${encodeURIComponent(code)}`)
      .then(setTicket)
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível abrir este ingresso.",
        ),
      );
  }, [code]);
  const shareUrl = useMemo(
    () => (typeof window === "undefined" ? "" : window.location.href),
    [],
  );

  if (error)
    return (
      <main className="grid min-h-screen place-items-center bg-[#0b0b0c] px-5">
        <div className="max-w-lg text-center">
          <p className="font-mono text-xs text-[#ff5c35]">YOTICKET</p>
          <h1 className="mt-4 text-4xl font-semibold">Ingresso indisponível</h1>
          <p role="alert" className="mt-4 text-[#9e9990]">
            {error}
          </p>
          <Link
            href="/events"
            className="mt-7 inline-block bg-[#ff5c35] px-5 py-3 font-semibold text-black"
          >
            Ver eventos
          </Link>
        </div>
      </main>
    );
  if (!ticket)
    return (
      <main className="grid min-h-screen place-items-center bg-[#0b0b0c]">
        <p className="text-[#9e9990]">Carregando ingresso…</p>
      </main>
    );

  const label =
    ticket.status === "VALID"
      ? "Válido para entrada"
      : ticket.status === "USED"
        ? "Ingresso já utilizado"
        : "Ingresso cancelado";
  return (
    <main className="grid min-h-screen place-items-center bg-[#0b0b0c] px-5 py-12">
      <div className="w-full max-w-3xl">
        <Link
          href="/"
          className="font-mono text-xs tracking-[.2em] text-[#ff5c35]"
        >
          YOTICKET · INGRESSO COMPARTILHADO
        </Link>
        <section className="mt-5 overflow-hidden border border-[#343439] bg-[#f1ece2] text-[#121214]">
          <div className="grid md:grid-cols-[minmax(0,1fr)_280px]">
            <div className="p-8">
              <h1 className="text-4xl font-semibold leading-tight">
                {ticket.event.title}
              </h1>
              <p className="mt-6 text-lg">
                {formatDate(ticket.event.startsAt)} ·{" "}
                {formatTime(ticket.event.startsAt)}
              </p>
              <p className="mt-2 text-black/60">{ticket.event.location}</p>
              <div className="mt-8 border-t border-black/15 pt-6">
                <p className="text-xs uppercase tracking-[.12em] text-black/50">
                  Status
                </p>
                <p
                  className={`mt-2 font-semibold ${ticket.status === "VALID" ? "text-emerald-700" : "text-stone-600"}`}
                >
                  {label}
                </p>
              </div>
              <p className="mt-8 text-xs leading-5 text-black/50">
                Este link não exibe dados pessoais. A validade é confirmada pela
                portaria no momento da entrada.
              </p>
            </div>
            <div className="relative grid place-items-center border-t border-dashed border-black/25 bg-white p-8 md:border-l md:border-t-0">
              <QRCodeSVG value={shareUrl} size={190} level="M" />
              <p className="mt-4 text-center text-xs text-black/50">
                Apresente na portaria
              </p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
