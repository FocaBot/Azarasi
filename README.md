# Azarasi Framework

Azarasi is the custom bot framework that powers [FocaBot](https://www.focabot.xyz/).

It was developed from the ground-up with simplicity and flexibility in mind.
It's 100% TypeScript and uses [Discord.js](https://discord.js.org/) under the hood.

It strives to make bot development easier while providing most things you'd expect from a
full-featured bot framework and staying out of the way of advanced users.
```bash
npm install --save azarasi@next
```

Current features include:

 - Command system
   - Built-in permission checking
   - Prefixed command triggers (`-command`)
   - Mention command triggers (`@Bot command`)
   - RegExp command triggers
 - Module system
   - Modules contain multiple command and event definitions
   - Modules can be disabled, enabled, loaded and reloaded at runtime
   - Module Hot-reloading
   - Basic dependency system
 - Basic Permission system
 - Global event system
 - Log formatting
 - Persistent key-value data store (powered by either [Gun](http://gun.js.org/) or [Redis](https://redis.io/))
 - Localization
 - Per-guild settings system
   - Per-guild custom command prefix
   - Per-guild custom language
   - Per-guild module disabling
   - Per-guild custom command permissions
 - Support for some modern language features (like decorators).

## Example

This is a simple, single-file bot made using Azarasi:

```javascript
const { Azarasi } = require('azarasi');

const myBot = new Azarasi({
  prefix: '-',
  token: '[Insert token here]'
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

For more complex examples, check out the [examples](examples/) directory.
