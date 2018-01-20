var request = require('supertest')
var should = require('should')
var mocha = require('mocha')
var app = require('../tserver.js')

describe('testing GET functions', function() {
  this.timeout(5000);

  it('Get /', function (done) {
    request(app)
      .get('/')
      .expect(200, done)
  })

  it('GET /getPage', function (done) {
    request(app)
      .get('/getPage')
      .query({ 'host': '8.8.8.8' })
      .expect(200, function(err, res) {
        if (err) return done(err)
        should.exist(res)
        res.status.should.be.equal(200)
        done()
    })
  })

  it('return 404 - GET with invalid path', function (done) {
    request(app)
      .get('/foo')
      .expect(404, done)
  })
})
