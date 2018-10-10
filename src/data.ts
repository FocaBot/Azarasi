import { IDataStore } from './dataStores'
import { RedisDataStore } from './dataStores/redis'
import { GunDataStore } from './dataStores/gun'
import { MemoryDataStore } from './dataStores/memory'
import { Azarasi } from '.'

export default function GetDataStore(az : Azarasi) : IDataStore {
  let dataStore : IDataStore
  
  switch (az.properties.dataStore) {
    case 'redis':
      dataStore = new RedisDataStore(az)
    case 'gun':
    case undefined:
    case null:
      dataStore = new GunDataStore(az)
    case 'memory':
      dataStore = new MemoryDataStore(az)
    default:
      throw new Error('Invalid data store requested.')
  }

  dataStore.connect()
  return dataStore
}
