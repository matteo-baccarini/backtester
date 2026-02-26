import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private configService: ConfigService) {
        const secret = configService.get<string>('JWT_SECRET');
        if (!secret) {
            throw new Error('JWT_SECRET environment variable is not set');
        }
        super({
            // 1. Tell Passport WHERE to find the token in the request
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

            // 2. Reject expired tokens automatically
            ignoreExpiration: false,

            // 3. The same secret used to SIGN tokens (in auth.module.ts)
            secretOrKey: secret,
        });
    }

    // 4. This runs AFTER Passport verifies the token signature
    async validate(payload: { sub: string; email: string; role: string }) {
        // Whatever you return here gets attached to req.user
        return {
            id: payload.sub,
            email: payload.email,
            role: payload.role,
        };
    }
}
