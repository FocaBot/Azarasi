"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const redis_1 = require("./dataStores/redis");
const gun_1 = require("./dataStores/gun");
const memory_1 = require("./dataStores/memory");
function GetDataStore(az) {
    switch (az.properties.dataStore) {
        case 'redis':
            return new redis_1.RedisDataStore(az);
        case 'gun':
        case undefined:
        case null:
            return new gun_1.GunDataStore(az);
        case 'memory':
            return new memory_1.MemoryDataStore(az);
        default:
            throw new Error('Invalid data store requested.');
    }
}
exports.default = GetDataStore;
//# sourceMappingURL=data.js.map