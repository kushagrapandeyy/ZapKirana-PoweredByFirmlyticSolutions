import { Injectable, Logger } from '@nestjs/common';
import { Redis } from '@upstash/redis';

@Injectable()
export class CacheService {
  private readonly redis: Redis;
  private readonly logger = new Logger(CacheService.name);

  constructor() {
    this.redis = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    try {
      const data = await this.redis.get<T>(key);
      return data;
    } catch (error) {
      this.logger.error(`Error getting key ${key} from Redis`, error);
      return null;
    }
  }

  async set(key: string, value: any, ttlSeconds?: number): Promise<void> {
    try {
      if (ttlSeconds) {
        await this.redis.set(key, value, { ex: ttlSeconds });
      } else {
        await this.redis.set(key, value);
      }
    } catch (error) {
      this.logger.error(`Error setting key ${key} in Redis`, error);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(key);
    } catch (error) {
      this.logger.error(`Error deleting key ${key} from Redis`, error);
    }
  }

  async setAdd(key: string, ...members: string[]): Promise<void> {
    try {
      if (members.length === 0) return;
      await this.redis.sadd(key, members[0], ...members.slice(1));
    } catch (error) {
      this.logger.error(`Error adding to set ${key}`, error);
    }
  }

  async setRemove(key: string, ...members: string[]): Promise<void> {
    try {
      await this.redis.srem(key, ...members);
    } catch (error) {
      this.logger.error(`Error removing from set ${key}`, error);
    }
  }

  async setMembers(key: string): Promise<string[]> {
    try {
      return await this.redis.smembers(key);
    } catch (error) {
      this.logger.error(`Error getting set members for ${key}`, error);
      return [];
    }
  }

  async clearPrefix(prefix: string): Promise<void> {
    try {
      let cursor = 0;
      do {
        const result = await this.redis.scan(cursor, { match: `${prefix}*`, count: 100 });
        cursor = Number(result[0]);
        const keys = result[1];
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } while (cursor !== 0);
    } catch (error) {
      this.logger.error(`Error clearing prefix ${prefix}`, error);
    }
  }
}
