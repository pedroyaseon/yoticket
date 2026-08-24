export type PublicEvent = {
  id: string;
  title: string;
  description: string;
  location: string;
  startsAt: string;
  capacity: number;
  soldQuantity: number;
  heldQuantity: number;
  priceInCents: number;
  posterUrl?: string | null;
};

export type TicketType = "FULL" | "HALF";
export type SeatStatus = "AVAILABLE" | "PENDING" | "RESERVED";

export type EventSeat = {
  id: string;
  label: string;
  row: string;
  number: number;
  status: SeatStatus;
};

export type SeatMap = {
  eventId: string;
  prices: { full: number; half: number };
  holdMinutes: number;
  seats: EventSeat[];
};

export function formatCurrency(valueInCents: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(valueInCents / 100);
}

export function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function formatTime(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function availability(event: PublicEvent) {
  return Math.max(0, event.capacity - event.soldQuantity - event.heldQuantity);
}
