import { EventStatus, PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { buildSeatMap } from '../src/events/seat-map';

const prisma = new PrismaClient();
const DEMO_PASSWORD = 'demo123';

const venues = [
  { slug: 'aurora-centro', name: 'Cine Aurora — Centro', priceAdjustment: 0 },
  {
    slug: 'aurora-shopping-norte',
    name: 'Cine Aurora — Shopping Norte',
    priceAdjustment: 400,
  },
  {
    slug: 'cinema-yo-vila-cultural',
    name: 'Cinema Yo — Vila Cultural',
    priceAdjustment: -200,
  },
];

const movies = [
  {
    externalId: 157336,
    title: 'Interestelar',
    posterUrl:
      'https://image.tmdb.org/t/p/w500/6ricSDD83BClJsFdGB6x7cM0MFQ.jpg',
    description:
      'Um grupo de astronautas atravessa um buraco de minhoca em busca de um novo lar para a humanidade.',
    priceInCents: 4200,
  },
  {
    externalId: 693134,
    title: 'Duna: Parte Dois',
    posterUrl:
      'https://image.tmdb.org/t/p/w500/8LJJjLjAzAwXS40S5mx79PJ2jSs.jpg',
    description:
      'Paul Atreides se une a Chani e aos Fremen enquanto enfrenta o destino do universo.',
    priceInCents: 3600,
  },
  {
    externalId: 335984,
    title: 'Blade Runner 2049',
    posterUrl:
      'https://image.tmdb.org/t/p/w500/49pANIZXRAdHUiWjjBv4vxPeqRC.jpg',
    description:
      'Uma descoberta enterrada por décadas leva um novo blade runner à procura de Rick Deckard.',
    priceInCents: 3200,
  },
  {
    externalId: 27205,
    title: 'A Origem',
    posterUrl:
      'https://image.tmdb.org/t/p/w500/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg',
    description:
      'Um especialista em extrair segredos dos sonhos recebe a missão de implantar uma ideia.',
    priceInCents: 3000,
  },
  {
    externalId: 569094,
    title: 'Homem-Aranha: Através do Aranhaverso',
    posterUrl:
      'https://image.tmdb.org/t/p/w500/fBS6y0LYX4kU6pPSBYMdQy6SIHX.jpg',
    description:
      'Miles Morales atravessa o Multiverso e encontra uma equipe de Pessoas-Aranha.',
    priceInCents: 3400,
  },
  {
    externalId: 603,
    title: 'Matrix',
    posterUrl:
      'https://image.tmdb.org/t/p/w500/lDqMDI3xpbB9UQRyeXfei0MXhqb.jpg',
    description:
      'Um programador descobre que a realidade é uma simulação controlada por máquinas.',
    priceInCents: 3000,
  },
  {
    externalId: 329865,
    title: 'A Chegada',
    posterUrl:
      'https://image.tmdb.org/t/p/w500/3rDwbFpn6z5HJUgDjpfhEePx8VI.jpg',
    description:
      'Uma linguista tenta compreender visitantes interplanetários e o propósito de sua chegada.',
    priceInCents: 3200,
  },
  {
    externalId: 76341,
    title: 'Mad Max: Estrada da Fúria',
    posterUrl:
      'https://image.tmdb.org/t/p/w500/tH64gzAHDFg7EFcgfkkZyHdGM5P.jpg',
    description:
      'Em um mundo pós-apocalíptico, Max e Furiosa fogem de um tirano implacável.',
    priceInCents: 3400,
  },
  {
    externalId: 872585,
    title: 'Oppenheimer',
    posterUrl:
      'https://image.tmdb.org/t/p/w500/1OsQJEoSXBjduuCvDOlRhoEUaHu.jpg',
    description:
      'A trajetória de J. Robert Oppenheimer e o desenvolvimento da bomba atômica.',
    priceInCents: 3800,
  },
  {
    externalId: 414906,
    title: 'Batman',
    posterUrl:
      'https://image.tmdb.org/t/p/w500/wd7b4Nv9QBHDTIjc2m7sr0IUMoh.jpg',
    description:
      'Batman investiga a corrupção de Gotham enquanto enfrenta o serial killer Charada.',
    priceInCents: 3600,
  },
  {
    externalId: 496243,
    title: 'Parasita',
    posterUrl:
      'https://image.tmdb.org/t/p/w500/igw938inb6Fy0YVcwIyxQ7Lu5FO.jpg',
    description:
      'Uma família desempregada se infiltra na rotina de uma família rica, com consequências inesperadas.',
    priceInCents: 3000,
  },
  {
    externalId: 545611,
    title: 'Tudo em Todo o Lugar ao Mesmo Tempo',
    posterUrl:
      'https://image.tmdb.org/t/p/w500/2dSZQGwijlXvMSyuGe0FSgrXnv0.jpg',
    description:
      'Uma imigrante chinesa precisa salvar o mundo explorando diferentes universos e possibilidades.',
    priceInCents: 3200,
  },
];

const sessionSlots = [
  { dayOffset: 0, hour: 18, minute: 0 },
  { dayOffset: 0, hour: 21, minute: 0 },
  { dayOffset: 1, hour: 19, minute: 30 },
];

function sessionDate(
  movieIndex: number,
  dayOffset: number,
  hour: number,
  minute: number,
) {
  const date = new Date(
    2026,
    8,
    5 + movieIndex * 3 + dayOffset,
    hour,
    minute,
    0,
    0,
  );
  return date;
}

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

  await prisma.event.updateMany({
    where: {
      id: {
        in: [
          'demo-interstellar',
          'demo-dune-part-two',
          'demo-blade-runner-2049',
          'demo-published-event',
          'demo-spider-verse',
        ],
      },
    },
    data: { status: EventStatus.CANCELLED },
  });
  await prisma.event.updateMany({
    where: {
      title: 'Interestelar — Sessão Especial',
      location: 'Cinema Yo — Sala 2',
      externalId: 157336,
    },
    data: { status: EventStatus.CANCELLED },
  });

  for (const [movieIndex, movie] of movies.entries()) {
    for (const venue of venues) {
      for (const [slotIndex, slot] of sessionSlots.entries()) {
        const id = `session-${movie.externalId}-${venue.slug}-${slotIndex}`;
        const capacity = 96;
        await prisma.event.upsert({
          where: { id },
          update: {
            ...movie,
            location: venue.name,
            startsAt: sessionDate(
              movieIndex,
              slot.dayOffset,
              slot.hour,
              slot.minute,
            ),
            capacity,
            priceInCents: movie.priceInCents + venue.priceAdjustment,
            status: EventStatus.PUBLISHED,
            organizerId: organizer.id,
          },
          create: {
            id,
            ...movie,
            location: venue.name,
            startsAt: sessionDate(
              movieIndex,
              slot.dayOffset,
              slot.hour,
              slot.minute,
            ),
            capacity,
            priceInCents: movie.priceInCents + venue.priceAdjustment,
            status: EventStatus.PUBLISHED,
            organizerId: organizer.id,
          },
        });

        const seatCount = await prisma.seat.count({ where: { eventId: id } });
        if (seatCount === 0) {
          await prisma.seat.createMany({
            data: buildSeatMap(capacity).map((seat) => ({
              ...seat,
              eventId: id,
            })),
          });
        }
      }
    }
  }
}

main().finally(() => prisma.$disconnect());
