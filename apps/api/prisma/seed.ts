import { PrismaClient, Role, EventStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { buildSeatMap } from '../src/events/seat-map';

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

  const demoEvents = [
    {
      id: 'demo-interstellar',
      externalId: 157336,
      title: 'Interestelar',
      posterUrl:
        'https://image.tmdb.org/t/p/w500/6ricSDD83BClJsFdGB6x7cM0MFQ.jpg',
      description:
        'Um grupo de astronautas atravessa um buraco de minhoca em busca de um novo lar para a humanidade.',
      location: 'Cine Aurora — Sala IMAX',
      startsAt: new Date('2026-09-12T22:00:00.000Z'),
      capacity: 180,
      priceInCents: 4200,
    },
    {
      id: 'demo-dune-part-two',
      externalId: 693134,
      title: 'Duna: Parte Dois',
      posterUrl:
        'https://image.tmdb.org/t/p/w500/8LJJjLjAzAwXS40S5mx79PJ2jSs.jpg',
      description:
        'Paul Atreides se une a Chani e aos Fremen enquanto busca vingança e enfrenta o destino do universo.',
      location: 'Cine Aurora — Sala 2',
      startsAt: new Date('2026-10-03T20:30:00.000Z'),
      capacity: 120,
      priceInCents: 3600,
    },
    {
      id: 'demo-blade-runner-2049',
      externalId: 335984,
      title: 'Blade Runner 2049',
      posterUrl:
        'https://image.tmdb.org/t/p/w500/49pANIZXRAdHUiWjjBv4vxPeqRC.jpg',
      description:
        'Uma descoberta enterrada por décadas leva um novo blade runner à procura do desaparecido Rick Deckard.',
      location: 'Centro Cultural Prisma',
      startsAt: new Date('2026-11-07T23:00:00.000Z'),
      capacity: 90,
      priceInCents: 3200,
    },
    {
      id: 'demo-published-event',
      externalId: 27205,
      title: 'A Origem',
      posterUrl:
        'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
      description:
        'Um especialista em extrair segredos dos sonhos recebe a missão de implantar uma ideia na mente de um herdeiro.',
      location: 'Cinema Yo — Sala 1',
      startsAt: new Date('2026-12-18T20:00:00.000Z'),
      capacity: 80,
      priceInCents: 2800,
    },
    {
      id: 'demo-spider-verse',
      externalId: 569094,
      title: 'Homem-Aranha: Através do Aranhaverso',
      posterUrl:
        'https://image.tmdb.org/t/p/w500/fBS6y0LYX4kU6pPSBYMdQy6SIHX.jpg',
      description:
        'Miles Morales atravessa o Multiverso e encontra uma equipe de Pessoas-Aranha com ideias diferentes sobre como salvar quem amam.',
      location: 'Cine Aurora — Sala 3',
      startsAt: new Date('2026-12-20T18:30:00.000Z'),
      capacity: 140,
      priceInCents: 3400,
    },
  ];

  for (const { id, ...event } of demoEvents) {
    await prisma.event.upsert({
      where: { id },
      update: {
        ...event,
        status: EventStatus.PUBLISHED,
        organizerId: organizer.id,
      },
      create: {
        id,
        ...event,
        status: EventStatus.PUBLISHED,
        organizerId: organizer.id,
      },
    });

    const seatCount = await prisma.seat.count({ where: { eventId: id } });
    if (seatCount === 0) {
      await prisma.seat.createMany({
        data: buildSeatMap(event.capacity).map((seat) => ({
          ...seat,
          eventId: id,
        })),
      });
    }
  }
}

main().finally(() => prisma.$disconnect());
