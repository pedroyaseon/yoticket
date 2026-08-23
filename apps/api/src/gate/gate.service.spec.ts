import { TicketStatus } from '@prisma/client';
import { GateService } from './gate.service';

describe('GateService', () => {
  const tx = {
    ticket: { updateMany: jest.fn(), findUnique: jest.fn() },
  };
  const prisma = {
    $transaction: jest.fn((callback: (client: typeof tx) => unknown) =>
      callback(tx),
    ),
  };
  const service = new GateService(prisma as never);

  beforeEach(() => jest.clearAllMocks());

  it('marks a valid ticket as used atomically', async () => {
    tx.ticket.updateMany.mockResolvedValue({ count: 1 });
    await expect(
      service.validate('event-1', 'secure-ticket-code-123'),
    ).resolves.toEqual({ status: 'VALID' });
    expect(tx.ticket.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          code: 'secure-ticket-code-123',
          eventId: 'event-1',
          status: TicketStatus.VALID,
        },
      }),
    );
  });

  it('identifies an already-used ticket', async () => {
    tx.ticket.updateMany.mockResolvedValue({ count: 0 });
    tx.ticket.findUnique.mockResolvedValue({
      eventId: 'event-1',
      status: TicketStatus.USED,
    });
    await expect(
      service.validate('event-1', 'secure-ticket-code-123'),
    ).resolves.toEqual({ status: 'ALREADY_USED' });
  });

  it('does not validate a ticket for another event', async () => {
    tx.ticket.updateMany.mockResolvedValue({ count: 0 });
    tx.ticket.findUnique.mockResolvedValue({
      eventId: 'event-2',
      status: TicketStatus.VALID,
    });
    await expect(
      service.validate('event-1', 'secure-ticket-code-123'),
    ).resolves.toEqual({ status: 'WRONG_EVENT' });
  });
});
