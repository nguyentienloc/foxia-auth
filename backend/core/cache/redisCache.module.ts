import {Global, Module} from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import * as redisStore from 'cache-manager-redis-store';
import {RedisCacheService} from './services/redisCache.service';

@Global()
@Module({
  imports: [
    CacheModule.registerAsync({
      imports: [],
      inject: [],
      isGlobal: true,
      useFactory: async () => ({
        isGlobal: true,
        store: redisStore,
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        auth_pass: process.env.REDIS_PASSWORD || undefined,
        db: 1,
        tls: process.env.REDIS_SSL ? {} : undefined,
        keyPrefix: `zs-crm-core-cache-${process.env.REDIS_DB}`,
      }),
    }),
  ],
  providers: [RedisCacheService],
  exports: [RedisCacheService],
})
export class RedisCacheModule {
}