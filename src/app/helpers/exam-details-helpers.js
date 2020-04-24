var func = require('../utils/functions')
var Client = require('node-rest-client').Client
var client = new Client()
var async = require('async')
var dbOp
var dateFormat = require('dateformat')

function GetExamDetailsHelper() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of get exam details data helper')
  DbOperation = require('./db-operations').DbOperation
  dbOp = new DbOperation()
}

GetExamDetailsHelper.prototype.getExamDetailsData = function(candidateExamId,exam_id, userCode, token, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamDetailsData()', func.logCons.LOG_ENTER)
  getCandidateIdfromCandidateDetails(userCode, urlMap, function(error, candidateData) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'CandidateDetailsCollection dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'CandidateDetailsCollection()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, candidateData)
    } else if (!candidateData || candidateData.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'CandidateDetailsCollection()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'Candidate id  = ' + candidateData[0][func.dbCons.COLLECTION_CANDIDATE_DETAILS_ID])
      getExamLinkFromCandidateExamDetals(candidateExamId,exam_id, candidateData[0][func.dbCons.COLLECTION_CANDIDATE_DETAILS_ID], urlMap, function(error, examDetailsLink) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getExamLinkFromCandidateExamDetals dbOperation = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamLinkFromCandidateExamDetals()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, examDetailsLink)
        } else if (!examDetailsLink || examDetailsLink.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamLinkFromCandidateExamDetals()', func.logCons.LOG_EXIT)
          return callback(null, [])
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamLinkFromCandidateExamDetals()', func.logCons.LOG_EXIT)
          callback(null, examDetailsLink)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamDetailsData()', func.logCons.LOG_EXIT)
}

function getQueryJsonForExamDetails(candidateExamId,exam_id, userCode) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getQueryJsonForExamDetails()', func.logCons.LOG_ENTER);
  var queryorArray = [];
  queryorArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_EQUAL, func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_AVAILABLE));
  queryorArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_EQUAL, func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_IN_PROGRESS));
  var queryAndArray = [];
  queryAndArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_EXAM_ID, func.lightBlueCons.OP_EQUAL, exam_id));
  queryAndArray.push(dbOp.getQueryJsonForOp(func.dbCons.COLLECTION_CANDIDATE_EXAM_DETAILS_CANDIDATE_ID, func.lightBlueCons.OP_EQUAL, userCode));
  queryAndArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, candidateExamId));
  queryAndArray.push(dbOp.getOperationJson(func.lightBlueCons.OP_OR, queryorArray))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getQueryJsonForExamDetails()', func.logCons.LOG_EXIT);
  return dbOp.getOperationJson(func.lightBlueCons.OP_AND, queryAndArray);
}

function getCandidateIdfromCandidateDetails(userCode, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside getCandidateIdfromCandidateDetails()', func.logCons.LOG_ENTER)
  dbOp.findByKey(func.dbCons.FIELD_USER_ID, func.lightBlueCons.OP_EQUAL, userCode, urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function(error, candidateData) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching candidate_id = ' + JSON.stringify(error) + 'for user_code: ' + userCode)
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCandidateIdfromCandidateDetails dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateIdfromCandidateDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, candidateData)
    } else if (!candidateData || candidateData.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'no candidate_id found for user_code = ' + userCode)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateIdfromCandidateDetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateIdfromCandidateDetails()', func.logCons.LOG_EXIT)
      callback(null, candidateData)
    }
  });
}

