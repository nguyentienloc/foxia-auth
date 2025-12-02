import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { KratosSessionGuard } from 'core/auth/guards/kratos-session.guard';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, KratosSessionGuard],
  exports: [AuthService],
})
export class AuthModule {}
