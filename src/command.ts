import Discord from 'discord.js'
import { Azarasi } from '.'
import { Guild, GuildData } from './guilds'
import { Settings } from './settings'
import { Locale } from './locales'
import { UserPermissions } from './permissions'
import { Module } from './module'

/**
 * Represents a bot command.
 */
export class Command {
  readonly name : string
  handler : CommandHandler
  /** Command aliases */
  readonly aliases? : string[]
  /** Require admin role */
  adminOnly? : boolean
  /** Require DJ (or admin) role */
  djOnly? : boolean
  /** Make the command available to the owner only */
  ownerOnly? : boolean
  /** Argument separator */
  argSeparator? : string
  /** Argument delimiter */
  argTypes? : ArgumentType[]
  /** Include command name in arguments array. Useful for aliases */
  includeCommandNameInArgs? : boolean
  /** Allow this command to be executed in DMs */
  allowDM? : boolean
  /** For selfbots, allow the command to be executed by others */
  everyone? : boolean
  /** Required permissions to run the command */
  requiredPermissions? : Discord.PermissionResolvable
  /** Required role (names) to run this command */
  requiredRoles? : string[]
  /** Regular expression to trigger the command. If this is set, the default triggers are disabled */
  readonly regex? : RegExp
  /** Associated module */
  module? : Module
  /** Azarasi instance */
  az? : Azarasi

  /**
   * Instantiates a new command.
   * You must register it with [[CommandManager.register]] to make it work.
   * @param name - Command name. MUST be in lowercase and contain no spaces.
   * @param options - Command options
   * @param handler - Command handler
   */
  constructor (name : string, handler : CommandHandler)
  constructor (name : string, options : CommandOptions, handler: CommandHandler)
  constructor (name : string, arg1 : CommandOptions | CommandHandler, arg2? : CommandHandler) {
    this.name = name.toLowerCase()
    if (typeof arg1 === 'function') {
      // The handler is the second argument
      this.handler = arg1
    } else if (typeof arg2 === 'function') {
      this.handler = arg2
      Object.assign(this, arg1)
    } else {
      throw new Error('No handler specified.')
    }
    // Checks
    if (this.regex) {
      if (this.aliases) throw new Error("A RegExp command can't specify aliases.")
      if (this.argSeparator || this.includeCommandNameInArgs) throw new Error("A RegExp command can't have additional arguments.")
    }
  }

  async exec (msg : Discord.Message, args : string | string[] | RegExpExecArray) {
    if (!this.az) throw new Error('This command is not registered.')

    try {
      const guild = await this.az.guilds.getGuild(msg.guild)
      const guildData = guild.data
      const guildSettings = await this.az.settings.getForGuild(msg.guild)
      const guildLocale = await this.az.locales.getLocale(guildSettings.locale || this.az.properties.locale || '')
      const permissions = await this.az.permissions.mapPermissions(msg.author, msg.guild)

      // Check if command execution is not restricted
      if (guildSettings.restrict && !permissions.isDJ) return
      // Check if the message was sent in the command channel
      if (guildSettings.commandChannel && guildSettings.commandChannel !== msg.channel.id && !permissions.isAdmin) return
      // Check for other restrictions
      if (guildData.permissionOverrides && guildData.permissionOverrides[this.name]) {
        switch (guildData.permissionOverrides[this.name]) {
          case 'dj':
            if (!permissions.isDJ) return
            break
          case 'admin':
            if (!permissions.isAdmin) return
            break
        }
      } else {
        if (this.adminOnly && !permissions.isAdmin) return
        if (this.djOnly && !permissions.isDJ) return
      }
      if (this.module && await this.module.isDisabledForGuild(msg.guild)) return
      // Args to pass to the handler
      let plainArgs : any[] = typeof args === 'string' ? [args] : args

      // Transform/Parse arguments if there's an "argTypes" parameter.
      if (this.argTypes && this.argTypes.length) {
        let typeIndex = 0
        plainArgs = await Promise.all(plainArgs.map((arg, i) => {
          // Use the last known type if no type is specified for the current argument
          if (this.argTypes![i] != null) typeIndex = i
          const type = this.argTypes![typeIndex]
          switch (type) {
            case String:
              return arg
            case Number:
              return parseFloat(arg)
            case Boolean:
              if (['true', '1', 'y', 'yes', 'on'].indexOf(arg.toLowerCase()) >= 0) return true
              if (['false', '0', 'n', 'no', 'off'].indexOf(arg.toLowerCase()) >= 0) return false
              return undefined
            case Discord.User:
              const userId = arg.match(/\d+/)
              if (userId) {
                return this.az!.client.fetchUser(userId[0]).catch(() => undefined)
              }
              return undefined
            case Discord.GuildMember:
              const memberId = arg.match(/\d+/)
              if (memberId) {
                return msg.guild.fetchMember(memberId[0]).catch(() => undefined)
              }
              return undefined
            case Discord.TextChannel:
              const channelId = arg.match(/\d+/)
              if (channelId) {
                return msg.guild.channels.find(c => c.type === 'text' && c.id === channelId[0])
              }
              return undefined
            default:
              throw new Error(
                `Couldn't parse argument #${i + 1} of command ${this.name}. ` +
                `Invalid type specified. (${type.name}).` +
                'Valid types are: String, Boolean, Number, User, GuildMember, TextChannel'
              )
          }
        }))
      }

      await this.handler.call(this.module || this,{
        // Message
        msg,
        message: msg,
        m: msg,
        // Arguments
        args,
        arguments: args,
        a: args,
        // Data
        guildData,
        data: guildData,
        d: guildData,
        // Settings
        guildSettings,
        settings: guildSettings,
        s: guildSettings,
        // Locale
        guildLocale,
        locale: guildLocale,
        l: guildLocale,
        // Permissions
        permissions,
        perms: permissions,
        p: permissions,
        // Client
        b: msg.client,
        bot: msg.client,
        client: msg.client,
        // Azarasi
        core: this.az,
        azarasi: this.az,
        az: this.az
      }, ...plainArgs)
    } catch (e) {
      this.az.logError(e)
    }
  }

