import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { KratosSessionService } from '../services/kratos-session.service';

declare module 'express-serve-static-core' {
  interface Request {
    kratosSession?: Awaited<
      ReturnType<KratosSessionService['getSessionFromRequest']>
    >;
    user?: any;
  }
}

@Injectable()
export class KratosSessionGuard implements CanActivate {
  private static readonly OPTIONAL_KEY = 'optional';

  constructor(
    private readonly sessionService: KratosSessionService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    try {
      const session = await this.sessionService.getSessionFromRequest(request);
      request.kratosSession = session;
      request.user = {
        id: session.identity?.id,
        session,
        identity: session.identity,
        traits: session.identity?.traits,
      };

      return true;
    } catch (error) {
      const optional = this.reflector.get<boolean>(
        KratosSessionGuard.OPTIONAL_KEY,
        context.getHandler(),
      );

      if (optional) {
        return true;
      }

      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException();
    }
  }
}

