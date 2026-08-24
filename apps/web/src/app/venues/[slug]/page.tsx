"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { MovieCard } from "@/components/movie-card";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { api } from "@/lib/api";
import type { Venue } from "@/lib/movie";

export default function VenueDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    api<Venue>(`/venues/${encodeURIComponent(slug)}`)
      .then(setVenue)
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar este local.",
        ),
      );
  }, [slug]);

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      <SiteHeader />
      <main className="mx-auto min-h-[75vh] max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
        <Link href="/venues" className="text-sm text-[#9e9990] hover:text-[#ff5c35]">
          ← Todos os locais
        </Link>
        {error ? (
          <p role="alert" className="mt-8 border border-red-400/30 bg-red-950/20 p-5 text-red-200">
            {error}
          </p>
        ) : !venue ? (
          <div className="mt-8 h-72 animate-pulse bg-[#141416]" />
        ) : (
          <>
            <header className="mt-8 border-b border-[#29292d] pb-10">
              <p className="font-mono text-xs tracking-[.2em] text-[#ff5c35]">
                PROGRAMAÇÃO DO LOCAL
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-6xl">
                {venue.name}
              </h1>
              <p className="mt-4 text-[#9e9990]">
                {venue.movieCount} filmes com sessões disponíveis.
              </p>
            </header>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {venue.movies.map((movie, index) => (
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
