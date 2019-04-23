"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
/**
 * In-memory data store
 *
 * Doesn't support sharding (at least for now)
 */
class MemoryDataStore {
    /**
     * Instantiate new in-memory data store
     * @param az - Azarasi instance
     * @hidden
     */
    constructor(az) {
        /**
         * Data Subscriptions
         * @hidden
         */
        this.subscriptions = [];
        this.connected = false;
        this.ready = false;
        this.az = az;
        this.db = new Map();
        az.logError("You're using the in-memory data store.");
        az.logError('No data will be saved at all!');
        az.logError('Additionally, shards might be out of sync.');
    }
    async connect() {
        this.connected = true;
        this.ready = true;
    }
    /**
     * Handle key update
     * @param key - Key
     * @param val - Value
     * @hidden
     */
    handleUpdate(key, val) {
        this.subscriptions
            .filter(s => s.key === key)
            .forEach(s => s.handler(val));
    }
    ensureReady() {
        return Promise.resolve();
    }
    async get(key) {
        return JSON.parse(this.db.get(key) || 'null');
    }
    async set(key, val) {
        this.db.set(key, JSON.stringify(val));
        this.handleUpdate(key, val);
        return 'OK';
    }
    async del(key) {
        return this.db.delete(key) ? 'OK' : 'ERROR';
    }
    async subscribe(key, handler) {
        const sub = new _1.DataSubscription(key, handler);
        sub.off = () => this.subscriptions.splice(this.subscriptions.indexOf(sub, 1));
        this.subscriptions.push(sub);
        return sub;
    }
}
exports.MemoryDataStore = MemoryDataStore;
//# sourceMappingURL=memory.js.map