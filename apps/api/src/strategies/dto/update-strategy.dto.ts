import { IsString, IsInt, IsOptional, Min, MinLength, MaxLength } from 'class-validator';

//Update strategy user restrictions
export class UpdateStrategyDTO {
    @IsString()
    @IsOptional()
    @MinLength(2)
    @MaxLength(100)
    name?: string;

    @IsString()
    @IsOptional()
    @MaxLength(500)
    description?: string;

    @IsString()
    @IsOptional()
    symbol?: string;

    @IsInt()
    @IsOptional()
    @Min(1)
    shortPeriod?: number;
    
    @IsInt()
    @IsOptional()
    @Min(2)
    longPeriod?: number;
}