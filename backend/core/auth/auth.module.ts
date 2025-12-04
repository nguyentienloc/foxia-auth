import { DynamicModule, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthService } from './services/auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { kratosProviders } from './providers/kratos.provider';
import { KratosSessionService } from './services/kratos-session.service';
import { hydraProviders } from './providers/hydra.provider';

@Module({})
export class BaseAuthModule {
  public static forRoot(): DynamicModule {
    const jwtModule = JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: process.env.JWT_EXPIRES_IN },
    });

    return {
      module: BaseAuthModule,
      global: true,
      imports: [jwtModule],
      exports: [AuthService, JwtModule, KratosSessionService, ...kratosProviders, ...hydraProviders],
      providers: [JwtStrategy, AuthService, KratosSessionService, ...kratosProviders, ...hydraProviders],
    };
  }
}
