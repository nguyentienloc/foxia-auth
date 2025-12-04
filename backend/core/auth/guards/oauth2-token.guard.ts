import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Request } from 'express';
import { default as axios } from 'axios';

declare module 'express-serve-static-core' {
  interface Request {
    oauth2Client?: {
      clientId: string;
      scope?: string;
      active: boolean;
    };
  }
}

@Injectable()
export class OAuth2TokenGuard implements CanActivate {
  private static readonly OPTIONAL_KEY = 'optional';

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();

    // Extract token from Authorization header
    const authHeader = request.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const optional = this.reflector.get<boolean>(
        OAuth2TokenGuard.OPTIONAL_KEY,
        context.getHandler(),
      );

      if (optional) {
        return true;
      }

      throw new UnauthorizedException('Missing or invalid Authorization header');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Introspect token with Hydra using axios
      const formData = new URLSearchParams();
      formData.append('token', token);

      const hydraPublicUrl = process.env.HYDRA_PUBLIC_URL;
      if (!hydraPublicUrl) {
        throw new UnauthorizedException('Hydra configuration error');
      }

      const response = await axios.post(
        `${hydraPublicUrl}/oauth2/introspect`,
        formData.toString(),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      const introspection = response.data;

      if (!introspection.active) {
        throw new UnauthorizedException('Token is not active');
      }

      // Attach client info to request
      request.oauth2Client = {
        clientId: introspection.client_id as string,
        scope: introspection.scope as string,
        active: introspection.active,
      };

      return true;
    } catch (error: any) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }

      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
