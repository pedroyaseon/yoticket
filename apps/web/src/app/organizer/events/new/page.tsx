"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import {
  ScheduleFields,
  sessionStartsAtFrom,
} from "@/components/schedule-fields";
import { api } from "@/lib/api";
import type { Venue } from "@/lib/movie";

type CatalogMovie = {
  externalId: number;
  title: string;
  description: string;
  posterUrl: string | null;
  releaseDate: string | null;
};

export default function NewEventPage() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<CatalogMovie[]>([]);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selected, setSelected] = useState<CatalogMovie | null>(null);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(true);
  const [creating, setCreating] = useState(false);
  const router = useRouter();

  useEffect(() => {
    void loadMovies("");
    api<Venue[]>("/venues")
      .then(setVenues)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (!selected) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && !creating) {
        setSelected(null);
        setError("");
      }
    }
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [creating, selected]);

  async function loadMovies(movieQuery: string) {
    setSearching(true);
    setError("");
    try {
      const result = await api<CatalogMovie[]>(
        `/catalog/movies?query=${encodeURIComponent(movieQuery.trim())}`,
      );
      setMovies(result);
      if (result.length === 0)
        setError("Nenhum filme encontrado para esta busca.");
    } catch (reason) {
      setMovies([]);
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível consultar o catálogo.",
      );
    } finally {
      setSearching(false);
    }
  }

  function search(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (query.trim().length === 1) {
      setError("Informe ao menos dois caracteres para buscar.");
      return;
    }
    setSelected(null);
    void loadMovies(query);
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      setError("Escolha um filme do catálogo.");
      return;
    }
    setCreating(true);
    setError("");
    const data = new FormData(event.currentTarget);
    try {
      const startsAt = sessionStartsAtFrom(data);
      await api<{ count: number; firstEventId: string }>("/events/schedule", {
        method: "POST",
        body: JSON.stringify({
          externalId: selected.externalId,
          title: selected.title,
          description: selected.description || "Sessão especial de cinema.",
          posterUrl: selected.posterUrl || undefined,
          location: data.get("location"),
          startsAt,
          capacity: Number(data.get("capacity")),
          priceInCents: Math.round(Number(data.get("price")) * 100),
        }),
      });
      router.push("/organizer/events");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível publicar o evento.",
      );
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      <SiteHeader />
      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <Link
          href="/organizer/events"
          className="text-sm text-[#9e9990] hover:text-[#ff5c35]"
        >
          ← Voltar para meus eventos
        </Link>
        <div className="mt-7 border-b border-[#29292d] pb-8">
          <p className="font-mono text-xs tracking-[.2em] text-[#ff5c35]">
            CATÁLOGO DO ORGANIZADOR
          </p>
          <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
            Adicionar filme à programação
          </h1>
          <p className="mt-4 max-w-2xl text-[#9e9990]">
            Escolha um filme em cartaz ou pesquise na TMDb e configure onde e
            por quanto tempo e em quais horários ele será exibido.
          </p>
        </div>

        <form
          onSubmit={search}
          className="mt-8 flex flex-col gap-3 sm:flex-row"
          aria-busy={searching}
        >
          <label className="sr-only" htmlFor="movie-query">
            Buscar filme
          </label>
          <input
            id="movie-query"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Busque por título, por exemplo: Interestelar"
            className="flex-1 border border-[#39393e] bg-[#141416] p-3.5 outline-none focus:border-[#ff5c35]"
          />
          <button
            disabled={searching}
            className="bg-[#ff5c35] px-6 py-3.5 font-semibold text-black disabled:opacity-50"
          >
            {searching ? "Consultando…" : "Buscar filme"}
          </button>
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setSelected(null);
                void loadMovies("");
              }}
              className="border border-[#39393e] px-5 py-3.5 text-sm"
            >
              Ver em cartaz
            </button>
          )}
        </form>

        {error && !selected && (
          <p
            role="alert"
            className="mt-5 border border-red-400/30 bg-red-950/20 p-4 text-red-200"
          >
            {error}
          </p>
        )}

        <section className="mt-8" aria-live="polite">
          <div className="mb-4 flex items-end justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[.14em] text-[#77736d]">
                {query ? "Resultado da busca" : "Filmes em cartaz"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold">
                Escolha o filme da sessão
              </h2>
            </div>
            <p className="text-sm text-[#77736d]">{movies.length} títulos</p>
          </div>
          {searching ? (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {Array.from({ length: 6 }, (_, index) => (
                <div
                  key={index}
                  className="aspect-[2/3] animate-pulse bg-[#1b1b1e]"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
              {movies.map((movie) => (
                <button
                  type="button"
                  aria-pressed={selected?.externalId === movie.externalId}
                  onClick={() => {
                    setSelected(movie);
                    setError("");
                  }}
                  key={movie.externalId}
                  className={`group overflow-hidden border text-left ${
                    selected?.externalId === movie.externalId
                      ? "border-[#ff5c35]"
                      : "border-[#303034] hover:border-[#77736d]"
                  }`}
                >
                  <div className="relative aspect-[2/3] bg-[#202024]">
                    {movie.posterUrl && (
                      <Image
                        src={movie.posterUrl}
                        alt={`Cartaz de ${movie.title}`}
                        fill
                        sizes="(max-width: 640px) 50vw, 180px"
                        className="object-cover"
                      />
                    )}
                    {selected?.externalId === movie.externalId && (
                      <span className="absolute right-2 top-2 bg-[#ff5c35] px-2 py-1 text-xs font-bold text-black">
                        Selecionado
                      </span>
                    )}
                  </div>
                  <span className="block min-h-16 p-3 text-sm font-semibold leading-5">
                    {movie.title}
                  </span>
                </button>
              ))}
            </div>
          )}
        </section>

        {selected && (
          <div
            className="fixed inset-0 z-50 overflow-y-auto bg-black/85 px-4 py-5 backdrop-blur-sm sm:px-6 sm:py-8"
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !creating) {
                setSelected(null);
                setError("");
              }
            }}
          >
            <form
              onSubmit={create}
              role="dialog"
              aria-modal="true"
              aria-labelledby="schedule-dialog-title"
              aria-busy={creating}
              className="relative mx-auto grid w-full max-w-6xl gap-7 border border-[#3b3b40] bg-[#141416] p-5 shadow-2xl md:grid-cols-[180px_minmax(0,1fr)] sm:p-7 lg:grid-cols-[220px_minmax(0,1fr)] lg:p-8"
            >
              <button
                type="button"
                aria-label="Fechar configuração"
                autoFocus
                disabled={creating}
                onClick={() => {
                  setSelected(null);
                  setError("");
                }}
                className="absolute right-4 top-4 z-10 grid h-10 w-10 place-items-center border border-[#3d3d42] bg-[#111113] text-xl text-[#aaa59c] hover:border-[#ff5c35] hover:text-white disabled:opacity-40"
              >
                ×
              </button>

              <div className="relative hidden aspect-[2/3] self-start overflow-hidden bg-[#202024] md:block">
                {selected.posterUrl && (
                  <Image
                    src={selected.posterUrl}
                    alt={`Cartaz de ${selected.title}`}
                    fill
                    sizes="220px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 pt-9 md:pt-0">
                <p className="font-mono text-xs tracking-[.16em] text-[#ff5c35]">
                  CONFIGURAR PROGRAMAÇÃO
                </p>
                <h2
                  id="schedule-dialog-title"
                  className="mt-3 pr-10 text-3xl font-semibold"
                >
                  {selected.title}
                </h2>
                <p className="mt-2 text-sm text-[#8f8a82]">
                  Defina o local, período e horários antes de publicar as
                  sessões.
                </p>

                {error && (
                  <p
                    role="alert"
                    className="mt-5 border border-red-400/30 bg-red-950/20 p-4 text-red-200"
                  >
                    {error}
                  </p>
                )}

                <ScheduleFields venues={venues} />
                <div className="mt-7 flex flex-wrap items-center gap-4 border-t border-[#303034] pt-6">
                  <button
                    type="button"
                    disabled={creating}
                    onClick={() => {
                      setSelected(null);
                      setError("");
                    }}
                    className="border border-[#3d3d42] px-5 py-3.5 text-sm text-[#bbb6ad] hover:border-[#77736d] disabled:opacity-40"
                  >
                    Cancelar
                  </button>
                  <button
                    disabled={creating}
                    className="bg-[#ff5c35] px-6 py-3.5 font-semibold text-black disabled:opacity-50"
                  >
                    {creating ? "Criando programação…" : "Criar programação"}
                  </button>
                  <p className="text-sm text-[#77736d]">
                    Meia-entrada será calculada automaticamente.
                  </p>
                </div>
              </div>
            </form>
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
