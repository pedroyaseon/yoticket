import { ConflictException } from '@nestjs/common';
import { ReservationStatus, TicketStatus } from '@prisma/client';
import { TicketsService } from './tickets.service';

describe('TicketsService', () => {
  type TicketUpdateInput = {
    data: { status: TicketStatus; seatId: string | null };
  };
  const tx = {
    $queryRaw: jest.fn(),
    ticket: {
      findFirst: jest.fn(),
      updateMany: jest.fn<Promise<{ count: number }>, [TicketUpdateInput]>(),
      count: jest.fn(),
    },
    reservationItem: { deleteMany: jest.fn() },
    event: { update: jest.fn() },
    reservation: { update: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const service = new TicketsService(prisma as never);
  const validTicket = {
    id: 'ticket-1',
    eventId: 'event-1',
    reservationId: 'reservation-1',
    ownerId: 'customer-1',
    seatId: 'seat-1',
    status: TicketStatus.VALID,
    priceInCents: 2000,
    refundedAt: null,
    event: { startsAt: new Date(Date.now() + 86_400_000) },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    tx.ticket.findFirst.mockResolvedValue(validTicket);
    tx.ticket.updateMany.mockResolvedValue({ count: 1 });
    tx.ticket.count.mockResolvedValue(0);
  });

  it('cancels a valid ticket, releases its seat and simulates the refund', async () => {
    await expect(
      service.cancelAndRefund('ticket-1', 'customer-1'),
    ).resolves.toEqual(
      expect.objectContaining({
        status: TicketStatus.CANCELLED,
        refundStatus: 'APPROVED',
        refundInCents: 2000,
      }),
    );
    expect(tx.reservationItem.deleteMany).toHaveBeenCalledWith({
      where: { reservationId: 'reservation-1', seatId: 'seat-1' },
    });
    const ticketUpdate = tx.ticket.updateMany.mock.calls[0][0];
    expect(ticketUpdate.data.status).toBe(TicketStatus.CANCELLED);
    expect(ticketUpdate.data.seatId).toBeNull();
    expect(tx.event.update).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: { soldQuantity: { decrement: 1 } },
    });
    expect(tx.reservation.update).toHaveBeenCalledWith({
      where: { id: 'reservation-1' },
      data: {
        quantity: { decrement: 1 },
        status: ReservationStatus.CANCELLED,
      },
    });
  });

  it('does not refund an already-used ticket', async () => {
    tx.ticket.findFirst.mockResolvedValue({
      ...validTicket,
      status: TicketStatus.USED,
    });

    await expect(
      service.cancelAndRefund('ticket-1', 'customer-1'),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.ticket.updateMany).not.toHaveBeenCalled();
  });

  it('returns an idempotent response for an already-refunded ticket', async () => {
    tx.ticket.findFirst.mockResolvedValue({
      ...validTicket,
      status: TicketStatus.CANCELLED,
      refundedAt: new Date(),
    });

    await expect(
      service.cancelAndRefund('ticket-1', 'customer-1'),
    ).resolves.toEqual(
      expect.objectContaining({ refundStatus: 'ALREADY_REFUNDED' }),
    );
    expect(tx.event.update).not.toHaveBeenCalled();
  });
});
