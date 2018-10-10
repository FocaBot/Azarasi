// This file is a fucking disaster tbh
import { IDataStore, SubscriptionHandler, DataSubscription } from '.'
import { EventEmitter } from 'events'
import http from 'http'
import { Azarasi } from '..'

/**
 * Hacky stuff
 * @hidden
 */
const log = console.log
console.log = () => {}

process.env.GUN_ENV = 'production'
// @ts-ignore
import Gun from 'gun'
import { reject } from 'bluebird';
Gun.log.off = true
console.log = log

/**
 * [Gun](http://gun.js.org/) Data Store
 * 
 * **NOT RECOMMENDED FOR LARGE BOTS**
 */
export class GunDataStore implements IDataStore {
  /**
   * Underlying Gun instance
   * @hidden
   */
  private db : any
  /**
   * Azarasi instance
   * @hidden
   */
  private readonly az : Azarasi
  /**
   * Internal event emitter
   * @hidden
   */
  private _emitter : EventEmitter = new EventEmitter()

  connected : boolean = false
  ready : boolean = false

  /**
   * Instantiate new Gun Data Store
   * @param az - Azarasi instance
   * @hidden
   */
  constructor (az : Azarasi) {
    this.az = az
  }

  /**
   * Create Gun server
   * @hidden
   */
  createServer () {
    const port = this.az.properties.dbPort || 12920
    const file = this.az.properties.dbFile || 'data.db'

    return new Promise((resolve, reject) => {
      // Create HTTP server
      const server = http.createServer((req, res) => {
        if (req && req.url && req.url.indexOf('gun') >= 0) return
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
""""""""""""""""""""""""`))
        res.end()
      })
      // Listen on specified port
      server.listen(port, '127.0.0.1', 511, () => {
        resolve(server)
      }).on('error', reject)
    })
    // Attach Gun endpoint
    .then(srv => new Gun({ web: srv, file }))
    .catch(e => {
      if (e.code === 'EADDRINUSE') return new Gun({ peers: [`http://127.0.0.1:${port}/gun`], file })
    })
    .catch(e => {
      this.az.logError(`The port ${port} is in use by another process.`)
      process.exit(1)
    })
  }

  async connect () {
    try {
      this.db = await this.createServer()
      this.connected = true
      this.ready = true
      this._emitter.emit('connected')
    } catch (e) {
      this.az.logError(e)
      process.exit(1)
    }
  }

  ensureReady () {
    if (this.ready) return Promise.resolve()
    return new Promise(resolve => this._emitter.once('connected', () => resolve()))
  }

  async get (key : string) {
    await this.ensureReady()
    return new Promise(resolve => {
      this.db.get(key).get('val').once((v? : string) => resolve(JSON.parse(v || 'null')))
    })
  }

  async set (key : string, val : any) {
    await this.ensureReady()
    return new Promise((resolve, reject) => {
      //@ts-ignore
      this.db.get(key).put({ val: JSON.stringify(val) }, ({ err }) => err == null ? resolve('OK') : reject(err))
    })
  }

  async del (key : string) {
    await this.ensureReady()
    return this.set(key, null)
  }

  subscribe (key : string, handler : SubscriptionHandler) : DataSubscription {
    const sub = new DataSubscription(key, handler)
    const gsub = this.db.get(key).path('val').on((data : string) => sub.handler(JSON.parse(data || 'null')))
    sub.off = () => gsub.off()
    return sub
  }
}

