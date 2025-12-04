import { Module } from '@nestjs/common';
import { OAuth2Controller } from './controllers/oauth2.controller';
import { OAuth2Service } from './services/oauth2.service';
import { HydraKratosIntegrationService } from './services/hydra-kratos-integration.service';
import { BaseAuthModule } from 'core/auth/auth.module';

@Module({
  imports: [BaseAuthModule],
  controllers: [OAuth2Controller],
  providers: [
    OAuth2Service,
    HydraKratosIntegrationService,
  ],
  exports: [OAuth2Service, HydraKratosIntegrationService],
})
export class OAuth2Module {}

