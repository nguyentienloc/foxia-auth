import { CACHE_MANAGER } from '@nestjs/cache-manager';
import {Inject, Injectable} from '@nestjs/common';
import {Cache, CachingConfig} from 'cache-manager';
import {isEmpty} from 'lodash';

@Injectable()
export class RedisCacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cacheManager: Cache) {
  }

  async get<T>(key: string): Promise<T> {
    try {
      return await this.cacheManager.get<T>(key);
    } catch (error) {
      console.log(`get ${key} in redis error`, error);
    }
    return;
  }

  async set<T>(key: string, value: any, options?: CachingConfig): Promise<T> {
    return this.cacheManager.set(key, value, options || {ttl: 0});
  }

  async del<T>(key: string): Promise<T> {
    try {
      if (isEmpty(key)) return;
      const result = this.cacheManager.del(key);
      return result;
    } catch (error) {
      console.log(`del ${key} in redis error`, error);
    }
    return;
  }

  async delWithPrefix<T>(prefix: string): Promise<T> {
    const keys = await this.cacheManager.store.keys('*' + prefix + '*');
    console.log('keys', keys, prefix)
    return await this.del(keys);
  }

  async getKeys(key?: string) {
    return await this.cacheManager.store.keys(key);
  }
}
