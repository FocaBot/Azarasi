import 'reflect-metadata'
import Discord from 'discord.js'
import c from 'chalk'
import moment from 'moment'
import util from 'util'
import { Azarasi } from '.'
import { Command, CommandOptions, CommandHandler } from './command'
import { Parameter } from './settings'
import { DataSubscription } from './dataStores'
import { EventMetaKey, EventMetadata, CommandMetaKey, CommandMetadata } from './decorators'

export class Module {
  /** Internal name */
  readonly id : string
  /** Module state */
  state : ModuleState = ModuleState.Loading

  /** Friendly name */
  readonly name? : string 
  /** Description */
  readonly description? : string
  /** Author */
  readonly author? : string
  /** Icon */
  readonly icon? : string

  /** Azarasi instance */
  readonly az : Azarasi
  /** Discord client */
  readonly client : Discord.Client

  /** Registered commands */
  readonly commands : Map<string, Command> = new Map()
  /** Registered event handlers */
  readonly events : ModuleEvent[] = []

  /** Disable this module by default */
  readonly defaultDisabled : boolean = false
  /** Allow this module to be disabled */
  readonly allowDisabling : boolean = true

  /** Module constructor (internal use only) */
  constructor (az : Azarasi, id : string) {
    this.id = id
    this.az = az
    this.client = az.client

    // Read module metadata and register commands and events defined by decorators
    const commandMeta : CommandMetadata[] = Reflect.getMetadata(CommandMetaKey, this) || []
    for (const cmd of commandMeta) {
      //@ts-ignore
      this.registerCommand(cmd.trigger || cmd.name, cmd.options, cmd.handler)
    }
    const eventMeta : EventMetadata[] = Reflect.getMetadata(EventMetaKey, this) || []
    for (const evt of eventMeta) {
      this.registerEvent(evt.eventName, evt.handler)
    }
  }

  /**
   * Registers a command bound to this module.
   * 
   * Use this instead of [[CommandManager.register]] to let the module system
   * handle unloading/reloading for you.
   *
   * An alternative decorator syntax is available: [@registerCommand](/globals.html#registercommand)
   * (only available in TypeScript and ESNEXT for now)
   * @param name - Command name
   * @param options - Command options
   * @param handler - Command handler
   */
  registerCommand (name : string, options : CommandOptions, handler: CommandHandler) : Command | boolean
  /**
   * Registers a command bound to this module.
   *
   * Use this instead of [[CommandManager.register]] to let the module system
   * handle unloading/reloading for you.
   *
   * An alternative decorator syntax is available: [@registerCommand](/globals.html#registercommand)
   * (only available in TypeScript and ESNEXT for now)
   * @param name - Command name
   * @param handler - Command handler
   */
  registerCommand (name : string, handler : CommandHandler) : Command | boolean
  /**
   * Registers a command bound to this module.
   *
   * Use this instead of [[CommandManager.register]] to let the module system
   * handle unloading/reloading for you.
   *
   * An alternative decorator syntax is available: [@registerCommand](/globals.html#registercommand)
   * (only available in TypeScript and ESNEXT for now)
   * @param trigger - Regex trigger
   * @param options - Command options
   * @param handler - Command handler
   */
  registerCommand (trigger : RegExp, options : CommandOptions, handler: CommandHandler) : Command | boolean
  /**
   * Registers a command bound to this module.
   *
   * Use this instead of [[CommandManager.register]] to let the module system
   * handle unloading/reloading for you.
   *
   * An alternative decorator syntax is available: [@registerCommand](/globals.html#registercommand)
   * (only available in TypeScript and ESNEXT for now)
   * @param trigger - Regex trigger
   * @param handler - Command handler
   */
  registerCommand (trigger : RegExp, handler : CommandHandler) : Command | boolean
  registerCommand (arg0 : string | RegExp, arg1 : CommandOptions | CommandHandler, arg2? : CommandHandler) : Command | false {
    const handler = typeof arg1 === 'function' ? arg1 : arg2
    if (!handler) throw new Error('No command handler specified.')
    const options = typeof arg1 === 'object' ? arg1 : {}

    try {
      //@ts-ignore (i know what i'm doing)
      const command = this.az.commands.register(arg0, options, handler)
      command.module = this

      this.commands.set(command.name, command)
      return command
    } catch (e) {
      this.az.logError(e)
      return false
    }
  }

