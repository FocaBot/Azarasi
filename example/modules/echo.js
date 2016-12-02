/**
 * Echo Module
 */
class EchoModule extends BotModule {
  init() {
    // Repeat!
    this.registerCommand('echo', (msg, text) => {
      msg.channel.sendMessage(text);
    });
    // Reverse!
    this.registerCommand('reverse', (msg, text) => {
      msg.reply(text.split('').reverse().join(''));
    });
  }
}

module.exports = EchoModule;
