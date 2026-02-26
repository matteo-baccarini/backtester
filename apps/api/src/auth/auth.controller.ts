import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

@Controller('auth')
export class AuthController {
    constructor(
        private authService: AuthService,
        private usersService: UsersService,
    ) { }

    // POST /auth/register
    @Post('register')
    async register(@Body() registerDto: RegisterDto) {
        const user = await this.usersService.createUser(
            registerDto.email,
            registerDto.name,
            registerDto.password,
        );

        return {
            message: 'User registered successfully',
            user,
        };
    }

    // POST /auth/login
    @Post('login')
    @HttpCode(HttpStatus.OK)
    async login(@Body() loginDto: LoginDto) {
        return this.authService.login(loginDto.email, loginDto.password);
    }
}