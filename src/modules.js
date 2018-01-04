const reload = require('require-reload')(require)
const path = require('path')
const watch = require('node-watch')
const Discord = require('discord.js')

/**
 * Module Base class
 * @global
 */
class BotModule {
  /**
   * Instantiates a Module
   */
  constructor (name) {
    /** Module name */
    this.name = name
    /** Discord.js client */
    this.bot = global.Core.bot
    /** Registered Commands */
    this.commands = []
    /** Registered event handlers */
    this.events = []
  }

  /**
   * Registers a command.
   * @param {string} name - Command name.
   * @param {object} options - Command options.
   * @param {function} func - Command handler.
   * @returns {BotCommand}
   * @see {BotCommand}
   */
  registerCommand (name, options, func) {
    try {
      const command = Core.commands.register(name, Object.assign(options, {
        module: this
      }), func)
      this.commands.push(command)
      return command
    } catch (e) {
      Core.log(e, 2)
      return false
    }
  }

  /**
   * Unregisters a command (only if it belongs to this module).
   * @param {string|BotCommand} command - Command to unregister
   */
  unregisterCommand (command) {
    try {
      const cmd = command instanceof BotCommand ? command : Core.commands.registered[command]
      if (!cmd.module || cmd.module !== this) return
      Core.commands.unregister(cmd)
    } catch (e) {
      Core.log(e, 2)
    }
  }

  /**
   * Registers a setting parameter.
   * @param {string} key - Parameter key
   * @param {object} props - Parameter properties
   */
  registerParameter (key, props) {
    return Core.settings.register(key, Object.assign(props, {
      module: this
    }))
  }

  /**
   * Unregisters a setting parameter.
   * @param {string} key - Parameter key
   */
  unregisterParameter (key) {
    if (Core.settings.schema[key] && Core.settings.schema[key].module === this) {
      return Core.settings.unregister(key)
    }
  }

  /**
   * Registers an event listener bound to this module
   * @param {string} name - Event Name - Prefix with discord. for discord events
   * @param {function} evHandler - Event Handler
   * @example
   * this.registerEvent('discord.message', messageHandler)
   * this.registerEvent('customEvent', handler)
   */
  registerEvent (name, evHandler) {
    // Try to avoid event handler if the module is disabled
    const self = this
    const handler = async function (param) {
      let guild = param instanceof Discord.Guild ? param : param.guild
      if (param && param.guildId) guild = { id: param.guildId }
      if (guild && guild.id && await Core.modules.isDisabledForGuild(guild, self)) {
        return false
      }
      evHandler.apply(self, arguments)
    }
    if (name.match(/^discord\.(.*)/)) {
      Core.bot.on(name.match(/^discord\.(.*)/)[1], handler)
    } else if (name.match(/^db\.(.*)/)) {
      const channelName = name.match(/^db\.(.*)/)[1]
      this.events.push({ name, handler: Core.data.subscribe(channelName, handler), evHandler })
    } else {
      Core.events.on(name, handler)
    }
    this.events.push({ name, handler, evHandler })
  }

  /**
   * Unregisters an event listener
   * @param {string} name - Event Name
   * @param {string} evHandler - Optional event handler
   */
  unregisterEvent (name, evHandler) {
    this.events.filter(v => {
      return v.name === name && (v.evHandler === evHandler || evHandler == null)
    }).forEach(ev => {
      if (ev.name.match(/^discord\.(.*)/)) {
        Core.bot.removeListener(ev.name.match(/^discord\.(.*)/)[1], ev.handler)
      } else if (ev.name.match(/^db\.(.*)/)) {
        ev.handler.off()
      } else {
        Core.events.removeListener(ev.name, ev.handler)
      }
    })
  }

  shutdown () {
    if (typeof this.unload === 'function') this.unload()
    for (const param in Core.settings.schema) {
      if (Core.settings.schema[param].module === this) this.unregisterParameter(param)
    }
    this.events.forEach(ev => {
      if (ev.name.match(/^discord\.(.*)/)) {
        Core.bot.removeListener(ev.name.match(/^discord\.(.*)/)[1], ev.handler)
      } else {
        Core.events.removeListener(ev.name, ev.handler)
      }
    })
    Core.commands.unregister(this.commands)
  }
}

