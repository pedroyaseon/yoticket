import { Event, EventStatus } from '@prisma/client';
import { EventsService } from './events.service';

describe('EventsService public catalog', () => {
  const prisma = {
    event: { findMany: jest.fn() },
  };
  const service = new EventsService(prisma as never);
  const sessions: Event[] = [
    session({
      id: 'session-1',
      externalId: 603,
      location: 'Cine Centro',
      priceInCents: 4000,
    }),
    session({
      id: 'session-2',
      externalId: 603,
      location: 'Cine Norte',
      priceInCents: 3600,
    }),
    session({
      id: 'session-3',
      externalId: 329865,
      title: 'A Chegada',
      location: 'Cine Centro',
      priceInCents: 3000,
    }),
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.event.findMany.mockResolvedValue(sessions);
  });

  it('groups multiple sessions of the same movie into one poster', async () => {
    const movies = await service.listMovies();

    expect(movies).toHaveLength(2);
    expect(movies[0]).toEqual(
      expect.objectContaining({
        key: '603',
        sessionCount: 2,
        priceFromInCents: 1800,
        venues: ['Cine Centro', 'Cine Norte'],
      }),
    );
  });

  it('lists distinct movies available in each venue', async () => {
    const venues = await service.listVenues();

    expect(venues).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          slug: 'cine-centro',
          name: 'Cine Centro',
          movieCount: 2,
        }),
        expect.objectContaining({
          slug: 'cine-norte',
          name: 'Cine Norte',
          movieCount: 1,
        }),
      ]),
    );
  });
});

function session(overrides: Partial<Event>): Event {
  return {
    id: 'session',
    externalId: 603,
    title: 'Matrix',
    posterUrl: 'https://image.tmdb.org/poster.jpg',
    description: 'Descrição suficiente para o teste.',
    location: 'Cine Centro',
    startsAt: new Date(Date.now() + 86_400_000),
    capacity: 96,
    heldQuantity: 0,
    soldQuantity: 0,
    priceInCents: 4000,
    status: EventStatus.PUBLISHED,
    organizerId: 'organizer-1',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}
