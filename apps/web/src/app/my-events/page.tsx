"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { api } from "@/lib/api";
import { formatDate, formatTime, type PublicEvent } from "@/lib/event";

type Ticket = {
  id: string;
  status: "VALID" | "USED" | "CANCELLED";
  event: PublicEvent;
};

export default function MyEventsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Ticket[]>("/tickets/me")
      .then(setTickets)
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar seus eventos.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const events = useMemo(() => {
    const grouped = new Map<
      string,
      { event: PublicEvent; tickets: Ticket[] }
    >();
    for (const ticket of tickets) {
      const current = grouped.get(ticket.event.id) ?? {
        event: ticket.event,
        tickets: [],
      };
      current.tickets.push(ticket);
      grouped.set(ticket.event.id, current);
    }
    return Array.from(grouped.values());
  }, [tickets]);

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      <SiteHeader />
      <main className="mx-auto min-h-[75vh] max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="font-mono text-xs tracking-[.2em] text-[#ff5c35]">
          MINHA AGENDA
        </p>
        <h1 className="mt-4 text-5xl font-semibold tracking-tight">Meus eventos</h1>
        <p className="mt-4 text-[#9e9990]">
          Sessões associadas aos seus ingressos.
        </p>

        {loading && <div className="mt-10 h-56 animate-pulse bg-[#141416]" />}
        {error && (
          <div role="alert" className="mt-10 border border-amber-400/30 bg-amber-950/20 p-6">
            <p>{error}</p>
            <Link href="/login?returnTo=/my-events" className="mt-4 inline-block text-[#ff7a59]">
              Entrar como cliente →
            </Link>
          </div>
        )}
        {!loading && !error && events.length === 0 && (
          <div className="mt-10 border border-[#29292d] bg-[#141416] p-10 text-center">
            <h2 className="text-2xl font-semibold">Nenhum evento na sua agenda</h2>
            <Link href="/events" className="mt-6 inline-block bg-[#ff5c35] px-5 py-3 font-semibold text-black">
              Escolher um filme
            </Link>
          </div>
        )}
        <div className="mt-10 space-y-5">
          {events.map(({ event, tickets: eventTickets }) => (
            <article key={event.id} className="grid overflow-hidden border border-[#303034] bg-[#141416] sm:grid-cols-[150px_minmax(0,1fr)]">
              <div className="relative hidden min-h-48 bg-[#202024] sm:block">
                {event.posterUrl && <Image src={event.posterUrl} alt="" fill sizes="150px" className="object-cover" />}
              </div>
              <div className="p-6">
                <p className="font-mono text-xs text-[#ff5c35]">
                  {formatDate(event.startsAt)} · {formatTime(event.startsAt)}
                </p>
                <h2 className="mt-3 text-2xl font-semibold">{event.title}</h2>
                <p className="mt-2 text-sm text-[#9e9990]">{event.location}</p>
                <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-[#29292d] pt-5">
                  <p className="text-sm text-[#aaa59c]">
                    {eventTickets.length} {eventTickets.length === 1 ? "ingresso" : "ingressos"}
                  </p>
                  <Link href="/my-tickets" className="text-sm font-semibold text-[#ff7a59]">
                    Abrir ingressos →
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
