const EventEmitter = require('events').EventEmitter

/**
 * Global Data Store.
 *
 * Powered By GUN (http://gun.js.org/)
 */
class DataStore extends EventEmitter {
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
    return await this.set(key, null)
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

module.exports = DataStore
