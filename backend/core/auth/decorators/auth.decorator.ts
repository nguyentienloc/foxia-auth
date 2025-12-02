import { applyDecorators, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiUnauthorizedResponse } from '@nestjs/swagger';
import { UserAdminGuard } from '../guards/user/user-admin.guard';
import { UserGuard } from '../guards/user/user.guard';

export const Auth = () => {
  return applyDecorators(
    UseGuards(UserGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
  );
};

export const AuthAdmin = () => {
  return applyDecorators(
    UseGuards(UserAdminGuard),
    ApiBearerAuth(),
    ApiUnauthorizedResponse({
      description: 'Unauthorized',
    }),
  );
};