function getExamLinkFromCandidateExamDetals(candidateExamId,examId, candidateId, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamLinkFromCandidateExamDetals()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(getQueryJsonForExamDetails(candidateExamId,examId, candidateId), urlMap, func.dbCons.COLLECTION_CANDIDATE_EXAM_DETAILS, dbOp.getProjectionJson(func.dbCons.FIELD_EXAM_QUESTIONNAIRE_LINK), function(error, examDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching exam_link for candidate_exam_status as Available or InProgress = ' + JSON.stringify(error) + 'for exam_id: ' + examId + ' and candidate_id: ' + candidateId)
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getExamLinkFromCandidateExamDetals dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamLinkFromCandidateExamDetals()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, examDetails)
    } else if (!examDetails || examDetails.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'no exam_link found for candidate_exam_status as Available or InProgress for exam_id = ' + examId + ' and candidate_id: ' + candidateId)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamLinkFromCandidateExamDetals()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamLinkFromCandidateExamDetals()', func.logCons.LOG_EXIT)
      callback(null, examDetails)
    }
  });
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamLinkFromCandidateExamDetals()', func.logCons.LOG_EXIT)
}
GetExamDetailsHelper.prototype.updateExamStatus = function(candidateExamId,examId, userId, status, orgNameMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateExamStatus', func.logCons.LOG_ENTER)
  getCandidateDetails(userId, orgNameMap, function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'updateExamStatus = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateExamStatus()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (response.length === 0 || !response) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateExamStatus()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      getExamDurationDetails(examId, orgNameMap, function(error, getExamDuration) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getExamDurationDetails = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamDurationDetails()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, response)
        } else if (response.length === 0 || !response) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamDurationDetailsd()', func.logCons.LOG_EXIT)
          return callback(null, [])
        } else {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'getExamDuration = ' + getExamDuration[0][func.dbCons.FIELD_EXAM_DURATION])
          updateCandidateExamDetails(candidateExamId,response[0], getExamDuration[0][func.dbCons.FIELD_EXAM_DURATION], examId, status, orgNameMap, function(error, updateResponse) {
            if (error) {
              func.printLog(func.logCons.LOG_LEVEL_ERROR, 'updateExamStatus = ' + error)
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateExamStatus()', func.logCons.LOG_EXIT)
              return callback(new Error().stack, response)
            } else if (response.length === 0 || !response) {
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateExamStatus()', func.logCons.LOG_EXIT)
              return callback(null, [])
            } else {
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateExamStatus()', func.logCons.LOG_EXIT)
              return callback(null, updateResponse)
            }
          })
        }
      })
    }
  })
}

function getExamDurationDetails(examId, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamDurationDetails', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_EXAM_DURATION, true, true))
  var query = dbOp.getQueryJsonForOp(func.dbCons.EXAM_ID, func.lightBlueCons.OP_EQUAL, examId)
  dbOp.findByQuery(query, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_EXAM_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), projection, function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'error while fetching exam_duration: ' + JSON.stringify(error) + ' for exam_id: ' + examId)
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getExamDurationDetails dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamDurationDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'no exam_duration  found for exam_id = ' + examId)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamDurationDetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamDurationDetails()', func.logCons.LOG_EXIT)
      callback(null, response)
    }
  })
}

function getCandidateDetails(userId, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_ID, func.lightBlueCons.OP_EQUAL, userId)
  dbOp.findByQuery(query, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), getProjectionOverCandidateDetails(), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching candidate details = ' + JSON.stringify(error) + 'for user_id: ' + userId)
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCandidateDetails dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'no candidate_details found for user_id: ' + userId)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails()', func.logCons.LOG_EXIT)
      callback(null, response)
    }
  })
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000)
}

function updateCandidateExamDetails(candidateExamId,response, ExamDuration, examId, status, orgNameMap, callback) {
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_ID, func.lightBlueCons.OP_EQUAL, response[func.dbCons.FIELD_ID]))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_EXAM_ID, func.lightBlueCons.OP_EQUAL, examId))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, candidateExamId))
  var json = {}
  json[func.dbCons.FIELD_STATUS] = getEnumStatusFromValue(status.toUpperCase())
  json[func.dbCons.FIELD_START_TIME] = dateFormat(new Date(), func.msCons.FIELD_DATE_FORMAT_BACKEND)
  json[func.dbCons.FIELD_END_TIME] = dateFormat(addMinutes(new Date(), ExamDuration), func.msCons.FIELD_DATE_FORMAT_BACKEND)
  dbOp.update(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_EXAM_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getOperationJson(func.lightBlueCons.OP_SET, json), dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while updating exam status,end_time and start_time exam details = ' + JSON.stringify(error) + 'for exam_id: ' + examId)
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'updateCandidateExamDetails dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateExamDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'no data found in exam details for exam_id: ' + examId)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateExamDetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateExamDetails()', func.logCons.LOG_EXIT)
      callback(null, response)
    }
  })
}

function getProjectionOverCandidateDetails() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverCandidateDetails()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PERSON_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_STATUS, true, true))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverCandidateDetails()', func.logCons.LOG_EXIT)
  return projection
}

function getEnumStatusFromValue(value) {
  switch (value) {
    case func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_AVAILABLE:
      return func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_AVAILABLE
    case func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_IN_PROGRESS:
      return func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_IN_PROGRESS
    case func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_COMPLETED:
      return func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_COMPLETED
    case func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_SYSTEM_CLOSED:
      return func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_SYSTEM_CLOSED
    case func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_CLOSED:
      return func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_CLOSED
    default:
      return -1
  }
}
exports.GetExamDetailsHelper = GetExamDetailsHelper
