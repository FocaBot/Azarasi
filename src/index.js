require('colors')
const util = require('util')
const Discordie = require('discordie')
const moment = require('moment')
const CommandManager = require('./commands')
const GuildManager = require('./guilds')
const ModuleManager = require('./modules')
const PermissionsManager = require('./permissions')
const DataStore = require('./data')
const pkg = require('../package.json')

/**
 * The mother of all seals.
 */
class FocaBotCore {
  /**
   * Instantiates a new Bot.
   * @param {object} settings - The settings object.
   * @param {string} settings.prefix - Default bot prefix (REQUIRED)
   * @param {string} settings.token - Bot token (REQUIRED)
   * @param {boolean} settings.selfBot - Defines this bot as a selfbot
   * @param {string} settings.publicPrefix - Public Prefix (SelfBots only)
   * @param {string[]} settings.owner - Bot owner user IDs
   * @param {string[]} settings.admins - Global admin user IDs
   * @param {string[]} settings.adminRoles - Admin role names
   * @param {string[]} settings.djRoles - "DJ" role names
   * @param {string[]} settings.blacklist - Blacklisted User IDs
   * @param {number} settings.shardIndex - Current shard id
   * @param {number} settings.shardCount - Total shard count
   * @param {string} settings.modulePath - Path to load modules from
   * @param {string} settings.redisURL - Redis server URL (redis://)
   * @param {boolean} settings.debug - True to enable debug mode
   */
  constructor (settings) {
    global.Core = this
    /** The settings object */
    this.settings = settings
    // Some checks
    if (!this.settings) throw new Error('No settings object.')
    if (!this.settings.prefix) throw new Error('No prefix set.')
    if (!this.settings.token) throw new Error('Missing bot token.')
    /** The discordie Client */
    this.bot = new Discordie({
      autoReconnect: true,
      shardId: settings.shardIndex,
      shardCount: settings.shardCount
    })
    /**
     * The data store
     */
    this.data = new DataStore()
    /**
     * The guild manager
     * @type {GuildManager}
     */
    this.guilds = new GuildManager()
    /**
     * The permissions manager
     * @type {PermissionsManager}
     */
    this.permissions = new PermissionsManager()
    /**
     * The command manager
     * @type {CommandManager}
     */
    this.commands = new CommandManager()
    /**
     * The module manager
     * @type {ModuleManager}
     */
    this.modules = new ModuleManager()

    this.bot.Dispatcher.on('GATEWAY_READY', () => {
      this.log('Connected!.')
      if (this.settings.selfBot) {
        this.permissions.owner.push(this.bot.User.id)
      }
    })
    this.bot.Dispatcher.on('MESSAGE_CREATE', e => this.processMessage(e.message))

    this.bootDate = moment()

    this.version = pkg.version
  }

  /**
   * Establishes connection with discord.
   */
  establishConnection () {
    this.bot.connect({ token: this.settings.token })
  }

  /**
   * Processes messages.
   * @param {object} msg - Discordie message object
   */
  processMessage (msg) {
    // Check if the user isn't in the blacklist
    if (this.settings.blacklist && this.settings.blacklist.indexOf(msg.author.id) >= 0) {
      return
    }
    this.commands.processMessage(msg)
  }

  /**
   * Logs stuff to the console.
   * @param {number} type - 0 for important stuff, 1 for debug info, 2 for errors.
   */
  log (message, type = 0) {
    // Avoid useless logs when debug mode is disabled.
    if (type === 1 && !this.settings.debug) return
    const msg = (typeof message === 'string') ? message : util.inspect(message)

    const t = moment()
    const i = (this.settings.shardIndex || 0).toString()
    let prefix = `[${t.format('YY/MM/DD@').dim.cyan}${t.format('HH:MM').cyan} ${i.yellow}]`

    if (type >= 2) {
      prefix = `[${t.format('YY/MM/DD@').dim.red}${t.format('HH:MM').red} ${i.yellow}]`
      process.stderr.write(`${prefix} ${msg}\n`, 'utf8')
    } else {
      process.stdout.write(`${prefix} ${msg}\n`, 'utf8')
    }
  }
}

module.exports = FocaBotCore
