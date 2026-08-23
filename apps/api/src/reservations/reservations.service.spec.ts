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
  });

  it('rejects a reservation that would exceed the available capacity', async () => {
    tx.event.findFirst.mockResolvedValue({
      id: 'event-1',
      capacity: 10,
      soldQuantity: 8,
      heldQuantity: 1,
    });

    await expect(
      service.create('event-1', 'customer-1', { quantity: 2 }),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.event.update).not.toHaveBeenCalled();
    expect(tx.reservation.create).not.toHaveBeenCalled();
  });

  it('expires stale reservations before calculating availability', async () => {
    tx.reservation.findMany.mockResolvedValue([{ id: 'old-1', quantity: 2 }]);
    tx.event.findFirst.mockResolvedValue({
      id: 'event-1',
      capacity: 10,
      soldQuantity: 4,
      heldQuantity: 2,
    });
    tx.reservation.create.mockResolvedValue({ id: 'reservation-1' });

    await expect(
      service.create('event-1', 'customer-1', { quantity: 3 }),
    ).resolves.toEqual({ id: 'reservation-1' });
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
