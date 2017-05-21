/**
 * Requires FFMPEG to work
 * 
 * Also
 */
class AudioModule extends BotModule {
  init () {
    // Play a local audio file (full path)
    this.registerCommand('playfile', ({ msg, args }) => {
      if (msg.member.voiceChannel) {
        Core.AudioPlayer.getForGuild(msg.guild).play(msg.member.voiceChannel, args)
      } else {
        msg.reply('You must be in a voice channel.')
      }
    })
    // Stop Playback
    this.registerCommand('stop', ({ msg, args }) => {
      Core.AudioPlayer.getForGuild(msg.guild).stop(true)
    })
  }
}

module.exports = AudioModule
