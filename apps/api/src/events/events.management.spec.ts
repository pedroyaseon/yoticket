import { ConflictException } from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { EventsService } from './events.service';

describe('EventsService organizer management', () => {
  const tx = {
    seat: { deleteMany: jest.fn() },
    event: { update: jest.fn() },
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
});
