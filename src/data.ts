import { IDataStore } from './dataStores'
import { RedisDataStore } from './dataStores/redis'
import { GunDataStore } from './dataStores/gun'
import { CouchDataStore } from './dataStores/couchdb'
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
      dataStore = new GunDataStore(az)
      break
    case 'couchdb':
      dataStore = new CouchDataStore(az)
      break
    case 'memory':
    case undefined:
    case null:
      dataStore = new MemoryDataStore(az)
      break
    default:
      throw new Error('Invalid data store requested.')
  }

  dataStore.connect().catch(e => {
    az.logError('Data store backend returned an error: ', e.message)
    process.exit(1)
  })
  return dataStore
}
