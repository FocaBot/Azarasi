import { IDataStore, SubscriptionHandler, DataSubscription } from '.'
import { EventEmitter } from 'events'
import Redis from 'ioredis'
import Azarasi from '..'

/**
 * [Redis](https://redis.io/) Data Store
 * 
 * Recommended for large bots
 */
export class RedisDataStore implements IDataStore {
  /**
   * Underlying Redis connection
   * @hidden
   */
  private db : Redis.Redis
  /**
   * Redis connection for events
   * @hidden
   */
  private events : Redis.Redis
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
  /**
   * Internal event emitter
   * @hidden
   */
  private _emitter : EventEmitter = new EventEmitter()

  connected : boolean = false
  ready : boolean = false

  /**
   * Instantiate new Redis Data Store
   * @param az - Azarasi instance
   * @hidden
   */
  constructor (az : Azarasi) {
    this.az = az
    this.db = new Redis(this.az.properties.redisUrl || 'redis://127.0.0.1/1', {
      reconnectOnError: (e) => true,
      lazyConnect: true
    })
    this.events = this.db.duplicate()
  }

  async connect () {
    try {
      await this.db.connect()
      await this.events.connect()
      await this.events.subscribe('AzUpdate')
      this.events.on('message', (c : string, msg : string) => {
        if (c === 'AzUpdate') this.handleUpdate(msg)
      })
      this.connected = true
      this.ready = true
      this._emitter.emit('connected')
    } catch (e) {
      this.az.logError(e)
      process.exit(1)
    }
  }

  /**
   * Handle key update
   * @param key - Key
   * @param val - Value
   * @hidden
   */
  private handleUpdate (msg : string) {
    const { key, val } = JSON.parse(msg)
    this.subscriptions
      .filter(s => s.key === key)
      .forEach(s => s.handler(val))
  }

  ensureReady () {
    if (this.ready) return Promise.resolve()
    return new Promise(resolve => this._emitter.once('connected', () => resolve()))
  }

  async get (key : string) {
    await this.ensureReady()
    return JSON.parse(await this.db.get(key) || 'null')
  }

  async set (key : string, val : any) {
    await this.ensureReady()
    const result = await this.db.set(key, JSON.stringify(val))
    this.db.publish('AzUpdate', JSON.stringify({ key, val }))
      .catch((e) => { this.az.logError(e) })
    return result
  }

  async del (key : string) {
    await this.ensureReady()
    return this.db.del(key)
  }

  subscribe (key : string, handler : SubscriptionHandler) : DataSubscription {
    const sub = new DataSubscription(key, handler)
    sub.off = () => this.subscriptions.splice(this.subscriptions.indexOf(sub, 1))
    this.subscriptions.push(sub)
    return sub
  }
}

