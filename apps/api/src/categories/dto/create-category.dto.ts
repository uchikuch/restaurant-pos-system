import {
    IsString,
    IsOptional,
    IsBoolean,
    IsNumber,
    IsArray,
    ValidateNested,
    Min,
    IsEnum,
    Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

class AvailabilityDto {
    @IsOptional()
    @IsBoolean()
    breakfast?: boolean;

    @IsOptional()
    @IsBoolean()
    lunch?: boolean;

    @IsOptional()
    @IsBoolean()
    dinner?: boolean;

    @IsOptional()
    @IsBoolean()
    lateNight?: boolean;
}

class ScheduleItemDto {
    @IsEnum(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'])
    day: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:MM format' })
    startTime: string;

    @IsString()
    @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Time must be in HH:MM format' })
    endTime: string;
}

export class CreateCategoryDto {
    @IsString()
    name: string;

    @IsString()
    description: string;

    @IsOptional()
    @IsString()
    image?: string;

    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @IsOptional()
    @IsBoolean()
    isAvailable?: boolean;

    @IsOptional()
    @IsNumber()
    @Min(0)
    sortOrder?: number;

    @IsOptional()
    @ValidateNested()
    @Type(() => AvailabilityDto)
    availability?: AvailabilityDto;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => ScheduleItemDto)
    schedule?: ScheduleItemDto[];

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    tags?: string[];

    @IsOptional()
    @IsString()
    icon?: string;

    @IsOptional()
    @IsString()
    @Matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, { message: 'Color must be a valid hex color' })
    color?: string;
}