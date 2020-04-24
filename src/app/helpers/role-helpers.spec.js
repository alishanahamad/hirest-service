'use strict'

const sinon = require('sinon')
const expect = require('chai').expect

const fs = require('fs')
const func = require('../utils/functions')
const Rolehelpers = require('./role-helpers').Rolehelpers
const dbOp = require('./role-helpers').dbOp

const roleHelpers = new Rolehelpers()

describe('Role Helpers module', function() {

  it('should return error when database operation returns error', function() {
    // Test data
    // const userCode = 1,
    //   isResource = true
    // const urlMap = {
    //   domain_name: 'futurx',
    //   orgname: 'test'
    // }
    // const expectedError = new Error('database error')
    //
    // Create Stub function
    // const findByQueryStub = this.sandbox.stub(dbOp, 'findByQuery').callsFake(function(query, urlMap, collectionName, callback) {
    //   callback(expectedError)
    // })
    //
    // roleHelpers.assignRole(userCode, isResource, urlMap, function(err) {
    //   expect(findByQueryStub).to.have.been.called
    //   expect(err[func.msgCons.PARAM_ERROR_MSG]).to.equal(func.msgCons.MSG_ERROR_SERVER_ERROR)
    //   expect(err[func.msgCons.PARAM_ERROR_DESC]).to.equal(func.msgCons.MSG_ERROR_PLZ_TRY_AFTER)
    // })

  })

  it('should return default role and permission when no role definition found for given resource', function() {
    // Test data
    // const userCode = 1,
    //   isResource = true
    // const urlMap = {
    //   domain_name: 'futurx',
    //   orgname: 'test'
    // }
    // const rules = [{
    //   "a": "APP_USER",
    //   "can": "show dashboard"
    // }, {
    //   "a": "APP_USER",
    //   "can": "add role"
    // }, {
    //   "a": "APP_USER",
    //   "can": "get report by details"
    // }, {
    //   "a": "APP_USER",
    //   "can": "get survey"
    // }, {
    //   "a": "APP_USER",
    //   "can": "close survey"
    // }, {
    //   "a": "APP_USER",
    //   "can": "get indrfat list"
    // }, {
    //   "a": "APP_USER",
    //   "can": "store response"
    // }, {
    //   "a": "APP_USER",
    //   "can": "validate response"
    // }]
    // const expectedActions = ['show dashboard', 'add role', 'get report by details', 'get survey', 'close survey', 'get indrfat list', 'store response', 'validate response']
    //
    // // Create Stub function
    // const findByQueryStub = this.sandbox.stub(dbOp, 'findByQuery')
    //
    // findByQueryStub.onFirstCall().callsFake(function(query, urlMap, collectionName, callback) {
    //   return callback(null)
    // })
    //
    // findByQueryStub.onSecondCall().callsFake(function(query, urlMap, collectionName, callback) {
    //   return callback(null, rules)
    // })
    //
    // roleHelpers.assignRole(userCode, isResource, urlMap, function(err, userRole, actions) {
    //   expect(findByQueryStub).to.have.been.calledTwice
    //   expect(err).to.be.null
    //   expect(userRole).to.equal(func.dbCons.VALUE_APP_USER)
    //   expect(actions).to.eql(expectedActions)
    // })

  })

  it('should return default role and permission when no role definition found for given user', function() {
    // Test data
    // const userCode = 1,
    //   isResource = false
    // const urlMap = {
    //   domain_name: 'futurx',
    //   orgname: 'test'
    // }
    // const rules = [{
    //   "a": "APP_USER",
    //   "can": "show dashboard"
    // }, {
    //   "a": "APP_USER",
    //   "can": "add role"
    // }, {
    //   "a": "APP_USER",
    //   "can": "get report by details"
    // }, {
    //   "a": "APP_USER",
    //   "can": "get survey"
    // }, {
    //   "a": "APP_USER",
    //   "can": "close survey"
    // }, {
    //   "a": "APP_USER",
    //   "can": "get indrfat list"
    // }, {
    //   "a": "APP_USER",
    //   "can": "store response"
    // }, {
    //   "a": "APP_USER",
    //   "can": "validate response"
    // }]
    // const expectedActions = ['show dashboard', 'add role', 'get report by details', 'get survey', 'close survey', 'get indrfat list', 'store response', 'validate response']
    //
    // // Create Stub function
    // const findByQueryStub = this.sandbox.stub(dbOp, 'findByQuery')
    //
    // findByQueryStub.onFirstCall().callsFake(function(query, urlMap, collectionName, callback) {
    //   return callback(null, [])
    // })
    //
    // findByQueryStub.onSecondCall().callsFake(function(query, urlMap, collectionName, callback) {
    //   return callback(null, rules)
    // })
    //
    // roleHelpers.assignRole(userCode, isResource, urlMap, function(err, userRole, actions) {
    //   expect(findByQueryStub).to.have.been.calledTwice
    //   expect(err).to.be.null
    //   expect(userRole).to.equal(func.dbCons.VALUE_APP_USER)
    //   expect(actions).to.eql(expectedActions)
    // })

  })

  it('should return error message when multiple roles exists for given resource', function() {
    // Test data
    // const userCode = 1,
    //   isResource = true
    // const urlMap = {
    //   domain_name: 'futurx',
    //   orgname: 'test'
    // }
    // const expectedRoles = [{
    //   role_id: 1
    // }, {
    //   role_id: 2
    // }]
    // const expectedMessage = 'More than one role found!!'
    //
    // // Create Stub function
    // const findByQueryStub = this.sandbox.stub(dbOp, 'findByQuery').callsFake(function(query, urlMap, collectionName, callback) {
    //   callback(null, expectedRoles)
    // })
    // const getRoleCallback = sinon.spy()
    //
    // roleHelpers.assignRole(userCode, isResource, urlMap, getRoleCallback)
    //
    // expect(findByQueryStub).to.have.been.called
    // expect(getRoleCallback).to.have.been.calledWith(expectedMessage)

  })

  it('should return error message when role is expired for given resource', function() {
    // Test data
    // const userCode = 1,
    //   isResource = true
    // const urlMap = {
    //   domain_name: 'futurx',
    //   orgname: 'test'
    // }
    // const expectedRole = [{
    //   "role_name": 2,
    //   "user_role_details_id": 1,
    //   "entity_details": {
    //     "id": 1,
    //     "type": "RESOURCE"
    //   },
    //   "effective_date_to": "2017-01-22T00:00:00.000+0530",
    //   "effective_date_from": "2017-01-12T00:00:00.000+0530",
    // }]
    // const expectedMessage = 'Role Experied, no role found!!'
    //
    // // Create Stub function
    // const findByQueryStub = this.sandbox.stub(dbOp, 'findByQuery').callsFake(function(query, urlMap, collectionName, callback) {
    //   callback(null, expectedRole)
    // })
    // const getRoleCallback = sinon.spy()
    //
    // roleHelpers.assignRole(userCode, isResource, urlMap, getRoleCallback)
    //
    // expect(findByQueryStub).to.have.been.called
    // expect(getRoleCallback).to.have.been.calledWith(expectedMessage)

  })

  it('should return default role and permission when role name value is -1 for given resource', function() {
    // Test data
    // const userCode = 1,
    //   isResource = true
    // const urlMap = {
    //   domain_name: 'futurx',
    //   orgname: 'test'
    // }
    // const rules = [{
    //   "a": "APP_USER",
    //   "can": "show dashboard"
    // }, {
    //   "a": "APP_USER",
    //   "can": "add role"
    // }, {
    //   "a": "APP_USER",
    //   "can": "get report by details"
    // }, {
    //   "a": "APP_USER",
    //   "can": "get survey"
    // }, {
    //   "a": "APP_USER",
    //   "can": "close survey"
    // }, {
    //   "a": "APP_USER",
    //   "can": "get indrfat list"
    // }, {
    //   "a": "APP_USER",
    //   "can": "store response"
    // }, {
    //   "a": "APP_USER",
    //   "can": "validate response"
    // }]
    // const expectedActions = ['show dashboard', 'add role', 'get report by details', 'get survey', 'close survey', 'get indrfat list', 'store response', 'validate response']
    // const expectedRoleData = {
    //   "role_name": -1,
    //   "user_role_details_id": 1,
    //   "entity_details": {
    //     "id": 1,
    //     "type": "RESOURCE"
    //   },
    //   "effective_date_to": "9999-12-12T00:00:00.000+0530",
    //   "effective_date_from": "1999-01-12T00:00:00.000+0530"
    // }
    //
    // // Create Stub function
    // const findByQueryStub = this.sandbox.stub(dbOp, 'findByQuery')
    //
    // findByQueryStub.onFirstCall().callsFake(function(query, urlMap, collectionName, callback) {
    //   return callback(null, expectedRoleData)
    // })
    //
    // findByQueryStub.onSecondCall().callsFake(function(query, urlMap, collectionName, callback) {
    //   return callback(null, rules)
    // })
    //
    // roleHelpers.assignRole(userCode, isResource, urlMap, function(err, userRole, actions) {
    //   expect(findByQueryStub).to.have.been.calledTwice
    //   expect(err).to.be.null
    //   expect(userRole).to.equal(func.dbCons.VALUE_APP_USER)
    //   expect(actions).to.eql(expectedActions)
    // })

  })

  const rolesTestData = [{
    roleDetails: {
      "role_name": 0,
      "user_role_details_id": 1,
      "effective_date_to": "9999-12-12T00:00:00.000+0530",
      "effective_date_from": "1999-01-12T00:00:00.000+0530"
    },
    roleName: func.dbCons.VALUE_APP_USER,
    roleDef: [{
      "a": "APP_USER",
      "can": "show dashboard"
    }, {
      "a": "APP_USER",
      "can": "google"
    }, {
      "a": "APP_USER",
      "can": "facebook callback"
    }, {
      "a": "APP_USER",
      "can": "google callback"
    }, {
      "a": "APP_USER",
      "can": "callback"
    }, {
      "a": "APP_USER",
      "can": "done"
    }]
  }, {
    roleDetails: {
      "role_name": 1,
      "user_role_details_id": 1,
      "effective_date_to": "9999-12-12T00:00:00.000+0530",
      "effective_date_from": "1999-01-12T00:00:00.000+0530"
    },
    roleName: func.dbCons.VALUE_ACCOUNT_ADMIN,
    roleDef: [{"a":"ACCOUNT_ADMIN","can":"show dashboard"},{"a":"ACCOUNT_ADMIN","can":"google"},{"a":"ACCOUNT_ADMIN","can":"facebook callback"},{"a":"ACCOUNT_ADMIN","can":"google callback"},{"a":"ACCOUNT_ADMIN","can":"callback"},{"a":"ACCOUNT_ADMIN","can":"done"}]
  }, {
    roleDetails: {
      "role_name": 2,
      "user_role_details_id": 1,
      "effective_date_to": "9999-12-12T00:00:00.000+0530",
      "effective_date_from": "1999-01-12T00:00:00.000+0530"
    },
    roleName: func.dbCons.VALUE_CONSULTANT_USER,
    roleDef: [{"a":"CONSULTANT_USER","can":"show dashboard"},{"a":"CONSULTANT_USER","can":"google"},{"a":"CONSULTANT_USER","can":"facebook callback"},{"a":"CONSULTANT_USER","can":"google callback"},{"a":"CONSULTANT_USER","can":"callback"},{"a":"CONSULTANT_USER","can":"done"}]
  }, {
    roleDetails: {
      "role_name": 3,
      "user_role_details_id": 1,
      "effective_date_to": "9999-12-12T00:00:00.000+0530",
      "effective_date_from": "1999-01-12T00:00:00.000+0530"
    },
    roleName: func.dbCons.VALUE_APPLICATION_ADMIN,
    roleDef: [{"a":"SYSTEM_ADMIN","can":"show dashboard"},{"a":"SYSTEM_ADMIN","can":"google"},{"a":"SYSTEM_ADMIN","can":"facebook callback"},{"a":"SYSTEM_ADMIN","can":"google callback"},{"a":"SYSTEM_ADMIN","can":"callback"},{"a":"SYSTEM_ADMIN","can":"done"}]
  }, {
    roleDetails: {
      "role_name": 4,
      "user_role_details_id": 1,
      "effective_date_to": "9999-12-12T00:00:00.000+0530",
      "effective_date_from": "1999-01-12T00:00:00.000+0530"
    },
    roleName: func.dbCons.VALUE_ANONYMOUS_USER,
    roleDef: [{"a":"ANONYMOUS_USER","can":"show dashboard"},{"a":"ANONYMOUS_USER","can":"google"},{"a":"ANONYMOUS_USER","can":"facebook callback"},{"a":"ANONYMOUS_USER","can":"google callback"},{"a":"ANONYMOUS_USER","can":"callback"},{"a":"ANONYMOUS_USER","can":"done"}]
  }]

  rolesTestData.forEach(function(roleData, index) {
    it('assigns a role #' + (index + 1) + ' to the resource', function() {
      // Test data
      // const userCode = 1,
      //   isResource = true
      // const urlMap = {
      //   domain_name: 'futurx',
      //   orgname: 'test'
      // }
      // const expectedRoles = roleData.roleDef
      // const expectedRoleName = roleData.roleName
      // const expectedActions = ['show dashboard', 'google', 'facebook callback', 'google callback', 'callback', 'done']
      // const expectedRoleData = roleData.roleDetails
      //
      // // Create Stub function
      // const findByQueryStub = this.sandbox.stub(dbOp, 'findByQuery')
      //
      // findByQueryStub.onFirstCall().callsFake(function(query, urlMap, collectionName, callback) {
      //   return callback(null, expectedRoleData)
      // })
      //
      // findByQueryStub.onSecondCall().callsFake(function(query, urlMap, collectionName, callback) {
      //   return callback(null, expectedRoles)
      // })
      //
      // roleHelpers.assignRole(userCode, isResource, urlMap, function(err, userRole, actions) {
      //   expect(findByQueryStub).to.have.been.calledTwice
      //   expect(err).to.be.null
      //   expect(userRole).to.equal(expectedRoleName)
      //   expect(actions).to.eql(expectedActions)
      // })

    })
  })

})
