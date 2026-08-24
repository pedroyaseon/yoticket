import { ConflictException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { EventsService } from './events.service';

describe('EventsService organizer management', () => {
  let createdStatuses: EventStatus[] = [];
  const tx = {
    $queryRaw: jest.fn(),
    seat: { deleteMany: jest.fn() },
    event: { update: jest.fn(), count: jest.fn(), create: jest.fn() },
    reservation: { findMany: jest.fn(), updateMany: jest.fn() },
    reservationItem: { deleteMany: jest.fn() },
  };
  const prisma = {
    event: { findUnique: jest.fn(), update: jest.fn() },
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const service = new EventsService(prisma as never);
  const event = {
    id: 'event-1',
    organizerId: 'organizer-1',
    status: EventStatus.PUBLISHED,
    capacity: 96,
    heldQuantity: 0,
    soldQuantity: 0,
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.event.findUnique.mockResolvedValue(event);
    tx.reservation.findMany.mockResolvedValue([]);
    tx.event.count.mockResolvedValue(0);
    tx.event.create.mockImplementation(
      ({ data }: { data: { startsAt: Date; status: EventStatus } }) => {
        createdStatuses.push(data.status);
        return Promise.resolve({
          ...event,
          id: `event-${data.startsAt.getTime()}`,
          startsAt: data.startsAt,
        });
      },
    );
    createdStatuses = [];
    tx.event.update.mockResolvedValue({
      ...event,
      status: EventStatus.CANCELLED,
    });
  });

  it('blocks capacity changes after tickets have been sold', async () => {
    prisma.event.findUnique.mockResolvedValue({ ...event, soldQuantity: 1 });

    await expect(
      service.update('event-1', 'organizer-1', { capacity: 120 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('soft-cancels an event without sales and releases pending holds', async () => {
    tx.reservation.findMany.mockResolvedValue([{ id: 'reservation-1' }]);

    await expect(service.cancel('event-1', 'organizer-1')).resolves.toEqual(
      expect.objectContaining({ status: EventStatus.CANCELLED }),
    );
    expect(tx.reservationItem.deleteMany).toHaveBeenCalledWith({
      where: { reservationId: { in: ['reservation-1'] } },
    });
    expect(tx.event.update).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: { status: EventStatus.CANCELLED, heldQuantity: 0 },
    });
  });

  it('does not remove an event that already has paid tickets', async () => {
    prisma.event.findUnique.mockResolvedValue({ ...event, soldQuantity: 2 });

    await expect(
      service.cancel('event-1', 'organizer-1'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('creates every scheduled session atomically as published', async () => {
    const startsAt = [
      new Date(Date.now() + 86_400_000).toISOString(),
      new Date(Date.now() + 90_000_000).toISOString(),
      new Date(Date.now() + 172_800_000).toISOString(),
    ];

    const result = await service.createSchedule('organizer-1', {
      externalId: 603,
      title: 'Matrix',
      description: 'Descrição suficiente para a sessão de Matrix.',
      posterUrl: 'https://image.tmdb.org/poster.jpg',
      location: 'Cine Centro',
      startsAt,
      capacity: 96,
      priceInCents: 4000,
    });
    expect(result.count).toBe(3);
    expect(typeof result.firstEventId).toBe('string');
    expect(tx.event.create).toHaveBeenCalledTimes(3);
    expect(createdStatuses).toEqual([
      EventStatus.PUBLISHED,
      EventStatus.PUBLISHED,
      EventStatus.PUBLISHED,
    ]);
  });

  it('rejects a schedule that overlaps an existing session', async () => {
    tx.event.count.mockResolvedValue(1);

    await expect(
      service.createSchedule('organizer-1', {
        externalId: 603,
        title: 'Matrix',
        description: 'Descrição suficiente para a sessão de Matrix.',
        location: 'Cine Centro',
        startsAt: [new Date(Date.now() + 86_400_000).toISOString()],
        capacity: 96,
        priceInCents: 4000,
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.event.create).not.toHaveBeenCalled();
  });
});
