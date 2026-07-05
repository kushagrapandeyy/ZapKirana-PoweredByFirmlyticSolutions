"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var CacheService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CacheService = void 0;
const common_1 = require("@nestjs/common");
const redis_1 = require("@upstash/redis");
let CacheService = CacheService_1 = class CacheService {
    redis;
    logger = new common_1.Logger(CacheService_1.name);
    constructor() {
        this.redis = new redis_1.Redis({
            url: process.env.UPSTASH_REDIS_REST_URL,
            token: process.env.UPSTASH_REDIS_REST_TOKEN,
        });
    }
    async get(key) {
        try {
            const data = await this.redis.get(key);
            return data;
        }
        catch (error) {
            this.logger.error(`Error getting key ${key} from Redis`, error);
            return null;
        }
    }
    async set(key, value, ttlSeconds) {
        try {
            if (ttlSeconds) {
                await this.redis.set(key, value, { ex: ttlSeconds });
            }
            else {
                await this.redis.set(key, value);
            }
        }
        catch (error) {
            this.logger.error(`Error setting key ${key} in Redis`, error);
        }
    }
    async delete(key) {
        try {
            await this.redis.del(key);
        }
        catch (error) {
            this.logger.error(`Error deleting key ${key} from Redis`, error);
        }
    }
    async setAdd(key, ...members) {
        try {
            if (members.length === 0)
                return;
            await this.redis.sadd(key, members[0], ...members.slice(1));
        }
        catch (error) {
            this.logger.error(`Error adding to set ${key}`, error);
        }
    }
    async setRemove(key, ...members) {
        try {
            await this.redis.srem(key, ...members);
        }
        catch (error) {
            this.logger.error(`Error removing from set ${key}`, error);
        }
    }
    async setMembers(key) {
        try {
            return await this.redis.smembers(key);
        }
        catch (error) {
            this.logger.error(`Error getting set members for ${key}`, error);
            return [];
        }
    }
    async clearPrefix(prefix) {
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
        }
        catch (error) {
            this.logger.error(`Error clearing prefix ${prefix}`, error);
        }
    }
};
exports.CacheService = CacheService;
exports.CacheService = CacheService = CacheService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CacheService);
//# sourceMappingURL=cache.service.js.map