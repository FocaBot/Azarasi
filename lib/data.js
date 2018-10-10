"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("./dataStores/redis");
const gun_1 = require("./dataStores/gun");
const memory_1 = require("./dataStores/memory");
function GetDataStore(az) {
    let dataStore;
    switch (az.properties.dataStore) {
        case 'redis':
            dataStore = new redis_1.RedisDataStore(az);
            break;
        case 'gun':
        case undefined:
        case null:
            dataStore = new gun_1.GunDataStore(az);
            break;
        case 'memory':
            dataStore = new memory_1.MemoryDataStore(az);
            break;
        default:
            throw new Error('Invalid data store requested.');
    }
    dataStore.connect();
    return dataStore;
}
exports.default = GetDataStore;
//# sourceMappingURL=data.js.map