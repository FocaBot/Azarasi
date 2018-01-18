const _guilds = {}
const { spawn } = require('child_process')

/**
 * Handles audio playback on guilds.
 *
 * An instance is automatically created for each guild by the GuildManager
 * To access it from a command callback, use the data.audioPlayerObject.
 */
class AudioPlayer {
  /**
   * Instantiates a new audio player.
   * @param {Discord.Guild} guild - Discord guild object.
   */
  constructor (guild) {
    /** Associated guild */
    this.guild = guild
    /** Current voice connection */
    this.voiceConnection = undefined
    /** Current stream object */
    this.currentStream = undefined
    /** FFMPEG process */
    this.ffmpegProcess = undefined
  }

  /**
   * Plays an audio stream.
   * @param {Discord.VoiceChannel} voiceChannel - Discordie VoiceChannel object
   * @param {String} path - Stream path or URL
   * @param {object} flags - Flags to append to the FFMpeg command
   * @param {string[]} flags.input - Input flags
   * @param {string[]} flags.output - Output flags
   * @return {Promise<Object>} Discord encoder object
   */
  async play (voiceChannel, path, flags = {}, offset = 0) {
    if (this.currentStream) {
      throw new Error('Bot is currently playing another file on the server.')
    }
    await this.join(voiceChannel)
    // Launch the FFMPEG process
    this.ffmpegProcess = spawn(Core.properties.ffmpegBin || 'ffmpeg',
      [].concat(
        // workaround for shitty connections
        path.indexOf('http') === 0 ? [
          '-reconnect', '1',
          '-reconnect_at_eof', '1',
          // '-reconnect_streamed', '1',
          '-reconnect_delay_max', '2'
        ] : []
      )
      .concat(flags.input)
      .concat([
        '-hide_banner',
        '-analyzeduration', '0',
        '-loglevel', Core.properties.debug ? 'warning' : '0',
        '-i', path,
        // disable video encoding
        '-vn'
      ])
      .concat(flags.output)
      .concat(
        '-f', 'data',
        '-map', '0:a',
        '-ar', '48k',
        '-ac', '2',
        '-acodec', 'libopus',
        '-sample_fmt', 's16',
        '-vbr', 'off',
        '-b:a', '64000',
        'pipe:1'
      )
      .filter(f => f)
    )
    // Play the output stream
    this.currentStream = this.voiceConnection.playOpusStream(this.ffmpegProcess.stdout)
    // Debug FFMPEG output
    if (Core.properties.debug) this.ffmpegProcess.stderr.on('data', d => Core.log(String(d), 1))

    this._offset = offset
    this.currentStream.once('end', () => this.clean())
    return this.currentStream
  }

  /**
   * Joins a voice channel.
   * @param {object} voiceChannel - Discord voice channel object
   * @return {Promise<Object>} Discord voice connection object
   */
  async join (voiceChannel) {
    this.voiceConnection = await voiceChannel.join()
    return this.voiceConnection
  }

  /**
   * Attempts to stop playback.
   * @param {boolean} disconnect - Set to true to also disconnect from the voice channel
   * @param {boolean} removeEvents - Remove event listeners before sending the stream.
   */
  stop (disconnect, removeEvents) {
    try {
      if (removeEvents) this.currentStream.removeAllListeners('end')
      this.currentStream.end()
    } catch (e) {}
    this.clean(disconnect)
  }

  /**
   * Current playback timestamp.
   * @type {number}
   */
  get timestamp () {
    if (this.currentStream) return (this.currentStream.time / 1000) + this._offset
    return NaN
  }

  /**
   * Cleans resources and (optionally) disconnects from the voice channel.
   * @param {boolean} disconnect - Set to true to disconnect
   */
  clean (disconnect) {
    if (this.ffmpegProcess) {
      try {
        this.ffmpegProcess.kill()
      } catch (e) {
        Core.log(e,2)
      }
    }
    delete this.currentStream
    if (disconnect) {
      try {
        this.voiceConnection.disconnect()
        delete this.voiceConnection
      } catch (e) { }
    }
  }

  static getForGuild (guild) {
    if (!_guilds[guild.id]) _guilds[guild.id] = new AudioPlayer(guild)
    return _guilds[guild.id]
  }
}

module.exports = AudioPlayer
