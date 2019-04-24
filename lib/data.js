"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("./dataStores/redis");
const gun_1 = require("./dataStores/gun");
const couchdb_1 = require("./dataStores/couchdb");
const memory_1 = require("./dataStores/memory");
/**
 * Returns the appropriate data store depending on the configuration.
 * @param az - Azarasi instance
 * @constructor
 * @hidden
 */
function GetDataStore(az) {
    let dataStore;
    switch (az.properties.dataStore) {
        case 'redis':
            dataStore = new redis_1.RedisDataStore(az);
            break;
        case 'gun':
            dataStore = new gun_1.GunDataStore(az);
            break;
        case 'couchdb':
            dataStore = new couchdb_1.CouchDataStore(az);
            break;
        case 'memory':
        case undefined:
        case null:
            dataStore = new memory_1.MemoryDataStore(az);
            break;
        default:
            throw new Error('Invalid data store requested.');
    }
    dataStore.connect().catch(e => {
        az.logError('Data store backend returned an error: ', e.message);
        process.exit(1);
    });
    return dataStore;
}
exports.default = GetDataStore;
//# sourceMappingURL=data.js.map