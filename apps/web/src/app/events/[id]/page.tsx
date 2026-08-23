'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

type Event = { id: string; title: string; description: string; location: string; startsAt: string; priceInCents: number; capacity: number; soldQuantity: number; heldQuantity: number; posterUrl?: string | null };

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => { api<Event>(`/events/${id}`).then(setEvent).catch((error: unknown) => setMessage(error instanceof Error ? error.message : 'Não foi possível carregar o evento.')); }, [id]);

  async function buy(outcome: 'APPROVED' | 'DECLINED') {
    setIsSubmitting(true); setMessage('');
    try {
      const reservation = await api<{ id: string }>(`/events/${id}/reservations`, { method: 'POST', body: JSON.stringify({ quantity }) });
      const payment = await api<{ status: string }>(`/reservations/${reservation.id}/payment`, { method: 'POST', body: JSON.stringify({ outcome }) });
      setMessage(payment.status === 'APPROVED' ? 'Pagamento aprovado. Seus ingressos foram gerados.' : payment.status === 'DECLINED' ? 'Pagamento recusado. A reserva foi liberada.' : 'A reserva expirou. Escolha a quantidade novamente.');
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Erro ao processar a compra.'); }
    finally { setIsSubmitting(false); }
  }

  if (!event) return <main className="p-10">{message || 'Carregando sessão…'}</main>;
  const available = event.capacity - event.soldQuantity - event.heldQuantity;
  return <main className="mx-auto max-w-5xl px-6 py-12"><div className="grid gap-8 md:grid-cols-[minmax(0,1fr)_320px]"><section>{event.posterUrl && <><span className="sr-only">Pôster de {event.title}</span>{/* TMDb fornece URLs remotas; a otimização poderá ser configurada para o domínio fixado. */}{/* eslint-disable-next-line @next/next/no-img-element */}
    <img src={event.posterUrl} alt="" className="mb-7 h-96 w-full object-cover md:hidden" /></>}<p className="font-mono text-xs tracking-[.2em] text-[#e76732]">YOTICKET / SESSÃO</p><h1 className="mt-3 text-4xl font-semibold">{event.title}</h1><p className="mt-5 leading-7 text-[#bdb5a8]">{event.description}</p><p className="mt-7">{new Date(event.startsAt).toLocaleString('pt-BR')}<br />{event.location}</p></section><aside className="border border-[#3d3932] bg-[#201e1a] p-6"><p className="text-sm text-[#bdb5a8]">Ingresso</p><p className="mt-1 text-3xl text-[#e76732]">R$ {(event.priceInCents / 100).toFixed(2)}</p><p className="mt-5 text-sm text-[#bdb5a8]">{available} disponíveis</p><label className="mt-5 block text-sm">Quantidade<input value={quantity} min="1" max={Math.min(10, available)} type="number" onChange={(input) => setQuantity(Math.max(1, Number(input.target.value)))} className="mt-2 w-full border border-[#514b41] bg-transparent p-3" /></label><button disabled={isSubmitting || available < 1} onClick={() => buy('APPROVED')} className="mt-5 w-full bg-[#e76732] p-3 font-semibold text-[#151412]">{isSubmitting ? 'Processando…' : 'Simular pagamento aprovado'}</button><button disabled={isSubmitting || available < 1} onClick={() => buy('DECLINED')} className="mt-3 w-full border border-[#514b41] p-3 disabled:opacity-50">Simular pagamento recusado</button>{message && <p className="mt-5 text-sm">{message}</p>}{message.startsWith('Pagamento aprovado') && <Link href="/my-tickets" className="mt-4 inline-block text-sm text-[#e76732] underline">Ver meus ingressos</Link>}</aside></div></main>;
}
