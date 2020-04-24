var func = require('../utils/functions');
var dbOp;
var fs = require('fs');
var async = require('async');
var http = require('http');
var smtp = func.config.get('smtp');
var nodemailer = require('nodemailer');
var HELPER_CONS = 'SS_TCD_';

function AddCampusDrivesrHelper() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of add campus drives helper');
  DbOperation = require('./db-operations').DbOperation;
  dbOp = new DbOperation();
}

function createJsonFromAddCampus(data, body) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'createJsonFromAddCampus()', func.logCons.LOG_ENTER);
  var campusJSON = {};
  campusJSON[func.dbCons.FIELD_CAMPUS_START_DATE] = body[func.dbCons.FIELD_CAMPUS_START_DATE];
  campusJSON[func.dbCons.FILED_CAMPUS_PROPOSED_DATE] = body[func.dbCons.FILED_CAMPUS_PROPOSED_DATE];
  campusJSON[func.dbCons.FIELD_CAMPUS_INVITE_YEAR] = body[func.dbCons.FIELD_CAMPUS_INVITE_YEAR];
  campusJSON[func.dbCons.FIELD_COURSE] = body[func.dbCons.FIELD_COURSE];
  campusJSON[func.dbCons.FIELD_CANDIDATE_SIGNUP_URL] = body[func.dbCons.FIELD_CANDIDATE_SIGNUP_URL];
  campusJSON[func.dbCons.FIELD_STREAM] = body[func.dbCons.FIELD_STREAM];
  campusJSON[func.dbCons.FIELD_STATUS] = body[func.dbCons.FIELD_STATUS];
  campusJSON[func.dbCons.FIELD_INSTITUTE_ID] = data;
  campusJSON[func.dbCons.COMMON_CREATED_BY] = body[func.dbCons.COMMON_CREATED_BY];
  campusJSON[func.dbCons.COMMON_UPDATED_BY] = body[func.dbCons.COMMON_UPDATED_BY];
  campusJSON[func.dbCons.BATCH_SIZE] = body[func.dbCons.BATCH_SIZE];
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'createJsonFromAddCampus()', func.logCons.LOG_EXIT);
  return campusJSON;
}

function AddCampusDrivesDetails(urlMap, data, body, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'AddCampusDrivesDetails()', func.logCons.LOG_ENTER);
  dbOp.insert(urlMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, createJsonFromAddCampus(data, body), dbOp.getCommonProjection(), function(error, insertCampusDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while lightblue call = ' + JSON.stringify(error));
      return callback(new Error().stack, insertCampusDetails);
    } else if (!insertCampusDetails || insertCampusDetails.length === 0) {
      return callback(new Error().stack, func.errorsArrayGenrator(func.errorObjectGenrator(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_CAMPUS_DRIVES_DETAILS_IS_NOT_INSERTED), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_CAMPUS_DRIVES_DETAILS_IS_NOT_INSERTED));
    } else {
      callback(null, insertCampusDetails);
    }
  });
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'AddCampusDrivesDetails()', func.logCons.LOG_EXIT);
}
AddCampusDrivesrHelper.prototype.AddCampusDrivesDetails = function(urlMap, body, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'AddCampusDrivesDetails()', func.logCons.LOG_ENTER);
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_ID, func.lightBlueCons.OP_EQUAL, body[func.dbCons.FIELD_USER_CODE]), urlMap, func.dbCons.COLLECTION_TPO_USER_DETAILS, function(error, data) {
    if (error) return callback(new Error().stack, data);
    if (!data || data.length === 0) {
      var response = [];
      return callback(null, response);
    } else {
      body[func.dbCons.FIELD_INSTITUTE_ID] = data[0][func.dbCons.FIELD_INSTITUTE_ID];
      AddCampusDrivesDetails(urlMap, data[0][func.dbCons.FIELD_INSTITUTE_ID], body, function(error, fetchRegisterJSON) {
        if (error) return callback(new Error().stack, fetchRegisterJSON);
        else {
          callback(null, fetchRegisterJSON);
        }
      });
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'AddCampusDrivesDetails()', func.logCons.LOG_EXIT);
    }
  });
};
exports.AddCampusDrivesrHelper = AddCampusDrivesrHelper;
