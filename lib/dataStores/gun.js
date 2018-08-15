"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// This file is a fucking disaster tbh
const _1 = require(".");
const events_1 = require("events");
const http_1 = __importDefault(require("http"));
/**
 * Hacky stuff
 * @hidden
 */
const log = console.log;
console.log = () => { };
process.env.GUN_ENV = 'production';
// @ts-ignore
const gun_1 = __importDefault(require("gun"));
gun_1.default.log.off = true;
console.log = log;
/**
 * [Gun](http://gun.js.org/) Data Store
 *
 * **NOT RECOMMENDED FOR LARGE BOTS**
 */
class GunDataStore {
    /**
     * Instantiate new Gun Data Store
     * @param az - Azarasi instance
     * @hidden
     */
    constructor(az) {
        /**
         * Internal event emitter
         * @hidden
         */
        this._emitter = new events_1.EventEmitter();
        this.connected = false;
        this.ready = false;
        this.az = az;
    }
    /**
     * Create Gun server
     * @hidden
     */
    createServer() {
        const port = this.az.properties.dbPort || 12920;
        const file = this.az.properties.dbFile || 'data.db';
        return new Promise((resolve, reject) => {
            // Create HTTP server
            const server = http_1.default.createServer((req, res) => {
                if (req && req.url && req.url.indexOf('gun') >= 0)
                    return;
                res.write(new Buffer(`
       .-.
      :   ;
       "."
       / \\
      /  |     ///////////////////
    .'    \\    // HERE BE SEALS //
   /.'   \`.\\   ///////////////////
   ' \\    \`\`.
     _\`.____ \`-._
    /^^^^^^^^\`.\\^\\
   /           \`  \\
""""""""""""""""""""""""`));
                res.end();
            });
            // Listen on specified port
            server.listen(port, '127.0.0.1', 511, () => {
                resolve(server);
            }).on('error', reject);
        })
            // Attach Gun endpoint
            .then(srv => new gun_1.default({ web: srv, file }))
            .catch(e => {
            if (e.code === 'EADDRINUSE')
                return new gun_1.default({ peers: [`http://127.0.0.1:${port}/gun`], file });
        })
            .catch(e => {
            this.az.logError(`The port ${port} is in use by another process.`);
            process.exit(1);
        });
    }
    async connect() {
        try {
            this.db = await this.createServer();
            this.connected = true;
            this.ready = true;
            this._emitter.emit('connected');
        }
        catch (e) {
            this.az.logError(e);
            process.exit(1);
        }
    }
    ensureReady() {
        if (this.ready)
            return Promise.resolve();
        return new Promise(resolve => this._emitter.once('connected', () => resolve()));
    }
    async get(key) {
        await this.ensureReady();
        return new Promise(resolve => {
            this.db.get(key).path('val').val((v) => resolve(JSON.parse(v || 'null')));
        });
    }
    async set(key, val) {
        await this.ensureReady();
        return new Promise((resolve, reject) => {
            //@ts-ignore
            this.db.get(key).put({ val: JSON.stringify(val) }, ({ err }) => err == null ? resolve('OK') : reject(err));
        });
    }
    async del(key) {
        await this.ensureReady();
        return this.set(key, null);
    }
    subscribe(key, handler) {
        const sub = new _1.DataSubscription(key, handler);
        const gsub = this.db.get(key).path('val').on((data) => sub.handler(JSON.parse(data || 'null')));
        sub.off = () => gsub.off();
        return sub;
    }
}
exports.GunDataStore = GunDataStore;
//# sourceMappingURL=gun.js.map