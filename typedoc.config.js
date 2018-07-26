const path = require('path')
 
module.exports = {
  src : './src',
  out: './docs',
  // theme: path.resolve(path.join(__dirname, 'node_modules', 'typedoc-clarity-theme', 'bin')),
  ignoreCompilerErrors: true,
  excludeExternals: true,
  externalPattern: '**/node_modules/**/*',
  mode: 'file',
  exclude: [
    '**/*.ds.ts'
  ]
}
