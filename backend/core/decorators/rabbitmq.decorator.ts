import { RabbitRPC, RabbitSubscribe } from 'core/rabbitmq';
import { RabbitHandlerConfig } from '@golevelup/nestjs-rabbitmq/lib/rabbitmq.interfaces';
import { IdentityExchange } from 'core/interfaces/rmq-exchanges.interface';

export type Exchanges = IdentityExchange;

export function IRabbitRPC<
  E extends keyof Exchanges,
  R extends keyof Exchanges[E],
  P extends Exchanges[E][R],
  T extends Pick<
    RabbitHandlerConfig,
    | 'queue'
    | 'createQueueIfNotExists'
    | 'assertQueueErrorHandler'
    | 'queueOptions'
    | 'errorBehavior'
    | 'errorHandler'
    | 'allowNonJsonMessages'
  >,
>(exchange: E, routingKey: R, configs: T) {
  return (
    target: any,
    propertyKey?: string | symbol | undefined,
    descriptor?: TypedPropertyDescriptor<(payload: P, ...rest: any) => any>,
  ): void => {
    const originalHandler = descriptor.value!;
    descriptor.value = function (this: any, payload: P, ...inputs: any) {
      return originalHandler.apply(this, [payload, ...inputs]);
    };
    RabbitRPC({ ...configs, routingKey: routingKey as string, exchange })(
      target,
      propertyKey,
      descriptor,
    );
  };
}
type RpcConfig = {
  [K in keyof Exchanges]: { exchange: K; routingKey: keyof Exchanges[K] };
}[keyof Exchanges];
export function TRabbitRPC<
  T extends Pick<
    RabbitHandlerConfig,
    | 'queue'
    | 'createQueueIfNotExists'
    | 'assertQueueErrorHandler'
    | 'queueOptions'
    | 'errorBehavior'
    | 'errorHandler'
    | 'allowNonJsonMessages'
  > &
    RpcConfig,
>(configs: T) {
  return <R extends any[]>(
    target: any,
    propertyKey?: string | symbol | undefined,
    descriptor?: TypedPropertyDescriptor<(...args: R) => any>,
  ): void => {
    RabbitRPC(configs)(target, propertyKey, descriptor);
  };
}
