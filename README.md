# Azarasi Framework

A Discord bot framework built on top of [Discord.js](https://discord.js.org/) to make
bot development easier (formerly called FocaBotCore).

```npm install --save azarasi```

Currently, it provides:

 - A command system with built-in prefix and role checking.
 - A module system with hot-reloading.
 - Basic permission system.
 - Persistent data store (powered by [Gun](http://gun.js.org/))
 - Localization system
 - Configuration system (per-guild).
 - Built-in audio player (requires FFMPEG).

## Example

This is a simple, single-file bot made using Azarasi:

```javascript
const Azarasi = require('azarasi');

const myBot = new Azarasi({
  prefix: '-',
  token: '[Insert token here]',
});

// The classic "ping" command
myBot.commands.register('ping', ({ msg }) => {
  msg.reply('Pong!');
});

// Makes the bot repeat something
myBot.commands.register('echo', ({ msg, args }) => {
  msg.channel.send(args);
});

// Connect to discord
myBot.establishConnection();
```

For a more complex example, check out the [example](example/) directory.

## Bots Using Azarasi Framework

  - [FocaBot](https://bots.discord.pw/bots/181986129011146752) [(source code)](https://github.com/FocaBot/FocaBot)
  - [SelfBot-Base](https://github.com/TheBITLINK/SelfBot-Base) (older version, source only)

If you want to add your bot to the list, feel free to make a PR or contact me on Discord (TheBITLINK#3141). 
