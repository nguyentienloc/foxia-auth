import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET,
      algorithms: ['HS256'],
    });
  }

  async validate(payload: any): Promise<any> {
    const { sub, exp } = payload;
    return { id: sub, exp: exp * 1000 };
  }
}
