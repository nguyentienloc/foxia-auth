import {
  Injectable,
  UnauthorizedException,
  InternalServerErrorException,
  Inject,
} from '@nestjs/common';
import { Request } from 'express';
import { isAxiosError } from 'axios';
import {
  FrontendApi,
  FrontendApiToSessionRequest,
  Session,
} from '@ory/kratos-client';
import { KRATOS_FRONTEND_API } from '../providers/kratos.provider';

@Injectable()
export class KratosSessionService {
  constructor(
    @Inject(KRATOS_FRONTEND_API)
    private readonly frontendApi: FrontendApi,
  ) {}

  async getSessionFromRequest(req: Request): Promise<Session> {
    const cookie = req.headers['cookie'];
    const sessionToken = req.headers['x-session-token'] as string | undefined;

    if (!cookie && !sessionToken) {
      throw new UnauthorizedException('Missing Kratos session context');
    }

    try {
      const params: FrontendApiToSessionRequest = {
        ...(cookie ? { cookie } : {}),
        ...(sessionToken ? { xSessionToken: sessionToken } : {}),
      };

      const response = await this.frontendApi.toSession(params, {
        headers: {
          ...(cookie ? { cookie } : {}),
          ...(sessionToken ? { 'x-session-token': sessionToken } : {}),
        },
        withCredentials: true,
      });

      return response.data;
    } catch (error) {
      throw this.normalizeError(error);
    }
  }

  private normalizeError(error: unknown) {
    if (isAxiosError(error)) {
      const status = error.response?.status ?? 500;
      const message =
        (error.response?.data as any)?.error?.message ||
        error.response?.statusText ||
        'Unable to validate session';

      if (status === 401) {
        throw new UnauthorizedException(message);
      }

      throw new InternalServerErrorException(message);
    }

    throw error;
  }
}

