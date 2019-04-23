import { IDataStore, SubscriptionHandler, DataSubscription } from '.'
import { Azarasi } from '..'

/**
 * In-memory data store
 * 
 * Doesn't support sharding (at least for now)
 */
export class MemoryDataStore implements IDataStore {
  /**
   * Underlying store
   * @hidden
   */
  private db : Map<string, string>
  /**
   * Azarasi instance
   * @hidden
   */
  private readonly az : Azarasi
  /**
   * Data Subscriptions
   * @hidden
   */
  private subscriptions : DataSubscription[] = []

  connected : boolean = false
  ready : boolean = false

  /**
   * Instantiate new in-memory data store
   * @param az - Azarasi instance
   * @hidden
   */
  constructor (az : Azarasi) {
    this.az = az
    this.db = new Map<string, string>()
    az.logError("You're using the in-memory data store.")
    az.logError('No data will be saved at all!')
    az.logError('Additionally, shards might be out of sync.')
  }

  async connect () {
    this.connected = true
    this.ready = true
  }

  /**
   * Handle key update
   * @param key - Key
   * @param val - Value
   * @hidden
   */
  private handleUpdate (key : string, val : any) {
    this.subscriptions
      .filter(s => s.key === key)
      .forEach(s => s.handler(val))
  }

  ensureReady () {
    return Promise.resolve()
  }

  async get (key : string) {
    return JSON.parse(this.db.get(key) || 'null')
  }

  async set (key : string, val : any) {
    this.db.set(key, JSON.stringify(val))
    this.handleUpdate(key, val)
    return 'OK'
  }

  async del (key : string) {
    return this.db.delete(key) ? 'OK' : 'ERROR'
  }

  async subscribe (key : string, handler : SubscriptionHandler) : Promise<DataSubscription> {
    const sub = new DataSubscription(key, handler)
    sub.off = () => this.subscriptions.splice(this.subscriptions.indexOf(sub, 1))
    this.subscriptions.push(sub)
    return sub
  }
}

