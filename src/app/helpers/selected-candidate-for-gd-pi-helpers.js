var func = require('../utils/functions');
var dbOp;
var fs = require('fs');
var async = require('async');
var http = require('http');
var smtp = func.config.get('smtp');
var nodemailer = require('nodemailer');
var dateFormat = require('dateformat');
var HELPER_CONS = 'SS_SCFGP_';
var configJson = func.config.get('mail_domains');
EmailVerificationHelpers = require('../helpers/email-verification-helpers').EmailVerificationHelpers;
var emailVerificationHelpers = new EmailVerificationHelpers();

function SelectedCandidateList() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of add tpo register helper');
  DbOperation = require('./db-operations').DbOperation;
  dbOp = new DbOperation();
}

function getCandidateDetailsIds(designation, instituteIDs) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateDetailsIds()', func.logCons.LOG_ENTER);
  var candidateSourceIDS = func.getValuesArrayFromJson(func.dbCons.FIELD_ID, instituteIDs)
  var andArray = [];
  andArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_INSTITUTE_ID, func.lightBlueCons.OP_IN, instituteIDs));
  andArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_DESIGNATION, func.lightBlueCons.OP_EQUAL, designation));
  return andArray;
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateDetailsIds()', func.logCons.LOG_EXIT);
}

function getEnumStatusFromValue(value) {
  switch (value) {
    case func.dbCons.ENUM_STAGE_FOR_GD:
      return func.dbCons.ENUM_SELECTED_FOR_GD
    case func.dbCons.ENUM_STAGE_FOR_PI:
      return func.dbCons.ENUM_SELECTED_FOR_PI
    default:
      return 1
  }
}

function finalSendMailToTpoWithCandidate(env, urlMap, body, tpoDetails, fetchAllPersonIDS, updatedCandidateDetail, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'finalSendMailToTpoWithCandidate()', func.logCons.LOG_ENTER);
  var emailID = tpoDetails[0][func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_EMAIL]
  var finalJson = {}
  var detailsJson = {}
  var count = 1
  finalJson.designation = body[func.dbCons.FIELD_DESIGNATION];
  finalJson.tpoName = tpoDetails[0][func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_NAME] + " " + tpoDetails[0][func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_FAMILY_NAME];
  async.forEachOf(fetchAllPersonIDS, function(item, key, callbackinner) {
    item[func.dbCons.FIELD_USER_ID] = count++
      callbackinner()
  }, function(error) {
    if (error) {
      return callback(new Error().stack, updatedCandidateDetail)
    } else {
      // callback(null, updatedCandidateDetail)
      finalJson.candidate_details = fetchAllPersonIDS
      emailVerificationHelpers.sendMailTpo(emailID, env, urlMap, finalJson, configJson[func.configCons.FIELD_SECOND_ROUND_LIST], func.msgCons.TITLE_MSG_FOR_SECOND_ROUND, 1, function(err, resp) {
        if (err) {
          res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
          return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
        } else {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'mail sent successully')
          return callback(null, resp)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'finalSendMailToTpoWithCandidate()', func.logCons.LOG_EXIT);
}


function getPersonDetailsIDFromUserID(env, urlMap, body, userIDs, fetchAllPersonIDS, updatedCandidateDetail, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getPersonDetailsIDFromUserID()', func.logCons.LOG_ENTER);
  var userCode = userIDs[0]['user_id']
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, userCode), urlMap, func.dbCons.COLLECTION_USER_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, tpoDetails) {
    if (error) return callback(new Error().stack, tpoDetails);
    if (!tpoDetails || tpoDetails.length === 0) {
      var tpoDetails = []
      callback(null, tpoDetails);
    } else {
      finalSendMailToTpoWithCandidate(env, urlMap, body, tpoDetails, fetchAllPersonIDS, updatedCandidateDetail, function(error, sendMail) {
        if (error) return callback(new Error().stack, sendMail);
        else {
          callback(null, updatedCandidateDetail);
        }
      })
    }
  });
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getPersonDetailsIDFromUserID()', func.logCons.LOG_EXIT);
}



