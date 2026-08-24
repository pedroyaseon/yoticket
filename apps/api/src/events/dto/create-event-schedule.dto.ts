import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class CreateEventScheduleDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  externalId?: number;

  @IsString()
  @MinLength(1)
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsUrl()
  posterUrl?: string;

  @IsString()
  @MinLength(10)
  @MaxLength(2000)
  description!: string;

  @IsString()
  @MinLength(2)
  @MaxLength(160)
  location!: string;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(120)
  @ArrayUnique()
  @IsDateString({}, { each: true })
  startsAt!: string[];

  @Type(() => Number)
  @IsInt()
  @Min(1)
  capacity!: number;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceInCents!: number;
}
