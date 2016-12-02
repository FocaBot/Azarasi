const AudioPlayer = require('./audioPlayer');

/**
 * Additional runtime data about guilds
 */
class GuildManager {
  constructor() {
    this._guilds = {};
    this.AudioPlayer = AudioPlayer;
  }

  getGuild(guild) {
    if (!guild) return Promise.resolve({});
    if (this._guilds[guild.id]) return Promise.resolve(this._guilds[guild.id]);
    // Not cached
    this._guilds[guild.id] = {}
    return this.initializeGuild(this._guilds[guild.id], guild);
  }

  initializeGuild(g, guild) {
    g.audioPlayer = new AudioPlayer(guild);
    return Promise.resolve(g);
  }
}

module.exports = GuildManager;
