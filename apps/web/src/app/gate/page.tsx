"use client";

import { BrowserQRCodeReader } from "@zxing/browser";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { api } from "@/lib/api";
import { formatDate, formatTime } from "@/lib/event";

type GateEvent = {
  id: string;
  externalId: number | null;
  title: string;
  location: string;
  startsAt: string;
};
type Status = "VALID" | "INVALID" | "ALREADY_USED" | "WRONG_EVENT";

const messages: Record<Status, string> = {
  VALID: "Ingresso validado com sucesso.",
  INVALID: "Código de ingresso inválido.",
  ALREADY_USED: "Este ingresso já foi utilizado.",
  WRONG_EVENT: "Este ingresso pertence a outra sessão.",
};

export default function GatePage() {
  const [events, setEvents] = useState<GateEvent[]>([]);
  const [location, setLocation] = useState("");
  const [movieKey, setMovieKey] = useState("");
  const [eventId, setEventId] = useState("");
  const [ticketCode, setTicketCode] = useState("");
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState("");
  const [scanning, setScanning] = useState(false);
  const [validating, setValidating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  const locations = useMemo(
    () =>
      Array.from(new Set(events.map((event) => event.location))).sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    [events],
  );
  const movies = useMemo(() => {
    const grouped = new Map<string, string>();
    for (const event of events.filter((item) => item.location === location)) {
      const key = event.externalId?.toString() ?? event.title;
      if (!grouped.has(key)) grouped.set(key, event.title);
    }
    return Array.from(grouped, ([key, title]) => ({ key, title })).sort(
      (a, b) => a.title.localeCompare(b.title, "pt-BR"),
    );
  }, [events, location]);
  const activeMovieKey = movies.some((movie) => movie.key === movieKey)
    ? movieKey
    : (movies[0]?.key ?? "");
  const sessions = useMemo(
    () =>
      events.filter(
        (event) =>
          event.location === location &&
          (event.externalId?.toString() ?? event.title) === activeMovieKey,
      ),
    [activeMovieKey, events, location],
  );
  const activeEventId = sessions.some((session) => session.id === eventId)
    ? eventId
    : (sessions[0]?.id ?? "");
  const selectedEvent = events.find((event) => event.id === activeEventId);

  useEffect(() => {
    api<GateEvent[]>("/gate/events")
      .then((items) => {
        setEvents(items);
        setLocation(items[0]?.location ?? "");
      })
      .catch((error: unknown) =>
        setMessage(
          error instanceof Error
            ? error.message
            : "Não foi possível carregar as sessões.",
        ),
      );
  }, []);
  useEffect(() => () => controlsRef.current?.stop(), []);

  function stopScanner() {
    controlsRef.current?.stop();
    controlsRef.current = null;
    setScanning(false);
  }

  function resetResult() {
    setStatus(null);
    setMessage("");
    stopScanner();
  }

  async function validate(value = ticketCode) {
    if (!activeEventId || !value.trim()) {
      setStatus(null);
      setMessage("Escolha a sessão e informe o código do ingresso.");
      return;
    }
    stopScanner();
    setValidating(true);
    try {
      const result = await api<{ status: Status }>("/gate/validate", {
        method: "POST",
        body: JSON.stringify({
          eventId: activeEventId,
          ticketCode: value.trim(),
        }),
      });
      setStatus(result.status);
      setMessage(messages[result.status]);
    } catch (error) {
      setStatus(null);
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível validar o ingresso.",
      );
    } finally {
      setValidating(false);
    }
  }

  async function startScanner() {
    if (!activeEventId) {
      setMessage("Escolha local, filme e horário antes de abrir a câmera.");
      return;
    }
    setStatus(null);
    setMessage("Solicitando acesso à câmera…");
    try {
      const reader = new BrowserQRCodeReader();
      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      if (!devices.length)
        throw new Error("Nenhuma câmera foi encontrada neste dispositivo.");
      setScanning(true);
      setMessage("Aponte a câmera para o QR Code do ingresso.");
      controlsRef.current = await reader.decodeFromVideoDevice(
        devices[0].deviceId,
        videoRef.current!,
        (result) => {
          if (result && !validating) {
            setTicketCode(result.getText());
            void validate(result.getText());
          }
        },
      );
    } catch (error) {
      stopScanner();
      setMessage(
        error instanceof Error
          ? error.message
          : "Não foi possível acessar a câmera. Verifique a permissão e tente novamente.",
      );
    }
  }

  return (
    <div className="min-h-screen bg-[#0b0b0c]">
      <SiteHeader />
      <main className="mx-auto max-w-5xl px-5 py-12 sm:px-8 sm:py-16">
        <p className="font-mono text-xs tracking-[.2em] text-[#ff5c35]">
          CONTROLE DE ACESSO
        </p>
        <h1 className="mt-4 text-4xl font-semibold sm:text-5xl">
          Validar ingresso
        </h1>
        <p className="mt-4 max-w-2xl text-[#9e9990]">
          Identifique primeiro a sessão desta entrada. Depois, leia o QR Code ou
          use o código manual.
        </p>

        <section className="mt-9 border border-[#343439] bg-[#141416] p-5 sm:p-7">
          <div className="grid gap-5 md:grid-cols-3">
            <label htmlFor="gate-location">
              <span className="mb-2 block text-xs uppercase tracking-[.13em] text-[#8f8a82]">
                1. Local
              </span>
              <select
                id="gate-location"
                value={location}
                onChange={(input) => {
                  setLocation(input.target.value);
                  setMovieKey("");
                  setEventId("");
                  resetResult();
                }}
                className="w-full border border-[#39393e] bg-[#0b0b0c] p-3.5"
              >
                <option value="">Selecione o local</option>
                {locations.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="gate-movie">
              <span className="mb-2 block text-xs uppercase tracking-[.13em] text-[#8f8a82]">
                2. Filme
              </span>
              <select
                id="gate-movie"
                value={activeMovieKey}
                onChange={(input) => {
                  setMovieKey(input.target.value);
                  setEventId("");
                  resetResult();
                }}
                disabled={!location}
                className="w-full border border-[#39393e] bg-[#0b0b0c] p-3.5 disabled:opacity-50"
              >
                <option value="">Selecione o filme</option>
                {movies.map((movie) => (
                  <option key={movie.key} value={movie.key}>
                    {movie.title}
                  </option>
                ))}
              </select>
            </label>
            <label htmlFor="gate-session">
              <span className="mb-2 block text-xs uppercase tracking-[.13em] text-[#8f8a82]">
                3. Dia e horário
              </span>
              <select
                id="gate-session"
                value={activeEventId}
                onChange={(input) => {
                  setEventId(input.target.value);
                  resetResult();
                }}
                disabled={!activeMovieKey}
                className="w-full border border-[#39393e] bg-[#0b0b0c] p-3.5 disabled:opacity-50"
              >
                <option value="">Selecione o horário</option>
                {sessions.map((session) => (
                  <option value={session.id} key={session.id}>
                    {formatDate(session.startsAt)} ·{" "}
                    {formatTime(session.startsAt)}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {selectedEvent && (
            <div className="mt-6 border-l-2 border-[#ff5c35] bg-[#0f0f11] px-5 py-4">
              <p className="font-semibold">{selectedEvent.title}</p>
              <p className="mt-1 text-sm text-[#9e9990]">
                {selectedEvent.location} · {formatDate(selectedEvent.startsAt)}{" "}
                · {formatTime(selectedEvent.startsAt)}
              </p>
            </div>
          )}

          <div className="mt-7 grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium">Leitura pela câmera</p>
              <video
                ref={videoRef}
                aria-label="Prévia da câmera para leitura do QR Code"
                className="mt-3 aspect-video w-full bg-black object-cover"
                muted
                playsInline
              />
              <button
                type="button"
                onClick={scanning ? stopScanner : startScanner}
                disabled={validating || !activeEventId}
                className="mt-3 w-full border border-[#3a3a40] p-3 disabled:opacity-40"
              >
                {scanning ? "Parar câmera" : "Abrir câmera"}
              </button>
            </div>
            <div>
              <label
                className="block text-sm font-medium"
                htmlFor="ticket-code"
              >
                Código manual
              </label>
              <textarea
                id="ticket-code"
                value={ticketCode}
                onChange={(input) => setTicketCode(input.target.value)}
                placeholder="Cole o código ou link do ingresso"
                className="mt-3 min-h-36 w-full border border-[#39393e] bg-[#0b0b0c] p-3.5 font-mono text-xs"
              />
              <button
                type="button"
                disabled={validating || !activeEventId}
                onClick={() => void validate()}
                className="mt-3 w-full bg-[#ff5c35] p-3 font-semibold text-black disabled:opacity-40"
              >
                {validating ? "Validando…" : "Validar ingresso"}
              </button>
            </div>
          </div>

          {message && status === "VALID" && (
            <div
              role="status"
              aria-live="polite"
              className="mt-7 flex items-center gap-5 border-2 border-emerald-400 bg-emerald-950/50 p-6 text-emerald-100"
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-emerald-400 text-3xl font-black text-emerald-950">
                ✓
              </span>
              <div>
                <p className="text-xs font-bold uppercase tracking-[.18em] text-emerald-300">
                  Acesso liberado
                </p>
                <p className="mt-1 text-xl font-semibold">{message}</p>
              </div>
            </div>
          )}
          {message && status !== "VALID" && (
            <p
              role="alert"
              aria-live="polite"
              className="mt-7 border border-red-400/40 bg-red-950/30 p-5 text-red-100"
            >
              {message}
            </p>
          )}
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
