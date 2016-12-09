# FocaBotCore

A Discord bot framework built on top of [Discordie](https://qeled.github.io/discordie/) to make bot development easier.

```npm install --save focabot-core```

Currently, it provides:

 - A command system with built-in prefix and role checking.
 - A module system with hot-reloading.
 - Basic permission system.
 - Built-in audio player (requires FFMPEG).

## Example

This is a simple, single-file bot made using FocaBotCore:

```javascript
const FocaBotCore = require('focabot-core');

const myBot = new FocaBotCore({
  prefix: '-',
  token: '[Insert token here]',
});

// The classic "ping" command
myBot.commands.register('ping', (msg) => {
  msg.reply('Pong!');
});

// Makes the bot repeat something
myBot.commands.register('echo', (msg, text) => {
  msg.channel.sendMessage(text);
});

// Connect to discord
myBot.establishConnection();
```

For a more complex example, check out the [example](example/) directory.

## Bots Using FocaBotCore

  - [FocaBot](https://bots.discord.pw/bots/181986129011146752) (source code soon)
  - [MIDIBot](https://bots.discord.pw/bots/206474253531348992)

If you want to add your bot to the list, feel free to make a PR or contact me on Discord (TheBITLINK#3141). 
