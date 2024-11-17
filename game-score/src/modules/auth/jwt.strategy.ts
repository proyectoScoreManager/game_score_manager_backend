import {Injectable} from '@nestjs/common';
import {PassportStrategy} from '@nestjs/passport';
import {ExtractJwt, Strategy } from 'passport-jwt';

@Injectable ()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor () {
        console.log('SECRET_KEY:', process.env.SECRET_KEY); // Check if SECRET_KEY is loaded

        super ({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false, 
            secretOrKey: process.env.SECRET_KEY, 
        });
    }

    validate(payload: any) {
        return { userId: payload.user.sub, email: payload.user.email, roles: payload.user.roles };
    }
}