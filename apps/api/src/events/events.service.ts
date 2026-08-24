import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Event, EventStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';
import { buildSeatMap } from './seat-map';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}
  create(organizerId: string, input: CreateEventDto) {
    return this.prisma.event.create({
      data: {
        ...input,
        startsAt: new Date(input.startsAt),
        organizerId,
        seats: { create: buildSeatMap(input.capacity) },
      },
    });
  }
  listMine(organizerId: string) {
    return this.prisma.event.findMany({
      where: { organizerId },
      orderBy: { startsAt: 'asc' },
    });
  }
  listPublished(query?: string) {
    return this.prisma.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        startsAt: { gte: new Date() },
        ...(query ? { title: { contains: query, mode: 'insensitive' } } : {}),
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  async listMovies(query?: string) {
    const sessions = await this.publishedSessions(query);
    return this.summarizeMovies(sessions);
  }

  async findMovie(key: string) {
    const externalId = Number(key);
    const anchor = await this.prisma.event.findFirst({
      where: {
        status: EventStatus.PUBLISHED,
        startsAt: { gte: new Date() },
        ...(Number.isInteger(externalId) && String(externalId) === key
          ? { externalId }
          : { id: key }),
      },
    });
    if (!anchor) throw new NotFoundException('Filme não encontrado.');

    const sessions = await this.prisma.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        startsAt: { gte: new Date() },
        ...(anchor.externalId
          ? { externalId: anchor.externalId }
          : { title: anchor.title }),
      },
      orderBy: [{ location: 'asc' }, { startsAt: 'asc' }],
    });
    const summary = this.summarizeMovies(sessions)[0];
    return {
      ...summary,
      description: anchor.description,
      sessions: sessions.map((session) => ({
        id: session.id,
        location: session.location,
        startsAt: session.startsAt,
        priceInCents: session.priceInCents,
      })),
    };
  }

  async listVenues() {
    const sessions = await this.publishedSessions();
    const grouped = new Map<string, Event[]>();
    for (const session of sessions) {
      const current = grouped.get(session.location) ?? [];
      current.push(session);
      grouped.set(session.location, current);
    }
    return Array.from(grouped.entries())
      .map(([name, venueSessions]) => {
        const movies = this.summarizeMovies(venueSessions);
        return {
          slug: this.slugify(name),
          name,
          movieCount: movies.length,
          movies,
        };
      })
      .sort((left, right) => left.name.localeCompare(right.name, 'pt-BR'));
  }

  async findVenue(slug: string) {
    const venue = (await this.listVenues()).find((item) => item.slug === slug);
    if (!venue) throw new NotFoundException('Local não encontrado.');
    return venue;
  }
  async findPublished(id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, status: EventStatus.PUBLISHED },
    });
    if (!event) throw new NotFoundException('Evento não encontrado.');
    return event;
  }
  async publish(id: string, organizerId: string) {
    const event = await this.prisma.event.findUnique({ where: { id } });
    if (!event) throw new NotFoundException('Evento não encontrado.');
    if (event.organizerId !== organizerId)
      throw new ForbiddenException('Você não pode alterar este evento.');
    return this.prisma.event.update({
      where: { id },
      data: { status: EventStatus.PUBLISHED },
    });
  }

  private publishedSessions(query?: string) {
    return this.prisma.event.findMany({
      where: {
        status: EventStatus.PUBLISHED,
        startsAt: { gte: new Date() },
        ...(query ? { title: { contains: query, mode: 'insensitive' } } : {}),
      },
      orderBy: { startsAt: 'asc' },
    });
  }

  private summarizeMovies(sessions: Event[]) {
    const grouped = new Map<
      string,
      {
        key: string;
        externalId: number | null;
        title: string;
        posterUrl: string | null;
        description: string;
        priceFromInCents: number;
        sessionCount: number;
        venues: Set<string>;
      }
    >();
    for (const session of sessions) {
      const key = session.externalId?.toString() ?? session.id;
      const current = grouped.get(key);
      if (current) {
        current.priceFromInCents = Math.min(
          current.priceFromInCents,
          Math.floor(session.priceInCents / 2),
        );
        current.sessionCount += 1;
        current.venues.add(session.location);
      } else {
        grouped.set(key, {
          key,
          externalId: session.externalId,
          title: session.title,
          posterUrl: session.posterUrl,
          description: session.description,
          priceFromInCents: Math.floor(session.priceInCents / 2),
          sessionCount: 1,
          venues: new Set([session.location]),
        });
      }
    }
    return Array.from(grouped.values()).map((movie) => ({
      ...movie,
      venues: Array.from(movie.venues).sort((left, right) =>
        left.localeCompare(right, 'pt-BR'),
      ),
    }));
  }

  private slugify(value: string) {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
}
