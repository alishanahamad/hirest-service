/**
 * The <code>exam-score-details-calculation-helpers.js </code> use to retrieve student details for given campus drive id
 *
 * @author Kavish Kapadia
 */

var func = require('../utils/functions')
var async = require('async')
var DbOperation = require('./db-operations').DbOperation
var dbOp = new DbOperation()

/**
 * [ExamScoreDetailsCalculation is a constructor to create required objects]
 * @constructor
 */
function ExamScoreDetailsCalculationHelpers () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'exam-score-details-calculation-helpers obj created')
}

ExamScoreDetailsCalculationHelpers.prototype.getCampusStudentDetails = function (campusId, orgNameMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusStudentDetails', func.logCons.LOG_ENTER)
  if (campusId === null || campusId === undefined) {
    return callback(new Error().stack, [])
  } else {
    getStudentList(campusId, orgNameMap, function (error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCampusStudentDetails = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusStudentDetails()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, response)
      } else if (response.length === 0 || !response) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusStudentDetails()', func.logCons.LOG_EXIT)
        return callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Response from exam url' + JSON.stringify(response))
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusStudentDetails()', func.logCons.LOG_EXIT)
        callback(null, response)
      }
    })
  }
}

function getStudentList (campusDriveId, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getStudentList', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CAMPUS_DRIVE_ID, func.lightBlueCons.OP_EQUAL, campusDriveId))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_SOURCE_TYPE, func.lightBlueCons.OP_EQUAL, func.msCons.FIELD_CAMPUS))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CAMPUS_SOURCE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getStudentList dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getStudentList()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getStudentList()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      getCandidateIds(response, orgNameMap, function (error, list) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getStudentList dbOperation = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getStudentList()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, list)
        } else if (!list || list.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getStudentList()', func.logCons.LOG_EXIT)
          return callback(null, [])
        } else {
          getCandidateDetails(list, orgNameMap, function (error, result) {
            if (error) {
              func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getStudentList dbOperation = ' + error)
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getStudentList()', func.logCons.LOG_EXIT)
              return callback(new Error().stack, result)
            } else if (!result || result.length === 0) {
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getStudentList()', func.logCons.LOG_EXIT)
              return callback(null, [])
            } else {
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getStudentList()', func.logCons.LOG_EXIT)
              callback(null, result)
            }
          })
        }
      })
    }
  })
}

function getCandidateIds (response, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateIds', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_EQUAL, response[0][func.dbCons.FIELD_ID]))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_EQUAL, func.dbCons.ENUM_CANDIDATE_EXAM_PUBLISHED))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), getProjectionOverCandidateDetails(), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCandidateIds dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateIds()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateIds()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateIds()', func.logCons.LOG_EXIT)
      callback(null, response)
    }
  })
}

function getCandidateDetails (response, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails', func.logCons.LOG_ENTER)
  var json = []
  async.forEachOf(response, function (item, key, callbackinner) {
    getEmailId(item[func.dbCons.FIELD_USER_ID], orgNameMap, function (error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCandidateIds dbOperation = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateIds()', func.logCons.LOG_EXIT)
        return callbackinner()
      } else if (!response || response.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateIds()', func.logCons.LOG_EXIT)
        return callbackinner()
      } else {
        var jsonToAdd = {}
         var emailDecrypt = response[0][func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_EMAIL]
        // jsonToAdd[func.msCons.FIELD_CANDIDATE_EMAIL_ADDRESS] = (response[0][func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_EMAIL]
        getExamUrls(item[func.dbCons.FIELD_ID], orgNameMap, function (error, result) {
          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCandidateIds dbOperation = ' + error)
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateIds()', func.logCons.LOG_EXIT)
            return callbackinner()
          } else if (!result || result.length === 0) {
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateIds()', func.logCons.LOG_EXIT)
            return callbackinner()
          } else {
            jsonToAdd[func.msCons.FIELD_CANDIDATE_EMAIL_ADDRESS] = emailDecrypt
            jsonToAdd[func.msCons.FIELD_SURVEY_URLS_ARRAY] = getList(result)
            json.push(jsonToAdd)
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateIds()', func.logCons.LOG_EXIT)
            callbackinner()
          }
        })
      }
    })
  }, function (error) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, json)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails()', func.logCons.LOG_EXIT)
      callback(null, json)
    }
  })
}

function getEmailId (id, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getEmailId', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, id)
  dbOp.findByQuery(query, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_USER_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getProjectionJson(func.dbCons.FIELD_PROFILE_DATA, true, true), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getEmailId dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getEmailId()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getEmailId()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getEmailId()', func.logCons.LOG_EXIT)
      callback(null, response)
    }
  })
}

function getExamUrls (id, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamUrls', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_ID, func.lightBlueCons.OP_EQUAL, id)
  dbOp.findByQuery(query, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_EXAM_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getExamUrls dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamUrls()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamUrls()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamUrls()', func.logCons.LOG_EXIT)
      callback(null, response)
    }
  })
}

function getList (response) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getList()', func.logCons.LOG_ENTER)
  var json = []
  for (var index in response) {
    if (response[index][func.dbCons.FIELD_QUESTIONNAIRE_LINK] !== null && response[index][func.dbCons.FIELD_QUESTIONNAIRE_LINK] !== undefined) {
      json.push(response[index][func.dbCons.FIELD_QUESTIONNAIRE_LINK])
    }
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getList()', func.logCons.LOG_EXIT)
  return json
}

function getProjectionOverCandidateDetails () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverCandidateDetails()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_USER_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverCandidateDetails()', func.logCons.LOG_EXIT)
  return projection
}

exports.ExamScoreDetailsCalculationHelpers = ExamScoreDetailsCalculationHelpers
