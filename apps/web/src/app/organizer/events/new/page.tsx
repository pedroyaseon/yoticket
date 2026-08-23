'use client';

import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { api } from '@/lib/api';

type Movie = {
  externalId: number;
  title: string;
  description: string;
  posterUrl: string | null;
};

export default function NewEventPage() {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selected, setSelected] = useState<Movie | null>(null);
  const [error, setError] = useState('');
  const [searching, setSearching] = useState(false);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  async function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!query.trim()) {
      setError('Informe o título de um filme para buscar.');
      return;
    }
    setSearching(true);
    setError('');
    setSelected(null);
    try {
      setMovies(
        await api<Movie[]>(
          `/catalog/movies?query=${encodeURIComponent(query.trim())}`,
        ),
      );
    } catch (reason) {
      setMovies([]);
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível buscar o catálogo.',
      );
    } finally {
      setSearching(false);
    }
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      setError('Escolha um filme do catálogo.');
      return;
    }
    setCreating(true);
    setError('');
    const data = new FormData(event.currentTarget);
    try {
      const created = await api<{ id: string }>('/events', {
        method: 'POST',
        body: JSON.stringify({
          externalId: selected.externalId,
          title: selected.title,
          description: selected.description || 'Sessão especial de cinema.',
          posterUrl: selected.posterUrl || undefined,
          location: data.get('location'),
          startsAt: new Date(String(data.get('startsAt'))).toISOString(),
          capacity: Number(data.get('capacity')),
          priceInCents: Math.round(Number(data.get('price')) * 100),
        }),
      });
      await api(`/events/${created.id}/publish`, { method: 'POST' });
      router.push('/organizer/events');
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'Não foi possível publicar o evento.',
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10 sm:py-14">
      <p className="font-mono text-xs tracking-[.2em] text-[#e76732]">
        YOTICKET / NOVO EVENTO
      </p>
      <h1 className="mt-3 text-4xl font-semibold">Monte sua sessão</h1>
      <p className="mt-3 text-[#bdb5a8]">
        Busque um filme, escolha-o e complete as informações da sessão.
      </p>
      <form
        onSubmit={search}
        className="mt-8 flex flex-col gap-2 sm:flex-row"
        aria-busy={searching}
      >
        <label className="sr-only" htmlFor="movie-query">
          Busque um filme
        </label>
        <input
          id="movie-query"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Busque um filme"
          className="flex-1 border border-[#514b41] bg-transparent p-3"
        />
        <button
          disabled={searching}
          className="border border-[#e76732] px-4 py-3 text-[#e76732] disabled:opacity-50"
        >
          {searching ? 'Buscando…' : 'Buscar'}
        </button>
      </form>
      {error && (
        <p role="alert" className="mt-4 border border-red-300/50 p-3 text-red-200">
          {error}
        </p>
      )}
      <div className="mt-4 grid gap-2" aria-live="polite">
        {!searching && query && movies.length === 0 && !error && (
          <p className="text-sm text-[#bdb5a8]">Nenhum filme encontrado.</p>
        )}
        {movies.map((movie) => (
          <button
            type="button"
            aria-pressed={selected?.externalId === movie.externalId}
            onClick={() => setSelected(movie)}
            key={movie.externalId}
            className={`border p-3 text-left ${selected?.externalId === movie.externalId ? 'border-[#e76732]' : 'border-[#3d3932]'}`}
          >
            {movie.title}
          </button>
        ))}
      </div>
      {selected && (
        <form
          onSubmit={create}
          className="mt-8 grid gap-4 border-t border-[#3d3932] pt-8"
          aria-busy={creating}
        >
          <p className="font-semibold">Filme selecionado: {selected.title}</p>
          <label htmlFor="location">Local</label>
          <input required id="location" name="location" className="border border-[#514b41] bg-transparent p-3" />
          <label htmlFor="startsAt">Data e horário</label>
          <input required id="startsAt" name="startsAt" type="datetime-local" className="border border-[#514b41] bg-transparent p-3" />
          <div className="grid gap-4 sm:grid-cols-2">
            <label htmlFor="capacity">Capacidade<input required id="capacity" name="capacity" min="1" type="number" className="mt-2 w-full border border-[#514b41] bg-transparent p-3" /></label>
            <label htmlFor="price">Preço (R$)<input required id="price" name="price" min="0" step="0.01" type="number" className="mt-2 w-full border border-[#514b41] bg-transparent p-3" /></label>
          </div>
          <button disabled={creating} className="bg-[#e76732] p-3 font-semibold text-[#151412] disabled:opacity-50">{creating ? 'Publicando…' : 'Publicar evento'}</button>
        </form>
      )}
    </main>
  );
}
