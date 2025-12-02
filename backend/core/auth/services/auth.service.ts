import {
  Injectable,
  OnModuleInit,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService implements OnModuleInit {
  constructor(private readonly jwtService: JwtService) {}

  onModuleInit() {}

  async validateToken(token: string) {
    const user = await this.jwtService.verifyAsync(token);
    if (!user) {
      throw new UnauthorizedException('Invalid token');
    }
    if (user.exp < Date.now() / 1000) {
      throw new UnauthorizedException('Token expired');
    }
    return user;
  }
}