  toString () {
    return this.name
  }
}

/**
 * The function that gets executed when the command is triggered.
 * @hidden
 */
export type CommandHandler = (ctx : CommandContext, ...args : any[]) => void

/**
 * Argument Types
 */
export type ArgumentType = (
  BooleanConstructor |
  StringConstructor |
  NumberConstructor |
  typeof Discord.User |
  typeof Discord.GuildMember |
  typeof Discord.TextChannel
)

/**
 * Command arguments passed to all command handlers.
 */
export interface CommandContext {
  /** Message */
  msg : Discord.Message
  /** Arguments */
  args : any
  /** Guild Data */
  data : GuildData
  /** Guild Settings */
  settings : Settings
  /** Guild Locale */
  locale? : Locale
  /** User permissions */
  perms : UserPermissions
  /** Client instance */
  bot : Discord.Client
  /** Azarasi instance */
  core : Azarasi
}
// Long aliases
export interface CommandContext {
  /** Message (long alias) */
  message : Discord.Message
  /** Arguments (long alias) */
  arguments : any
  /** Guild Data (long alias) */
  guildData : GuildData
  /** Guild Settings (long alias) */
  guildSettings : Settings
  /** Guild Locale (long alias) */
  guildLocale? : Locale
  /** User permissions (long alias) */
  permissions : UserPermissions
  /** Client instance (long alias) */
  client : Discord.Client
  /** Azarasi instance (long alias) */
  azarasi : Azarasi
} 
// Short aliases
export interface CommandContext {
  /** Message (short alias) */
  m : Discord.Message
  /** Arguments (short alias) */
  a : any
  /** Guild Data (short alias) */
  d : GuildData
  /** Guild Settings (short alias) */
  s : Settings
  /** Guild Locale (short alias) */
  l? : Locale
  /** User permissions (short alias) */
  p : UserPermissions
  /** Client instance (short alias) */
  b : Discord.Client
  /** Azarasi instance (short alias) */
  az : Azarasi
}

/**
 * Custom Command Options
 */
export interface CommandOptions {
  /** Command aliases */
  aliases? : string[]
  /** Require admin role */
  adminOnly? : boolean
  /** Require DJ (or admin) role */
  djOnly? : boolean
  /** Make the command available to the owner only */
  ownerOnly? : boolean
  /** Argument delimiter */
  argSeparator? : string
  /** Argument types */
  argTypes? : ArgumentType[]
  /** Include command name in arguments array. Useful for aliases */
  includeCommandNameInArgs? : boolean
  /** Allow this command to be executed in DMs */
  allowDM? : boolean
  /** For selfbots, allow the command to be executed by others */
  everyone? : boolean
  /** Required permissions to run the command */
  requiredPermissions? : Discord.PermissionResolvable
  /** Required role (names) to run this command */
  requiredRoles? : string[]
  /** Regular expression to trigger the command. If this is set, the default triggers are disabled */
  regex? : RegExp
}
