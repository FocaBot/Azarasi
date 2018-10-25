const { Azarasi } = require('../../../lib/')

class Ping extends Azarasi.Module {
  init () {
    this.registerCommand('ping', ({ msg }) => {
      msg.reply('Pong!')
    })
  }
}

module.exports = Ping
