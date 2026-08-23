'use client';

import { BrowserQRCodeReader } from '@zxing/browser';
import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';

type Event = { id: string; title: string; location: string; startsAt: string };
type Status = 'VALID' | 'INVALID' | 'ALREADY_USED' | 'WRONG_EVENT';

const messages: Record<Status, string> = {
  VALID: 'Ingresso validado com sucesso.',
  INVALID: 'Código de ingresso inválido.',
  ALREADY_USED: 'Este ingresso já foi utilizado.',
  WRONG_EVENT: 'Este ingresso pertence a outro evento.',
};

export default function GatePage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [eventId, setEventId] = useState('');
  const [ticketCode, setTicketCode] = useState('');
  const [status, setStatus] = useState<Status | null>(null);
  const [message, setMessage] = useState('');
  const [scanning, setScanning] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => { api<Event[]>('/gate/events').then((items) => { setEvents(items); setEventId(items[0]?.id ?? ''); }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Não foi possível carregar os eventos.')); }, []);
  useEffect(() => () => controlsRef.current?.stop(), []);

  async function validate(value = ticketCode) {
    if (!eventId || !value.trim()) { setMessage('Selecione o evento e informe o código do ingresso.'); return; }
    controlsRef.current?.stop(); controlsRef.current = null; setScanning(false);
    try {
      const result = await api<{ status: Status }>('/gate/validate', { method: 'POST', body: JSON.stringify({ eventId, ticketCode: value.trim() }) });
      setStatus(result.status); setMessage(messages[result.status]);
    } catch (error) { setStatus(null); setMessage(error instanceof Error ? error.message : 'Não foi possível validar o ingresso.'); }
  }

  async function startScanner() {
    if (!eventId) { setMessage('Selecione o evento antes de abrir a câmera.'); return; }
    setMessage('');
    try {
      const reader = new BrowserQRCodeReader();
      const devices = await BrowserQRCodeReader.listVideoInputDevices();
      if (!devices.length) throw new Error('Nenhuma câmera foi encontrada neste dispositivo.');
      setScanning(true);
      controlsRef.current = await reader.decodeFromVideoDevice(devices[0].deviceId, videoRef.current!, (result) => {
        if (result) { setTicketCode(result.getText()); void validate(result.getText()); }
      });
    } catch (error) { setScanning(false); setMessage(error instanceof Error ? error.message : 'Não foi possível acessar a câmera. Verifique a permissão e tente novamente.'); }
  }

  return <main className="mx-auto max-w-3xl px-6 py-12"><p className="font-mono text-xs tracking-[.2em] text-[#e76732]">YOTICKET / PORTARIA</p><h1 className="mt-3 text-4xl font-semibold">Validar ingresso</h1><p className="mt-3 text-[#bdb5a8]">Selecione a sessão, use a câmera ou digite o código manualmente.</p><section className="mt-8 border border-[#3d3932] bg-[#201e1a] p-6"><label className="block text-sm">Evento<select value={eventId} onChange={(input) => setEventId(input.target.value)} className="mt-2 w-full border border-[#514b41] bg-[#151412] p-3"><option value="">Selecione uma sessão</option>{events.map((event) => <option value={event.id} key={event.id}>{event.title} — {new Date(event.startsAt).toLocaleString('pt-BR')}</option>)}</select></label><div className="mt-6 grid gap-5 md:grid-cols-2"><div><p className="text-sm text-[#bdb5a8]">Leitura por câmera</p><video ref={videoRef} className="mt-2 aspect-video w-full bg-black object-cover" muted playsInline /><button onClick={scanning ? () => { controlsRef.current?.stop(); controlsRef.current = null; setScanning(false); } : startScanner} className="mt-3 w-full border border-[#514b41] p-3">{scanning ? 'Parar câmera' : 'Abrir câmera'}</button></div><div><label className="block text-sm">Código manual<textarea value={ticketCode} onChange={(input) => setTicketCode(input.target.value)} placeholder="Cole o código ou link do ingresso" className="mt-2 min-h-28 w-full border border-[#514b41] bg-transparent p-3 font-mono text-xs" /></label><button onClick={() => void validate()} className="mt-3 w-full bg-[#e76732] p-3 font-semibold text-[#151412]">Validar código</button></div></div>{message && <p className={`mt-6 border p-4 ${status === 'VALID' ? 'border-[#e76732] text-[#f7f2e8]' : 'border-[#514b41] text-[#f7c6c0]'}`}>{message}</p>}</section></main>;
}
