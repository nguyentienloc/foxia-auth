import type { DynamicModule } from '@nestjs/common';

// Thin wrapper around '@golevelup/nestjs-rabbitmq' to avoid TypeScript
// type issues with missing named exports in the library typings.
// We intentionally treat the underlying module as `any` and re-export
// the members we actually use.
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-unsafe-assignment
const rabbitLib: any = require('@golevelup/nestjs-rabbitmq');

export const RabbitMQModule: {
  forRoot: (moduleRef: any, options: any) => DynamicModule;
  forRootAsync: (moduleRef: any, options: any) => DynamicModule;
} = rabbitLib.RabbitMQModule;

export const RabbitRPC: (config: any) => MethodDecorator = rabbitLib.RabbitRPC;

export const RabbitSubscribe: (config: any) => MethodDecorator =
  rabbitLib.RabbitSubscribe;


