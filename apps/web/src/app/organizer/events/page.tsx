'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Event = {
  id: string;
  title: string;
  startsAt: string;
  location: string;
  status: 'DRAFT' | 'PUBLISHED' | 'CANCELLED';
  capacity: number;
  soldQuantity: number;
  heldQuantity: number;
  priceInCents: number;
};

export default function OrganizerEventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<Event[]>('/organizer/events')
      .then(setEvents)
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : 'Não foi possível carregar os eventos.',
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <main
      className="mx-auto w-full max-w-5xl px-6 py-10 sm:py-14"
      aria-busy={loading}
    >
      <header className="mb-10 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="font-mono text-xs tracking-[.2em] text-[#e76732]">
            YOTICKET / PROGRAMAÇÃO
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Seus eventos</h1>
        </div>
        <Link
          className="bg-[#e76732] px-4 py-3 font-semibold text-[#151412] focus:outline-2 focus:outline-offset-2 focus:outline-[#f7f2e8]"
          href="/organizer/events/new"
        >
          Novo evento
        </Link>
      </header>
      {loading && <p className="text-[#bdb5a8]">Carregando eventos…</p>}
      {error && (
        <p role="alert" className="border border-red-300/50 p-4 text-red-200">
          {error}
        </p>
      )}
      {!loading && !error && events.length === 0 && (
        <p className="border-y border-[#3d3932] py-10 text-[#bdb5a8]">
          Nenhum evento criado ainda.
        </p>
      )}
      {!loading && !error && events.length > 0 && (
        <div className="divide-y divide-[#3d3932] border-y border-[#3d3932]">
          {events.map((event) => {
            const available =
              event.capacity - event.soldQuantity - event.heldQuantity;
            return (
              <article
                key={event.id}
                className="grid gap-4 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div>
                  <h2 className="text-xl font-semibold">{event.title}</h2>
                  <p className="mt-1 text-sm text-[#bdb5a8]">
                    {new Date(event.startsAt).toLocaleString('pt-BR')} ·{' '}
                    {event.location}
                  </p>
                  <p className="mt-3 text-sm text-[#bdb5a8]">
                    {event.soldQuantity} vendidos · {available} disponíveis ·
                    Receita simulada: R${' '}
                    {((event.soldQuantity * event.priceInCents) / 100).toFixed(2)}
                  </p>
                </div>
                <p className="font-mono text-xs text-[#e76732]">
                  {event.status}
                </p>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
