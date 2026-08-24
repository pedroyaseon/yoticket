"use client";

import { useEffect, useState } from "react";
import { MovieCard } from "@/components/movie-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { api } from "@/lib/api";
import type { MovieSummary } from "@/lib/movie";

export default function EventsPage() {
  const [movies, setMovies] = useState<MovieSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [query, setQuery] = useState("");
  const [resolvedQuery, setResolvedQuery] = useState<string | null>(null);
  const [error, setError] = useState("");
  const loading = resolvedQuery === null;
  const searching = resolvedQuery !== null && query !== resolvedQuery;

  useEffect(() => {
    const timer = window.setTimeout(() => setQuery(searchTerm.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    const controller = new AbortController();
    api<MovieSummary[]>(
      `/movies${query ? `?q=${encodeURIComponent(query)}` : ""}`,
      { signal: controller.signal },
    )
      .then((items) => {
        setMovies(items);
        setError("");
        setResolvedQuery(query);
      })
      .catch((reason: unknown) => {
        if (!(reason instanceof DOMException && reason.name === "AbortError")) {
          setError(
            reason instanceof Error
              ? reason.message
              : "Não foi possível carregar os filmes.",
          );
          setResolvedQuery(query);
        }
      });
    return () => controller.abort();
  }, [query]);

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      <SiteHeader />
      <main
        className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16"
        aria-busy={loading || searching}
      >
        <section className="grid gap-8 border-b border-[#29292d] pb-10 md:grid-cols-[minmax(0,1fr)_420px] md:items-end">
          <div>
            <p className="font-mono text-xs tracking-[.2em] text-[#ff5c35]">
              PROGRAMAÇÃO
            </p>
            <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">
              Filmes em cartaz
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-[#a8a39a]">
              Escolha o filme primeiro. Na página seguinte você define o local,
              o dia, o horário e a poltrona.
            </p>
          </div>
          <label htmlFor="event-search">
            <span className="mb-2 block text-xs uppercase tracking-[.14em] text-[#817d76]">
              Buscar por título
            </span>
            <div className="relative">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 left-0 grid w-11 place-items-center text-[#77736d]"
              >
                ⌕
              </span>
              <input
                id="event-search"
                value={searchTerm}
                onChange={(input) => setSearchTerm(input.target.value)}
                placeholder="Ex.: Interestelar"
                autoComplete="off"
                className="w-full appearance-none border border-[#39393e] bg-[#141416] py-3 pl-11 pr-11 outline-none transition placeholder:text-[#5d5a55] focus:border-[#ff5c35] focus:outline-none focus:ring-0"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label="Limpar busca"
                  className="absolute right-0 top-0 grid h-full w-11 place-items-center text-[#77736d] hover:text-white"
                >
                  ×
                </button>
              )}
            </div>
          </label>
        </section>
        {loading && (
          <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="aspect-[3/5] animate-pulse border border-[#29292d] bg-[#141416]"
              />
            ))}
          </div>
        )}
        {error && (
          <p
            role="alert"
            className="mt-10 border border-red-400/30 bg-red-950/20 p-5 text-red-200"
          >
            {error}
          </p>
        )}
        {!loading && !error && movies.length === 0 && (
          <div className="mt-10 border border-[#29292d] bg-[#141416] p-10 text-center">
            <p className="text-xl font-semibold">Nenhum filme encontrado</p>
            <p className="mt-2 text-[#9e9990]">
              Tente buscar por outro título.
            </p>
          </div>
        )}
        {!loading && !error && movies.length > 0 && (
          <>
            <div className="mt-10 flex min-h-5 items-center justify-between">
              <p className="text-sm text-[#8f8a82]">
                {searching
                  ? "Buscando…"
                  : `${movies.length} ${
                      movies.length === 1
                        ? "filme encontrado"
                        : "filmes encontrados"
                    }`}
              </p>
              <p className="font-mono text-xs text-[#66635e]">EM CARTAZ</p>
            </div>
            <div
              className={`mt-5 grid gap-5 transition-opacity sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 ${searching ? "opacity-50" : "opacity-100"}`}
            >
              {movies.map((movie, index) => (
                <MovieCard key={movie.key} movie={movie} priority={index < 4} />
              ))}
            </div>
          </>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
