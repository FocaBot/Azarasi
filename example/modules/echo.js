/**
 * Echo Module
 */
class EchoModule extends BotModule {
  init () {
    // Repeat!
    this.registerCommand('echo', ({ msg, args }) => {
      msg.channel.sendMessage(args)
    })
    // Reverse!
    this.registerCommand('reverse', ({ msg, args }) => {
      msg.reply(args.split('').reverse().join(''))
    })
  }
}

module.exports = EchoModule
