import { IDataStore, SubscriptionHandler, DataSubscription } from '.';
import { Azarasi } from '..';
/**
 * [CouchDB](http://couchdb.apache.org/) data store.
 */
export declare class CouchDataStore implements IDataStore {
    /**
     * Nano server scope
     * @hidden
     */
    private nano;
    /**
     * Database scope
     * @hidden
     */
    private db;
    /**
     * Follow feed
     * @hidden
     */
    private feed;
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
    ensureReady(): Promise<void> | Promise<{}>;
    get(key: string, raw?: boolean): Promise<any>;
    set(key: string, val: any): Promise<string>;
    del(key: string): Promise<string>;
    subscribe(key: string, handler: SubscriptionHandler): Promise<DataSubscription>;
}
export interface DataStructure {
    _id: string;
    _rev: string;
    val: any;
}
