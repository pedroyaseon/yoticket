"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { EventCard } from "@/components/event-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  availability,
  formatCurrency,
  formatDate,
  formatTime,
  type PublicEvent,
} from "@/lib/event";
import { api } from "@/lib/api";

export default function HomePage() {
  const [events, setEvents] = useState<PublicEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<PublicEvent[]>("/events")
      .then(setEvents)
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar a programação.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const featured = events[0];

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      <SiteHeader />
      <main>
        <section className="relative isolate min-h-[620px] overflow-hidden border-b border-[#29292d]">
          {featured?.posterUrl && (
            <Image
              src={featured.posterUrl}
              alt=""
              fill
              priority
              sizes="100vw"
              className="-z-20 object-cover object-center opacity-30 blur-[1px]"
            />
          )}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#0b0b0c_5%,rgba(11,11,12,.94)_40%,rgba(11,11,12,.45)_75%,#0b0b0c_100%)]" />
          <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_330px]">
            <div className="max-w-3xl">
              <p className="font-mono text-xs font-semibold tracking-[.22em] text-[#ff5c35]">
                BILHETERIA DIGITAL · PROGRAMAÇÃO 2026
              </p>
              <h1 className="mt-6 text-5xl font-semibold leading-[.98] tracking-[-.04em] sm:text-7xl">
                Seu próximo grande evento começa aqui.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#bbb6ad]">
                Escolha a sessão, reserve seus ingressos e entre com o QR Code
                no celular. Um fluxo curto, seguro e sem filas.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/events"
                  className="bg-[#ff5c35] px-6 py-3.5 font-semibold text-black hover:bg-[#ff7655]"
                >
                  Explorar eventos
                </Link>
                <Link
                  href="/my-tickets"
                  className="border border-[#4a4a50] bg-black/20 px-6 py-3.5 font-semibold hover:border-white"
                >
                  Meus ingressos
                </Link>
              </div>
              <div className="mt-12 grid max-w-2xl grid-cols-3 gap-4 border-t border-white/10 pt-6">
                <div>
                  <p className="text-2xl font-semibold">
                    {events.length || "—"}
                  </p>
                  <p className="mt-1 text-xs text-[#8f8a82]">sessões abertas</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">QR</p>
                  <p className="mt-1 text-xs text-[#8f8a82]">entrada digital</p>
                </div>
                <div>
                  <p className="text-2xl font-semibold">24h</p>
                  <p className="mt-1 text-xs text-[#8f8a82]">
                    acesso ao ingresso
                  </p>
                </div>
              </div>
            </div>
            {featured && (
              <Link
                href={`/events/${featured.id}`}
                className="group hidden overflow-hidden border border-white/15 bg-[#141416] shadow-2xl lg:block"
              >
                <div className="relative aspect-[3/4] overflow-hidden">
                  {featured.posterUrl && (
                    <Image
                      src={featured.posterUrl}
                      alt={`Pôster de ${featured.title}`}
                      fill
                      sizes="330px"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  )}
                  <p className="absolute left-4 top-4 bg-[#ff5c35] px-3 py-1.5 font-mono text-[11px] font-bold text-black">
                    EVENTO EM DESTAQUE
                  </p>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/80 to-transparent p-5 pt-20">
                    <p className="font-mono text-xs text-[#ff7a59]">
                      {formatDate(featured.startsAt)} ·{" "}
                      {formatTime(featured.startsAt)}
                    </p>
                    <h2 className="mt-2 text-2xl font-semibold">
                      {featured.title}
                    </h2>
                    <p className="mt-2 text-sm text-[#bbb6ad]">
                      {featured.location}
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-semibold">
                        {formatCurrency(Math.floor(featured.priceInCents / 2))}
                      </span>
                      <span className="text-xs text-[#bbb6ad]">
                        {availability(featured)} lugares
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            )}
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
          <div className="flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="font-mono text-xs tracking-[.2em] text-[#ff5c35]">
                TOP EVENTOS
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                Mais aguardados
              </h2>
            </div>
            <Link
              href="/events"
              className="text-sm font-medium text-[#ff7a59] hover:text-white"
            >
              Ver programação completa →
            </Link>
          </div>
          {loading && (
            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="aspect-[3/5] animate-pulse border border-[#29292d] bg-[#141416]"
                />
              ))}
            </div>
          )}
          {error && (
            <div
              role="alert"
              className="mt-9 flex flex-wrap items-center justify-between gap-4 border border-red-400/30 bg-red-950/20 p-5"
            >
              <p className="text-red-200">{error}</p>
              <Link href="/events" className="text-sm text-[#ff7a59] underline">
                Tentar no catálogo
              </Link>
            </div>
          )}
          {!loading && !error && (
            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {events.slice(0, 4).map((event, index) => (
                <EventCard key={event.id} event={event} priority={index < 2} />
              ))}
            </div>
          )}
        </section>

        <section className="border-y border-[#29292d] bg-[#141416]">
          <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8 sm:py-20">
            <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
              <div>
                <p className="font-mono text-xs tracking-[.2em] text-[#ff5c35]">
                  MAIS NA PROGRAMAÇÃO
                </p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                  Sessões para descobrir
                </h2>
                <p className="mt-4 max-w-md leading-7 text-[#9e9990]">
                  Ficção científica, animação e clássicos modernos em salas com
                  poltronas marcadas.
                </p>
                <div className="mt-7 flex flex-wrap gap-2 text-xs">
                  {[
                    "Ficção científica",
                    "Aventura",
                    "Animação",
                    "Sessões especiais",
                  ].map((genre) => (
                    <span
                      key={genre}
                      className="border border-[#3a3a40] px-3 py-2 text-[#aaa59c]"
                    >
                      {genre}
                    </span>
                  ))}
                </div>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                {events.slice(4, 6).map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
