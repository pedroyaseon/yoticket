import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
export class CreateEventDto {
  @IsOptional() @Type(() => Number) @IsInt() externalId?: number;
  @IsString() @MinLength(1) @MaxLength(160) title!: string;
  @IsOptional() @IsUrl() posterUrl?: string;
  @IsString() @MinLength(10) @MaxLength(2000) description!: string;
  @IsString() @MinLength(2) @MaxLength(160) location!: string;
  @IsDateString() startsAt!: string;
  @Type(() => Number) @IsInt() @Min(1) capacity!: number;
  @Type(() => Number) @IsInt() @Min(0) priceInCents!: number;
}
