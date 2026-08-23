'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Event = {
  id: string;
  title: string;
  location: string;
  startsAt: string;
  priceInCents: number;
  posterUrl?: string | null;
};

export default function HomePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Event[]>('/events')
      .then((items) => setEvents(items.slice(0, 3)))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-full bg-[#151412] text-[#f7f2e8]">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Link href="/" className="font-mono text-sm tracking-[.22em] text-[#e76732]">
          YOTICKET
        </Link>
        <nav aria-label="Navegação principal" className="flex items-center gap-5 text-sm">
          <Link href="/events" className="text-[#d8d0c2] hover:text-[#e76732]">
            Eventos
          </Link>
          <Link href="/login" className="border border-[#514b41] px-3 py-2 hover:border-[#e76732]">
            Entrar
          </Link>
        </nav>
      </header>

      <section className="mx-auto grid max-w-6xl gap-10 px-6 pb-16 pt-12 md:grid-cols-[1.1fr_.9fr] md:items-end md:pt-24">
        <div className="border-l-2 border-[#e76732] pl-6">
          <p className="font-mono text-xs tracking-[.22em] text-[#e76732]">
            CINEMA, EVENTOS E ENTRADA SEM FILA
          </p>
          <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight sm:text-6xl">
            Escolha a sessão. Garanta seu ingresso.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-[#c8c1b6]">
            Descubra experiências em cartaz, compre com segurança e apresente seu QR Code na entrada.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link href="/events" className="bg-[#e76732] px-5 py-3 font-semibold text-[#151412] hover:bg-[#f17b48]">
              Ver sessões
            </Link>
            <Link href="/login" className="border border-[#514b41] px-5 py-3 hover:border-[#e76732]">
              Acessar minha conta
            </Link>
          </div>
        </div>
        <aside className="border border-[#3d3932] bg-[#201e1a] p-6">
          <p className="font-mono text-xs tracking-[.18em] text-[#e76732]">COMO FUNCIONA</p>
          <ol className="mt-6 space-y-5 text-[#d8d0c2]">
            <li><span className="mr-3 font-mono text-[#e76732]">01</span>Encontre uma sessão publicada.</li>
            <li><span className="mr-3 font-mono text-[#e76732]">02</span>Reserve e simule o pagamento.</li>
            <li><span className="mr-3 font-mono text-[#e76732]">03</span>Apresente o QR Code na portaria.</li>
          </ol>
        </aside>
      </section>

      <section className="border-t border-[#3d3932] bg-[#1b1916]">
        <div className="mx-auto max-w-6xl px-6 py-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="font-mono text-xs tracking-[.2em] text-[#e76732]">EM CARTAZ</p>
              <h2 className="mt-3 text-3xl font-semibold">Próximas sessões</h2>
            </div>
            <Link href="/events" className="text-sm text-[#e76732] underline underline-offset-4">Ver todos os eventos</Link>
          </div>
          {loading && <p className="mt-8 text-[#bdb5a8]">Carregando sessões…</p>}
          {!loading && events.length === 0 && <p className="mt-8 text-[#bdb5a8]">Acesse os eventos para consultar a programação disponível.</p>}
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {events.map((event) => (
              <Link href={`/events/${event.id}`} key={event.id} className="group border border-[#3d3932] bg-[#201e1a] hover:border-[#e76732]">
                <div role="img" aria-label={`Pôster de ${event.title}`} className="h-52 bg-[#2b2822] bg-cover bg-center" style={event.posterUrl ? { backgroundImage: `url(${event.posterUrl})` } : undefined} />
                <div className="p-5"><h3 className="text-2xl font-semibold">{event.title}</h3><p className="mt-3 text-sm text-[#bdb5a8]">{new Date(event.startsAt).toLocaleString('pt-BR')}</p><p className="text-sm text-[#bdb5a8]">{event.location}</p><p className="mt-5 text-[#e76732]">R$ {(event.priceInCents / 100).toFixed(2)}</p></div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
