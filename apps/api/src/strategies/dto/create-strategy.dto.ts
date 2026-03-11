import { IsString, IsInt, IsOptional, Min, MinLength, MaxLength } from 'class-validator';

//user input and restrictions
export class CreateStrategyDTO {
    @IsString()
    @MinLength(2, {message : 'Strategy must be at least 2 characters long' })
    @MaxLength(100, {message : 'Strategy must be at most 100 characters long' })
    name : string;

    @IsString()
    @IsOptional()
    @MaxLength(500, {message : 'Strategy Description must be at most 500 characters long' })
    description : string;

    @IsString()
    @MinLength(1, {message : 'Symbol is required' })
    symbol : string;

    @IsInt({ message: 'shortPeriod must be an integer' })
    @Min(1, { message: 'shortPeriod must be at least 1' })
    shortPeriod: number;

    @IsInt({ message: 'longPeriod must be an integer' })
    @Min(2, { message: 'longPeriod must be at least 2' })
    longPeriod: number;
}