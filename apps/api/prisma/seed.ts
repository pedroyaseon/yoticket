import { PrismaClient, Role, EventStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'demo123';

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);
  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@demo.com' },
    update: { passwordHash, role: Role.ORGANIZER },
    create: { email: 'organizer@demo.com', passwordHash, role: Role.ORGANIZER },
  });

  await Promise.all([
    prisma.user.upsert({
      where: { email: 'customer1@demo.com' },
      update: { passwordHash, role: Role.CUSTOMER },
      create: {
        email: 'customer1@demo.com',
        passwordHash,
        role: Role.CUSTOMER,
      },
    }),
    prisma.user.upsert({
      where: { email: 'customer2@demo.com' },
      update: { passwordHash, role: Role.CUSTOMER },
      create: {
        email: 'customer2@demo.com',
        passwordHash,
        role: Role.CUSTOMER,
      },
    }),
    prisma.user.upsert({
      where: { email: 'gate@demo.com' },
      update: { passwordHash, role: Role.GATE },
      create: { email: 'gate@demo.com', passwordHash, role: Role.GATE },
    }),
  ]);

  await prisma.event.upsert({
    where: { id: 'demo-published-event' },
    update: {},
    create: {
      id: 'demo-published-event',
      externalId: 27205,
      title: 'A Origem',
      posterUrl:
        'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
      description:
        'Uma sessão especial de cinema para testar a compra de ingressos.',
      location: 'Cinema Yo — Sala 1',
      startsAt: new Date('2026-12-18T20:00:00.000Z'),
      capacity: 80,
      priceInCents: 2800,
      status: EventStatus.PUBLISHED,
      organizerId: organizer.id,
    },
  });
}

main().finally(() => prisma.$disconnect());
