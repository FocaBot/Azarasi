import { IDataStore } from './dataStores'
import { RedisDataStore } from './dataStores/redis'
import { GunDataStore } from './dataStores/gun'
import { MemoryDataStore } from './dataStores/memory'
import { Azarasi } from '.'

export default function GetDataStore(az : Azarasi) : IDataStore {
  switch (az.properties.dataStore) {
    case 'redis':
      return new RedisDataStore(az)
    case 'gun':
    case undefined:
    case null:
      return new GunDataStore(az)
    case 'memory':
      return new MemoryDataStore(az)
    default:
      throw new Error('Invalid data store requested.')
  }
}
