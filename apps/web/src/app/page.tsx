"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MovieCard } from "@/components/movie-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { api } from "@/lib/api";
import { formatCurrency } from "@/lib/event";
import type { MovieSummary } from "@/lib/movie";

export default function HomePage() {
  const [movies, setMovies] = useState<MovieSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<MovieSummary[]>("/movies")
      .then(setMovies)
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar os filmes.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  const featured = movies[0];

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
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#0b0b0c_5%,rgba(11,11,12,.95)_42%,rgba(11,11,12,.45)_78%,#0b0b0c_100%)]" />
          <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[minmax(0,1fr)_330px]">
            <div className="max-w-3xl">
              <p className="font-mono text-xs font-semibold tracking-[.22em] text-[#ff5c35]">
                BILHETERIA DIGITAL
              </p>
              <h1 className="mt-6 text-5xl font-semibold leading-[.98] tracking-[-.04em] sm:text-7xl">
                Escolha o filme. A gente guarda o seu lugar.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-[#bbb6ad]">
                Confira os filmes em cartaz, encontre o melhor local e escolha
                dia, horário e poltrona antes de pagar.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link
                  href="/events"
                  className="bg-[#ff5c35] px-6 py-3.5 font-semibold text-black hover:bg-[#ff7655]"
                >
                  Ver filmes em cartaz
                </Link>
                <Link
                  href="/venues"
                  className="border border-[#4a4a50] bg-black/20 px-6 py-3.5 font-semibold hover:border-white"
                >
                  Explorar locais
                </Link>
              </div>
            </div>

            {featured && (
              <Link
                href={`/events/${featured.key}`}
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
                    DESTAQUE
                  </p>
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black via-black/85 to-transparent p-5 pt-24">
                    <h2 className="text-2xl font-semibold">{featured.title}</h2>
                    <p className="mt-2 text-sm text-[#bbb6ad]">
                      Em {featured.venues.length} locais
                    </p>
                    <div className="mt-4 flex items-center justify-between">
                      <span className="font-semibold text-[#ff7a59]">
                        A partir de {formatCurrency(featured.priceFromInCents)}
                      </span>
                      <span className="text-xs text-white">Ver sessões →</span>
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
                EM CARTAZ
              </p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight">
                Filmes para a próxima sessão
              </h2>
            </div>
            <Link
              href="/events"
              className="text-sm font-medium text-[#ff7a59] hover:text-white"
            >
              Ver todos os filmes →
            </Link>
          </div>

          {loading && (
            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="aspect-[3/5] animate-pulse border border-[#29292d] bg-[#141416]" />
              ))}
            </div>
          )}
          {error && (
            <p role="alert" className="mt-9 border border-red-400/30 bg-red-950/20 p-5 text-red-200">
              {error}
            </p>
          )}
          {!loading && !error && (
            <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {movies.slice(0, 8).map((movie, index) => (
                <MovieCard key={movie.key} movie={movie} priority={index < 4} />
              ))}
            </div>
          )}
        </section>

        <section className="border-y border-[#29292d] bg-[#141416]">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-7 px-5 py-12 sm:px-8 md:flex-row md:items-center">
            <div>
              <p className="font-mono text-xs tracking-[.2em] text-[#ff5c35]">
                CINEMAS E ESPAÇOS
              </p>
              <h2 className="mt-3 text-3xl font-semibold">
                Veja o que está passando perto de você
              </h2>
              <p className="mt-3 text-[#9e9990]">
                Consulte a programação completa de cada local.
              </p>
            </div>
            <Link
              href="/venues"
              className="shrink-0 border border-[#ff5c35] px-6 py-3.5 font-semibold text-[#ff7a59] hover:bg-[#ff5c35] hover:text-black"
            >
              Ver todos os locais
            </Link>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
