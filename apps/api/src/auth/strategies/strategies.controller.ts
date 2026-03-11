import { Controller, Get, Post, Patch, Delete, Body, Param, Req, UseGuards, } from '@nestjs/common';
import { JwtAuthGuard } from '../guards/jwt-auth.guards';
import { StrategiesService } from '../../strategies/strategies.service';
import { CreateStrategyDTO } from '../../strategies/dto/create-strategy.dto';
import { UpdateStrategyDTO } from '../../strategies/dto/update-strategy.dto';
import { RequestWithUser } from '../interfaces/request-with-user.interface';

@Controller('strategies')
@UseGuards(JwtAuthGuard) // Every route in this controller requires a valid JWT
export class StrategiesController {
    constructor(private strategiesService: StrategiesService) { }

    @Post()
    async create(@Req() req: RequestWithUser, @Body() createDto: CreateStrategyDTO) {
        const userId = req.user.id;
        return this.strategiesService.createStrategy(userId, createDto);
    }

    @Get()
    async findAll(@Req() req: RequestWithUser) {
        const userId = req.user.id;
        return this.strategiesService.findAllByUserId(userId);
    }

    @Get(':id')
    async findOne(@Req() req: RequestWithUser, @Param('id') id: string) {
        const userId = req.user.id;
        return this.strategiesService.findById(id, userId);
    }

    @Patch(':id')
    async update(
        @Req() req: RequestWithUser,
        @Param('id') id: string,
        @Body() updateDto: UpdateStrategyDTO,
    ) {
        const userId = req.user.id;
        return this.strategiesService.updateStrategy(id, userId, updateDto);
    }

    @Delete(':id')
    async remove(@Req() req: RequestWithUser, @Param('id') id: string) {
        const userId = req.user.id;
        return this.strategiesService.deleteStrategy(id, userId);
    }
}
