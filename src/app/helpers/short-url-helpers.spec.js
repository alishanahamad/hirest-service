'use strict'

const sinon = require('sinon')
const expect = require('chai').expect

const ShortUrlHelper = require('./short-url-helpers').ShortUrlHelper
const dbOp = require('./short-url-helpers').dbOp

const shortUrlHelper = new ShortUrlHelper()

describe('Shorten URL Helpers module', function () {
  describe('Get Short URL', function () {
    it('should return short url without error')

    it('should return error when database operation returns error')
  })

  describe('Get Long URL', function () {
    it('should return long url without error')

    it('should return error when no url found')

    it('should return error when database operation returns error')
  })
})