function sendMailToTPOForCandidateDetails(env, body, urlMap, instituteIDs, fetchAllPersonIDS, updatedCandidateDetail, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'sendMailToTPOForCandidateDetails()', func.logCons.LOG_ENTER);
  var projection = [];
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_USER_ID));
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_INSTITUTE_ID));
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_INSTITUTE_ID, func.lightBlueCons.OP_IN, instituteIDs), urlMap, func.dbCons.COLLECTION_TPO_USER_DETAILS, projection, function(error, userIDs) {
    if (error) return callback(new Error().stack, userIDs);
    if (!userIDs || userIDs.length === 0) {
      var userIDs = []
      callback(null, userIDs);
    } else {
      getPersonDetailsIDFromUserID(env, urlMap, body, userIDs, fetchAllPersonIDS, updatedCandidateDetail, function(error, updateJSON) {
        if (error) return callback(new Error().stack, updateJSON);
        else {
          callback(null, updateJSON);
        }
      });
    }
  });
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'sendMailToTPOForCandidateDetails()', func.logCons.LOG_EXIT);
}


function updateStageInCandidateDetails(env, bodydata, urlMap, instituteIDs, fetchAllCandidateIDS, fetchAllPersonIDS, stage, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateStageInCandidateDetails()', func.logCons.LOG_ENTER);
  var fetchAllCandidateIDS = func.getValuesArrayFromJson(func.dbCons.FIELD_ID, fetchAllCandidateIDS)
  var fetchAllPersonIDArray = func.getValuesArrayFromJson(func.dbCons.FIELD_ID, fetchAllPersonIDS)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_IN, fetchAllCandidateIDS))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_PERSON_ID, func.lightBlueCons.OP_IN, fetchAllPersonIDArray))
  var body = {}
  body[func.dbCons.COLLECTION_JSON_STAGE] = getEnumStatusFromValue(stage)
  dbOp.update(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, dbOp.getOperationJson(func.lightBlueCons.OP_SET, body), dbOp.getCommonProjection(), function(error, updatedCandidateDetail) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateExamDetailsById()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, updatedCandidateDetail)
    }
    if (!updatedCandidateDetail || updatedCandidateDetail.length === 0) {
      var response = []
      return callback(null, response)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateStageInCandidateDetails()', func.logCons.LOG_EXIT)
      sendMailToTPOForCandidateDetails(env, bodydata, urlMap, instituteIDs, fetchAllPersonIDS, updatedCandidateDetail, function(error, sendMail) {
        if (error) return callback(new Error().stack, sendMail);
        else {
          callback(null, sendMail);
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateStageInCandidateDetails()', func.logCons.LOG_EXIT);
}

function getPersonIdsFromPersonDetails(env, body, urlMap, instituteIDs, fetchAllCandidateIDS, stage, encryEmailIds, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getPersonIdsFromPersonDetails()', func.logCons.LOG_ENTER);
  var projection = [];
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID));
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_FIRST_NAME));
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_LAST_NAME));
  projection.push(dbOp.getProjectionJson(func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME));
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FILED_EMAIL_ADDRESS, func.lightBlueCons.OP_IN, encryEmailIds), urlMap, func.dbCons.COLLECTION_PERSON_DETAILS, projection, function(error, fetchAllPersonIDS) {
    if (error) return callback(new Error().stack, fetchAllPersonIDS);
    if (!fetchAllPersonIDS || fetchAllPersonIDS.length === 0) {
      var fetchAllPersonIDS = []
      callback(null, fetchAllPersonIDS);
    } else {
      updateStageInCandidateDetails(env, body, urlMap, instituteIDs, fetchAllCandidateIDS, fetchAllPersonIDS, stage, function(error, updateJSON) {
        if (error) return callback(new Error().stack, updateJSON);
        else {
          callback(null, updateJSON);
        }
      });
    }
  });
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getPersonIdsFromPersonDetails()', func.logCons.LOG_EXIT);
}

