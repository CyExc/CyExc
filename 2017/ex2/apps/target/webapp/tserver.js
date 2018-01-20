/**
 *  Target server for Shell Injection Experiment
 *  ping -c 3 <ip address>
 */
var express = require('express')
var bodyParser = require('body-parser')
var argv = require('argv')
var errorhandler = require('errorhandler')

var exec = require('child_process').exec
var app = express()

/* eslint no-undef: 'error' */
/* global  DEFAULT_PORT:true */
DEFAULT_PORT = '8080'

argv.option([
  {
    name: 'port',
    short: 'p',
    type: 'int'
  }
])

var args = argv.run()
var p = (args.options.port) ? args.options.port : DEFAULT_PORT

app.set('views', __dirname)
app.set('view engine', 'ejs')

app.get('/', function (req, res) {
  res.sendFile('index.html', { root: __dirname })
})

var urlencodedParser = bodyParser.urlencoded({ extended: false })
app.get('/getPage', urlencodedParser, function (req, res) {
  if (!req.body) return res.sendStatus(400)

  var ping = 'ping -c 3 ' + req.query.host
  excute(ping, function (data) {
    if (!data) return res.sendStatus(500)
    res.render('index', { message: data })
  })
})

/* eslint handle-callback-err: ["error", "error"] */
app.use(function (req, res, next) {
  var error = new Error('Cannot ' + req.method + ' ' + req.path)
  error.status = 404
  next(error)
})
app.use(errorhandler())

app.listen(p, function () {
  console.log('Listening on ' + p)
})

function excute (cmd, callback) {
  exec(cmd, function (err, stdout, stderr) { callback(stdout) })
}

// for testing
module.exports = app
