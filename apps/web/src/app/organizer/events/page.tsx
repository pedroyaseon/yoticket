"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { api } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/event";
import { eventStatusLabels, type OrganizerEvent } from "@/lib/organizer-event";

export default function OrganizerEventsPage() {
  const [events, setEvents] = useState<OrganizerEvent[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<OrganizerEvent[]>("/organizer/events")
      .then(setEvents)
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar os eventos.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      <SiteHeader />
      <main
        className="mx-auto min-h-[70vh] w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16"
        aria-busy={loading}
      >
        <header className="flex flex-wrap items-end justify-between gap-5 border-b border-[#29292d] pb-9">
          <div>
            <p className="font-mono text-xs tracking-[.2em] text-[#ff5c35]">
              ÁREA DO ORGANIZADOR
            </p>
            <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
              Meus eventos
            </h1>
            <p className="mt-4 max-w-2xl text-[#9e9990]">
              Consulte suas sessões, acompanhe as vendas e altere a programação.
            </p>
          </div>
          <Link
            className="bg-[#ff5c35] px-5 py-3 font-semibold text-black hover:bg-[#ff7655]"
            href="/organizer/events/new"
          >
            + Adicionar sessão
          </Link>
        </header>

        {loading && (
          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="h-64 animate-pulse border border-[#29292d] bg-[#141416]"
              />
            ))}
          </div>
        )}
        {error && (
          <div
            role="alert"
            className="mt-10 border border-amber-400/30 bg-amber-950/20 p-6 text-amber-100"
          >
            <p>{error}</p>
            <Link href="/login" className="mt-4 inline-block text-[#ff7a59]">
              Entrar como organizador →
            </Link>
          </div>
        )}
        {!loading && !error && events.length === 0 && (
          <div className="mt-10 border border-[#29292d] bg-[#141416] p-12 text-center">
            <h2 className="text-3xl font-semibold">
              Sua programação está vazia
            </h2>
            <p className="mt-3 text-[#9e9990]">
              Escolha um filme do catálogo e crie sua primeira sessão.
            </p>
            <Link
              href="/organizer/events/new"
              className="mt-7 inline-block bg-[#ff5c35] px-5 py-3 font-semibold text-black"
            >
              Explorar filmes
            </Link>
          </div>
        )}
        {!loading && !error && events.length > 0 && (
          <div className="mt-10 grid gap-5 lg:grid-cols-2">
            {events.map((event) => {
              const available =
                event.capacity - event.soldQuantity - event.heldQuantity;
              return (
                <article
                  key={event.id}
                  className="grid overflow-hidden border border-[#303034] bg-[#141416] sm:grid-cols-[130px_minmax(0,1fr)]"
                >
                  <div className="relative hidden min-h-64 bg-[#202024] sm:block">
                    {event.posterUrl && (
                      <Image
                        src={event.posterUrl}
                        alt={`Cartaz de ${event.title}`}
                        fill
                        sizes="130px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex min-w-0 flex-col p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="text-xs uppercase tracking-[.12em] text-[#ff7a59]">
                          {eventStatusLabels[event.status]}
                        </p>
                        <h2 className="mt-2 truncate text-2xl font-semibold">
                          {event.title}
                        </h2>
                      </div>
                      <p className="font-mono text-xs text-[#77736d]">
                        R$ {(event.priceInCents / 100).toFixed(2)}
                      </p>
                    </div>
                    <div className="mt-5 space-y-2 text-sm text-[#a9a49b]">
                      <p>
                        {formatDate(event.startsAt)} ·{" "}
                        {formatTime(event.startsAt)}
                      </p>
                      <p>{event.location}</p>
                    </div>
                    <div className="mt-5 grid grid-cols-3 gap-3 border-y border-[#29292d] py-4 text-sm">
                      <p>
                        <strong className="block text-lg text-white">
                          {event.soldQuantity}
                        </strong>
                        vendidos
                      </p>
                      <p>
                        <strong className="block text-lg text-white">
                          {available}
                        </strong>
                        livres
                      </p>
                      <p>
                        <strong className="block text-lg text-white">
                          R${" "}
                          {(
                            (event.soldQuantity * event.priceInCents) /
                            100
                          ).toFixed(0)}
                        </strong>
                        receita
                      </p>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-3 pt-5">
                      <Link
                        href={`/organizer/events/${event.id}`}
                        className="bg-[#ff5c35] px-4 py-2.5 text-sm font-semibold text-black"
                      >
                        Ver e editar
                      </Link>
                      {event.status === "PUBLISHED" && (
                        <Link
                          href={`/events/${event.externalId ?? event.id}`}
                          className="border border-[#3a3a40] px-4 py-2.5 text-sm hover:border-[#ff5c35]"
                        >
                          Ver página do filme
                        </Link>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
