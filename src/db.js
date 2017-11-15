// Hacky stuff
const log = console.log
console.log = () => {}
const Gun = require('gun')
Gun.log.off = true
console.log = log
const http = require('http')
const port = Core.properties.dbPort || 12920
const file = Core.properties.dbFile || 'data.db'

module.exports = {
  createServer () {
    return new Promise((resolve, reject) => {
      const server = http.createServer((req, res) => {
        if (req.url.indexOf('gun') < 0) {
          res.write(new Buffer(`
       .-.
      :   ;
       "."
       / \\
      /  |     ///////////////////
    .'    \\    // HERE BE SEALS //
   /.'   \`.\\   ///////////////////
   ' \\    \`\`.
     _\`.____ \`-._
    /^^^^^^^^\`.\\^\\
   /           \`  \\
""""""""""""""""""""""""`))
          res.end()
        }
      })
      server.listen(port, '127.0.0.1', 511, () => {
        resolve(server)
      }).on('error', reject)
    })
    .then(srv => new Gun({ web: srv, file }))
    .catch(e => {
      if (e.code === 'EADDRINUSE') return new Gun({ peers: [`http://127.0.0.1:${port}/gun`], file })
    })
    .catch(e => {
      Core.log(`The port ${port} is in use by another process.`, 2)
      process.exit(1)
    })
  }
}
