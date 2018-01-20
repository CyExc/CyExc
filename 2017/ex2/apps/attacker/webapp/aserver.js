/**
 *  Attacker server for Shell Injection Experiment
 */
var express = require('express')
var argv = require('argv')
var errorhandler = require('errorhandler')

var app = express()

/* eslint no-undef: 'error' */
/* global  DEFAULT_PORT:true BIND_SHELL_SCRIPT:true */
DEFAULT_PORT = '8081'
BIND_SHELL_SCRIPT = 'bind_shell.py'

argv.option([
  {
    name: 'port',
    short: 'p',
    type: 'int'
  }
])

var args = argv.run()
var p = (args.options.port) ? args.options.port : DEFAULT_PORT
var bindURL = '/' + BIND_SHELL_SCRIPT

app.set('views', __dirname)
app.set('view engine', 'ejs')

app.get('/', function (req, res) {
  res.send('Attacker Web Server')
})

app.get(bindURL, function (req, res) {
  res.sendFile(BIND_SHELL_SCRIPT, { root: __dirname })
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

// for testing
module.exports = app
