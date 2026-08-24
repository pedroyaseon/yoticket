"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { api } from "@/lib/api";
import type { Venue } from "@/lib/movie";

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Venue[]>("/venues")
      .then(setVenues)
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar os locais.",
        ),
      )
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      <SiteHeader />
      <main className="mx-auto min-h-[75vh] max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <header className="border-b border-[#29292d] pb-10">
          <p className="font-mono text-xs tracking-[.2em] text-[#ff5c35]">
            LOCAIS
          </p>
          <h1 className="mt-4 text-5xl font-semibold tracking-tight sm:text-6xl">
            Onde você quer assistir?
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-[#a8a39a]">
            Abra um local para ver os filmes disponíveis e seguir para os dias,
            horários e poltronas.
          </p>
        </header>

        {loading && <div className="mt-10 h-72 animate-pulse bg-[#141416]" />}
        {error && (
          <p role="alert" className="mt-10 border border-red-400/30 bg-red-950/20 p-5 text-red-200">
            {error}
          </p>
        )}
        {!loading && !error && (
          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            {venues.map((venue) => (
              <Link
                key={venue.slug}
                href={`/venues/${venue.slug}`}
                className="group overflow-hidden border border-[#303034] bg-[#141416] hover:border-[#ff5c35]"
              >
                <div className="grid h-44 grid-cols-4 gap-px bg-[#29292d]">
                  {venue.movies.slice(0, 4).map((movie) => (
                    <div key={movie.key} className="relative bg-[#202024]">
                      {movie.posterUrl && (
                        <Image
                          src={movie.posterUrl}
                          alt=""
                          fill
                          sizes="180px"
                          className="object-cover opacity-75 transition group-hover:opacity-100"
                        />
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-end justify-between gap-5 p-6">
                  <div>
                    <p className="font-mono text-[10px] tracking-[.18em] text-[#ff5c35]">
                      {venue.movieCount} FILMES EM CARTAZ
                    </p>
                    <h2 className="mt-3 text-2xl font-semibold">{venue.name}</h2>
                  </div>
                  <span className="text-2xl text-[#ff7a59]">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
      <SiteFooter />
    </div>
  );
}
