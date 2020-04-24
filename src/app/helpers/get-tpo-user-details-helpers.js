var func = require('../utils/functions')
var dbOp
var fs = require('fs')
var async = require('async')
var http = require('http')
var smtp = func.config.get('smtp')
var nodemailer = require('nodemailer')
var HELPER_CONS = 'SS_CDL_'

function GetTPOUserDetails () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of get tpo user list')
  DbOperation = require('./db-operations').DbOperation
  dbOp = new DbOperation()
}
GetTPOUserDetails.prototype.getTPODetails = function (urlMap, body, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getTPODetails()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_ID, func.lightBlueCons.OP_EQUAL, body), urlMap, func.dbCons.COLLECTION_TPO_USER_DETAILS, function (error, tpoUserJSON) {
    if (error) return callback(new Error().stack, tpoUserJSON)
    else {
      console.log('tpoUserJSON: ' + JSON.stringify(tpoUserJSON))
      callback(null, tpoUserJSON)
    }
  })
}
exports.GetTPOUserDetails = GetTPOUserDetails
