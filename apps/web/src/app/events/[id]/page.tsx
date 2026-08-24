"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import {
  formatCurrency,
  formatDate,
  formatTime,
  type EventSeat,
  type PublicEvent,
  type SeatMap,
  type TicketType,
} from "@/lib/event";

type Reservation = {
  id: string;
  expiresAt: string;
  totalInCents: number;
  items: Array<{
    seatId: string;
    ticketType: TicketType;
    priceInCents: number;
    seat: EventSeat;
  }>;
};

type PaymentOutcome = "APPROVED" | "DECLINED";
const ticketTypeLabel = { FULL: "Inteira", HALF: "Meia-entrada" };

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [seatMap, setSeatMap] = useState<SeatMap | null>(null);
  const [selected, setSelected] = useState<Record<string, TicketType>>({});
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loadError, setLoadError] = useState("");
  const [message, setMessage] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const refreshSeats = useCallback(async () => {
    const result = await api<SeatMap>(`/events/${id}/seats`);
    setSeatMap(result);
  }, [id]);

  useEffect(() => {
    Promise.all([
      api<PublicEvent>(`/events/${id}`),
      api<SeatMap>(`/events/${id}/seats`),
    ])
      .then(([eventResult, seatResult]) => {
        setEvent(eventResult);
        setSeatMap(seatResult);
      })
      .catch((reason: unknown) =>
        setLoadError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar o evento.",
        ),
      );
  }, [id]);

  const selectedSeats = useMemo(
    () =>
      seatMap?.seats
        .filter((seat) => selected[seat.id])
        .map((seat) => ({ ...seat, ticketType: selected[seat.id] })) ?? [],
    [seatMap, selected],
  );

  const rows = useMemo(() => {
    const grouped = new Map<string, EventSeat[]>();
    for (const seat of seatMap?.seats ?? []) {
      const row = grouped.get(seat.row) ?? [];
      row.push(seat);
      grouped.set(seat.row, row);
    }
    return Array.from(grouped.entries());
  }, [seatMap]);

  const selectionTotal = selectedSeats.reduce(
    (total, seat) =>
      total +
      (seat.ticketType === "HALF"
        ? (seatMap?.prices.half ?? 0)
        : (seatMap?.prices.full ?? 0)),
    0,
  );

  function toggleSeat(seat: EventSeat) {
    if (seat.status !== "AVAILABLE" || reservation) return;
    setMessage("");
    setSelected((current) => {
      if (current[seat.id]) {
        const next = { ...current };
        delete next[seat.id];
        return next;
      }
      if (Object.keys(current).length >= 10) {
        setMessage("Você pode selecionar até 10 poltronas por compra.");
        return current;
      }
      return { ...current, [seat.id]: "FULL" };
    });
  }

  function changeTicketType(seatId: string, ticketType: TicketType) {
    setSelected((current) => ({ ...current, [seatId]: ticketType }));
  }

  async function reserveSeats() {
    if (!user) {
      router.push(`/login?returnTo=${encodeURIComponent(`/events/${id}`)}`);
      return;
    }
    if (user.role !== "CUSTOMER") {
      setMessage("Entre com um perfil de cliente para comprar ingressos.");
      return;
    }
    if (!selectedSeats.length) {
      setMessage("Selecione pelo menos uma poltrona.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      const result = await api<Reservation>(`/events/${id}/reservations`, {
        method: "POST",
        body: JSON.stringify({
          seats: selectedSeats.map((seat) => ({
            seatId: seat.id,
            ticketType: seat.ticketType,
          })),
        }),
      });
      setReservation(result);
      setSelected({});
      setMessage(
        "Poltronas bloqueadas. Conclua o pagamento antes do prazo indicado.",
      );
      await refreshSeats();
    } catch (reason) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : "Não foi possível reservar as poltronas.",
      );
      await refreshSeats().catch(() => undefined);
    } finally {
      setSubmitting(false);
    }
  }

  async function pay(outcome: PaymentOutcome) {
    if (!reservation) return;
    setSubmitting(true);
    setMessage("");
    try {
      const payment = await api<{ status: string }>(
        `/reservations/${reservation.id}/payment`,
        { method: "POST", body: JSON.stringify({ outcome }) },
      );
      setPaymentStatus(payment.status);
      setReservation(null);
      setMessage(
        payment.status === "APPROVED"
          ? "Pagamento aprovado. Seus ingressos já estão na carteira."
          : payment.status === "DECLINED"
            ? "Pagamento recusado. As poltronas foram liberadas."
            : "Sua reserva expirou. Selecione as poltronas novamente.",
      );
      await refreshSeats();
    } catch (reason) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : "Não foi possível processar o pagamento.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loadError)
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-3xl px-5 py-20 sm:px-8">
          <p className="font-mono text-xs text-[#ff5c35]">EVENTO INDISPONÍVEL</p>
          <h1 className="mt-4 text-4xl font-semibold">Não encontramos esta sessão.</h1>
          <p role="alert" className="mt-5 text-[#aaa59c]">{loadError}</p>
          <Link href="/events" className="mt-8 inline-block bg-[#ff5c35] px-5 py-3 font-semibold text-black">
            Voltar aos eventos
          </Link>
        </main>
      </div>
    );

  if (!event || !seatMap)
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="h-96 animate-pulse bg-[#141416]" />
        </main>
      </div>
    );

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden border-b border-[#29292d]">
          {event.posterUrl && (
            <Image src={event.posterUrl} alt="" fill priority sizes="100vw" className="-z-20 object-cover opacity-15 blur-md" />
          )}
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#0b0b0c_8%,rgba(11,11,12,.88),#0b0b0c_94%)]" />
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[250px_minmax(0,1fr)] lg:py-16">
            <div className="relative aspect-[3/4] overflow-hidden border border-white/10 bg-[#1b1b1e]">
              {event.posterUrl && (
                <Image src={event.posterUrl} alt={`Pôster de ${event.title}`} fill priority sizes="250px" className="object-cover" />
              )}
            </div>
            <section className="self-end">
              <Link href="/events" className="text-sm text-[#aaa59c] hover:text-[#ff5c35]">← Voltar para eventos</Link>
              <p className="mt-9 font-mono text-xs font-semibold tracking-[.2em] text-[#ff5c35]">SESSÃO ESPECIAL · POLTRONAS MARCADAS</p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-6xl">{event.title}</h1>
              <p className="mt-6 max-w-3xl leading-7 text-[#b1aca3]">{event.description}</p>
              <div className="mt-8 grid gap-5 border-y border-white/10 py-6 sm:grid-cols-4">
                <EventFact label="Data" value={formatDate(event.startsAt)} />
                <EventFact label="Horário" value={formatTime(event.startsAt)} />
                <EventFact label="Local" value={event.location} />
                <EventFact label="A partir de" value={formatCurrency(seatMap.prices.half)} />
              </div>
            </section>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
          <div className="mb-9 flex flex-wrap items-end justify-between gap-5">
            <div>
              <p className="font-mono text-xs tracking-[.2em] text-[#ff5c35]">ESCOLHA SEU LUGAR</p>
              <h2 className="mt-3 text-4xl font-semibold tracking-tight">Mapa da sala</h2>
              <p className="mt-3 text-[#9e9990]">Selecione até 10 lugares. A reserva fica protegida por {seatMap.holdMinutes} minutos.</p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-[#aaa59c]">
              <Legend color="bg-[#232328] border-[#55555c]" label="Disponível" />
              <Legend color="bg-[#ff5c35] border-[#ff5c35]" label="Selecionada" />
              <Legend color="bg-amber-500/60 border-amber-400" label="Pendente" />
              <Legend color="bg-[#4a2225] border-[#7f3439]" label="Reservada" />
            </div>
          </div>

          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="overflow-x-auto border border-[#29292d] bg-[#111113] p-3 sm:p-8">
              <div className="mx-auto min-w-[420px] max-w-4xl sm:min-w-[690px]">
                <div className="mx-auto mb-12 h-2 w-3/4 rounded-[50%] bg-[#e7e0d4] shadow-[0_12px_35px_rgba(255,255,255,.18)]" />
                <p className="-mt-8 mb-10 text-center font-mono text-[10px] tracking-[.35em] text-[#77736d]">TELA</p>
                <div className="space-y-3">
                  {rows.map(([row, seats]) => (
                    <div key={row} className="flex items-center gap-1 sm:gap-3">
                      <span className="w-5 text-center font-mono text-xs text-[#77736d]">{row}</span>
                      <div className="flex flex-1 justify-center gap-1 sm:gap-2">
                        {seats.map((seat, index) => {
                          const isSelected = Boolean(selected[seat.id]);
                          const style = isSelected
                            ? "border-[#ff5c35] bg-[#ff5c35] text-black"
                            : seat.status === "AVAILABLE"
                              ? "border-[#55555c] bg-[#232328] hover:border-white hover:bg-[#303036]"
                              : seat.status === "PENDING"
                                ? "cursor-not-allowed border-amber-400 bg-amber-500/60 text-black"
                                : "cursor-not-allowed border-[#7f3439] bg-[#4a2225] text-[#9e666a]";
                          return (
                            <button
                              key={seat.id}
                              type="button"
                              disabled={seat.status !== "AVAILABLE" || Boolean(reservation)}
                              aria-pressed={isSelected}
                              aria-label={`Poltrona ${seat.label}, ${isSelected ? "selecionada" : seat.status === "AVAILABLE" ? "disponível" : seat.status === "PENDING" ? "pendente" : "reservada"}`}
                              onClick={() => toggleSeat(seat)}
                              className={`h-7 w-7 rounded-t-md border text-[9px] font-semibold transition sm:h-8 sm:w-10 sm:rounded-t-lg sm:text-[10px] ${index === 2 || index === 9 ? "ml-1 sm:ml-3" : ""} ${style}`}
                            >
                              {seat.number}
                            </button>
                          );
                        })}
                      </div>
                      <span className="w-5 text-center font-mono text-xs text-[#77736d]">{row}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <aside className="border border-[#3a3a40] bg-[#141416] p-6 lg:sticky lg:top-24">
              <p className="font-mono text-xs tracking-[.18em] text-[#ff5c35]">SUA RESERVA</p>
              <h3 className="mt-3 text-2xl font-semibold">{reservation ? "Pagamento pendente" : "Ingressos selecionados"}</h3>

              {!reservation && selectedSeats.length === 0 && (
                <div className="mt-6 border border-dashed border-[#3a3a40] p-6 text-center text-sm leading-6 text-[#8f8a82]">
                  Escolha uma poltrona no mapa para montar sua compra.
                </div>
              )}

              <div className="mt-6 space-y-3">
                {(reservation?.items ?? selectedSeats).map((item) => {
                  const seat = "seat" in item ? item.seat : item;
                  const type = item.ticketType;
                  const price = "priceInCents" in item
                    ? item.priceInCents
                    : type === "HALF"
                      ? seatMap.prices.half
                      : seatMap.prices.full;
                  return (
                    <div key={seat.id} className="border border-[#29292d] bg-[#101012] p-3">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">Poltrona {seat.label}</p>
                          <p className="mt-1 text-xs text-[#77736d]">{ticketTypeLabel[type]}</p>
                        </div>
                        <span className="text-sm font-semibold">{formatCurrency(price)}</span>
                      </div>
                      {!reservation && (
                        <div className="mt-3 grid grid-cols-2 gap-2">
                          {(["FULL", "HALF"] as const).map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => changeTicketType(seat.id, option)}
                              className={`border px-2 py-2 text-xs ${type === option ? "border-[#ff5c35] bg-[#ff5c35]/10 text-[#ff7a59]" : "border-[#343439] text-[#8f8a82]"}`}
                            >
                              {ticketTypeLabel[option]}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-[#29292d] pt-5">
                <span className="text-sm text-[#9e9990]">Total</span>
                <strong className="text-xl">{formatCurrency(reservation?.totalInCents ?? selectionTotal)}</strong>
              </div>

              {reservation ? (
                <>
                  <p className="mt-3 text-xs leading-5 text-amber-200">
                    Reserva válida até {formatTime(reservation.expiresAt)}. As poltronas aparecem como pendentes até o pagamento.
                  </p>
                  <button type="button" disabled={submitting} onClick={() => void pay("APPROVED")} className="mt-5 w-full bg-[#ff5c35] p-3.5 font-semibold text-black hover:bg-[#ff7655] disabled:opacity-50">
                    {submitting ? "Processando…" : "Finalizar pagamento"}
                  </button>
                  <button type="button" disabled={submitting} onClick={() => void pay("DECLINED")} className="mt-3 w-full py-2 text-xs text-[#8f8a82] hover:text-white disabled:opacity-50">
                    Simular pagamento recusado
                  </button>
                </>
              ) : (
                <button type="button" disabled={submitting || selectedSeats.length === 0 || authLoading} onClick={() => void reserveSeats()} className="mt-6 w-full bg-[#ff5c35] p-3.5 font-semibold text-black hover:bg-[#ff7655] disabled:opacity-40">
                  {submitting ? "Reservando…" : user ? "Reservar poltronas" : "Entrar para reservar"}
                </button>
              )}

              <p className="mt-4 text-center text-xs text-[#77736d]">
                Você pode explorar a programação sem login. A conta é exigida somente para reservar.
              </p>
              {message && (
                <div role={paymentStatus === "APPROVED" ? "status" : "alert"} className={`mt-5 border p-4 text-sm ${paymentStatus === "APPROVED" ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-200" : "border-amber-500/30 bg-amber-950/20 text-amber-100"}`}>
                  <p>{message}</p>
                  {paymentStatus === "APPROVED" && (
                    <Link href="/my-tickets" className="mt-3 inline-block font-semibold text-[#ff7a59]">Abrir meus ingressos →</Link>
                  )}
                </div>
              )}
            </aside>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}

function EventFact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-[.12em] text-[#77736d]">{label}</p>
      <p className="mt-2 font-medium">{value}</p>
    </div>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className={`h-4 w-5 rounded-t border ${color}`} />
      {label}
    </span>
  );
}
