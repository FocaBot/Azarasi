import { IDataStore } from './dataStores'
import { RedisDataStore } from './dataStores/redis'
import { GunDataStore } from './dataStores/gun'
import { MemoryDataStore } from './dataStores/memory'
import { Azarasi } from '.'

/**
 * Returns the appropriate data store depending on the configuration.
 * @param az - Azarasi instance
 * @constructor
 * @hidden
 */
export default function GetDataStore(az : Azarasi) : IDataStore {
  let dataStore : IDataStore

  switch (az.properties.dataStore) {
    case 'redis':
      dataStore = new RedisDataStore(az)
      break
    case 'gun':
    case undefined:
    case null:
      dataStore = new GunDataStore(az)
      break
    case 'memory':
      dataStore = new MemoryDataStore(az)
      break
    default:
      throw new Error('Invalid data store requested.')
  }

  dataStore.connect()
  return dataStore
}
