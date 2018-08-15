import Discord from 'discord.js'
import { Azarasi } from '.'
import { Locale } from './locales'
import { Module } from './module'

/**
 * Manages guild settings
 */
export class SettingsManager {
  private readonly az : Azarasi
  /** Settings schema */
  readonly schema : Map<string, Parameter> = new Map()
  /** Default values */
  private defaults : Settings = {}
  /**
   * Global defaults
   * 
   * Useful to override the default settings defined in the schema
   */
  globals : Settings = {}
  /**
   * Like globals, but enforced (can't be changed by guild administrators)
   */
  overrides : Settings = {}

  constructor (az : Azarasi) {
    this.az = az
    // Built-in settings
    this.register('restrict', { type: Boolean, def: false })
    this.register('prefix', { type: String, def: az.properties.prefix, min: 1 })
    this.register('commandChannel', { type: Discord.TextChannel })
    this.register('voiceChannel', { type: Discord.VoiceChannel })
    this.register('allowNSFW', { type: Boolean, def: false })
    this.register('locale', { type: Locale, def: az.properties.locale })
    this.register('botCommanderRole', { type: String })
    this.register('djRole', { type: String })
  }

  /** Check if a type is valid */
  validateType (type : any) {
    if (!type) throw new Error('No type specified.')
    if ([
      Boolean,
      String,
      Number,
      Discord.VoiceChannel,
      Discord.TextChannel,
      Discord.User,
      Locale
    ].indexOf(type) < 0) throw new Error('Invalid type specified.')
  }

  /**
   * Registers a parameter to the schema
   * @param key - Key of the parameter
   * @param param - Parameter definition
   */
  register (key : string, param : Parameter) {
    this.validateType(param.type)
    this.schema.set(key, param)
    if (param.def != null) this.defaults[key] = param.def
    else this.defaults[key] = null
  }

  /**
   * Unregister parameter from the schema
   * @param key - Key to remove
   */
  unregister (key : string) {
    if (this.defaults[key]) delete this.defaults[key]
    this.schema.delete(key)
  }

  /**
   * Gets parameters for a guild
   * @param guild - Guild
   */
  async getForGuild (guild? : Discord.Guild) : Promise<Settings> {
    if (guild) {
      const g = await this.az.guilds.getGuild(guild)
      const gSett = g.data.settings || {}
      // TODO: Exclude parameters from disabled modules
      return Object.freeze({...this.defaults, ...this.globals, ...gSett, ...this.overrides})
    } else {
      return Object.freeze({...this.defaults, ...this.globals, ...this.overrides})
    }
  }

  /**
   * Gets a specific parameter from a guild
   * @param guild - Guild
   * @param key - Parameter
   */
  async getGuildParam (guild : Discord.Guild, key : string) {
    if (!this.schema.has(key)) throw new Error(`The parameter "${key}" does not exist.`)
    const sett = await this.getForGuild(guild)
    return sett[key]
  }

  async setGuildParam (guild : Discord.Guild, key : string, value : any) {
    if (!this.schema.has(key)) throw new Error(`The parameter "${key}" does not exist.`)
    // Fail if an override is set
    if (this.overrides[key] != null) throw new Error(`This setting was overriden by the bot owner.`)
    // Get the parameter from the schema
    const param = this.schema.get(key)!
    // Load current parameter
    const oldVal = await this.getGuildParam(guild, key)
    let newVal

    switch (param.type) {
      case Boolean:
        // Positive values
        if (['yes', 'y', 'true', 'on', '1'].indexOf(value.toLowerCase()) >= 0) newVal = true
        // Negative values
        if (['no', 'n', 'false', 'off', '0'].indexOf(value.toLowerCase()) >= 0) newVal = false
        break
      case String:
        newVal = value.toString()
        // Length restrictions
        if (param.min != null && newVal.length < param.min) throw new Error('Value is too short.')
        if (param.max != null && newVal.length > param.max) throw new Error('Value is too long.')
        break
      case Number:
        newVal = parseFloat(value)
        // Restrictions
        if (param.integer) newVal = parseInt(value)
        if (param.min != null && newVal < param.min) throw new Error('Value is too low.')
        if (param.max != null && newVal > param.max) throw new Error('Value is too high.')
        break
      case Locale:
        const loc = value.toString().split('.')[0]
        const targetLang = loc.split('_')[0]
        const targetCountry = loc.split('_')[1]
        for (const l of this.az.locales.loaded.keys()) {
          const localeLang = l.split('_')[0]
          const localeCountry = l.split('_')[1]

          if (localeLang === targetLang) {
            if (!targetCountry) {
              newVal = l
              break
            }
            if (localeCountry === targetCountry) {
              newVal = l
              break
            }
          }
        }
        if (!newVal) throw new Error('Invalid language.')
        break
      // TODO: Beter handling of these types.
      case Discord.VoiceChannel:
      case Discord.TextChannel:
      case Discord.User:
        if (value === '*') newVal = undefined
        else newVal = value.id || value.match(/\d+/)[0]
        break
    }

    // Update guild
    const g = await this.az.guilds.getGuild(guild)
    if (!g.data.settings) g.data.settings = {}
    g.data.settings[key] = newVal || oldVal
    await g.saveData()
  }
}

/** Built in settings */
export interface Settings {
  /** If enabled, the bot will only accept commands from guild admins */
  restrict? : boolean
  /** Define a custom command prefix for the guild. The default prefix will keep working regardless */
  prefix? : string
  /** Limit bot commands to a single text channel */
  commandChannel? : string
  /** Limit voice chat related commands to a single voice channel */
  voiceChannel? : string
  /** Allow NSFW in channels not marked as NSFW */
  allowNSFW? : boolean
  /** Locale for guild */
  locale? : string
  /** Bot Commander role */
  botCommanderRole? : string
  /** DJ role */
  djRole? : string
  // Otros
  [key : string] : any
}

export interface Parameter {
  /** Parameter type */
  type :
    BooleanConstructor |
    StringConstructor |
    NumberConstructor |
    typeof Locale |
    typeof Discord.VoiceChannel |
    typeof Discord.TextChannel |
    typeof Discord.User
  /** Default value */
  def? : any
  /** Minimum value (numbers) or length (strings) */
  min? : number
  /** Maximum value (numbers) or length (strings) */
  max? : number
  /** Accept integers only (numbers) */
  integer? : boolean
  /** Associated module */
  module? : Module
}