function getchPersonDetailsEmailID(env, body, urlMap, instituteIDs, fetchAllCandidateIDS, stage, emailAddress, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getchPersonDetailsEmailID()', func.logCons.LOG_ENTER);
  var encryEmailIds = []
  async.forEachOf(emailAddress, function(item, key, callbackinner) {
    if (item && item != '' && item != null) {
      item = item
      encryEmailIds.push(item);
    }
    callbackinner()
  }, function(error) {
    if (error) {
      return callback(new Error().stack, emailAddress)
    } else {
      getPersonIdsFromPersonDetails(env, body, urlMap, instituteIDs, fetchAllCandidateIDS, stage, encryEmailIds, function(error, personIDs) {
        if (error) return callback(new Error().stack, personIDs);
        else {
          callback(null, personIDs);
        }
      });
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getchPersonDetailsEmailID()', func.logCons.LOG_EXIT);
}

function getchCandidateDetailsID(env, body, urlMap, instituteIDs, fetchAllCampusDriveIDS, stage, emailAddress, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getchCandidateDetailsID()', func.logCons.LOG_ENTER);
  var candidateIDs = func.getValuesArrayFromJson(func.dbCons.FIELD_ID, fetchAllCampusDriveIDS)
  var projection = [];
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID));
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CAMPUS_DRIVE_ID, func.lightBlueCons.OP_IN, candidateIDs), urlMap, func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, projection, function(error, fetchAllCandidateIDS) {
    if (error) return callback(new Error().stack, fetchAllCandidateIDS);
    if (!fetchAllCandidateIDS || fetchAllCampusDriveIDS.length === 0) {
      var fetchAllCandidateIDS = []
      callback(null, fetchAllCandidateIDS);
    } else {
      getchPersonDetailsEmailID(env, body, urlMap, instituteIDs, fetchAllCandidateIDS, stage, emailAddress, function(error, candidateDetailsIdS) {
        if (error) return callback(new Error().stack, candidateDetailsIdS);
        else {
          callback(null, candidateDetailsIdS);
        }
      });
    }
  });
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getchCandidateDetailsID()', func.logCons.LOG_EXIT);
}
SelectedCandidateList.prototype.getCandidateListForGdPI = function(env, urlMap, body, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateListForGdPI()', func.logCons.LOG_ENTER);
  var designation = body[func.dbCons.COLLECTION_DESIGNATION];
  var candidate_details = body[func.dbCons.COLLECTION_CANDIDATE_DETAILS];
  var stage = body[func.dbCons.COLLECTION_JSON_STAGE];
  var instituteIDs = func.getValuesArrayFromJson(func.dbCons.FIELD_INSTITUTE_ID, candidate_details)
  var emailAddress = func.getValuesArrayFromJson(func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS, candidate_details)
  var projection = [];
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID));
  queryForDB = getCandidateDetailsIds(designation, instituteIDs);
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, queryForDB), urlMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, projection, function(error, fetchAllCampusDriveIDS) {
    if (error) return callback(new Error().stack, fetchAllCampusDriveIDS);
    if (!fetchAllCampusDriveIDS || fetchAllCampusDriveIDS.length === 0) {
      var fetchAllCampusDriveIDS = []
      callback(null, fetchAllCampusDriveIDS);
    } else {
      getchCandidateDetailsID(env, body, urlMap, instituteIDs, fetchAllCampusDriveIDS, stage, emailAddress, function(error, candidateDetailsIdS) {
        if (error) return callback(new Error().stack, candidateDetailsIdS);
        else {
          callback(null, candidateDetailsIdS);
        }
      });
    }
  });
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateListForGdPI()', func.logCons.LOG_EXIT);
};
exports.SelectedCandidateList = SelectedCandidateList;
