const EventEmitter = require('events').EventEmitter
const _subscribed = { }

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
      this.db.get(key).path('val').val(v => resolve(JSON.parse(v || 'null')))
    })
  }

  /**
   * Sets the value of a key
   * NOTE: Objects get converted to JSON before saving
   * @param {string} key - Key to set
   * @param {object} value - New value
   */
  async set (key, value) {
    const val = JSON.stringify(value)
    await this.ensureReady()
    this.db.get(key).put({ val })
    return 'OK'
  }

  /**
   * Deletes a key
   * @param {string} key - Key to delete
   */
  async del (key) {
    return await this.set(key, null)
  }

  /**
   * Subscribes to a channel
   * @param {string} name - Channel name
   */
  async subscribe (name) {
    await this.ensureReady()
    if (_subscribed[name] == null) {
      this.db.get(`_Channel:${name}`).on(data => {
        if (_subscribed[name]) this.emit('message', name, JSON.parse(data.val))
      })
    }
    _subscribed[name] = true
    return 'OK'
  }

  /**
   * Unsubscribes from a channel
   * @param {string} name - Channel name
   */
  async unsubscribe (name) {
    await this.ensureReady()
    _subscribed[name] = false
    return 'OK'
  }

  /**
   * Publishes a message to a channel
   * @param {string} channel - Channel name
   * @param {object} message - Message to send
   */
  async publish (channel, message) {
    await this.ensureReady()
    this.db.get(`_Channel:${channel}`).put({ val: JSON.stringify(message) })
    return 'OK'
  }
}

module.exports = DataStore
