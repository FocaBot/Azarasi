const Azarasi = require('../../lib/').default

class Test extends Azarasi.Module {

  init () {
    this.registerCommand('test', ({ msg }) => {
      msg.reply('ayy elmio')
    })

    this.registerCommand('ping', ({ msg }) => {
      msg.reply('pong')
    })
  }

}

module.exports = Test
