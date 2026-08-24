import Image from "next/image";
import Link from "next/link";
import {
  availability,
  formatCurrency,
  formatDate,
  formatTime,
  type PublicEvent,
} from "@/lib/event";

export function EventCard({
  event,
  priority = false,
}: {
  event: PublicEvent;
  priority?: boolean;
}) {
  const available = availability(event);

  return (
    <Link
      href={`/events/${event.id}`}
      className="group block overflow-hidden border border-[#29292d] bg-[#141416] hover:-translate-y-1 hover:border-[#ff5c35]"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-[#202024]">
        {event.posterUrl ? (
          <Image
            src={event.posterUrl}
            alt={`Pôster de ${event.title}`}
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
        <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-black/90 to-transparent" />
        <p className="absolute bottom-4 left-4 bg-[#ff5c35] px-2.5 py-1 font-mono text-[11px] font-semibold text-black">
          {formatDate(event.startsAt)} · {formatTime(event.startsAt)}
        </p>
      </div>
      <div className="p-5">
        <h3 className="line-clamp-2 text-xl font-semibold leading-tight">
          {event.title}
        </h3>
        <p className="mt-3 truncate text-sm text-[#9e9990]">{event.location}</p>
        <div className="mt-5 flex items-end justify-between gap-3 border-t border-[#29292d] pt-4">
          <div>
            <p className="text-[11px] uppercase tracking-[.12em] text-[#77736d]">
              A partir de
            </p>
            <p className="mt-1 font-semibold text-[#ff7a59]">
              {formatCurrency(Math.floor(event.priceInCents / 2))}
            </p>
          </div>
          <p
            className={`text-xs ${available < 15 ? "text-amber-300" : "text-[#8f8a82]"}`}
          >
            {available} disponíveis
          </p>
        </div>
      </div>
    </Link>
  );
}
