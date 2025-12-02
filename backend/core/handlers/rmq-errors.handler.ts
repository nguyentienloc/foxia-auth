import { Channel, ConsumeMessage } from 'amqplib';
import StringUtils from '../utils/StringUtils';

export const DEFAULT_RMQ_ERROR_EXCHANGE = 'rmq-errors';
export const DEFAULT_RMQ_ERROR_ROUTING_KEY = 'rmq-errors';
export const DEFAULT_RMQ_ERROR_QUEUE = 'rmq-errors-queue';
export const DEFAULT_RMQ_ERROR_ATTEMPTS = 5

export interface IRmqErrorMessage {
  exchange: string;
  routingKey: string;
  content: string;
  error: any;
  queue: string;
}

export async function rmqErrorsHandler(
  channel: Channel,
  msg: ConsumeMessage,
  error: any,
) {
  console.log('message error', {
    queue: msg.fields.routingKey,
    content: msg.content.toString(),
    error: StringUtils.getString(error),
  });
  let { exchange, routingKey } = msg.fields;
  const queue = !exchange ? routingKey : undefined;
  if (queue) {
    exchange = undefined;
    routingKey = undefined;
  }
  const message: IRmqErrorMessage = {
    queue,
    exchange,
    routingKey,
    content: msg.content.toString(),
    error: StringUtils.getString(error),
  };

  channel.publish(
    DEFAULT_RMQ_ERROR_EXCHANGE,
    DEFAULT_RMQ_ERROR_ROUTING_KEY,
    Buffer.from(JSON.stringify(message)),
  );

  channel.nack(msg, false, false);
}
