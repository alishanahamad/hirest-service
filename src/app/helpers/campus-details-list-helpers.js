var func = require('../utils/functions');
var dbOp;
var fs = require('fs');
var async = require('async');
var http = require('http');
var smtp = func.config.get('smtp');
var nodemailer = require('nodemailer');
var HELPER_CONS = 'SS_CDL_';

function GetCampusDetailsList() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of campus details list');
  DbOperation = require('./db-operations').DbOperation;
  dbOp = new DbOperation();
}

function getPersonIdFromCandidateSourceDetails(urlMap, candidateDetailsId, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getPersonIdFromCandidateSourceDetails()', func.logCons.LOG_ENTER);
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_EQUAL, candidateDetailsId), urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, dbOp.getCommonProjection(), function(error, data) {
    if (error) return callback(new Error().stack, data);
    if (!data || data.length === 0) {
      var response = [];
      return callback();
    } else {
      callback(null, data);
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'getPersonIdFromCandidateSourceDetails()', func.logCons.LOG_EXIT);
    }
  });
}
function getInstituteDetailsList(urlMap, body, data, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getInstituteDetailsList()', func.logCons.LOG_ENTER);
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, data), urlMap, func.dbCons.COLLECTION_INSTITUTE_DETAILS, dbOp.getCommonProjection(), function(error, data) {
    if (error) return callback(new Error().stack, data);
    if (!data || data.length === 0) {
      var response = [];
      return callback();
    } else {
      callback(null, data);
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'getInstituteDetailsList()', func.logCons.LOG_EXIT);
    }
  });
}
function getAllInstituteDetails(urlMap, body, data, callback) {
  let instituteName = body[0][func.dbCons.FIELD_INSTITUTE_NAME]
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getAllInstituteDetails()', func.logCons.LOG_ENTER);
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_INSTITUTE_ID, func.lightBlueCons.OP_EQUAL, data), urlMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, dbOp.getCommonProjection(), function(error, body) {
    if (error) return callback(new Error().stack, data);
    if (!body || body.length === 0) {
      var response = [];
      return callback(null, response);
    } else {
      var personId = [];
      async.eachOfSeries(body, function(item, key, callbackdata) {
        item[func.dbCons.FIELD_INSTITUTE_NAME] = instituteName
          item[func.dbCons.FILED_PERSON_ID] = [];
          dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CAMPUS_DRIVE_ID, func.lightBlueCons.OP_EQUAL, item[func.dbCons.FILED_ID]), urlMap, func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, dbOp.getCommonProjection(), function(error, candidateId) {
            if (error) return callback(new Error().stack, candidateId);
            if (!candidateId || candidateId.length === 0) {
              var response = [];
              return callbackdata();
            } else {
              getPersonIdFromCandidateSourceDetails(urlMap, candidateId[0][func.dbCons.FILED_ID], function(error, fetchJSON) {
                if (error) return callbackdata(new Error().stack, fetchJSON);
                if (!fetchJSON || fetchJSON.length === 0) {
                  var response = [];
                  return callbackdata();
                } else {
                  for (var i = 0; i < fetchJSON.length; i++) {
                    item[func.dbCons.FILED_PERSON_ID].push(fetchJSON[i][func.dbCons.FILED_PERSON_ID]);
                  }
                  callbackdata();
                }
              });
            }
          });
        },
        function(err) {
          if (err) {
            //TODO: ADD 2nd Argument
            return callback(new Error().stack);
          } else {
            callback(null, body);
          }
        });
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'AddCampusDrivesDetails()', func.logCons.LOG_EXIT);
    }
  });
}
GetCampusDetailsList.prototype.getCampusDetails = function(urlMap, body, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCampusDetails()', func.logCons.LOG_ENTER);
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_ID, func.lightBlueCons.OP_EQUAL, body), urlMap, func.dbCons.COLLECTION_TPO_USER_DETAILS, dbOp.getCommonProjection(), function(error, data) {
    if (error) return callback(new Error().stack, data);
    if (!data || data.length === 0) {
      var response = [];
      return callback(null, response);
    } else {
      getInstituteDetailsList(urlMap,data,data[0][func.dbCons.FIELD_INSTITUTE_ID],function(error,fetchInstituteId){
        if (error) return callback(new Error().stack, fetchInstituteId);
        else {
          data[0][func.dbCons.FIELD_INSTITUTE_NAME] = fetchInstituteId[0][func.dbCons.FIELD_NAME]
          getAllInstituteDetails(urlMap, data,data[0][func.dbCons.FIELD_INSTITUTE_ID], function(error, fetchRegisterJSON) {
            if (error) return callback(new Error().stack, fetchRegisterJSON);
            else {
              callback(null, fetchRegisterJSON);
            }
          });
        }
      })
      // getAllInstituteDetails(urlMap, data, data[0][func.dbCons.FIELD_INSTITUTE_ID], function(error, fetchRegisterJSON) {
      //   if (error) return callback(new Error().stack, fetchRegisterJSON);
      //   else {
      //     callback(null, fetchRegisterJSON);
      //   }
      // });
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCampusDetails()', func.logCons.LOG_EXIT);
    }
  });
};
exports.GetCampusDetailsList = GetCampusDetailsList;
