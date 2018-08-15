import { IDataStore, SubscriptionHandler, DataSubscription } from '.';
import { Azarasi } from '..';
/**
 * [Redis](https://redis.io/) Data Store
 *
 * Recommended for large bots
 */
export declare class RedisDataStore implements IDataStore {
    /**
     * Underlying Redis connection
     * @hidden
     */
    private db;
    /**
     * Redis connection for events
     * @hidden
     */
    private events;
    /**
     * Azarasi instance
     * @hidden
     */
    private readonly az;
    /**
     * Data Subscriptions
     * @hidden
     */
    private subscriptions;
    /**
     * Internal event emitter
     * @hidden
     */
    private _emitter;
    connected: boolean;
    ready: boolean;
    /**
     * Instantiate new Redis Data Store
     * @param az - Azarasi instance
     * @hidden
     */
    constructor(az: Azarasi);
    connect(): Promise<void>;
    /**
     * Handle key update
     * @param key - Key
     * @param val - Value
     * @hidden
     */
    private handleUpdate;
    ensureReady(): Promise<void> | Promise<{}>;
    get(key: string): Promise<any>;
    set(key: string, val: any): Promise<any>;
    del(key: string): Promise<any>;
    subscribe(key: string, handler: SubscriptionHandler): DataSubscription;
}
