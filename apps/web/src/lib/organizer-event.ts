export type OrganizerEvent = {
  id: string;
  externalId: number | null;
  title: string;
  posterUrl: string | null;
  description: string;
  startsAt: string;
  location: string;
  status: "DRAFT" | "PUBLISHED" | "CANCELLED";
  capacity: number;
  soldQuantity: number;
  heldQuantity: number;
  priceInCents: number;
  updatedAt: string;
};

export const eventStatusLabels = {
  DRAFT: "Rascunho",
  PUBLISHED: "Publicado",
  CANCELLED: "Cancelado",
};
