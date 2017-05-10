// const AudioPlayer = require('./audioPlayer')

/**
 * Represents a Guild
 */
class Guild {
  /**
   * Instantiates a new Guild
   */
  constructor (discordGuild) {
    this.discordGuild = discordGuild
    // this.audioPlayer = AudioPlayer.getForGuild(discordGuild)
    this.data = null
    // Handle external changes
    Core.data.subscribe('GuildData')
    Core.data.on('message', (channel, message) => {
      if (channel !== 'GuildData') return
      if (message.type === 'updated' && message.guild === this.discordGuild.id) {
        this.init()
      }
    })
  }

  /**
   * Initializes guild data
   */
  async init () {
    const data = await Core.data.get(`Guild:${this.discordGuild.id}`)
    this.data = Object.assign(Guild.defaultData(), data, { save: () => this.saveData() })
    return this
  }

  /**
   * Should return data that will be used for default on new guilds
   * @return {object}
   */
  static defaultData () {
    return {}
  }

  /**
   * Saves guild data
   */
  async saveData () {
    await Core.data.set(`Guild:${this.discordGuild.id}`, this.data)
    // Notify other instances about the change
    Core.data.publish('GuildData', {
      type: 'updated',
      guild: this.discordGuild.id
    })
  }
}

/**
 * Additional runtime data about guilds
 */
class GuildManager {
  constructor () {
    this._guilds = {}
    this.Guild = Guild
  }

  getGuild (guild) {
    if (!guild) return Promise.resolve({})
    if (!this._guilds[guild.id]) this._guilds[guild.id] = new Guild(guild)
    if (!this._guilds[guild.id].data) return this._guilds[guild.id].init()
    return Promise.resolve(this._guilds[guild.id])
  }
}

module.exports = GuildManager
