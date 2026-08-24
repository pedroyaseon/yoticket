"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { api } from "@/lib/api";
import { eventStatusLabels, type OrganizerEvent } from "@/lib/organizer-event";

export default function OrganizerEventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<OrganizerEvent | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api<OrganizerEvent>(`/organizer/events/${id}`)
      .then(setEvent)
      .catch((reason: unknown) =>
        setError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar o evento.",
        ),
      );
  }, [id]);

  async function save(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setBusy(true);
    setError("");
    setMessage("");
    const data = new FormData(formEvent.currentTarget);
    try {
      const updated = await api<OrganizerEvent>(`/events/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          description: data.get("description"),
          location: data.get("location"),
          startsAt: new Date(String(data.get("startsAt"))).toISOString(),
          capacity: data.get("capacity")
            ? Number(data.get("capacity"))
            : event?.capacity,
          priceInCents: Math.round(Number(data.get("price")) * 100),
        }),
      });
      setEvent(updated);
      setMessage("Alterações salvas com sucesso.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível salvar as alterações.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    setError("");
    try {
      setEvent(
        await api<OrganizerEvent>(`/events/${id}/publish`, { method: "POST" }),
      );
      setMessage("Evento publicado e disponível na bilheteria.");
    } catch (reason) {
      setError(
        reason instanceof Error ? reason.message : "Não foi possível publicar.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function cancelEvent() {
    if (
      !window.confirm(
        "Remover esta sessão da programação? Ela permanecerá no histórico como cancelada.",
      )
    )
      return;
    setBusy(true);
    setError("");
    try {
      setEvent(
        await api<OrganizerEvent>(`/events/${id}`, { method: "DELETE" }),
      );
      setMessage("Evento removido da programação.");
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : "Não foi possível remover o evento.",
      );
    } finally {
      setBusy(false);
    }
  }

  if (!event)
    return (
      <div className="min-h-screen bg-[#0b0b0c]">
        <SiteHeader />
        <main className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
          {error ? (
            <div role="alert">
              <h1 className="text-3xl font-semibold">Evento indisponível</h1>
              <p className="mt-4 text-[#9e9990]">{error}</p>
              <Link
                href="/organizer/events"
                className="mt-6 inline-block text-[#ff7a59]"
              >
                Voltar para meus eventos →
              </Link>
            </div>
          ) : (
            <div className="h-96 animate-pulse bg-[#141416]" />
          )}
        </main>
      </div>
    );

  const capacityLocked = event.soldQuantity > 0 || event.heldQuantity > 0;
  const cancelled = event.status === "CANCELLED";

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      <SiteHeader />
      <main className="mx-auto max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/organizer/events"
            className="text-sm text-[#9e9990] hover:text-[#ff5c35]"
          >
            ← Voltar para meus eventos
          </Link>
          {event.status === "PUBLISHED" && (
            <Link
              href={`/events/${event.externalId ?? event.id}`}
              className="border border-[#3a3a40] px-4 py-2.5 text-sm hover:border-[#ff5c35]"
            >
              Abrir página do filme ↗
            </Link>
          )}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)]">
          <aside>
            <div className="relative aspect-[2/3] overflow-hidden bg-[#202024]">
              {event.posterUrl && (
                <Image
                  src={event.posterUrl}
                  alt={`Cartaz de ${event.title}`}
                  fill
                  sizes="260px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="border border-t-0 border-[#343439] bg-[#141416] p-5">
              <p className="text-xs uppercase tracking-[.14em] text-[#ff7a59]">
                {eventStatusLabels[event.status]}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-4 text-sm text-[#9e9990]">
                <p>
                  <strong className="block text-2xl text-white">
                    {event.soldQuantity}
                  </strong>
                  vendidos
                </p>
                <p>
                  <strong className="block text-2xl text-white">
                    {event.capacity}
                  </strong>
                  lugares
                </p>
              </div>
            </div>
          </aside>

          <section>
            <p className="font-mono text-xs tracking-[.2em] text-[#ff5c35]">
              GERENCIAR SESSÃO
            </p>
            <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
              {event.title}
            </h1>
            <p className="mt-4 text-[#9e9990]">
              Edite os dados exibidos ao público ou remova esta sessão da
              programação.
            </p>

            {(message || error) && (
              <p
                role={error ? "alert" : "status"}
                className={`mt-6 border p-4 ${
                  error
                    ? "border-red-400/30 bg-red-950/20 text-red-200"
                    : "border-emerald-400/30 bg-emerald-950/30 text-emerald-200"
                }`}
              >
                {error || message}
              </p>
            )}

            <form
              key={event.updatedAt ?? event.id}
              onSubmit={save}
              className="mt-8 grid gap-5 border border-[#343439] bg-[#141416] p-6"
              aria-busy={busy}
            >
              <label htmlFor="description">
                <span className="mb-2 block text-sm text-[#bbb6ad]">
                  Sinopse
                </span>
                <textarea
                  required
                  id="description"
                  name="description"
                  defaultValue={event.description}
                  minLength={10}
                  className="min-h-28 w-full border border-[#39393e] bg-[#0b0b0c] p-3.5"
                  disabled={cancelled}
                />
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                <label htmlFor="location">
                  <span className="mb-2 block text-sm text-[#bbb6ad]">
                    Local
                  </span>
                  <input
                    required
                    id="location"
                    name="location"
                    defaultValue={event.location}
                    className="w-full border border-[#39393e] bg-[#0b0b0c] p-3.5"
                    disabled={cancelled}
                  />
                </label>
                <label htmlFor="startsAt">
                  <span className="mb-2 block text-sm text-[#bbb6ad]">
                    Data e horário
                  </span>
                  <input
                    required
                    id="startsAt"
                    name="startsAt"
                    type="datetime-local"
                    defaultValue={toLocalInput(event.startsAt)}
                    className="w-full border border-[#39393e] bg-[#0b0b0c] p-3.5"
                    disabled={cancelled}
                  />
                </label>
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label htmlFor="capacity">
                  <span className="mb-2 block text-sm text-[#bbb6ad]">
                    Capacidade
                  </span>
                  <input
                    required
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    defaultValue={event.capacity}
                    disabled={cancelled || capacityLocked}
                    className="w-full border border-[#39393e] bg-[#0b0b0c] p-3.5 disabled:opacity-50"
                  />
                  {capacityLocked && (
                    <span className="mt-2 block text-xs text-[#77736d]">
                      Bloqueada porque já existem reservas ou vendas.
                    </span>
                  )}
                </label>
                <label htmlFor="price">
                  <span className="mb-2 block text-sm text-[#bbb6ad]">
                    Inteira (R$)
                  </span>
                  <input
                    required
                    id="price"
                    name="price"
                    type="number"
                    min="0"
                    step="0.01"
                    defaultValue={(event.priceInCents / 100).toFixed(2)}
                    className="w-full border border-[#39393e] bg-[#0b0b0c] p-3.5"
                    disabled={cancelled}
                  />
                </label>
              </div>
              {!cancelled && (
                <div className="mt-2 flex flex-wrap gap-3">
                  <button
                    disabled={busy}
                    className="bg-[#ff5c35] px-5 py-3 font-semibold text-black disabled:opacity-50"
                  >
                    {busy ? "Salvando…" : "Salvar alterações"}
                  </button>
                  {event.status === "DRAFT" && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => void publish()}
                      className="border border-[#ff5c35] px-5 py-3 font-semibold text-[#ff7a59]"
                    >
                      Publicar evento
                    </button>
                  )}
                  <button
                    type="button"
                    disabled={busy || event.soldQuantity > 0}
                    onClick={() => void cancelEvent()}
                    className="ml-auto border border-red-500/50 px-5 py-3 text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                    title={
                      event.soldQuantity > 0
                        ? "Há ingressos vendidos para esta sessão"
                        : undefined
                    }
                  >
                    Remover evento
                  </button>
                </div>
              )}
            </form>
          </section>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function toLocalInput(value: string) {
  const date = new Date(value);
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
}
