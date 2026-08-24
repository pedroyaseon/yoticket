export type MovieSummary = {
  key: string;
  externalId: number | null;
  title: string;
  posterUrl?: string | null;
  description: string;
  priceFromInCents: number;
  sessionCount: number;
  venues: string[];
};

export type MovieSession = {
  id: string;
  location: string;
  startsAt: string;
  priceInCents: number;
};

export type MovieDetail = MovieSummary & {
  sessions: MovieSession[];
};

export type Venue = {
  slug: string;
  name: string;
  movieCount: number;
  movies: MovieSummary[];
};
