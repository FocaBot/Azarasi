import { Azarasi, CommandArgs } from '../../../lib'
import { registerCommand } from '../../../lib/decorators'

export default class Ping extends Azarasi.Module {
  @registerCommand ping ({ msg } : CommandArgs) {
    msg.reply('Pong!')
  }
}
