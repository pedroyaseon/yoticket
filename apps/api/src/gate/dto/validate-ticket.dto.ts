import { IsString, MaxLength, MinLength } from 'class-validator';

export class ValidateTicketDto {
  @IsString()
  @MinLength(1)
  eventId!: string;

  @IsString()
  @MinLength(16)
  @MaxLength(2048)
  ticketCode!: string;
}
