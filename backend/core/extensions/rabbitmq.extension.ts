import { Exchanges } from 'core/decorators/rabbitmq.decorator';
import { Options } from 'amqplib';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

declare module '@golevelup/nestjs-rabbitmq/lib/amqp/connection' {
  interface AmqpConnection {
    ipublish<T extends keyof Exchanges, R extends keyof Exchanges[T]>(
      exchange: T,
      routingKey: R,
      message: Exchanges[T][R],
      options?: Options.Publish,
    ): Promise<void>;
  }
}

AmqpConnection.prototype.ipublish = async function <
  T extends keyof Exchanges,
  R extends keyof Exchanges[T],
> (
  exchange: T,
  routingKey: R,
  message: Exchanges[T][R],
  options?: Options.Publish,
): Promise<void> {
  return await AmqpConnection.prototype.publish.apply(this, [exchange, routingKey, message, options]);
};
