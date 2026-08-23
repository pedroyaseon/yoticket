'use client';

import Link from 'next/link';
import { QRCodeSVG } from 'qrcode.react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

type Ticket = { id: string; code: string; status: 'VALID' | 'USED' | 'CANCELLED'; event: { title: string; location: string; startsAt: string } };

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [message, setMessage] = useState('');
  useEffect(() => { api<Ticket>(`/tickets/${id}`).then(setTicket).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Não foi possível carregar o ingresso.')); }, [id]);
  const shareUrl = useMemo(() => ticket && typeof window !== 'undefined' ? `${window.location.origin}/tickets/shared/${ticket.code}` : '', [ticket]);
  async function copy() { try { await navigator.clipboard.writeText(shareUrl); setMessage('Link de compartilhamento copiado.'); } catch { setMessage('Não foi possível copiar o link.'); } }
  if (!ticket) return <main className="p-10">{message || 'Carregando ingresso…'}</main>;
  return <main className="mx-auto max-w-3xl px-6 py-12"><Link href="/my-tickets" className="text-sm text-[#e76732]">← Meus ingressos</Link><section className="mt-5 grid gap-8 border border-[#3d3932] bg-[#201e1a] p-7 md:grid-cols-[1fr_auto]"><div><p className="font-mono text-xs tracking-[.2em] text-[#e76732]">YOTICKET / INGRESSO</p><h1 className="mt-3 text-3xl font-semibold">{ticket.event.title}</h1><p className="mt-5 text-[#bdb5a8]">{new Date(ticket.event.startsAt).toLocaleString('pt-BR')}<br />{ticket.event.location}</p><p className="mt-6">Status: <span className="text-[#e76732]">{ticket.status === 'VALID' ? 'Válido' : ticket.status === 'USED' ? 'Utilizado' : 'Cancelado'}</span></p><button onClick={copy} className="mt-7 border border-[#514b41] px-4 py-3 text-sm hover:border-[#e76732]">Copiar link de compartilhamento</button>{message && <p className="mt-3 text-sm text-[#bdb5a8]">{message}</p>}</div><div className="bg-white p-3"><QRCodeSVG value={shareUrl || ticket.code} size={190} level="M" /></div></section></main>;
}
