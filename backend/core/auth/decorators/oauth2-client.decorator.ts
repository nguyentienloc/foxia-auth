import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const OAuth2Client = createParamDecorator(
  (data: string, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const client = request.oauth2Client;
    return data ? client?.[data] : client;
  },
);

