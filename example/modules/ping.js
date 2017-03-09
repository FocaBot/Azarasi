/**
 * Ping Module
 */
class PingModule extends BotModule {
  init () {
    // A ping command.
    this.registerCommand('ping', (msg) => {
      msg.reply('Pong!')
    })
    // Another command.
    this.registerCommand('pong', (msg) => {
      msg.reply('Ping?')
    })
  }
}

module.exports = PingModule
