/**
 * The same bot from the README example, but using the module system
 */
const Azarasi = require('azarasi')
const path = require('path')

const myBot = new Azarasi({
  prefix: '-',
  token: '[Insert token here]',
  modulePath: path.join(__dirname, 'modules')
})

// Load modules
myBot.modules.load(['ping', 'echo', 'audio'])

// Connect to discord
myBot.establishConnection()
