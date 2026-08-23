'use client';

import { QRCodeSVG } from 'qrcode.react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

type SharedTicket = {
  code: string;
  status: 'VALID' | 'USED' | 'CANCELLED';
  event: { title: string; posterUrl?: string | null; location: string; startsAt: string };
};

export default function SharedTicketPage() {
  const { code } = useParams<{ code: string }>();
  const [ticket, setTicket] = useState<SharedTicket | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { api<SharedTicket>(`/tickets/shared/${encodeURIComponent(code)}`).then(setTicket).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Não foi possível abrir este ingresso.')); }, [code]);
  const shareUrl = useMemo(() => typeof window === 'undefined' ? '' : window.location.href, []);
  if (error) return <main className="mx-auto max-w-xl px-6 py-16"><h1 className="text-3xl font-semibold">Ingresso indisponível</h1><p className="mt-4 text-[#bdb5a8]">{error}</p></main>;
  if (!ticket) return <main className="p-10">Carregando ingresso…</main>;
  const status = ticket.status === 'VALID' ? 'Válido' : ticket.status === 'USED' ? 'Utilizado' : 'Cancelado';
  return <main className="mx-auto max-w-3xl px-6 py-12"><p className="font-mono text-xs tracking-[.2em] text-[#e76732]">YOTICKET / INGRESSO COMPARTILHADO</p><section className="mt-5 grid gap-8 border border-[#3d3932] bg-[#201e1a] p-7 md:grid-cols-[1fr_auto]"><div>{ticket.event.posterUrl && <div role="img" aria-label={`Pôster de ${ticket.event.title}`} className="mb-6 h-48 w-full bg-cover bg-center" style={{ backgroundImage: `url(${ticket.event.posterUrl})` }} />}<h1 className="text-3xl font-semibold">{ticket.event.title}</h1><p className="mt-5 text-[#bdb5a8]">{new Date(ticket.event.startsAt).toLocaleString('pt-BR')}<br />{ticket.event.location}</p><p className="mt-6">Status: <span className={ticket.status === 'VALID' ? 'text-[#e76732]' : 'text-[#bdb5a8]'}>{status}</span></p><p className="mt-6 text-xs leading-5 text-[#bdb5a8]">Este link não revela dados pessoais do titular. A validação definitiva é feita pela portaria.</p></div><div className="h-fit bg-white p-3"><QRCodeSVG value={shareUrl} size={190} level="M" /></div></section></main>;
}
