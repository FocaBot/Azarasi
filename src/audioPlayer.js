/**
 * Handles audio playback on guilds.
 *
 * An instance is automatically created for each guild by the GuildManager
 * To access it from a command callback, use the data.audioPlayerObject.
 */
class GuildAudioPlayer {
  /**
   * Instantiates a new audio player.
   * @param {object} guild - Discordie guild object.
   */
  constructor(guild) {
    /** Associated guild */
    this.guild = guild;
    /** Current voice channel */
    this.voiceChannel = undefined;
    /** Current encoder object */
    this.currentEncoder = undefined;
    /** Current encoder stream */
    this.encoderStream = undefined;
    // this.volume = 50;
  }

  /**
   * Plays an audio stream.
   * @param {object} audioChannel - Discordie VoiceChannel object
   * @param {String} path - Stream path or URL
   * @param {object} flags - Flags to append to the FFMpeg command
   * @param {string[]} flags.input - Input flags
   * @param {string[]} flags.output - Output flags
   * @return {Promise<Object>} Discordie encoder object
   */
  play(audioChannel, path, flags={}, offset=0) {
    if (this.currentEncoder) {
      return Promise.reject('Bot is currently playing another file on the server.');
    }

    return this.join(audioChannel)
    .then(v => v.createExternalEncoder({
      type: 'ffmpeg',
      source: path,
      format: 'opus', // opus doesn't allow volume change on the fly :C
      frameDuration: 60,
      inputArgs: flags.input,
      outputArgs: flags.output,
    })).then((encoder) => {
      this.currentEncoder = encoder;
      this.encoderStream = encoder.play();
      this.encoderStream.resetTimestamp();
      this._offset = offset;
      this.voiceConnection.getEncoder().setVolume(this.volume);
      encoder.on('end', () => this.clean());
      return encoder;
    });
  }

  /**
   * Joins a voice channel.
   * @param {object} audioChannel - Discordie voice channel object
   * @return {Promise<Object>} Discordie voice connection object
   */
  join(audioChannel) {
    // if hell :D
    if (this.voiceConnection) {
      // bot is connected to another voice channel
      if (this.voiceConnection.channelId === audioChannel.id) {
        // it happens to be the same voice channel, so we just resolve the current value
        return Promise.resolve(this.voiceChannel);
      }
      // The bot is in another voice channel.
      if (this.currentStream) return Promise.reject('Bot is already in another voice channel.');
      // If there's nothing being played, leave the current voice channel.
      this.clean(true);
    }

    return audioChannel.join().then((info) => {
      this.voiceConnection = info.voiceConnection;
      return info.voiceConnection;
    });
  }

  /**
  get volume() {
    return this._vol;
  }
  set volume(vol) {
    this._vol = vol;
    try {
      this.voiceConnection.getEncoder().setVolume(vol);
    } catch (e) { }
  }
  */
  
  /**
   * Attempts to stop playback.
   * @param {boolean} disconnect - Set to true to also disconnect from the voice channel
   */
  stop(disconnect) {
    try {
      this.currentEncoder.stop();
    } catch (e) {}
    this.clean(disconnect);
  }

  /**
   * Current playback timestamp.
   * @type {number}
   */
  get timestamp() {
    return this.encoderStream.timestamp + this._offset;
  }

  /**
   * Cleans resources and (optionally) disconnects from the voice channel.
   * @param {boolean} disconnect - Set to true to disconnect
   */
  clean(disconnect) {
    delete this.currentEncoder;
    delete this.encoderStream;
    if (disconnect) {
      try {
        this.voiceConnection.disconnect();
        delete this.voiceConnection;
      } catch (e) { }
    }
  }
}

module.exports = GuildAudioPlayer;
