const AudioPlayer = require('./audioPlayer')

/**
 * Represents a Guild
 */
class Guild {
  /**
   * Instantiates a new Guild
   */
  constructor (discordGuild) {
    this.discordGuild = discordGuild
    this.audioPlayer = AudioPlayer.getForGuild(discordGuild)
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
  init () {
    return Core.data.get(`Guild:${this.discordGuild.id}`)
    .then(data => {
      this.data = data || {}
      return this
    })
  }

  /**
   * Saves guild data
   */
  saveData () {
    return Core.data.set(`Guild:${this.discordGuild.id}`, this.data).then(() => {
      // Notify other instances about the change
      Core.data.publish('GuildData', {
        type: 'updated',
        guild: this.discordGuild.id
      })
    })
  }
}

/**
 * Additional runtime data about guilds
 */
class GuildManager {
  constructor () {
    this._guilds = {}
  }

  getGuild (guild) {
    if (!guild) return Promise.resolve({})
    if (this._guilds[guild.id]) return Promise.resolve(this._guilds[guild.id])
    // Not cached
    this._guilds[guild.id] = new Guild(guild)
    return this._guilds[guild.id].init()
  }
}

module.exports = GuildManager
