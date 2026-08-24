import { PaymentStatus, ReservationStatus } from '@prisma/client';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  type CreatedTicket = {
    eventId: string;
    reservationId: string;
    ownerId: string;
    code: string;
    seatId: string;
    ticketType: 'FULL' | 'HALF';
    priceInCents: number;
  };
  let createdTickets: CreatedTicket[] = [];
  const tx = {
    $queryRaw: jest.fn(),
    reservation: { findUnique: jest.fn(), update: jest.fn() },
    payment: { findUnique: jest.fn(), create: jest.fn() },
    event: { update: jest.fn() },
    ticket: { createMany: jest.fn() },
    reservationItem: { deleteMany: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const service = new PaymentsService(prisma as never);
  const reservation = {
    id: 'reservation-1',
    eventId: 'event-1',
    customerId: 'customer-1',
    quantity: 2,
    status: ReservationStatus.PENDING,
    expiresAt: new Date(Date.now() + 60_000),
    items: [
      {
        seatId: 'seat-1',
        ticketType: 'FULL' as const,
        priceInCents: 4000,
      },
      {
        seatId: 'seat-2',
        ticketType: 'HALF' as const,
        priceInCents: 2000,
      },
    ],
  };

  beforeEach(() => {
    jest.clearAllMocks();
    createdTickets = [];
    tx.reservation.findUnique.mockResolvedValue(reservation);
    tx.payment.findUnique.mockResolvedValue(null);
    tx.ticket.createMany.mockImplementation(
      ({ data }: { data: CreatedTicket[] }) => {
        createdTickets = data;
      },
    );
  });

  it('confirms a reservation and creates exactly one ticket per quantity', async () => {
    await expect(
      service.process('reservation-1', 'customer-1', 'APPROVED'),
    ).resolves.toEqual({
      status: PaymentStatus.APPROVED,
      reservationId: 'reservation-1',
    });
    expect(tx.reservation.update).toHaveBeenCalledWith({
      where: { id: 'reservation-1' },
      data: { status: ReservationStatus.CONFIRMED },
    });
    expect(tx.ticket.createMany).toHaveBeenCalledTimes(1);
    expect(createdTickets).toHaveLength(2);
    expect(createdTickets).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          eventId: 'event-1',
          ownerId: 'customer-1',
          seatId: 'seat-1',
        }),
      ]),
    );
  });

  it('returns the existing payment without creating duplicate tickets', async () => {
    tx.payment.findUnique.mockResolvedValue({ status: PaymentStatus.APPROVED });

    await expect(
      service.process('reservation-1', 'customer-1', 'APPROVED'),
    ).resolves.toEqual({
      status: PaymentStatus.APPROVED,
      reservationId: 'reservation-1',
    });
    expect(tx.payment.create).not.toHaveBeenCalled();
    expect(tx.ticket.createMany).not.toHaveBeenCalled();
  });

  it('releases held inventory after a declined payment', async () => {
    await expect(
      service.process('reservation-1', 'customer-1', 'DECLINED'),
    ).resolves.toEqual({
      status: PaymentStatus.DECLINED,
      reservationId: 'reservation-1',
    });
    expect(tx.reservation.update).toHaveBeenCalledWith({
      where: { id: 'reservation-1' },
      data: { status: ReservationStatus.CANCELLED },
    });
    expect(tx.event.update).toHaveBeenCalledWith({
      where: { id: 'event-1' },
      data: { heldQuantity: { decrement: 2 } },
    });
    expect(tx.ticket.createMany).not.toHaveBeenCalled();
    expect(tx.reservationItem.deleteMany).toHaveBeenCalledWith({
      where: { reservationId: 'reservation-1' },
    });
  });
});
