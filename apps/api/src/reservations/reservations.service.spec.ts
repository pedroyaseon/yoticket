import { ConflictException } from '@nestjs/common';
import { ReservationStatus } from '@prisma/client';
import { ReservationsService } from './reservations.service';

describe('ReservationsService', () => {
  const tx = {
    $queryRaw: jest.fn(),
    reservation: {
      findMany: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
    event: { findFirst: jest.fn(), update: jest.fn() },
    seat: { findMany: jest.fn() },
    reservationItem: { findMany: jest.fn(), deleteMany: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const service = new ReservationsService(prisma as never);

  beforeEach(() => {
    jest.clearAllMocks();
    tx.reservation.findMany.mockResolvedValue([]);
    tx.reservationItem.findMany.mockResolvedValue([]);
  });

  it('rejects a seat that is already held by another reservation', async () => {
    tx.event.findFirst.mockResolvedValue({
      id: 'event-1',
      priceInCents: 4000,
    });
    tx.seat.findMany.mockResolvedValue([
      { id: 'seat-1', label: 'A1' },
      { id: 'seat-2', label: 'A2' },
    ]);
    tx.reservationItem.findMany.mockResolvedValue([{ seat: { label: 'A2' } }]);

    await expect(
      service.create('event-1', 'customer-1', {
        seats: [
          { seatId: 'seat-1', ticketType: 'FULL' },
          { seatId: 'seat-2', ticketType: 'HALF' },
        ],
      }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.event.update).not.toHaveBeenCalled();
    expect(tx.reservation.create).not.toHaveBeenCalled();
  });

  it('expires stale reservations before calculating availability', async () => {
    tx.reservation.findMany.mockResolvedValue([{ id: 'old-1', quantity: 2 }]);
    tx.event.findFirst.mockResolvedValue({
      id: 'event-1',
      priceInCents: 4000,
    });
    tx.seat.findMany.mockResolvedValue([
      { id: 'seat-1', label: 'A1' },
      { id: 'seat-2', label: 'A2' },
      { id: 'seat-3', label: 'A3' },
    ]);
    tx.reservation.create.mockResolvedValue({
      id: 'reservation-1',
      items: [
        { priceInCents: 4000 },
        { priceInCents: 2000 },
        { priceInCents: 4000 },
      ],
    });

    await expect(
      service.create('event-1', 'customer-1', {
        seats: [
          { seatId: 'seat-1', ticketType: 'FULL' },
          { seatId: 'seat-2', ticketType: 'HALF' },
          { seatId: 'seat-3', ticketType: 'FULL' },
        ],
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        id: 'reservation-1',
        totalInCents: 10000,
      }),
    );
    expect(tx.reservationItem.deleteMany).toHaveBeenCalledWith({
      where: { reservationId: { in: ['old-1'] } },
    });
    expect(tx.reservation.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['old-1'] } },
      data: { status: ReservationStatus.EXPIRED },
    });
    expect(tx.event.update).toHaveBeenNthCalledWith(1, {
      where: { id: 'event-1' },
      data: { heldQuantity: { decrement: 2 } },
    });
    expect(tx.event.update).toHaveBeenNthCalledWith(2, {
      where: { id: 'event-1' },
      data: { heldQuantity: { increment: 3 } },
    });
  });
});
