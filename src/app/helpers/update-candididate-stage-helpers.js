var func = require('../utils/functions')
var dbOp
var fs = require('fs')
var HELPER_CONS = 'HS_UCS_'

function UpdateCandidateStage () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of update candidate stage helper')
  DbOperation = require('./db-operations').DbOperation
  dbOp = new DbOperation()
}

function getEnumStatusFromValue (value) {
  switch (value) {
    case func.dbCons.ENUM_STAGE_FOR_GD:
      return func.dbCons.ENUM_SELECTED_FOR_GD
    case func.dbCons.ENUM_STAGE_FOR_PI:
      return func.dbCons.ENUM_SELECTED_FOR_PI
    case func.dbCons.ENUM_STAGE_IN_PI:
      return func.dbCons.ENUM_SELECTED_IN_PI
    case func.dbCons.VALUE_STAGE_IN_PI_HR:
      return func.dbCons.ENUM_STAGE_IN_PI_HR
    case func.dbCons.VALUE_SELECTED_IN_PI_FOR_ONSITE:
      return func.dbCons.ENUM_STAGE_SELECTED_IN_PI_FOR_ONSITE
    case func.dbCons.VALUE_SELECTED_IN_GD_FOR_ONSITE:
      return func.dbCons.ENUM_STAGE_SELECTED_IN_GD_FOR_ONSITE
    case func.dbCons.VALUE_SELECTED_IN_PI_BY_ASSESSOR_FROM_ONSITE:
      return func.dbCons.ENUM_SELECTED_IN_PI_BY_ASSESSOR_FROM_ONSITE
    case func.dbCons.VALUE_SELECTED_IN_PI_BY_ADMIN_FROM_ONSITE:
      return func.dbCons.ENUM_SELECTED_IN_PI_BY_ADMIN_FROM_ONSITE
    case func.dbCons.VALUE_DOWNLOAD_CANDIDATE_OFFER_LETTER:
      return func.dbCons.ENUM_STAGE_DOWNLOAD_CANDIDATE_OFFER_LETTER
    case func.dbCons.VALUE_UPLOAD_CANDIDATE_OFFER_LETTER:
      return func.dbCons.ENUM_STAGE_UPLOAD_CANDIDATE_OFFER_LETTER
  
    default:
      return -1
  }
}

UpdateCandidateStage.prototype.updateStageForCandidate = function (body, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateStageForCandidate()', func.logCons.LOG_ENTER)
  var candidateIds = body[func.dbCons.FIELD_CANDIDATE_ID]
  var bodyData = {}
  bodyData[func.dbCons.COLLECTION_JSON_STAGE] = getEnumStatusFromValue(body[func.dbCons.COLLECTION_JSON_STAGE])
  if (bodyData[func.dbCons.COLLECTION_JSON_STAGE] !== -1) {
    dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidateIds), urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, dbOp.getOperationJson(func.lightBlueCons.OP_SET, bodyData), dbOp.getCommonProjection(), function (error, updatedCandidateDetail) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateExamDetailsById()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, updatedCandidateDetail)
      }
      if (!updatedCandidateDetail || updatedCandidateDetail.length === 0) {
        return callback(new Error().stack, func.errorsArrayGenrator(func.errorObjectGenrator(func.msgCons.CODE_BAD_REQUEST + '_1', func.msgCons.MSG_CANDIDATE_LIST_NOT_FOUND), func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_CANDIDATE_LIST_NOT_FOUND))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updatedCandidateDetail()', func.logCons.LOG_EXIT)
        return callback(null, updatedCandidateDetail)
      }
    })
  } else {
    return callback(new Error().stack, func.errorsArrayGenrator(func.errorObjectGenrator(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_FOR_BAD_REQUEST), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_FOR_BAD_REQUEST))
  }

  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateStageForCandidate()', func.logCons.LOG_EXIT)
}

exports.UpdateCandidateStage = UpdateCandidateStage
