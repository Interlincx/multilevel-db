var DB_NAME = process.env.DB_NAME || 'multilevel-db'
require('productionize')(DB_NAME)

var net = require('net')
var path = require('path')
var level = require('level')
var multileveldown = require('multileveldown')

var DB_CLOSED = process.env.DB_CLOSED === 'true'
var DB = process.env.DB || path.join(__dirname, 'db')

var db = DB_CLOSED ? {} : level(DB)

var EXTENDED_LOGS = ['arborist', 'blackbird', 'strategis'].some(p => (process.env.HOSTNAME || '').includes(p) || (process.env.DB_NAME || '').includes(p))

var server = net.createServer(function (sock) {
  var dataBuffer = []
  var mldbServer = multileveldown.server(db)

  sock.on('data', function (data) {
    if (EXTENDED_LOGS) dataBuffer.push({ data: data.toString(), ts: new Date().toISOString() })
    if (dataBuffer.length > 200) dataBuffer.shift()
  })

  mldbServer.on('error', function (err) {
    if (EXTENDED_LOGS) console.log({ dataBuffer, mldbError: err })
    sock.destroy()
    if (err) return console.error(err)
    process.exit(1)
  })

  sock.on('error', function (err) {
    if (EXTENDED_LOGS) console.log({ dataBuffer, socketError: err })
    sock.destroy()
    if (err) return console.error(err)
    process.exit(1)
  })

  if (!DB_CLOSED) {
    sock.pipe(mldbServer).pipe(sock)
  }
})

var PORT = process.env.PORT || 9000
server.listen(PORT)
var version = require('./package.json').version
console.log('%s (v%s) listening on port %s', DB_NAME, version, PORT)
