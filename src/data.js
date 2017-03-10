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
     * ioredis object
     *
     * Don't use this directly unless necessary.
     */
    this.redis = new Redis(Core.settings.redisURL || 'redis://127.0.0.1/1', {
      stringNumbers: true,
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
    this.redis.on('message', (channel, message) => {
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
  get (key) {
    return this.ensureReady()
    .then(() => {
      if (this.connected) {
        return this.redis.get(key)
      } else {
        return _cache[key] || null
      }
    })
    .then(v => JSON.parse(v))
  }

  /**
   * Sets the value of a key
   * NOTE: Objects get converted to JSON before saving
   * @param {string} key - Key to set
   * @param {object} value - New value
   * @param {number} exp - Time before expiration (seconds)
   */
  set (key, value, exp) {
    const v = JSON.stringify(value)
    return this.ensureReady()
    .then(() => {
      if (this.connected) {
        return exp ? this.redis.set(key, v, 'EX', exp) : this.redis.set(key, v)
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
    })
  }

  /**
   * Subscribes to a channel
   * @param {string} name - Channel name
   */
  subscribe (name) {
    return this.ensureReady()
    .then(() => {
      if (this.connected) {
        return this.redis.subscribe(name)
      } else {
        if (_subscribed.indexOf(name) < 0) _subscribed.push(name)
      }
    })
  }

  /**
   * Unsubscribes from a channel
   * @param {string} name - Channel name
   */
  unsubscribe (name) {
    return this.ensureReady()
    .then(() => {
      if (this.connected) {
        return this.redis.unsubscribe(name)
      } else {
        if (_subscribed.indexOf(name) >= 0) _subscribed.splice(_subscribed.indexOf(name), 1)
      }
    })
  }

  /**
   * Publishes a message to a channel
   * @param {string} channel - Channel name
   * @param {object} message - Message to send
   */
  publish (channel, message) {
    return this.ensureReady()
    .then(() => {
      if (this.connected) {
        return this.redis.publish(channel, JSON.stringify(message))
      } else if (_subscribed.indexOf(channel) >= 0) {
        this.emit('message', channel, JSON.parse(JSON.stringify(message)))
      }
    })
  }
}

module.exports = DataStore
