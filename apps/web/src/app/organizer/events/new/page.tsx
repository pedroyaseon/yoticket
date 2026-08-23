"use client";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import { api } from "@/lib/api";
type Movie = {
  externalId: number;
  title: string;
  description: string;
  posterUrl: string | null;
};
export default function NewEvent() {
  const [query, setQuery] = useState("");
  const [movies, setMovies] = useState<Movie[]>([]);
  const [selected, setSelected] = useState<Movie | null>(null);
  const [error, setError] = useState("");
  const router = useRouter();
  async function search(e: FormEvent) {
    e.preventDefault();
    try {
      setMovies(
        await api<Movie[]>(
          `/catalog/movies?query=${encodeURIComponent(query)}`,
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao buscar.");
    }
  }
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return setError("Escolha um filme do catálogo.");
    const d = new FormData(e.currentTarget);
    try {
      const event = await api<{ id: string }>("/events", {
        method: "POST",
        body: JSON.stringify({
          externalId: selected.externalId,
          title: selected.title,
          description: selected.description || "Sessão especial de cinema.",
          posterUrl: selected.posterUrl || undefined,
          location: d.get("location"),
          startsAt: new Date(String(d.get("startsAt"))).toISOString(),
          capacity: Number(d.get("capacity")),
          priceInCents: Math.round(Number(d.get("price")) * 100),
        }),
      });
      await api(`/events/${event.id}/publish`, { method: "POST" });
      router.push("/organizer/events");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao criar evento.");
    }
  }
  return (
    <main className="mx-auto max-w-3xl px-6 py-14">
      <p className="font-mono text-xs tracking-[.2em] text-[#e76732]">
        YOTICKET / NOVO EVENTO
      </p>
      <h1 className="mt-3 text-4xl font-semibold">Monte sua sessão</h1>
      <form onSubmit={search} className="mt-8 flex gap-2">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Busque um filme"
          className="flex-1 border border-[#514b41] bg-transparent p-3"
        />
        <button className="border border-[#e76732] px-4 text-[#e76732]">
          Buscar
        </button>
      </form>
      <div className="mt-4 grid gap-2">
        {movies.map((movie) => (
          <button
            type="button"
            onClick={() => setSelected(movie)}
            key={movie.externalId}
            className={`border p-3 text-left ${selected?.externalId === movie.externalId ? "border-[#e76732]" : "border-[#3d3932]"}`}
          >
            {movie.title}
          </button>
        ))}
      </div>
      {selected && (
        <form
          onSubmit={create}
          className="mt-8 grid gap-4 border-t border-[#3d3932] pt-8"
        >
          <p className="font-semibold">Filme selecionado: {selected.title}</p>
          <input
            required
            name="location"
            placeholder="Local"
            className="border border-[#514b41] bg-transparent p-3"
          />
          <input
            required
            name="startsAt"
            type="datetime-local"
            className="border border-[#514b41] bg-transparent p-3"
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              required
              name="capacity"
              min="1"
              type="number"
              placeholder="Capacidade"
              className="border border-[#514b41] bg-transparent p-3"
            />
            <input
              required
              name="price"
              min="0"
              step="0.01"
              type="number"
              placeholder="Preço (R$)"
              className="border border-[#514b41] bg-transparent p-3"
            />
          </div>
          <button className="bg-[#e76732] p-3 font-semibold text-[#151412]">
            Publicar evento
          </button>
        </form>
      )}
      {error && <p className="mt-4 text-red-300">{error}</p>}
    </main>
  );
}
