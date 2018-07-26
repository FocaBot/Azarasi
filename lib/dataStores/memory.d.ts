import { IDataStore, SubscriptionHandler, DataSubscription } from '.';
import Azarasi from '..';
/**
 * In-memory data store
 *
 * Doesn't support sharding (at least for now)
 */
export declare class MemoryDataStore implements IDataStore {
    /**
     * Underlying store
     * @hidden
     */
    private db;
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
    connected: boolean;
    ready: boolean;
    /**
     * Instantiate new in-memory data store
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
    private handleUpdate(key, val);
    ensureReady(): Promise<void>;
    get(key: string): Promise<any>;
    set(key: string, val: any): Promise<string>;
    del(key: string): Promise<"OK" | "ERROR">;
    subscribe(key: string, handler: SubscriptionHandler): DataSubscription;
}
