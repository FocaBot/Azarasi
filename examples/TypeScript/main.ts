import { Azarasi } from '../../lib/'
import path from 'path'

const exampleBot = new Azarasi({
  prefix: '--',
  token: '...',
  modulePath: path.join(__dirname, 'modules'),
  dataStore: 'memory'
})

exampleBot.modules.load(['ping'])

exampleBot.establishConnection()
