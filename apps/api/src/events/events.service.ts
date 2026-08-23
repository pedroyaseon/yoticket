import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateEventDto } from './dto/create-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}
  create(organizerId: string, input: CreateEventDto) {
    return this.prisma.event.create({
      data: { ...input, startsAt: new Date(input.startsAt), organizerId },
    });
  }
  listMine(organizerId: string) {
    return this.prisma.event.findMany({
      where: { organizerId },
      orderBy: { startsAt: 'asc' },
    });
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
}