  /**
   * Unregisters a command (only if it belongs to this module).
   * @param name - Command name
   */
  unregisterCommand (name : string) : void
  /**
   * Unregisters a command (only if it belongs to this module).
   * @param trigger - RegExp trigger
   */
  unregisterCommand (trigger : RegExp) : void
  /**
   * Unregisters a command (only if it belongs to this module).
   * @param command - Command instance
   */
  unregisterCommand (command : Command) : void
  unregisterCommand (command : Command | string | RegExp) : void {
    try {
      const name = command.toString()
      const cmd = this.az.commands.get(name)
      if (!cmd || cmd.module !== this) return
      this.az.commands.unregister(cmd)
      this.commands.delete(name)
    } catch (e) {
      this.az.logError(e)
    }
  }

  /**
   * Registers a parameter into the settings schema
   * @param key - Parameter key
   * @param param - Parameter definition
   */
  registerParameter (key : string, param : Parameter) {
    return this.az.settings.register(key, { ...param, module: this })
  }

  /**
   * Unregisters a parameter from the schema (only if it belongs to this module)
   * @param key - Parameter key
   */
  unregisterParameter (key : string) {
    const param = this.az.settings.schema.get(key)
    if (!param || param.module !== this) return
    this.az.settings.unregister(key)
  }

  /**
   * Registers a new event listener bound to this module.
   * 
   * Use this to let the module system handle module unloading/reloading for you,
   * avoiding stray event listeners and memory leaks.
   * 
   * Additionally, for some discord-related events, the handler will not be called if the
   * module is disabled in the guild that triggered the event.
   *
   * An alternative decorator syntax is available: [@registerEvent)(/globals.html#registerevent)
   * (only available in TypeScript and ESNEXT for now)
   * @param name
   * Event name
   *  - If prefixed with `discord.`, (`discord.message`, for instance)
   *    the corresponding discord.js event will be handled
   *  - If prefixed with `db.`, (`db.GuildData`), a data store subscription
   *    will be created ([[IDataStore.subscribe]])
   *  - Otherwise, the event listener will be added to [[Azarasi.events]]
   * @param handler - Event handler
   */
  registerEvent (name : string, handler : (...args : any[]) => any) {
    // Wrapper to check if the module is enabled before actually calling the event handler
    const mod = this
    const wrapper = async function (param : any, ...args : any[]) {
      let guild : Discord.Guild | undefined
      if (param && param instanceof Discord.Guild) guild = param
      if (param && param.guild && param.guild instanceof Discord.Guild) guild = param.guild
      if (guild && await mod.isDisabledForGuild(guild)) {
        return false
      }

      handler.call(mod, param, ...args)
    }
    // Match event type
    const nameParts = name.split('.')
    switch (nameParts[0]) {
      case 'discord':
      case 'client':
      case 'bot':
        const evName = nameParts.slice(1).join('.')
        this.client.on(evName, wrapper)
        this.events.push({
          name,
          evName,
          handler: wrapper,
          originalHandler: handler,
          type: ModuleEventType.Discord
        })
        break
      case 'db':
      case 'ds':
      case 'datastore':
      case 'database':
        const channelName = nameParts.slice(1).join('.')
        const sub = this.az.data.subscribe(channelName, wrapper)
        this.events.push({
          name,
          sub,
          originalHandler: handler,
          type: ModuleEventType.DataStore
        })
        break
      default:
        this.az.events.on(name, handler)
        this.events.push({
          name,
          handler: wrapper,
          originalHandler: handler,
          type: ModuleEventType.Azarasi
        })
    }
  }

  /**
   * Removes an event listener
   * @param name - Event name
   * @param handler
   * Event handler.
   * 
   * Since event handlers are cached internally, this parameter is not required
   * unless you have multiple handlers for the same event and want to remove a specific one.
   * 
   * If not specified, all event handlers matching `name` will be removed.
   */
  unregisterEvent (name : string, handler? : (...args : any[]) => any) {
    this.events.filter(e => {
      return e.name === name && (e.originalHandler === handler || handler == null)
    }).forEach(e => {
      switch (e.type) {
        case ModuleEventType.Discord:
          this.client.removeListener(e.evName!, e.handler!)
          break
        case ModuleEventType.DataStore:
          e.sub!.off!()
          break
        case ModuleEventType.Azarasi:
          this.az.events.removeListener(e.name, e.handler!)
          break
      }
      const index = this.events.indexOf(e)
      this.events.splice(index, 1)
    })
  }

