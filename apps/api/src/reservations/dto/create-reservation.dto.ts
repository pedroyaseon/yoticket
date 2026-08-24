import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsString,
  ValidateNested,
} from 'class-validator';
import { TicketType } from '@prisma/client';

export class SeatSelectionDto {
  @IsString() seatId!: string;
  @IsEnum(TicketType) ticketType!: TicketType;
}

export class CreateReservationDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(10)
  @ArrayUnique((selection: SeatSelectionDto) => selection.seatId)
  @ValidateNested({ each: true })
  @Type(() => SeatSelectionDto)
  seats!: SeatSelectionDto[];
}
