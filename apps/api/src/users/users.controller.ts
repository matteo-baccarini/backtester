import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guards';

@Controller('users')
export class UsersController {
    // GET /users/me  — protected, requires a valid JWT token
    @UseGuards(JwtAuthGuard)
    @Get('me')
    getMe(@Req() req: any) {
        // req.user is populated by JwtStrategy.validate()
        return req.user;
    }
}