  /**
   * Get a module instance by name and declare a dependency on it
   * @param name - Module name
   */
  requireModule<T extends Module> (name : string) : T {
    this.az.modules.registerDependency(this, name)
    return this.az.modules.get<T>(name)
  }

  /**
   * Checks if the module is disabled for a specific guild
   * @param guild - Discord Guild
   */
  isDisabledForGuild (guild : Discord.Guild) {
    return this.az.modules.isModuleDisabledForGuild(guild, this)
  }

  /**
   * Enables this module for a specific guild
   * @param guild - Discord Guild
   */
  enableForGuild (guild : Discord.Guild) {
    return this.az.modules.enableModuleForGuild(guild, this)
  }

  /**
   * Disables this module for a specific guild
   * @param guild - Discord Guild
   */
  disableForGuild (guild : Discord.Guild) {
    return this.az.modules.disableModuleForGuild(guild, this)
  }

  /**
   * Module initialization code.
   * 
   * This method is called each time the module is loaded or reloaded
   */
  init () : any {
  }
  /**
   * This method is called before unloading or reloading the module.
   * Use it if you need to perform cleanup tasks (remove event handlers, timeouts, etc)
   */
  shutdown () : any {
  }
  /**
   * This method gets called once the bot is fully initialized.
   * 
   * If the bot is already initialized, it gets called immediatly after init()
   */
  ready () : any {
  }
  /**
   * Logs stuff to the console with timestamp, shard id and module name.
   */
  log (...args : any[]) {
    const time = moment()
    const shard = this.az.shard && this.az.shard.id || 0
    const prefix = `[${c.dim.cyan(time.format('YYYY-MM-DD@'))}${c.cyan(time.format('HH:mm'))} `
      + `${c.yellow(shard.toString())} ${c.magenta(this.name || '?')}]`

    const msg = args.map(a => (typeof a === 'string' ? a : util.inspect(a)))
    msg.unshift(prefix)

    if (this.az.shard && this.az.properties.logToMaster) {
      this.az.shard.send({ event: 'az.log', payload: { kind: 'log', message: msg.join(' ') }})
    } else {
      console.log(msg.join(' '))
    }
  }

  /**
   * Logs an error to the console with timestamp and shard id
   */
  logError (...args : any[]) {
    const time = moment()
    const shard = this.az.shard && this.az.shard.id || 0
    const prefix = `[${c.dim.red(time.format('YYYY-MM-DD@'))}${c.red(time.format('HH:mm'))} `
      + `${c.yellow(shard.toString())} ${c.magenta(this.name || '?')}]`

    const msg = args.map(a => (typeof a === 'string' ? a : util.inspect(a)))
    msg.unshift(prefix)

    if (this.az.shard && this.az.properties.logToMaster) {
      this.az.shard.send({ event: 'az.log', payload: { kind: 'error', message: msg.join(' ') }})
    } else {
      console.error(msg.join(' '))
    }
  }

  /**
   * Logs information to the console (only in debug mode)
   */
  logDebug (...args : any[]) {
    if (!this.az.properties.debug) return

    const time = moment()
    const shard = this.az.shard && this.az.shard.id || 0
    const prefix = `[${c.dim.cyan(time.format('YYYY-MM-DD@'))}${c.cyan(time.format('HH:mm'))} `
      + `${c.yellow(shard.toString())} ${c.magenta(this.name || '?')}]`

    const msg = args.map(a => c.gray(typeof a === 'string' ? a : util.inspect(a)))
    msg.unshift(prefix)

    if (this.az.shard && this.az.properties.logToMaster) {
      this.az.shard.send({ event: 'az.log', payload: { kind: 'debug', message: msg.join(' ') }})
    } else {
      console.info(msg.join(' '))
    }
  }
}

/**
 * Contains data about a module's event listener.
 * @hidden
 */
export interface ModuleEvent {
  name : string
  evName? : string
  handler? : (...args : any[]) => any
  sub? : DataSubscription
  originalHandler : (...args : any[]) => any
  type : ModuleEventType
}
/** @hidden */
export enum ModuleEventType {
  Azarasi,
  Discord,
  DataStore
}

/**
 * Current module state.
 */
export enum ModuleState {
  /** The module is being loaded for the first time (or after a full unload) */
  Loading,
  /** The module is loaded and active. */
  Loaded,
  /** The module is currently unloading */
  Unloading,
  /** The module is currently reloading */
  Reloading,
  /** An error occurred during a reload. */
  Errored
}
