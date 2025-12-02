import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from 'core/auth/services/auth.service';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authorization = request.headers.authorization;
    const access_token = authorization?.split(' ')?.[1];

    if (!access_token) throw new UnauthorizedException('Unauthorized');

    try {
      const user = await this.authService.validateToken(access_token);
      request.user = {
        ...user,
        id: user.sub,
      };
      return true;
    } catch (error) {
      console.log(error);
      return false;
    }
  }
}
