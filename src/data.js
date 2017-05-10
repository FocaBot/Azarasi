const EventEmitter = require('events')
const Redis = require('ioredis')
const _cache = {}
const _subscribed = []

/**
 * Global Data Store.
 *
 * Uses Redis when available, and falls back to in-memory cache when not
 */
class DataStore extends EventEmitter {
  constructor () {
    super()
    /**
     * Is the redis connection active?
     * @type {boolean}
     */
    this.connected = false
    this.ready = false
    /**
     * ioredis object.
     *
     * Don't use this directly unless necessary
     */
    this.redis = new Redis(Core.properties.redisURL || 'redis://127.0.0.1/1', {
      stringNumbers: true,
      enableOfflineQueue: false
    })
    /**
     * Another ioredis object, this one used to subscribe to channels
     *
     * Don't use this directly unless necessary
     */
    this.subscriber = new Redis(Core.properties.redisURL || 'redis://127.0.0.1/1', {
      enableOfflineQueue: false
    })
    this.redis.on('ready', () => {
      this.connected = true
      this.ready = true
      this.emit('connected')
    })
    this.redis.once('error', () => {
      if (this.connected) return
      this.ready = true
      this.emit('fallback')
      // Log a little message
      Core.log(
        "WARNING: Couldn't connect to a Redis server, no data will be saved to disk."
      , 2)
    })
    this.redis.on('error', () => {
      // empty handler
    })
    this.subscriber.on('error', () => {
      // empty handler
    })
    this.subscriber.on('message', (channel, message) => {
      this.emit('message', channel, JSON.parse(message))
    })
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
      this.once('fallback', () => resolve())
    })
  }

  /**
   * Gets an object by its key
   * @param {string} key - Key to find
   * @returns {object}
   */
  async get (key) {
    await this.ensureReady()
    if (this.connected) {
      return JSON.parse(await this.redis.get(key))
    } else {
      return JSON.parse(_cache[key] || null)
    }
  }

  /**
   * Sets the value of a key
   * NOTE: Objects get converted to JSON before saving
   * @param {string} key - Key to set
   * @param {object} value - New value
   * @param {number} exp - Time before expiration (seconds)
   */
  async set (key, value, exp) {
    const v = JSON.stringify(value)
    await this.ensureReady()
    if (this.connected) {
      return exp ? await this.redis.set(key, v, 'EX', exp) : await this.redis.set(key, v)
    } else {
      _cache[key] = v
      // Set a timeout for expiration
      if (exp) {
        setTimeout(() => {
          delete _cache[key]
        }, exp * 1000)
      }
      return 'OK'
    }
  }

  /**
   * Deletes a key
   * @param {string} key - Key to delete
   */
  async del (key) {
    await this.ensureReady()
    if (this.connected) {
      return await this.redis.del(key)
    } else {
      delete _cache[key]
      return 'OK'
    }
  }

  /**
   * Subscribes to a channel
   * @param {string} name - Channel name
   */
  async subscribe (name) {
    await this.ensureReady()
    if (this.connected) {
      return await this.subscriber.subscribe(name)
    } else {
      if (_subscribed.indexOf(name) < 0) _subscribed.push(name)
    }
  }

  /**
   * Unsubscribes from a channel
   * @param {string} name - Channel name
   */
  async unsubscribe (name) {
    await this.ensureReady()
    if (this.connected) {
      return await this.subscriber.unsubscribe(name)
    } else {
      if (_subscribed.indexOf(name) >= 0) _subscribed.splice(_subscribed.indexOf(name), 1)
    }
  }

  /**
   * Publishes a message to a channel
   * @param {string} channel - Channel name
   * @param {object} message - Message to send
   */
  async publish (channel, message) {
    await this.ensureReady()
    if (this.connected) {
      return await this.redis.publish(channel, JSON.stringify(message))
    } else if (_subscribed.indexOf(channel) >= 0) {
      this.emit('message', channel, JSON.parse(JSON.stringify(message)))
    }
  }
}

module.exports = DataStore
