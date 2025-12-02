declare module '@golevelup/nestjs-rabbitmq' {
  // Augment typings to include members used in this project.
  // At runtime these are provided by the actual library.

  import type { DynamicModule } from '@nestjs/common';

  export class RabbitMQModule {
    static forRoot(
      _module: typeof RabbitMQModule,
      _options: any,
    ): DynamicModule;

    static forRootAsync(
      _module: typeof RabbitMQModule,
      _options: any,
    ): DynamicModule;
  }

  export interface RabbitRPCConfig {
    exchange?: string;
    routingKey?: string;
    queue?: string;
    [key: string]: any;
  }

  export function RabbitRPC(config: RabbitRPCConfig): MethodDecorator;

  export function RabbitSubscribe(config: any): MethodDecorator;
}


