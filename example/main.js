/**
 * The same bot from the README example, but using the module system
 */
const FocaBotCore = require('focabot-core');

const myBot = new FocaBotCore({
  prefix: '-',
  token: '[Insert token here]',
  modulePath: __dirname + '/modules/',
});

// Load modules
myBot.modules.load(['ping', 'echo']);

// Connect to discord
myBot.establishConnection();
