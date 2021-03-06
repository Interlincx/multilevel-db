var net = require('net')
var multileveldown = require('multileveldown')

module.exports = function (opts) {
  var db = multileveldown.client({
    retry: true,
    valueEncoding: opts.valueEncoding
  })

  function connect () {
    var sock = net.connect({host: opts.host, port: opts.port})

    sock.on('error', function (err) {
      sock.destroy()
      if (err) console.error(err)
    })

    sock.on('close', function () {
      setTimeout(connect, 1000)
    })

    sock.pipe(db.connect()).pipe(sock)
  }

  connect()

  return db
}
