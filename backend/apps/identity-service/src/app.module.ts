import { RedisModule } from '@liaoliaots/nestjs-redis';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BaseAuthModule } from 'core/auth/auth.module';
import { identityConnection } from 'core/constants/database-connection.constant';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { OAuth2Module } from './modules/oauth2/oauth2.module';
import { RabbitMQModule } from 'core/rabbitmq';
import { getRmqHost } from 'core/utils';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath:
        'apps/identity-service/' +
        (process.env.NODE_ENV ? `.env.${process.env.NODE_ENV}` : '.env'),
    }),
    TypeOrmModule.forRoot({
      name: identityConnection,
      type: 'postgres',
      host: process.env.DATABASE_HOST,
      port: +process.env.DATABASE_PORT,
      extra:
        process.env.DATABASE_SSL === 'prefer'
          ? {
              max: 100,
              ssl: {
                rejectUnauthorized: false,
              },
            }
          : { max: 100 },
      username: process.env.DATABASE_USERNAME,
      password: process.env.DATABASE_PASSWORD,
      database: process.env.DATABASE_NAME,
      entities: [__dirname + '/entities/*.entity{.ts,.js}'],
      migrations: [__dirname + '/migrations/*{.js,.ts}'],
      logging: ['error'],
      // logging: true,
    }),
    BaseAuthModule.forRoot(),
    RedisModule.forRoot({
      readyLog: true,
      config: {
        password: process.env.REDIS_PASSWORD,
        db: Number(process.env.REDIS_DB_NUMBER),
        port: parseInt(process.env.REDIS_PORT),
        host: process.env.REDIS_HOST,
        tls: process.env.REDIS_SSL ? {} : undefined,
        enableTLSForSentinelMode: false,
        keyPrefix: `like-identity-cache-${process.env.REDIS_DB}`,
      },
    }),
    RabbitMQModule.forRootAsync(RabbitMQModule, {
      useFactory: () => ({
        registerHandlers:
          !process.env.CONSUMER || process.env.CONSUMER == 'true'
            ? true
            : false,
        exchanges: [
          {
            name: 'rmq-errors',
            type: 'direct',
          },
          {
            name: 'fms-kids-identity-exchange',
            type: 'direct',
          },
        ],
        queues: [
          {
            name: 'rmq-errors-queue',
            exchange: 'rmq-errors',
            routingKey: 'rmq-errors',
            queueOptions: {
              durable: true,
              deadLetterExchange: 'rmq-errors-dlx',
              deadLetterRoutingKey: 'rmq-errors-dlx',
            },
          },
        ],
        uri: getRmqHost(),
        prefetchCount: 20,
        connectionInitOptions: { wait: false },
        enableControllerDiscovery: true,
        // Thêm cấu hình error handling
        errorHandler: (channel, msg, error) => {
          console.error('RabbitMQ Error Handler:', {
            queue: msg.fields.routingKey,
            content: msg.content.toString(),
            error: error.message,
          });
          // Gửi message đến error queue
          const errorMessage = {
            queue: msg.fields.routingKey,
            exchange: msg.fields.exchange,
            routingKey: msg.fields.routingKey,
            content: msg.content.toString(),
            error: error.message,
          };
          channel.publish(
            'rmq-errors',
            'rmq-errors',
            Buffer.from(JSON.stringify(errorMessage)),
          );
          channel.nack(msg, false, false);
        },
      }),
    }),
    AuthModule,
    OAuth2Module,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
