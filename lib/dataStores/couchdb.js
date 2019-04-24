"use strict";
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const _1 = require(".");
const events_1 = require("events");
const Nano = __importStar(require("nano"));
/**
 * [CouchDB](http://couchdb.apache.org/) data store.
 */
class CouchDataStore {
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
        // Server Scope
        this.nano = Nano.default({
            url: this.az.properties.couchdbUrl || 'http://127.0.0.1:5984',
            log(id, args) {
                az.logDebug(id, args);
            }
        });
        // Document scope
        this.db = this.nano.db.use(this.az.properties.couchdbDatabase || 'azarasi');
    }
    async connect() {
        try {
            // Check if database exists
            const dbInfo = this.nano.db.get(this.az.properties.couchdbDatabase || 'azarasi');
        }
        catch (e) {
            if (e.headers && e.headers.statusCode === 404) {
                // Create database
                this.nano.db.create(this.az.properties.couchdbDatabase || 'azarasi');
            }
            else {
                throw e;
            }
        }
        // Connect to change feed
        //@ts-ignore
        this.feed = this.nano.db.follow(this.az.properties.couchdbDatabase || 'azarasi', {
            since: 'now',
            include_docs: true
        });
        this.feed.on('change', change => {
            this.az.logDebug('DB Change:', change);
            const doc = change.doc;
            this.subscriptions
                .filter(s => s.key === doc._id)
                .forEach(s => s.handler(doc.val));
        });
        //@ts-ignore
        this.feed.follow();
    }
    ensureReady() {
        if (this.ready)
            return Promise.resolve();
        return new Promise(resolve => this._emitter.once('connected', () => resolve()));
    }
    async get(key, raw = false) {
        await this.ensureReady();
        try {
            const doc = await this.db.get(key);
            return raw ? doc : doc.val;
        }
        catch (e) {
            return raw ? { val: null } : null;
        }
    }
    async set(key, val) {
        await this.ensureReady();
        const orig = await this.get(key, true);
        await this.db.insert(Object.assign({}, orig, { val }));
        return 'OK';
    }
    async del(key) {
        const orig = await this.get(key, true);
        await this.db.destroy(key, orig._rev);
        return 'OK';
    }
    async subscribe(key, handler) {
        await this.ensureReady();
        const sub = new _1.DataSubscription(key, handler);
        sub.off = () => this.subscriptions.splice(this.subscriptions.indexOf(sub, 1));
        this.subscriptions.push(sub);
        return sub;
    }
}
exports.CouchDataStore = CouchDataStore;
//# sourceMappingURL=couchdb.js.map