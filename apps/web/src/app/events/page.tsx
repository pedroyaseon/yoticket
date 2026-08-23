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

export default function EventsPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const controller = new AbortController();
    api<Event[]>(`/events${query ? `?q=${encodeURIComponent(query)}` : ''}`, {
      signal: controller.signal,
    })
      .then(setEvents)
      .catch((err: unknown) => {
        if (!(err instanceof DOMException && err.name === 'AbortError')) {
          setError(err instanceof Error ? err.message : 'Não foi possível carregar os eventos.');
        }
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [query]);

  return (
    <main className="mx-auto max-w-6xl px-6 py-12">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="font-mono text-xs tracking-[.2em] text-[#e76732]">YOTICKET / EM CARTAZ</p>
          <h1 className="mt-3 text-4xl font-semibold">Próximas sessões</h1>
        </div>
        <Link className="border border-[#514b41] px-4 py-2 text-sm hover:border-[#e76732]" href="/my-tickets">
          Meus ingressos
        </Link>
      </div>
      <label className="mt-8 block max-w-md">
        <span className="sr-only">Buscar evento</span>
        <input
          value={query}
          onChange={(event) => {
            setLoading(true);
            setQuery(event.target.value);
          }}
          placeholder="Buscar por título"
          className="w-full border border-[#514b41] bg-transparent px-4 py-3 outline-none focus:border-[#e76732]"
        />
      </label>
      {loading && <p className="mt-8 text-[#bdb5a8]">Carregando sessões…</p>}
      {error && <p className="mt-8 text-red-300">{error}</p>}
      {!loading && !error && events.length === 0 && <p className="mt-8 text-[#bdb5a8]">Nenhum evento publicado foi encontrado.</p>}
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Link href={`/events/${event.id}`} key={event.id} className="group border border-[#3d3932] bg-[#201e1a] hover:border-[#e76732]">
            {event.posterUrl ? (
              // TMDb fornece URLs remotas; otimização do Next seria configurada quando o domínio for fixado.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={event.posterUrl} alt={`Pôster de ${event.title}`} className="h-64 w-full object-cover opacity-85 transition group-hover:opacity-100" />
            ) : <div className="h-64 bg-[#2b2822]" />}
            <div className="p-5">
              <h2 className="text-2xl font-semibold">{event.title}</h2>
              <p className="mt-3 text-sm text-[#bdb5a8]">{new Date(event.startsAt).toLocaleString('pt-BR')}</p>
              <p className="text-sm text-[#bdb5a8]">{event.location}</p>
              <p className="mt-5 text-[#e76732]">R$ {(event.priceInCents / 100).toFixed(2)}</p>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
