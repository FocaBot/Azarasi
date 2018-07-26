import Azarasi from '.'
import Discord from 'discord.js'
import { Settings } from './settings'

export class Guild {
  private readonly az : Azarasi
  discordGuild? : Discord.Guild
  data : GuildData

  constructor (az : Azarasi, discordGuild? : Discord.Guild) {
    this.az = az
    this.discordGuild = discordGuild
    this.data = {...Guild.defaultData(), async save () {} }
    if (this.discordGuild) {
      // Subscribe to external updates
      this.az.data.subscribe('_AzEvent.GuildData', (msg : GuildDataEvent) => {
        if (msg.type === 'updated' && this.discordGuild && msg.guild === this.discordGuild.id) {
          this.init()
        }
      })
    }
  }

  /**
   * Initializes guild data
   */
  async init () {
    if (!this.discordGuild) return
    const data = await this.az.data.get(`Guild:${this.discordGuild.id}`)
    this.data = {...Guild.defaultData(), ...data, save: () => this.saveData() }
  }

  /**
   * Should return data that will be used for default on new guilds
   */
  static defaultData () {
    return {}
  }

  /**
   * Saves Guild Data
   */
  async saveData () {
    if (!this.discordGuild) return
    await this.az.data.set(`Guild:${this.discordGuild.id}`, this.data)
    // Notify other instances about the change
    this.az.data.set('_AzEvent.GuildData', {
      type: 'updated',
      guild: this.discordGuild.id
    })
  }
}

/**
 * Manages persistent data for guilds
 */
export class GuildManager {
  private readonly az : Azarasi
  private guilds : Map<string, Guild> = new Map()

  constructor (az : Azarasi) {
    this.az = az
  }

  /**
   * Get data for a guild. If no guild is specified, dummy (default) values will be used.
   * @param guild - Guild to get
   */
  async getGuild (guild? : Discord.Guild) : Promise<Guild> {
    if (!guild) return new Guild(this.az)
    if (this.guilds.has(guild.id)) {
      return this.guilds.get(guild.id)!
    } else {
      const g = new Guild(this.az, guild)
      await g.init()
      this.guilds.set(guild.id, g)
      return g
    }
  }
}

/**
 * Guild data event
 * @hidden
 */
interface GuildDataEvent {
  type : 'updated'
  guild : string
}

export interface GuildData {
  /**
   * Save changes to the data store
   */
  save : () => Promise<void>
  /**
   * Guild settings
   */
  settings? : Settings
  /**
   * Command permission overrides
   */
  permissionOverides? : {
    [key : string] : string
  }
  /**
   * Disabled modules
   */
  disabledModules? : {
    [name : string] : boolean
  }
  /** Custom fields */
  [key : string] : any
}
