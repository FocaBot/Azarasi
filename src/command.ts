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
  /** Argument delimiter */
  argSeparator? : string
  /** Include command name in arguments array. Useful for aliases */
  includeCommandNameInArgs? : boolean
  /** Allow this command to be executed in DMs */
  allowDM? : boolean
  /** For selfbots, allow the command to be executed by others */
  everyone? : boolean
  /** Required permissions to run the command */
  requiredPermissions? : Discord.PermissionResolvable[]
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
      await this.handler({
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
      })
    } catch (e) {
      this.az.logError(e)
    }
  }

  toString () {
    return this.name
  }
}

export type CommandHandler = (args : CommandArgs) => void

export interface CommandArgs {
  /** Message */
  msg : Discord.Message
  /** Arguments */
  args : string | string[] | RegExpExecArray
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
export interface CommandArgs {
  /** Message (long alias) */
  message : Discord.Message
  /** Arguments (long alias) */
  arguments : string | string[] | RegExpExecArray
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
export interface CommandArgs {
  /** Message (short alias) */
  m : Discord.Message
  /** Arguments (short alias) */
  a : string | string[] | RegExpExecArray
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
  /** Include command name in arguments array. Useful for aliases */
  includeCommandNameInArgs? : boolean
  /** Allow this command to be executed in DMs */
  allowDM? : boolean
  /** For selfbots, allow the command to be executed by others */
  everyone? : boolean
  /** Required permissions to run the command */
  requiredPermissions? : Discord.PermissionResolvable[]
  /** Required role (names) to run this command */
  requiredRoles? : string[]
  /** Regular expression to trigger the command. If this is set, the default triggers are disabled */
  regex? : RegExp
}
