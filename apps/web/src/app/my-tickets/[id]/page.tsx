"use client";

import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { useParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { api } from "@/lib/api";
import { formatDate, formatTime, type PublicEvent } from "@/lib/event";

type Ticket = {
  id: string;
  code: string;
  status: "VALID" | "USED" | "CANCELLED";
  event: PublicEvent;
};
const labels = {
  VALID: "Válido para entrada",
  USED: "Ingresso utilizado",
  CANCELLED: "Ingresso cancelado",
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [message, setMessage] = useState("");
  useEffect(() => {
    api<Ticket>(`/tickets/${id}`)
      .then(setTicket)
      .catch((reason: unknown) =>
        setMessage(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar o ingresso.",
        ),
      );
  }, [id]);
  const shareUrl = useMemo(
    () =>
      ticket && typeof window !== "undefined"
        ? `${window.location.origin}/tickets/shared/${ticket.code}`
        : "",
    [ticket],
  );
  async function copy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setMessage("Link copiado. Agora você pode compartilhar este ingresso.");
    } catch {
      setMessage("Não foi possível copiar o link.");
    }
  }

  if (!ticket)
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
          {message ? (
            <div role="alert">
              <h1 className="text-3xl font-semibold">Ingresso indisponível</h1>
              <p className="mt-4 text-[#9e9990]">{message}</p>
              <Link href="/login" className="mt-6 inline-block text-[#ff7a59]">
                Entrar novamente →
              </Link>
            </div>
          ) : (
            <div className="h-96 animate-pulse bg-[#141416]" />
          )}
        </main>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      <SiteHeader />
      <main className="mx-auto max-w-4xl px-5 py-12 sm:px-8 sm:py-16">
        <Link
          href="/my-tickets"
          className="text-sm text-[#9e9990] hover:text-[#ff5c35]"
        >
          ← Voltar para meus ingressos
        </Link>
        <div className="mt-7 overflow-hidden border border-[#343439] bg-[#f1ece2] text-[#121214]">
          <div className="grid md:grid-cols-[minmax(0,1fr)_300px]">
            <section className="p-7 sm:p-10">
              <p className="font-mono text-xs font-bold tracking-[.2em] text-[#d94320]">
                YOTICKET · INGRESSO DIGITAL
              </p>
              <h1 className="mt-5 text-4xl font-semibold leading-tight">
                {ticket.event.title}
              </h1>
              <div className="mt-8 grid gap-5 border-y border-black/15 py-6 sm:grid-cols-2">
                <div>
                  <p className="text-xs uppercase tracking-[.12em] text-black/50">
                    Data e horário
                  </p>
                  <p className="mt-2 font-semibold">
                    {formatDate(ticket.event.startsAt)} ·{" "}
                    {formatTime(ticket.event.startsAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[.12em] text-black/50">
                    Local
                  </p>
                  <p className="mt-2 font-semibold">{ticket.event.location}</p>
                </div>
              </div>
              <div className="mt-7 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[.12em] text-black/50">
                    Status
                  </p>
                  <p
                    className={`mt-2 font-semibold ${ticket.status === "VALID" ? "text-emerald-700" : "text-stone-600"}`}
                  >
                    {labels[ticket.status]}
                  </p>
                </div>
                <p className="font-mono text-xs text-black/50">
                  {ticket.code.slice(0, 16).toUpperCase()}
                </p>
              </div>
            </section>
            <aside className="relative grid place-items-center border-t border-dashed border-black/25 bg-white p-8 md:border-l md:border-t-0">
              <span className="absolute -left-3 -top-3 hidden h-6 w-6 rounded-full bg-[#0b0b0c] md:block" />
              <span className="absolute -bottom-3 -left-3 hidden h-6 w-6 rounded-full bg-[#0b0b0c] md:block" />
              <div className="text-center">
                <QRCodeSVG
                  value={shareUrl || ticket.code}
                  size={205}
                  level="M"
                />
                <p className="mt-4 text-xs text-black/50">
                  Apresente este QR Code na portaria
                </p>
              </div>
            </aside>
          </div>
        </div>
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <p aria-live="polite" className="text-sm text-[#9e9990]">
            {message}
          </p>
          <button
            type="button"
            onClick={() => void copy()}
            className="border border-[#3a3a40] px-5 py-3 text-sm font-semibold hover:border-[#ff5c35] hover:text-[#ff7a59]"
          >
            Copiar link de compartilhamento
          </button>
        </div>
      </main>
    </div>
  );
}
