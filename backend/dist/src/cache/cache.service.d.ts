export declare class CacheService {
    private readonly redis;
    private readonly logger;
    constructor();
    get<T>(key: string): Promise<T | null>;
    set(key: string, value: any, ttlSeconds?: number): Promise<void>;
    delete(key: string): Promise<void>;
    setAdd(key: string, ...members: string[]): Promise<void>;
    setRemove(key: string, ...members: string[]): Promise<void>;
    setMembers(key: string): Promise<string[]>;
    clearPrefix(prefix: string): Promise<void>;
}
