import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategies';
import { AuthController } from './auth.controller';

@Module({
    imports: [
        //1. UsersModule : check if a user exists and get their password hash
        UsersModule,

        //2. Passport Module : the library that allows the use JWT authentication strategy
        PassportModule,

        //3. JWT Module : configures the JWT Token generation
        JwtModule.registerAsync({
            useFactory: async (configService: ConfigService) => {
                const secret = configService.get<string>('JWT_SECRET');
                if (!secret) {
                    throw new Error('JWT_SECRET environment variable is not set');
                }
                return {
                    secret,
                    signOptions: { expiresIn: '1d' },
                };
            },
            inject: [ConfigService],
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService], //other modules can now use this AuthService
})
export class AuthModule { }
