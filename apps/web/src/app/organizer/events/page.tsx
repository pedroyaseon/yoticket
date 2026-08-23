"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
type Event = {
  id: string;
  title: string;
  startsAt: string;
  location: string;
  status: string;
  capacity: number;
  soldQuantity: number;
  priceInCents: number;
};
export default function OrganizerEvents() {
  const [events, setEvents] = useState<Event[]>([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api<Event[]>("/organizer/events")
      .then(setEvents)
      .catch((e) => setError(e.message));
  }, []);
  return (
    <main className="mx-auto w-full max-w-5xl px-6 py-14">
      <header className="mb-10 flex items-end justify-between">
        <div>
          <p className="font-mono text-xs tracking-[.2em] text-[#e76732]">
            YOTICKET / PROGRAMAÇÃO
          </p>
          <h1 className="mt-3 text-4xl font-semibold">Seus eventos</h1>
        </div>
        <Link
          className="bg-[#e76732] px-4 py-3 font-semibold text-[#151412]"
          href="/organizer/events/new"
        >
          Novo evento
        </Link>
      </header>
      {error && <p className="text-red-300">{error}</p>}
      <div className="divide-y divide-[#3d3932] border-y border-[#3d3932]">
        {events.map((event) => (
          <article
            key={event.id}
            className="flex items-center justify-between py-5"
          >
            <div>
              <h2 className="text-xl font-semibold">{event.title}</h2>
              <p className="mt-1 text-[#bdb5a8]">
                {new Date(event.startsAt).toLocaleString("pt-BR")} ·{" "}
                {event.location}
              </p>
            </div>
            <p className="font-mono text-xs text-[#e76732]">{event.status}</p>
          </article>
        ))}
        {!error && events.length === 0 && (
          <p className="py-10 text-[#bdb5a8]">Nenhum evento criado ainda.</p>
        )}
      </div>
    </main>
  );
}
