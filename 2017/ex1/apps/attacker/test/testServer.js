var request = require('supertest')
var app = require('../CVE-2017-5638.js')

describe('testing GET functions', function() {
  this.timeout(5000);

  it('Get /', function (done) {
    request(app)
      .get('/')
      .expect(200, done)
  })

  it('GET /reverseShellClient.js', function (done) {
    request(app)
      .get('/reverseShellClient.js')
      .expect(200, done)
  })

  it('return 404 - GET with invalid path', function (done) {
    request(app)
      .get('/foo')
      .expect(404, done)
  })
})

describe('testing POST functions', function () {
    it('POST /postPage no param', function (done) {
      request(app)
      .post('/postPage')
      .expect(500, done)
    })

    it('POST /postPage with url', function (done) {
      request(app)
      .post('/postPage')
      .set("Connection", "keep alive")
      .set("Content-Type", "application/json")
      .type("form")
      .send({url: 'http://localhost:8080/struts2-showcase-2.3.12/showcase.action'})
      .expect(200, done)
    })

    it('POST /postPage with url and cmd', function (done) {
      request(app)
      .post('/postPage')
      .set("Connection", "keep alive")
      .set("Content-Type", "application/json")
      .type("form")
      .send({url: 'http://localhost:8080/struts2-showcase-2.3.12/showcase.action', cmd: 'ls'})
      .expect(200, done)
    })
})
