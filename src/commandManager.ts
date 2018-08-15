import Discord from 'discord.js'
import { Azarasi } from '.'
import { Guild, GuildData } from './guilds'
import { Settings } from './settings'
import { Locale } from './locales'
import { UserPermissions } from './permissions'
import { Module } from './module'
import { Command, CommandHandler, CommandOptions } from './command'

export class CommandManager {
  /** Azarasi instance */
  private readonly az : Azarasi
  private mentionRegex? : RegExp
  /** Registered command instances */
  registered : Map<string, Command> = new Map()
  /** Plain text-triggered commands (includes all aliases) */
  plain : Map<string, Command> = new Map()
  /** RegExp-triggered commands */
  regexes : Map<RegExp, Command> = new Map()

  constructor (az : Azarasi) {
    this.az = az
    az.events.on('ready', () => {
      this.mentionRegex = new RegExp(`^<@!?${az.bot.user.id}>\\s?(\\S+)([\\w\\W]*)`)
    })
  }

  /**
   * Register command(s)
   * @param command - [[Command]] instance to register
   * @param commands - Array of [[Command]] instances to register
   * @param name - Command name
   * @param trigger - Command trigger (RegExp)
   * @param options - Command options
   * @param handler - Command handler
   */
  register (command : Command) : Command
  register (commands : Command[]) : Command[]
  register (name : string, options : CommandOptions, handler : CommandHandler) : Command
  register (trigger : RegExp, options : CommandOptions, handler : CommandHandler) : Command
  register (name : string, handler : CommandHandler) : Command
  register (trigger : RegExp, handler : CommandHandler) : Command
  register (arg1 : string | RegExp | Command | Command[], arg2? : CommandOptions | CommandHandler, arg3? : CommandHandler) : Command | Command[] {
    // Command array
    if (arg1 instanceof Array) {
      return arg1.map(c => this.register(c))
    }
    let command : Command
    if (arg1 instanceof Command) {
      command = arg1
    } else {
      const name = arg1.toString()
      if (typeof arg2 === 'function') {
        // Name, Handler
        const options = arg1 instanceof RegExp ? { regex: arg1 } : {}
        command = new Command(name, options, arg2)
      } else if (typeof arg2 === 'object' && typeof arg3 === 'function') {
        // Name, Options, Handler
        const options = arg1 instanceof RegExp ? {...arg2, regex: arg1 } : arg2
        command = new Command(name, options, arg3)
      } else {
        throw new Error('No handler specified.')
      }
    }
    // Link Azarasi instance
    command.az = this.az
    // Register triggers
    if (arg1 instanceof RegExp) {
      // RegExp command
      this.regexes.set(arg1, command)
    } else {
      const aliases : string[] = [command.name].concat(command.aliases || [])
      aliases.forEach(alias => this.plain.set(alias, command))
    }
    // Map command
    this.registered.set(command.name, command)
    
    return command
  }

  /**
   * Find a command by its key (name, alias, regex)
   * @param key - The key to find
   */
  get (key : string | RegExp) : Command | undefined {
    const k = key.toString()
    return this.registered.get(k) || this.plain.get(k)
  }

  /**
   * Unregisters command(s)
   * @param name - The command to unregister (name)
   * @param trigger - The command to unregister (regex)
   * @param command - The command to unregister
   * @param commands - The commands to unregister
   */
  unregister (name : string) : void
  unregister (trigger : RegExp) : void
  unregister (command : Command) : void
  unregister (commands: Command[]) : void
  unregister (cmd : string | RegExp | Command | Command[]) : void {
    if (cmd instanceof Array) {
      return cmd.forEach(c => this.unregister(c))
    }
    const command = cmd instanceof Command ? cmd : this.get(cmd)
    if (!command) throw new Error('Command not found')
    // Remove link
    delete command.az
    // Remove all references
    this.registered.forEach((val, key, map) => val === command && map.delete(key))
    this.plain.forEach((val, key, map) => val === command && map.delete(key))
    this.regexes.forEach((val, key, map) => val === command && map.delete(key))
  }

  /**
   * Process a message
   * @param msg - Discord Message
   * @param content - Overrides msg.content
   */
  async processMessage (msg : Discord.Message, content = msg.content) {
    const az = this.az
    const s = await az.settings.getForGuild(msg.guild)

    let commandName : string | undefined
    let args : string | string[] | RegExpExecArray = ''
    
    // Global prefix
    let pfx = az.properties.prefix
    // Selfbot public prefix
    if (az.properties.selfBot && az.properties.publicPrefix && msg.author.id !== az.bot.user.id) {
      pfx = az.properties.publicPrefix
    }
    // Guild Prefix
    if (s.prefix && content.toLowerCase().indexOf(s.prefix.toLowerCase()) === 0) {
      pfx = s.prefix
    }
    // Prefixed command
    if (pfx && content.toLowerCase().indexOf(pfx.toLowerCase()) === 0) {
      const cmdText = content.slice(pfx.length).trim().split(' ')
      commandName = cmdText[0].toLowerCase()
      args = cmdText.slice(1).join(' ')
    }
    // Bot mention
    const match = this.mentionRegex ? content.match(this.mentionRegex) : false
    if (match) {
      commandName = match[1].toLowerCase()
      args = match[2].trim()
    }
    // Regex commands
    for (const regexCmd of this.regexes.keys()) {
      const match = regexCmd.exec(content)
      if (match) {
        commandName = regexCmd.toString()
        args = match
      }
    }
    // Get the command
    if (!commandName) return
    const command = this.get(commandName)
    if (!command) return
    if (command.argSeparator && typeof args === 'string') args = args.split(command.argSeparator)
    // Run the command
    try {
      this.run(command, msg, args)
    } catch (e) {
      az.logError(e)
    }
  }

  run (cmd : string | Command | RegExp, msg : Discord.Message, args : string | string[] | RegExpExecArray) {
    const az = this.az
    // Get the command
    const command = (cmd instanceof Command) ? cmd : this.get(cmd)
    const name = (cmd instanceof Command) ? cmd.name : cmd
    if (!command) return false
    // Check if it can be executed
    if (!msg.guild && !command.allowDM) return
    if (az.properties.selfBot && !command.everyone && msg.author.id !== az.bot.user.id) return
    if (command.ownerOnly && !az.permissions.isOwner(msg.author)) return
    if (command.requiredPermissions && !msg.member.hasPermission(command.requiredPermissions)) return
    if (command.requiredRoles && !az.permissions.hasRoles(command.requiredRoles, msg.author, msg.guild)) return
    const a = !command.regex && command.includeCommandNameInArgs ? [ name ].concat(args) : args
    //@ts-ignore
    command.exec(msg, a)
  }
}
