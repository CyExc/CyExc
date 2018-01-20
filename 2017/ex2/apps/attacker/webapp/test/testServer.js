var request = require('supertest')
var app = require('../aserver.js')

describe('testing GET functions', function() {
  it('Get /', function (done) {
    request(app)
      .get('/')
      .expect(200, done)
  })

  it('GET /bindShell.py', function (done) {
    request(app)
      .get('/bind_shell.py')
      .expect(200, done)
  })

  it('return 404 - GET with invalid path', function (done) {
    request(app)
      .get('/foo')
      .expect(404, done)
  })
})
