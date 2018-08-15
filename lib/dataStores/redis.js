"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const events_1 = require("events");
const ioredis_1 = __importDefault(require("ioredis"));
/**
 * [Redis](https://redis.io/) Data Store
 *
 * Recommended for large bots
 */
class RedisDataStore {
    /**
     * Instantiate new Redis Data Store
     * @param az - Azarasi instance
     * @hidden
     */
    constructor(az) {
        /**
         * Data Subscriptions
         * @hidden
         */
        this.subscriptions = [];
        /**
         * Internal event emitter
         * @hidden
         */
        this._emitter = new events_1.EventEmitter();
        this.connected = false;
        this.ready = false;
        this.az = az;
        this.db = new ioredis_1.default(this.az.properties.redisUrl || 'redis://127.0.0.1/1', {
            reconnectOnError: (e) => true,
            lazyConnect: true
        });
        this.events = this.db.duplicate();
    }
    async connect() {
        try {
            await this.db.connect();
            await this.events.connect();
            await this.events.subscribe('AzUpdate');
            this.events.on('message', (c, msg) => {
                if (c === 'AzUpdate')
                    this.handleUpdate(msg);
            });
            this.connected = true;
            this.ready = true;
            this._emitter.emit('connected');
        }
        catch (e) {
            this.az.logError(e);
            process.exit(1);
        }
    }
    /**
     * Handle key update
     * @param key - Key
     * @param val - Value
     * @hidden
     */
    handleUpdate(msg) {
        const { key, val } = JSON.parse(msg);
        this.subscriptions
            .filter(s => s.key === key)
            .forEach(s => s.handler(val));
    }
    ensureReady() {
        if (this.ready)
            return Promise.resolve();
        return new Promise(resolve => this._emitter.once('connected', () => resolve()));
    }
    async get(key) {
        await this.ensureReady();
        return JSON.parse(await this.db.get(key) || 'null');
    }
    async set(key, val) {
        await this.ensureReady();
        const result = await this.db.set(key, JSON.stringify(val));
        this.db.publish('AzUpdate', JSON.stringify({ key, val }))
            .catch((e) => { this.az.logError(e); });
        return result;
    }
    async del(key) {
        await this.ensureReady();
        return this.db.del(key);
    }
    subscribe(key, handler) {
        const sub = new _1.DataSubscription(key, handler);
        sub.off = () => this.subscriptions.splice(this.subscriptions.indexOf(sub, 1));
        this.subscriptions.push(sub);
        return sub;
    }
}
exports.RedisDataStore = RedisDataStore;
//# sourceMappingURL=redis.js.map