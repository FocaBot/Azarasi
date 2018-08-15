const { Azarasi } = require('../../lib/').default

class Ping extends Azarasi.Module {

  init () {
    this.registerCommand('ping', ({ msg }) => {
      msg.reply('Pong!')
    })
  }

}

module.exports = Test
