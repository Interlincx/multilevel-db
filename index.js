var DB_NAME = process.env.DB_NAME || 'multilevel-db'
require('productionize')(DB_NAME)

var net = require('net')
var path = require('path')
var level = require('level')
var multileveldown = require('multileveldown')

var DB_CLOSED = process.env.DB_CLOSED === 'true'
var DB = process.env.DB || path.join(__dirname, 'db')

var db = DB_CLOSED ? {} : level(DB)
var EXTENDED_LOGS = process.env.EXTENDED_LOGS === 'true'

var server = net.createServer(function (sock) {
  var mldbServer = multileveldown.server(db)
  var incomingMessage = ''

  sock.on('data', function (data) {
    incomingMessage = data.toString()
  })

  mldbServer.on('error', function (err) {
    if (EXTENDED_LOGS) console.log({ IpAddress: sock.remoteAddress, incomingMessage, mldbError: err })
    sock.destroy()
    if (err) return console.error(err)
    process.exit(1)
  })

  sock.on('error', function (err) {
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
