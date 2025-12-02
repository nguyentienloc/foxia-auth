import { Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import { Reflector } from '@nestjs/core';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  handleRequest(err, user, info, context: ExecutionContextHost) {
    const optional = this.reflector.get<boolean>(
      'optional',
      context.getHandler(),
    );
    if (!optional && (err || !user)) {
      throw err || new UnauthorizedException();
    }
    return user;
  }
}
