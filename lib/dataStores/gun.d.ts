import { IDataStore, SubscriptionHandler, DataSubscription } from '.';
import { Azarasi } from '..';
/**
 * [Gun](http://gun.js.org/) Data Store
 *
 * **NOT RECOMMENDED FOR LARGE BOTS**
 */
export declare class GunDataStore implements IDataStore {
    /**
     * Underlying Gun instance
     * @hidden
     */
    private db;
    /**
     * Azarasi instance
     * @hidden
     */
    private readonly az;
    /**
     * Internal event emitter
     * @hidden
     */
    private _emitter;
    connected: boolean;
    ready: boolean;
    /**
     * Instantiate new Gun Data Store
     * @param az - Azarasi instance
     * @hidden
     */
    constructor(az: Azarasi);
    /**
     * Create Gun server
     * @hidden
     */
    createServer(): Promise<any>;
    connect(): Promise<void>;
    ensureReady(): Promise<void> | Promise<{}>;
    get(key: string): Promise<{}>;
    set(key: string, val: any): Promise<{}>;
    del(key: string): Promise<{}>;
    subscribe(key: string, handler: SubscriptionHandler): DataSubscription;
}
