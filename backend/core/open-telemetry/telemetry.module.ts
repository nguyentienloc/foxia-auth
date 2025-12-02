// core/open-telemetry/telemetry.module.ts
import {
  DynamicModule,
  Global,
  Module,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { TelemetryInterceptor } from './interceptors/telemetry.interceptor';
import { TelemetryOptions } from './interfaces/telemetry-options.interface';
import { OtelCollectorService } from './services/telemetry-collector.service';
import { TelemetryService } from './services/telemetry.service';

@Global()
@Module({})
export class TelemetryModule implements OnModuleInit, OnModuleDestroy {
  constructor(private readonly otelCollector: OtelCollectorService) {}

  static forRoot(options: TelemetryOptions): DynamicModule {
    return {
      module: TelemetryModule,
      providers: [
        {
          provide: 'TELEMETRY_OPTIONS',
          useValue: options,
        },
        TelemetryService,
        {
          provide: OtelCollectorService,
          useFactory: () => {
            return new OtelCollectorService(options.serviceName);
          },
        },
        {
          provide: APP_INTERCEPTOR,
          useClass: TelemetryInterceptor,
        },
      ],
      exports: [TelemetryService, OtelCollectorService],
    };
  }

  async onModuleInit() {
    await this.otelCollector.start();
  }

  async onModuleDestroy() {
    await this.otelCollector.shutdown();
  }
}
