/**
 * The <code>candidate-exam-helpers.js</code>
 *
 * @author Payal Asodariya, Monika Mehta
 */

var func = require('../utils/functions')
var dbOp

function CandidateExamHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of institute details helper')
  DbOperation = require('./db-operations').DbOperation
  dbOp = new DbOperation()
}

/**
 *
 * @param {JSON} body
 * @param {JSON} orgNameMap
 * @param {Function} callback
 */
CandidateExamHelpers.prototype.getCandidateExamDetails = function (body, orgNameMap, callback) {
  var userID = body[func.dbCons.FIELD_USER_ID]
  var examId = body[func.dbCons.FIELD_EXAM_ID]
  let candidateExamId = body[func.msCons.FIELD_CANDIDATE_EXAM_DETAILS_ID]
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetails', func.logCons.LOG_ENTER)
  getCandidateDetailsByUserId(userID, orgNameMap, function (error, responseCandidate) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCandidateExamDetails = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, responseCandidate)
    } else if (responseCandidate.length === 0 || !responseCandidate) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      getCandidateExamDetailsById(candidateExamId,responseCandidate[0][func.dbCons.FIELD_ID], examId, orgNameMap, function (error, response) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCandidateExamDetails = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetails()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, response)
        } else if (response.length === 0 || !response) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetails()', func.logCons.LOG_EXIT)
          return callback(null, [])
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetails()', func.logCons.LOG_EXIT)
          callback(null, response)
        }
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetails()', func.logCons.LOG_EXIT)
      })
    }
  })
}
/**
 *
 * @param {JSON} body
 * @param {JSON} orgNameMap
 * @param {Function} callback
 */
CandidateExamHelpers.prototype.updateCandidateExamDetails = function (body, orgNameMap, callback) {
  var userID = body[func.dbCons.FIELD_USER_ID]
  var examId = body[func.dbCons.FIELD_EXAM_ID]
  let candidateExamId = body[func.msCons.FIELD_CANDIDATE_EXAM_DETAILS_ID]
  var status = body[func.dbCons.FIELD_STATUS]
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateExamDetails', func.logCons.LOG_ENTER)
  getCandidateDetailsByUserId(userID, orgNameMap, function (error, responseCandidate) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCandidateDetails = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, responseCandidate)
    } else if (responseCandidate.length === 0 || !responseCandidate) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      updateCandidateExamDetailsById(responseCandidate[0][func.dbCons.FIELD_ID], examId,candidateExamId, status, orgNameMap, function (error, response) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCandidateExamDetails = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetails()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, response)
        } else if (response.length === 0 || !response) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetails()', func.logCons.LOG_EXIT)
          return callback(null, [])
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetails()', func.logCons.LOG_EXIT)
          callback(null, response)
        }
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetails()', func.logCons.LOG_EXIT)
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateExamDetails', func.logCons.LOG_EXIT)

}
/**
 * this function is for getting candidate exam by CandidateId and ExamId
 * @param {Number} candidateId
 * @param {Number} examId
 * @param {JSON} urlMap
 * @param {function} callback
 */
function getCandidateExamDetailsById (candidateExamId,candidateId, examId, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetailsById()', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_ID, func.lightBlueCons.OP_EQUAL, candidateId))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_EXAM_ID, func.lightBlueCons.OP_EQUAL, examId))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, candidateExamId))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, func.dbCons.COLLECTION_CANDIDATE_EXAM_DETAILS, dbOp.getCommonProjection(), function (error, candidateExamDetail) {
    if (error) {
     func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while fetching candidate exam details = ' + JSON.stringify(error) + ' for candidate_id = ' + candidateId + 'and exam_id' + examId)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetailsById()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, candidateExamDetail)
    }
    if (!candidateExamDetail || candidateExamDetail.length === 0) {
      var response = []
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'No candidate exam details found for candidate_id = ' + candidateId + 'and exam_id' + examId)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetailsById()', func.logCons.LOG_EXIT)
      return callback(null, response)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetailsById()', func.logCons.LOG_EXIT)
      return callback(null, candidateExamDetail)
    }
  })
}

function getCandidateDetailsByUserId (userId, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsByUserId', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_ID, func.lightBlueCons.OP_EQUAL, userId)
  dbOp.findByQuery(query, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), getProjectionOverCandidateDetails(), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while fetching candidate details = ' + JSON.stringify(error) + ' for user id = ' + userId)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsByUserId()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'No candidate details found for user id = ' + userId)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsByUserId()', func.logCons.LOG_EXIT)
      callback(null, response)
    }
  })
}
/**
 * this function is for updating candidate exam by CandidateId and ExamId
 * @param {Number} candidateId
 * @param {Number} examId
 * @param {String} status
 * @param {JSON} urlMap
 * @param {Function} callback
 */
function updateCandidateExamDetailsById (candidateId, examId,candidateExamId, status, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateExamDetailsById()', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_ID, func.lightBlueCons.OP_EQUAL, candidateId))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_EXAM_ID, func.lightBlueCons.OP_EQUAL, examId))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, candidateExamId))
  var body = {}
  body[func.dbCons.FIELD_STATUS] = getEnumStatusFromValue(status)
  dbOp.update(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, func.dbCons.COLLECTION_CANDIDATE_EXAM_DETAILS, dbOp.getOperationJson(func.lightBlueCons.OP_SET, body), dbOp.getCommonProjection(), function (error, updatedCandidateExamDetail) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while updating candidate exam status = ' + JSON.stringify(error) + ' for candidate_id = ' + candidateId + 'and exam_id' + examId)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateExamDetailsById()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, updatedCandidateExamDetail)
    }
    if (!updatedCandidateExamDetail || updatedCandidateExamDetail.length === 0) {
      var response = []
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'No candidate found for candidate_id' + candidateId + 'and exam_id ' + examId, func.logCons.LOG_EXIT)
      return callback(null, response)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateExamDetailsById()', func.logCons.LOG_EXIT)
      return callback(null, updatedCandidateExamDetail)
    }
  })
}
/**
 * this function is for getting Number from String status
 * @param {String} value
 */
function getEnumStatusFromValue (value) {
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
/**
 * this function is for getting projection JSON
 */
function getProjectionOverCandidateDetails () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverCandidateDetails()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverCandidateDetails()', func.logCons.LOG_EXIT)
  return projection
}
exports.CandidateExamHelpers = CandidateExamHelpers