/**
 * Manages the modules.
 */
class ModuleManager {
  constructor () {
    /** Currently loaded modules */
    this.loaded = {}
    this.modulePath = Core.properties.modulePath || './modules'
    // Hot Module Reloading
    if (Core.properties.watch) {
      this.pendingReloads = {}
      watch(this.modulePath, { recursive: true }, (event, file) => {
        // Get module name
        const modName = file.split(this.modulePath)[1].match(/^\/?([^/\\.]*)(\.[^/\\])?\/?/)[1]
        // Ignore if the module isn't loaded
        if (!this.loaded[modName]) return
        try {
          // Avoid reloading twice
          if (this.pendingReloads[modName]) clearTimeout(this.pendingReloads[modName])
          // Reload the module
          this.pendingReloads[modName] = setTimeout(() => {
            this.reload(modName)
            Core.log(`Reloaded Module "${modName}"!`)
            delete this.pendingReloads[modName]
          }, 100)
        } catch (e) {
          console.error(e)
        }
      })
    }
  }

  /**
   * Loads the specified modules.
   * @param {string[]} modules - Modules to load
   */
  load (modules) {
    const m = (typeof modules === 'string') ? [modules] : modules
    if (!m.forEach) throw new Error('This function only accepts strings or arrays.')
    m.forEach((mod) => {
      try {
        const Module = reload(path.join(this.modulePath, mod))
        this.loaded[mod] = new Module(mod)
        Core.log(`Loaded Module "${mod}"!`, 1)
        if (typeof this.loaded[mod].init === 'function') this.loaded[mod].init()
        if (typeof this.loaded[mod].ready === 'function') {
          if (Core.ready) {
            this.loaded[mod].ready()
          } else {
            Core.bot.once('ready', () => this.loaded[mod].ready())
          }
        }
      } catch (e) {
        Core.log(e, 2)
      }
    })
  }

  /**
   * Unloads the specified modules.
   * @param {string[]} modules - Modules to unload
   */
  unload (modules) {
    const m = (typeof modules === 'string') ? [modules] : modules
    if (!m.forEach) throw new Error('This function only accepts strings or arrays.')
    m.forEach((mod) => {
      try {
        this.loaded[mod].shutdown()
        delete this.loaded[mod]
        Core.log(`Unloaded Module "${mod}".`, 1)
      } catch (e) {
        Core.log(e, 2)
      }
    })
  }

  /**
   * Reloads the specified modules.
   * @param {string[]} modules - Modules to load
   */
  reload (modules) {
    this.unload(modules)
    this.load(modules)
  }

  /**
   * Enables a module only in a specific guild
   * @param {Discord.Guild} guild
   * @param {string|BotModule} mod - Module name or instance
   */
  async enableForGuild (guild, mod) {
    const g = await Core.guilds.getGuild(guild)
    const m = mod instanceof BotModule ? mod : this.loaded[mod]
    if (!m) throw new Error('No such module.')
    if (!g.data.disabledModules) g.data.disabledModules = { }
    g.data.disabledModules[m.name] = false
    await g.saveData()
  }

  /**
   * Disables a module only in a specific guild
   * @param {Discord.Guild} guild
   * @param {string|BotModule} mod - Module name or instance
   */
  async disableForGuild (guild, mod) {
    const g = await Core.guilds.getGuild(guild)
    const m = mod instanceof BotModule ? mod : this.loaded[mod]
    if (!m) throw new Error('No such module.')
    if (!g.data.disabledModules) g.data.disabledModules = { }
    g.data.disabledModules[m.name] = true
    await g.saveData()
  }

  /**
   * Checks if a module is disabled in a guild.
   * @param {Discord.Guild} guild
   * @param {string|BotModule} mod - Module name or instance
   */
  async isDisabledForGuild (guild, mod) {
    const d = (await Core.guilds.getGuild(guild)).data
    const m = mod instanceof BotModule ? mod : this.registered[mod]
    if (!m) return true
    if (d.disabledModules && d.disabledModules[m.name] != null) {
      if (d.disabledModules[mod.name] === true) return true
      if (d.disabledModules[mod.name] === false) return false
      return m.defaultDisabled
    }
    return m.defaultDisabled
  }
}

module.exports = ModuleManager
global.BotModule = BotModule
