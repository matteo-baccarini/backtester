import { IsString, IsNumber, IsDateString, Min } from 'class-validator';

export class RunBacktestDto {
    @IsString()
    strategyId: string;

    @IsNumber()
    @Min(100, { message: 'Initial Capital must be at least 100' })
    initialCapital: number;

    @IsDateString({}, { message: 'startDate must be a valid ISO date string' })
    startDate: string;

    @IsDateString({}, { message: 'startDate must be a valid ISO date string' })
    endDate: string;

}