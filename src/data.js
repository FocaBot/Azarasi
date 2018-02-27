const { EventEmitter } = require('events')
const Redis = require('ioredis')

/**
 * Standalone Data Store.
 *
 * Powered By GUN (http://gun.js.org/)
 * DON'T USE THIS ON LARGE BOTS
 */
class GunDataStore extends EventEmitter {
  constructor () {
    super()
    /**
     * Is the connection active?
     * @type {boolean}
     */
    this.connected = false
    this.ready = false
    this.connect()
  }

  async connect () {
    try {
      /**
       * Database object.
       *
       * Don't use this directly unless necessary
       */
      this.db = await require('./db').createServer()
      this.connected = true
      this.ready = true
      this.emit('connected')
    } catch (e) {
      Core.log(e, 2)
      process.exit(1)
    }
  }

  /**
   * Returns a Promise that resolves either when the Redis connection
   * or the fallback cache are ready
   * @return {Promise<Boolean>}
   */
  ensureReady () {
    if (this.ready) return Promise.resolve()
    return new Promise(resolve => {
      this.once('connected', () => resolve())
    })
  }

  /**
   * Gets an object by its key
   * @param {string} key - Key to find
   * @returns {object}
   */
  async get (key) {
    await this.ensureReady()
    return new Promise(resolve => {
      this.db.get(key).path('val').val(v => resolve(JSON.parse(v || null)))
    })
  }

  /**
   * Sets the value of a key
   * NOTE: Objects get converted to JSON before saving
   * @param {string} key - Key to set
   * @param {object} val - New value
   */
  async set (key, val) {
    await this.ensureReady()
    return new Promise((resolve, reject) => {
      this.db.get(key).put({ val: JSON.stringify(val) }, ({ err }) => err == null ? resolve('OK') : reject(err))
    })
  }

  /**
   * Deletes a key
   * @param {string} key - Key to delete
   */
  async del (key) {
    await this.ensureReady()
    return this.set(key, null)
  }

  /**
   * Subscribes to a key and listens for changes
   * @param {string} key - Key
   * @param {function} handler - Event handler
   * @return {Gun} - Gun chain
   */
  subscribe (key, handler) {
    this.db.get(key).path('val').on(data => handler(JSON.parse(data || null)))
  }
}

class RedisDataStore extends EventEmitter {
  constructor () {
    super()
    /**
     * Is the connection active?
     * @type {boolean}
     */
    this.connected = false
    this.ready = false
    this.subscriptions = []
    this.connect()
  }

  async connect () {
    try {
      /**
       * Database object.
       *
       * Don't use this directly unless necessary
       */
      this.db = this.events = new Redis(Core.properties.redisURL || 'redis://127.0.0.1/1', {
        reconnectOnError: true,
        lazyConnect: true
      })
      this.events = this.db.duplicate()
      await this.db.connect()
      await this.events.connect()
      await this.events.subscribe('AzUpdate')
      this.events.on('message', (c, msg) => {
        if (c === 'AzUpdate') {
          const { key, val } = JSON.parse(msg)
          this.subscriptions
            .filter(s => s.key === key)
            .forEach(s => s.handler(val))
        }
      })
      this.connected = true
      this.ready = true
      this.emit('connected')
    } catch (e) {
      Core.log(e, 2)
      process.exit(1)
    }
  }

  /**
   * Returns a Promise that resolves either when the Redis connection
   * or the fallback cache are ready
   * @return {Promise<Boolean>}
   */
  ensureReady () {
    if (this.ready) return Promise.resolve()
    return new Promise(resolve => {
      this.once('connected', () => resolve())
    })
  }

  /**
   * Gets an object by its key
   * @param {string} key - Key to find
   * @returns {object}
   */
  async get (key) {
    await this.ensureReady()
    return JSON.parse(await this.db.get(key))
  }

  /**
   * Sets the value of a key
   * @param {string} key - Key to set
   * @param {object} val - New value
   */
  async set (key, val) {
    await this.ensureReady()
    const result = await this.db.set(key, JSON.stringify(val))
    this.db.publish('AzUpdate', JSON.stringify({ key, val }))
      .catch((e) => { Core.log(e, 2) })
    return result
  }

  /**
   * Deletes a key
   * @param {string} key - Key to delete
   */
  async del (key) {
    await this.ensureReady()
    return this.db.del(key)
  }

  /**
   * Subscribes to a key and listens for changes
   * @param {string} key - Key
   * @param {function} handler - Event handler
   */
  subscribe (key, handler) {
    const sub = { key, handler }
    sub.off = () => this.subscriptions.splice(this.subscriptions.indexOf(sub, 1))
    this.subscriptions.push(sub)
    return sub
  }
}

module.exports = { GunDataStore, RedisDataStore }
