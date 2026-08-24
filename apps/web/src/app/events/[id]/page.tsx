"use client";

import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { api } from "@/lib/api";
import {
  availability,
  formatCurrency,
  formatDate,
  formatTime,
  type PublicEvent,
} from "@/lib/event";

type PaymentOutcome = "APPROVED" | "DECLINED";

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<PublicEvent | null>(null);
  const [loadError, setLoadError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api<PublicEvent>(`/events/${id}`)
      .then(setEvent)
      .catch((reason: unknown) =>
        setLoadError(
          reason instanceof Error
            ? reason.message
            : "Não foi possível carregar o evento.",
        ),
      );
  }, [id]);

  async function checkout(outcome: PaymentOutcome) {
    setSubmitting(true);
    setMessage("");
    setPaymentStatus(null);
    try {
      const reservation = await api<{ id: string }>(
        `/events/${id}/reservations`,
        { method: "POST", body: JSON.stringify({ quantity }) },
      );
      const payment = await api<{ status: string }>(
        `/reservations/${reservation.id}/payment`,
        { method: "POST", body: JSON.stringify({ outcome }) },
      );
      setPaymentStatus(payment.status);
      setMessage(
        payment.status === "APPROVED"
          ? "Pagamento aprovado. Seus ingressos já estão disponíveis."
          : payment.status === "DECLINED"
            ? "Pagamento recusado. Nenhuma cobrança foi realizada."
            : "Sua reserva expirou. Tente novamente.",
      );
    } catch (reason) {
      setMessage(
        reason instanceof Error
          ? reason.message
          : "Não foi possível concluir a compra.",
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
          <p className="font-mono text-xs text-[#ff5c35]">
            EVENTO INDISPONÍVEL
          </p>
          <h1 className="mt-4 text-4xl font-semibold">
            Não encontramos esta sessão.
          </h1>
          <p role="alert" className="mt-5 text-[#aaa59c]">
            {loadError}
          </p>
          <Link
            href="/events"
            className="mt-8 inline-block bg-[#ff5c35] px-5 py-3 font-semibold text-black"
          >
            Voltar aos eventos
          </Link>
        </main>
      </div>
    );
  if (!event)
    return (
      <div className="min-h-screen">
        <SiteHeader />
        <main className="mx-auto max-w-7xl px-5 py-20 sm:px-8">
          <div className="h-96 animate-pulse bg-[#141416]" />
        </main>
      </div>
    );

  const available = availability(event);
  const total = event.priceInCents * quantity;

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      <SiteHeader />
      <main>
        <section className="relative isolate overflow-hidden border-b border-[#29292d]">
          <div className="absolute inset-0 -z-20">
            {event.posterUrl && (
              <Image
                src={event.posterUrl}
                alt=""
                fill
                priority
                sizes="100vw"
                className="object-cover opacity-20 blur-md"
              />
            )}
          </div>
          <div className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,#0b0b0c_10%,rgba(11,11,12,.86),#0b0b0c_92%)]" />
          <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:px-8 md:grid-cols-[280px_minmax(0,1fr)] lg:grid-cols-[320px_minmax(0,1fr)_360px] lg:py-16">
            <div className="relative aspect-[3/4] overflow-hidden border border-white/10 bg-[#1b1b1e]">
              {event.posterUrl ? (
                <Image
                  src={event.posterUrl}
                  alt={`Pôster de ${event.title}`}
                  fill
                  priority
                  sizes="320px"
                  className="object-cover"
                />
              ) : (
                <div className="grid h-full place-items-center font-mono text-sm text-[#77736d]">
                  YOTICKET
                </div>
              )}
            </div>
            <section className="self-end">
              <Link
                href="/events"
                className="text-sm text-[#aaa59c] hover:text-[#ff5c35]"
              >
                ← Voltar para eventos
              </Link>
              <p className="mt-9 font-mono text-xs font-semibold tracking-[.2em] text-[#ff5c35]">
                SESSÃO ESPECIAL
              </p>
              <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
                {event.title}
              </h1>
              <p className="mt-6 max-w-2xl leading-7 text-[#b1aca3]">
                {event.description}
              </p>
              <div className="mt-8 grid gap-5 border-y border-white/10 py-6 sm:grid-cols-3">
                <div>
                  <p className="text-xs uppercase tracking-[.12em] text-[#77736d]">
                    Data
                  </p>
                  <p className="mt-2 font-medium">
                    {formatDate(event.startsAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[.12em] text-[#77736d]">
                    Horário
                  </p>
                  <p className="mt-2 font-medium">
                    {formatTime(event.startsAt)}
                  </p>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-[.12em] text-[#77736d]">
                    Local
                  </p>
                  <p className="mt-2 font-medium">{event.location}</p>
                </div>
              </div>
            </section>
            <aside className="border border-[#3a3a40] bg-[#141416] p-6 md:col-span-2 lg:col-span-1 lg:self-end">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[.14em] text-[#77736d]">
                    Ingresso individual
                  </p>
                  <p className="mt-2 text-3xl font-semibold text-[#ff7a59]">
                    {formatCurrency(event.priceInCents)}
                  </p>
                </div>
                <span className="bg-emerald-950/60 px-2.5 py-1 text-xs text-emerald-300">
                  Disponível
                </span>
              </div>
              <div className="mt-6 border-y border-[#29292d] py-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Quantidade</p>
                    <p className="mt-1 text-xs text-[#77736d]">
                      Máximo de 10 por compra
                    </p>
                  </div>
                  <div className="flex items-center border border-[#3a3a40]">
                    <button
                      type="button"
                      aria-label="Diminuir quantidade"
                      disabled={quantity <= 1 || submitting}
                      onClick={() =>
                        setQuantity((current) => Math.max(1, current - 1))
                      }
                      className="h-10 w-10 text-xl disabled:opacity-30"
                    >
                      −
                    </button>
                    <output
                      aria-live="polite"
                      className="grid h-10 min-w-10 place-items-center border-x border-[#3a3a40] font-semibold"
                    >
                      {quantity}
                    </output>
                    <button
                      type="button"
                      aria-label="Aumentar quantidade"
                      disabled={
                        quantity >= Math.min(10, available) || submitting
                      }
                      onClick={() =>
                        setQuantity((current) =>
                          Math.min(10, available, current + 1),
                        )
                      }
                      className="h-10 w-10 text-xl disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
              <div className="mt-5 flex items-center justify-between">
                <span className="text-sm text-[#9e9990]">Total</span>
                <strong className="text-xl">{formatCurrency(total)}</strong>
              </div>
              <p className="mt-2 text-xs text-[#77736d]">
                {available} ingressos disponíveis
              </p>
              <button
                type="button"
                disabled={submitting || available < 1}
                onClick={() => void checkout("APPROVED")}
                className="mt-6 w-full bg-[#ff5c35] p-3.5 font-semibold text-black hover:bg-[#ff7655] disabled:opacity-50"
              >
                {submitting ? "Processando…" : "Comprar ingressos"}
              </button>
              <button
                type="button"
                disabled={submitting || available < 1}
                onClick={() => void checkout("DECLINED")}
                className="mt-3 w-full py-2 text-xs text-[#77736d] hover:text-white disabled:opacity-50"
              >
                Simular pagamento recusado
              </button>
              <p className="mt-4 text-center text-xs text-[#77736d]">
                É necessário entrar com uma conta de cliente.
              </p>
              {message && (
                <div
                  role={paymentStatus === "APPROVED" ? "status" : "alert"}
                  className={`mt-5 border p-4 text-sm ${paymentStatus === "APPROVED" ? "border-emerald-500/40 bg-emerald-950/20 text-emerald-200" : "border-amber-500/30 bg-amber-950/20 text-amber-100"}`}
                >
                  <p>{message}</p>
                  {paymentStatus === "APPROVED" ? (
                    <Link
                      href="/my-tickets"
                      className="mt-3 inline-block font-semibold text-[#ff7a59]"
                    >
                      Abrir meus ingressos →
                    </Link>
                  ) : (
                    !paymentStatus && (
                      <Link
                        href="/login"
                        className="mt-3 inline-block font-semibold text-[#ff7a59]"
                      >
                        Entrar como cliente →
                      </Link>
                    )
                  )}
                </div>
              )}
            </aside>
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
          <div className="grid gap-6 md:grid-cols-3">
            <article className="border border-[#29292d] bg-[#141416] p-6">
              <p className="font-mono text-xs text-[#ff5c35]">RESERVA SEGURA</p>
              <p className="mt-3 text-sm leading-6 text-[#9e9990]">
                O estoque é protegido no banco durante todo o fluxo de compra.
              </p>
            </article>
            <article className="border border-[#29292d] bg-[#141416] p-6">
              <p className="font-mono text-xs text-[#ff5c35]">QR CODE ÚNICO</p>
              <p className="mt-3 text-sm leading-6 text-[#9e9990]">
                Cada ingresso possui um código seguro e pode ser validado uma
                única vez.
              </p>
            </article>
            <article className="border border-[#29292d] bg-[#141416] p-6">
              <p className="font-mono text-xs text-[#ff5c35]">ACESSO DIGITAL</p>
              <p className="mt-3 text-sm leading-6 text-[#9e9990]">
                Seu ingresso fica disponível no celular e pode ser compartilhado
                por link.
              </p>
            </article>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
