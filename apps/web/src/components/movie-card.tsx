import Image from "next/image";
import Link from "next/link";
import { formatCurrency } from "@/lib/event";
import type { MovieSummary } from "@/lib/movie";

export function MovieCard({
  movie,
  priority = false,
}: {
  movie: MovieSummary;
  priority?: boolean;
}) {
  return (
    <Link
      href={`/events/${movie.key}`}
      className="group block overflow-hidden border border-[#29292d] bg-[#141416] hover:-translate-y-1 hover:border-[#ff5c35]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#202024]">
        {movie.posterUrl ? (
          <Image
            src={movie.posterUrl}
            alt={`Pôster de ${movie.title}`}
            fill
            priority={priority}
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center font-mono text-xs tracking-[.2em] text-[#6f6b65]">
            YOTICKET
          </div>
        )}
      </div>
      <div className="p-5">
        <h3 className="line-clamp-2 min-h-12 text-xl font-semibold leading-tight">
          {movie.title}
        </h3>
        <p className="mt-3 text-sm text-[#9e9990]">
          {movie.venues.length === 1
            ? movie.venues[0]
            : `${movie.venues.length} locais para escolher`}
        </p>
        <div className="mt-5 flex items-end justify-between gap-3 border-t border-[#29292d] pt-4">
          <div>
            <p className="text-[11px] uppercase tracking-[.12em] text-[#77736d]">
              A partir de
            </p>
            <p className="mt-1 font-semibold text-[#ff7a59]">
              {formatCurrency(movie.priceFromInCents)}
            </p>
          </div>
          <span className="text-xs font-medium text-[#ff7a59]">
            Ver sessões →
          </span>
        </div>
      </div>
    </Link>
  );
}
