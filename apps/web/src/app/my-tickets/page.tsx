'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Ticket = { id: string; code: string; status: 'VALID' | 'USED' | 'CANCELLED'; event: { title: string; location: string; startsAt: string } };

export default function MyTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  useEffect(() => { api<Ticket[]>('/tickets/me').then(setTickets).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : 'Não foi possível carregar os ingressos.')).finally(() => setLoading(false)); }, []);
  return <main className="mx-auto max-w-5xl px-6 py-12"><div className="flex items-end justify-between gap-4"><div><p className="font-mono text-xs tracking-[.2em] text-[#e76732]">YOTICKET / CLIENTE</p><h1 className="mt-3 text-4xl font-semibold">Meus ingressos</h1></div><Link href="/events" className="border border-[#514b41] px-4 py-2 text-sm">Ver eventos</Link></div>{loading && <p className="mt-8 text-[#bdb5a8]">Carregando ingressos…</p>}{error && <p className="mt-8 text-red-300">{error}</p>}{!loading && !error && tickets.length === 0 && <p className="mt-8 text-[#bdb5a8]">Você ainda não possui ingressos.</p>}<div className="mt-8 grid gap-4 md:grid-cols-2">{tickets.map((ticket) => <Link href={`/my-tickets/${ticket.id}`} key={ticket.id} className="border border-[#3d3932] bg-[#201e1a] p-6 hover:border-[#e76732]"><div className="flex justify-between gap-3"><h2 className="text-2xl font-semibold">{ticket.event.title}</h2><span className={ticket.status === 'VALID' ? 'text-[#e76732]' : 'text-[#bdb5a8]'}>{ticket.status === 'VALID' ? 'Válido' : ticket.status === 'USED' ? 'Utilizado' : 'Cancelado'}</span></div><p className="mt-5 text-sm text-[#bdb5a8]">{new Date(ticket.event.startsAt).toLocaleString('pt-BR')}<br />{ticket.event.location}</p><p className="mt-6 font-mono text-xs tracking-wider text-[#bdb5a8]">{ticket.code.slice(0, 12)}…</p></Link>)}</div></main>;
}
