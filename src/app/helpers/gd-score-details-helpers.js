'use-strict'
/**
 * The <code>gd-score-details-helpers.js</code>
 *
 * @author Monika Mehta, Rishabh Gandhi, Ashita Shah, Dipak Savaliya
 */

var func = require('../utils/functions')
var async = require('async')
var _ = require('lodash')
var fs = require('fs')
var choiceWtMaping = JSON.parse(fs.readFileSync('./json_files/choices-mapping.json'))
var DbOperation = require('./db-operations').DbOperation
var dbOp = new DbOperation()
var assessmentIcons = func.config.get('assessment_param_icons')
var HELPER_CONS = 'HS_GDSDH_'

function GdScoreDetailsHelpers () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of get gd score details helper')
}

/**
 * UPDATE API SCORE HELPER
 * @param  {[type]}   gdScoreDataToUpdate [description]
 * @param  {[type]}   urlMap              [description]
 * @param  {Function} callback            [description]
 * @return {[type]}                       [description]
 */
GdScoreDetailsHelpers.prototype.updateGDScoreDetails = function (gdScoreDataToUpdate, roundType, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'update gd score details where request body is = ' + JSON.stringify(gdScoreDataToUpdate), func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateGDScoreDetails()', func.logCons.LOG_ENTER)
  upsertGDScore(gdScoreDataToUpdate, roundType, urlMap, function (error, updatedGdScore) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'updateGDScoreDetails = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateGDScoreDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, updatedGdScore)
    } else if (updatedGdScore.length === 0 || !updatedGdScore) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateGDScoreDetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateGDScoreDetails()', func.logCons.LOG_EXIT)
      return callback(null, func.responseGenerator([], HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_GD_SCORE_DETAILS_UPDATED))
    }
  })
}

/**
 * GET SCORE API HELPER
 * @param  {[type]}   body     [description]
 * @param  {[type]}   urlMap   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
GdScoreDetailsHelpers.prototype.getScoreDetails = function (body, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGDScoreDetails()', func.logCons.LOG_ENTER)
  if (body[func.dbCons.COLLECTION_JSON_STAGE] === 2) {
    callFetchGdScoreDetails(body[func.dbCons.COLLECTION_JSON_STAGE], body[func.msCons.STAGE_DETAIL_ID], urlMap, callback)
  } else if (body[func.dbCons.COLLECTION_JSON_STAGE] === 3) {
    callFetchPiScoreDetails(body[func.dbCons.COLLECTION_JSON_STAGE], body[func.msCons.STAGE_DETAIL_ID], urlMap, callback)
  } else {
    return callback(null, [])
  }
}

function upsertGDScore (gdScoreDataToUpdate, roundType, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'upsertGDScore()', func.logCons.LOG_ENTER)
  var assessorId = gdScoreDataToUpdate[func.dbCons.ASSESSOR_ID]
  var gdGroupDetailsId = gdScoreDataToUpdate[func.dbCons.GD_GROUP_DETAILS_ID]
  var updateJSON = {}
  var candidateGdStatus = func.dbCons.ENUM_STATUS_GROUP_EVALUATION_DONE
  async.forEachOf(gdScoreDataToUpdate[func.msCons.FIELD_CANDIDATE_SCORES], function (candidateScore, index, callbackInner) {
    var candidateId = candidateScore[func.dbCons.FIELD_CANDIDATE_ID]
    if (gdScoreDataToUpdate[func.dbCons.FIELD_STATUS] === func.dbCons.VALUE_GD_SCORE_IN_DRAFT) {
      updateJSON[func.dbCons.FIELD_DRAFT_SCORE_DETAILS_JSON] = (JSON.stringify(candidateScore)).toString()
      updateJSON[func.dbCons.FIELD_STATUS] = func.dbCons.ENUM_GD_SCORE_IN_DRAFT
      candidateGdStatus = func.dbCons.ENUM_STATUS_GD_GROUP_IN_DRAFT
      dbOperationToUpdate(assessorId, gdGroupDetailsId, candidateId, updateJSON, urlMap, callbackInner)
    } else if (gdScoreDataToUpdate[func.dbCons.FIELD_STATUS] === func.dbCons.VALUE_GD_SCORE_COMPLETED) {
      candidateGdStatus = func.dbCons.ENUM_STATUS_GROUP_EVALUATION_DONE
      generateUpdateJSON(candidateScore, roundType, function (error, updateJSON) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `error = ${JSON.stringify(error)}`)
          callbackInner()
        } else {
          dbOperationToUpdate(assessorId, gdGroupDetailsId, candidateId, updateJSON, urlMap, callbackInner)
        }
      })
    }
  }, function (error) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'upsertGDScore async call = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'upsertGDScore()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP))
    } else {
      changeStatusInGdGroupDetail(gdGroupDetailsId, candidateGdStatus, urlMap, function (error, updateStatusResponse) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'changeStatusInGdGroupDetail = ' + JSON.stringify(error))
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'changeStatusInGdGroupDetail()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, updateStatusResponse)
        } else if (updateStatusResponse.length === 0 || !updateStatusResponse) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'changeStatusInGdGroupDetail()', func.logCons.LOG_EXIT)
          return callback(null, updateStatusResponse)
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'changeStatusInGdGroupDetail()', func.logCons.LOG_EXIT)
          return callback(null, updateStatusResponse)
        }
      })
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'upsertGDScore()', func.logCons.LOG_EXIT)
    }
  })
}

function generateUpdateJSON (candidateScore, roundType, cb) {
  var updateJSON = {}
  var scoreDetailJson = {}
  var gdScoreJson = {}
  candidateScore[func.msCons.PARAM_VALUES].filter(function (obj) {
    scoreDetailJson[obj[func.msCons.FIELD_PARAM_DISPLAY_NAME]] = obj[func.msCons.RESPONSE_GIVEN]
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `scoreDetailJson = ${JSON.stringify(scoreDetailJson)}`)
  getAverageOfResponse(scoreDetailJson, function (error, updatedScoreDetailsJson) {
    if (error) return cb(new Error().stack, 'error in genrateing avg score')
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `updatedScoreDetailsJson = ${JSON.stringify(updatedScoreDetailsJson)}`)
    gdScoreJson[func.msCons.FIELD_GD_SCORE_DETAILS] = updatedScoreDetailsJson
    gdScoreJson[func.msCons.FIELD_EXAM_SCORE] = candidateScore[func.msCons.FIELD_EXAM_SCORE]
    if (candidateScore[func.msCons.FIELD_PREVIOUS_SCORES] != undefined) {
      gdScoreJson[func.msCons.FIELD_PREVIOUS_SCORES] = candidateScore[func.msCons.FIELD_PREVIOUS_SCORES]
    }
    updateJSON[func.dbCons.SCORE_DETAIL_JSON] = (JSON.stringify(gdScoreJson)).toString()
    updateJSON[func.dbCons.FIELD_STATUS] = func.dbCons.ENUM_GD_SCORE_COMPLETED
    updateJSON[func.dbCons.FIELD_DRAFT_SCORE_DETAILS_JSON] = (JSON.stringify(candidateScore)).toString()
    cb(null, updateJSON)
  })
}

getAverageOfResponse = function (gdScoreJson, cbAverageValue) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAverageOfResponse()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + `gdScoreJson =  ${JSON.stringify(gdScoreJson)}`)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `choiceWtMaping =  ${JSON.stringify(choiceWtMaping)}`)
  var weightageOfResponse = []
  async.forEachOf(gdScoreJson, function (scoreValue, catName, callback) {
    if (!choiceWtMaping[catName]) {
      return callback()
    }
    weightageOfResponse.push(choiceWtMaping[catName][scoreValue[func.msCons.FIELD_SELECTED_VALUE]])
    callback()
  }, function (err) {
    if (err) return cbAverageValue(new Error().stack, func.errorsArrayGenrator(func.errorObjectGenrator(HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `weightageOfResponse =  ${JSON.stringify(weightageOfResponse)}`)
    gdScoreJson[func.msCons.FIELD_AVERAGE_OF_SCORE] = {}
    gdScoreJson[func.msCons.FIELD_AVERAGE_OF_SCORE][func.msCons.FIELD_SELECTED_VALUE] = recognizeNumber(func.averageOfNumber(weightageOfResponse))
    gdScoreJson[func.msCons.FIELD_AVERAGE_OF_SCORE][func.msCons.FIELD_WEIGHTAGE] = func.averageOfNumber(weightageOfResponse)
    gdScoreJson[func.msCons.FIELD_AVERAGE_OF_SCORE][func.dbCons.FIELD_ASSESSMENT_PARAM_URL] = assessmentIcons[func.configCons.FIELD_AVERAGE_SCORE_ICON]
    cbAverageValue(null, gdScoreJson)
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAverageOfResponse()', func.logCons.LOG_EXIT)
}

function recognizeNumber (value) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'recognizeNumber()', func.logCons.LOG_ENTER)
  var scoreMap = choiceWtMaping[func.configCons.FIELD_AVERAGE_SCORE]
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `scoreMap =  ${JSON.stringify(scoreMap)}`)
  var possibleScores = Object.keys(scoreMap)
  var closest = possibleScores.reduce(function (prev, curr) {
    return (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev)
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'recognizeNumber()', func.logCons.LOG_EXIT)
  return scoreMap[closest]
}

function dbOperationToUpdate (assessorId, gdGroupDetailsId, candidateId, updateJSON, urlMap, callback) {
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.ASSESSOR_ID, func.lightBlueCons.OP_EQUAL, parseInt(assessorId)))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.GD_GROUP_DETAILS_ID, func.lightBlueCons.OP_EQUAL, gdGroupDetailsId))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_ID, func.lightBlueCons.OP_EQUAL, candidateId))
  dbOp.update(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_GD_SCORE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getOperationJson(func.lightBlueCons.OP_SET, updateJSON), function (error, updatedGdScore) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while updating score in gd_score_details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToUpdate()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, updatedGdScore)
    } else if (!updatedGdScore || updatedGdScore.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Data is not updated successfully in gd_score_details ')
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToUpdate()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToUpdate()', func.logCons.LOG_EXIT)
      callback(null, updatedGdScore)
    }
  })
}

function changeStatusInGdGroupDetail (gdGroupDetailId, candidateGdStatus, urlMap, callback) {
  var jsonToUpdate = {}
  jsonToUpdate[func.dbCons.FIELD_GD_STATUS] = candidateGdStatus
  let query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_GD_GROUP_DETAILS_ID, func.lightBlueCons.OP_EQUAL, gdGroupDetailId))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_GD_STATUS, func.lightBlueCons.OP_NOT_EQUAL, func.dbCons.ENUM_STATUS_CANDIDATE_NOT_APPEARED_IN_GD))
  dbOp.update(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_GD_GROUP_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getOperationJson(func.lightBlueCons.OP_SET, jsonToUpdate), function (error, updatedGdGroupStatus) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while updating status in gd_score_details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'changeStatusInGdGroupDetail()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, updatedGdGroupStatus)
    } else if (!updatedGdGroupStatus || updatedGdGroupStatus.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Data is not updated successfully in gd_group_details for gr_group_id' + gdGroupDetailId)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'changeStatusInGdGroupDetail()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      callback(null, updatedGdGroupStatus)
    }
  })
}

/*********************************************************************************************************
                                GET API PRIVATE FUNCTIONS
*********************************************************************************************************/

function callFetchGdScoreDetails (stage, groupDetailsIds, urlMap, cbCallFetchGdScoreDetails) {
  fetchGdScoreDetails(groupDetailsIds, urlMap, function (error, gdScoreDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getGdScore dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGDScoreDetails()', func.logCons.LOG_EXIT)
      return cbCallFetchGdScoreDetails(new Error().stack, error)
    } else if (!gdScoreDetails || gdScoreDetails.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no gd score details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGDScoreDetails()', func.logCons.LOG_EXIT)
      return cbCallFetchGdScoreDetails(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGdScore dbOperation = ' + gdScoreDetails)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGDScoreDetails()', func.logCons.LOG_EXIT)
      generateScoreIngredientJson(stage, gdScoreDetails, groupDetailsIds, urlMap, cbCallFetchGdScoreDetails)
    }
  })
}

function callFetchPiScoreDetails (stage, piDetailsIds, urlMap, cbCallFetchPiScoreDetails) {
  fetchPiScoreDetails(piDetailsIds, urlMap, function (error, piScoreDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'fetchPiScoreDetails dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchPiScoreDetails()', func.logCons.LOG_EXIT)
      return cbCallFetchPiScoreDetails(new Error().stack, error)
    } else if (!piScoreDetails || piScoreDetails.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no gd score details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchPiScoreDetails()', func.logCons.LOG_EXIT)
      return cbCallFetchPiScoreDetails(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchPiScoreDetails dbOperation = ' + piScoreDetails)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchPiScoreDetails()', func.logCons.LOG_EXIT)
      generateScoreIngredientJson(stage, piScoreDetails, piDetailsIds, urlMap, cbCallFetchPiScoreDetails)
    }
  })
}

function fetchGdScoreDetails (groupDetailsIds, urlMap, cbGdScores) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchGdScoreDetails()', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.GD_GROUP_DETAILS_ID, func.lightBlueCons.OP_IN, groupDetailsIds))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.SCORE_DETAIL_JSON, func.lightBlueCons.OP_NOT_EQUAL, ''))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, func.dbCons.COLLECTION_GD_SCORE_DETAILS, dbOp.getCommonProjection(), function (error, gdScoreDetailsData) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching gd score details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchGdScoreDetails()', func.logCons.LOG_EXIT)
      return cbGdScores(new Error().stack, gdScoreDetailsData)
    } else if (!gdScoreDetailsData || gdScoreDetailsData.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no gd score details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchGdScoreDetails()', func.logCons.LOG_EXIT)
      return cbGdScores(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'GdScoreDetails: ', gdScoreDetailsData)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchGdScoreDetails()', func.logCons.LOG_EXIT)
      cbGdScores(null, gdScoreDetailsData)
    }
  })
}

function fetchPiScoreDetails (piDetailsIds, urlMap, cbGdScores) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchPiScoreDetails()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID, func.lightBlueCons.OP_IN, piDetailsIds), urlMap, func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, dbOp.getCommonProjection(), function (error, piScoreDetailsData) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching pi score details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchPiScoreDetails()', func.logCons.LOG_EXIT)
      return cbGdScores(new Error().stack, gdScoreDetailsData)
    } else if (!piScoreDetailsData || piScoreDetailsData.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no pi score details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchPiScoreDetails()', func.logCons.LOG_EXIT)
      return cbGdScores(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchPiScoreDetails: ', piScoreDetailsData)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchPiScoreDetails()', func.logCons.LOG_EXIT)
      cbGdScores(null, piScoreDetailsData)
    }
  })
}

function getCandidateDetailsFromCandidateId (candidateDetailsId, urlMap, cbCandidateDetails) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsFromCandidateId()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidateDetailsId), urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, dbOp.getCommonProjection(), function (error, candidateDetailsData) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching candidate details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsFromCandidateId()', func.logCons.LOG_EXIT)
      return cbCandidateDetails(new Error().stack, error)
    } else if (!candidateDetailsData || candidateDetailsData.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no candidate details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsFromCandidateId()', func.logCons.LOG_EXIT)
      return cbCandidateDetails(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchCandidateDetails: ', candidateDetailsData)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsFromCandidateId()', func.logCons.LOG_EXIT)
      cbCandidateDetails(null, candidateDetailsData)
    }
  })
}

function getAssessorDetailsFromAssessorId (assessorDetailsIds, urlMap, cbAssessorDetails) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessorDetailsFromAssessorId()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_USER_CODE, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PROFILE_DATA + '.' + func.dbCons.FIELD_GIVEN_NAME, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PROFILE_DATA + '.' + func.dbCons.FIELD_FAMILY_NAME, true, true))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_IN, assessorDetailsIds), urlMap, func.dbCons.COLLECTION_USER_DETAILS, projection, function (error, assessorDetailsData) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching assessor details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessorDetailsFromAssessorId()', func.logCons.LOG_EXIT)
      return cbAssessorDetails(new Error().stack, error)
    } else if (!assessorDetailsData || assessorDetailsData.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no assessor details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessorDetailsFromAssessorId()', func.logCons.LOG_EXIT)
      return cbAssessorDetails(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessorDetailsFromAssessorId: ', assessorDetailsData)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessorDetailsFromAssessorId()', func.logCons.LOG_EXIT)
      cbAssessorDetails(null, assessorDetailsData)
    }
  })
}

function getGdGroupDetailsFromGdGroupDetailsId (gdGroupDetailsId, urlMap, cbGdGroupDetails) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGdGroupDetailsFromGdGroupDetailsId()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_GD_GROUP_DETAILS_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_GD_LOCATION, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_GD_DATE, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID, true, true))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_GD_GROUP_DETAILS_ID, func.lightBlueCons.OP_IN, gdGroupDetailsId), urlMap, func.dbCons.COLLECTION_GD_GROUP_DETAILS, projection, function (error, gdGroupDetailsData) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching Gd Group details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGdGroupDetailsFromGdGroupDetailsId()', func.logCons.LOG_EXIT)
      return cbGdGroupDetails(new Error().stack, error)
    } else if (!gdGroupDetailsData || gdGroupDetailsData.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no Gd Group details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGdGroupDetailsFromGdGroupDetailsId()', func.logCons.LOG_EXIT)
      return cbGdGroupDetails(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGdGroupDetailsFromGdGroupDetailsId: ', gdGroupDetailsData)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGdGroupDetailsFromGdGroupDetailsId()', func.logCons.LOG_EXIT)
      cbGdGroupDetails(null, gdGroupDetailsData)
    }
  })
}

function getCampusDriveIdsFromCandidateSourceId (candidateSourceIds, scoreDetails, urlMap, cbPiCandidateSourceDetails) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdsFromCandidateSourceId()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, true, true))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidateSourceIds), urlMap, func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, projection, function (error, campusDriveIds) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching campus_drive_id for candidate_source_id' + candidateSourceIds + 'from candidate source details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdsFromCandidateSourceId()', func.logCons.LOG_EXIT)
      return cbPiCandidateSourceDetails(new Error().stack, error)
    } else if (!campusDriveIds || campusDriveIds.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no campus_drive_id found for candidate_source_id = ' + candidateSourceIds + 'Error = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdsFromCandidateSourceId()', func.logCons.LOG_EXIT)
      return cbPiCandidateSourceDetails(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdsFromCandidateSourceId: ', campusDriveIds)
      scoreDetails.filter(function (obj) {
        var gdGroup = func.filterBasedOnValue(campusDriveIds, func.dbCons.FIELD_ID, obj[func.dbCons.FIELD_CANDIDATE_SOURCE_ID])
        obj[func.dbCons.FIELD_CAMPUS_DRIVE_ID] = gdGroup[0][func.dbCons.FIELD_CAMPUS_DRIVE_ID]
      })
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdsFromCandidateSourceId()', func.logCons.LOG_EXIT)
      cbPiCandidateSourceDetails(null, scoreDetails)
    }
  })
}

function getCandidateNameFromPersonId (candidateDetails, urlMap, cbCandidateName) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateNameFromPersonId()', func.logCons.LOG_ENTER)
  var candidateIdArray = func.getValuesArrayFromJson(func.dbCons.FIELD_PERSON_ID, candidateDetails)
  getPersonDetailsFromPersonId(candidateIdArray, urlMap, function (error, personDetails) {
    if (error) {
      return cbCandidateName(new Error().stack, error)
    } else {
      cbCandidateName(null, personDetails)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateNameFromPersonId()', func.logCons.LOG_ENTER)
}

function getPersonDetailsFromPersonId (personDetailsId, urlMap, cbPersonDetails) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromPersonId()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.CANDIDATE_FIELD_FIRST_NAME, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.CANDIDATE_FIELD_LAST_NAME, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_RESUME_FILE, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.CANDIDATE_FIELD_PROFILE_IMAGE, true, true))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, personDetailsId), urlMap, func.dbCons.COLLECTION_PERSON_DETAILS, projection, function (error, personDetailsData) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching Gd Group details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromPersonId()', func.logCons.LOG_EXIT)
      return cbPersonDetails(new Error().stack, error)
    } else if (!personDetailsData || personDetailsData.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no Gd Group details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromPersonId()', func.logCons.LOG_EXIT)
      return cbPersonDetails(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromPersonId: ', personDetailsData)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromPersonId()', func.logCons.LOG_EXIT)
      cbPersonDetails(null, personDetailsData)
    }
  })
}

function getDesignationFromCampusDriveId (campusDriveDetails, urlMap, cbDesignation) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateNameFromPersonId()', func.logCons.LOG_ENTER)
  getCampusDriveDetailsFromCampusDriveId(func.getValuesArrayFromJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, campusDriveDetails), urlMap, function (error, designationDetails) {
    if (error) {
      return cbDesignation(new Error().stack, error)
    } else {
      cbDesignation(null, designationDetails)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateNameFromPersonId()', func.logCons.LOG_ENTER)
}

function getCampusDriveDetailsFromCampusDriveId (campusDriveId, urlMap, cbCampusDriveDetails) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDetailsFromCampusDriveId()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_DESIGNATION, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_INSTITUTE_ID, true, true))
  dbOpertationForCampusDriveDetails(campusDriveId, projection, urlMap, function (error, campusDriveDetailsResponse) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching Gd Group details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDetailsFromCampusDriveId()', func.logCons.LOG_EXIT)
      return cbCampusDriveDetails(new Error().stack, error)
    } else if (!campusDriveDetailsResponse || campusDriveDetailsResponse.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no Gd Group details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDetailsFromCampusDriveId()', func.logCons.LOG_EXIT)
      return cbCampusDriveDetails(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDetailsFromCampusDriveId: ', campusDriveDetailsResponse)
      fetchInstituteName(campusDriveDetailsResponse, urlMap, cbCampusDriveDetails)
    }
  })
}

function fetchInstituteName (campusDriveDetails, urlMap, cbInstituteName) {
  const instituteIds = func.getValuesArrayFromJson(func.dbCons.FIELD_INSTITUTE_ID, campusDriveDetails)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_INSTITUTE_DETAILS_NAME, true, true))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, instituteIds), urlMap, func.dbCons.COLLECTION_INSTITUTE_DETAILS, projection, function (error, instituteDetailsResponse) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching institute name = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchInstituteName()', func.logCons.LOG_EXIT)
      return cbInstituteName(new Error().stack, error)
    } else if (!instituteDetailsResponse || instituteDetailsResponse.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no Gd Group details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchInstituteName()', func.logCons.LOG_EXIT)
      return cbInstituteName(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchInstituteName: ', instituteDetailsResponse)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchInstituteName()', func.logCons.LOG_EXIT)
      getCampusDriveDetailsFinalArray(campusDriveDetails, instituteDetailsResponse, cbInstituteName)
    }
  })
}

function getCampusDriveDetailsFinalArray (campusDriveDetails, instituteDetailsResponse, cbCampusDriveDetailsFinalArray) {
  campusDriveDetails.filter(function (obj) {
    var instituteName = func.filterBasedOnValue(instituteDetailsResponse, func.dbCons.FILED_ID, obj[func.dbCons.FIELD_INSTITUTE_ID])
    obj[func.dbCons.FIELD_INSTITUTE_NAME] = instituteName[0][func.dbCons.FIELD_INSTITUTE_DETAILS_NAME]
  })
  cbCampusDriveDetailsFinalArray(null, campusDriveDetails)
}

function dbOpertationForCampusDriveDetails (campusDriveId, projection, urlMap, cbdbOp) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOpertationForCampusDriveDetails()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, campusDriveId), urlMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, projection, function (error, campusDriveDetailsData) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching Gd Group details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOpertationForCampusDriveDetails()', func.logCons.LOG_EXIT)
      return cbdbOp(new Error().stack, error)
    } else if (!campusDriveDetailsData || campusDriveDetailsData.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no Gd Group details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOpertationForCampusDriveDetails()', func.logCons.LOG_EXIT)
      return cbdbOp(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOpertationForCampusDriveDetails: ', campusDriveDetailsData)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOpertationForCampusDriveDetails()', func.logCons.LOG_EXIT)
      cbdbOp(null, campusDriveDetailsData)
    }
  })
}

function generateScoreIngredientJson (stage, scoreDetails, detailsIds, urlMap, cbScoreJson) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateScoreIngredientJson()', func.logCons.LOG_ENTER)
  var rowGdScoreJson = {}
  rowGdScoreJson[func.msCons.GD_PI_DETAILS] = scoreDetails
  var finished = _.after(3, function () {
    var finalGdScoreArray = []
    if (createFinalScoreJson(stage, rowGdScoreJson) !== null) {
      finalGdScoreArray.push(createFinalScoreJson(stage, rowGdScoreJson))
    }
    cbScoreJson(null, finalGdScoreArray)
  })
  getCandidateDetailsFromCandidateId(func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_ID, scoreDetails), urlMap, function (error, candidateDetails) {
    if (error) {
      return cbScoreJson(new Error().stack, error)
    } else {
      rowGdScoreJson[func.dbCons.COLLECTION_CANDIDATE_DETAILS] = candidateDetails
      getCandidateNameFromPersonId(candidateDetails, urlMap, function (error, personDetails) {
        if (error) {
          return cbScoreJson(new Error().stack, error)
        } else {
          rowGdScoreJson[func.dbCons.COLLECTION_PERSON_DETAILS] = personDetails
          finished()
        }
      })
    }
  })
  getAssessorDetailsFromAssessorId(func.getValuesArrayFromJson(func.dbCons.ASSESSOR_ID, scoreDetails), urlMap, function (error, assessorDetails) {
    if (error) {
      return cbScoreJson(new Error().stack, error)
    } else {
      rowGdScoreJson[func.dbCons.COLLECTION_USER_DETAILS] = assessorDetails
      finished()
    }
  })
  getCampusDriveIdForParticularStage(stage, scoreDetails, detailsIds, urlMap, function (error, campusDriveIds) {
    if (error) {
      return cbScoreJson(new Error().stack, error)
    } else {
      rowGdScoreJson[func.dbCons.COLLECTION_GD_GROUP_DETAILS] = campusDriveIds
      getDesignationFromCampusDriveId(campusDriveIds, urlMap, function (error, designationDetails) {
        if (error) {
          return cbScoreJson(new Error().stack, error)
        } else {
          rowGdScoreJson[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS] = designationDetails
          finished()
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateScoreIngredientJson()', func.logCons.LOG_EXIT)
}

function getCampusDriveIdForParticularStage (stage, scoreDetails, detailsIds, urlMap, cbCampusDriveIds) {
  if (stage == 3) {
    getCampusDriveIdsFromCandidateSourceId(func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, scoreDetails), scoreDetails, urlMap, cbCampusDriveIds)
  } else if (stage == 2) {
    getGdGroupDetailsFromGdGroupDetailsId(detailsIds, urlMap, cbCampusDriveIds)
  } else {
    return cbCampusDriveIds(null, [])
  }
}

function updateCandidateDetailsJson (rowGdScoreJson) {
  rowGdScoreJson[func.msCons.GD_PI_DETAILS].filter(function (obj) {
    var gdGroup = func.filterBasedOnValue(rowGdScoreJson[func.dbCons.COLLECTION_GD_GROUP_DETAILS], func.dbCons.FIELD_CANDIDATE_ID, obj[func.dbCons.FIELD_CANDIDATE_ID])
    obj[func.dbCons.FIELD_CAMPUS_DRIVE_ID] = gdGroup[0][func.dbCons.FIELD_CAMPUS_DRIVE_ID]
  })
  rowGdScoreJson[func.msCons.GD_PI_DETAILS].filter(function (obj) {
    var gdGroup = func.filterBasedOnValue(rowGdScoreJson[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS], func.dbCons.FIELD_ID, obj[func.dbCons.FIELD_CAMPUS_DRIVE_ID])
    obj[func.dbCons.FIELD_INSTITUTE_NAME] = gdGroup[0][func.dbCons.FIELD_INSTITUTE_NAME]
  })
  return rowGdScoreJson
}

function createFinalScoreJson (stage, rowGdScoreJson) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'createFinalScoreJson()', func.logCons.LOG_ENTER)
  var finalJson = {}
  rowGdScoreJson = updateCandidateDetailsJson(rowGdScoreJson)
  if (rowGdScoreJson[func.msCons.GD_PI_DETAILS].length > 0 && rowGdScoreJson[func.msCons.GD_PI_DETAILS][0][func.dbCons.FIELD_PI_LOCATION] !== undefined && stage == 3) {
    finalJson[func.dbCons.FIELD_PI_LOCATION] = rowGdScoreJson[func.msCons.GD_PI_DETAILS][0][func.dbCons.FIELD_PI_LOCATION]
    finalJson[func.dbCons.FIELD_PI_DATE] = rowGdScoreJson[func.msCons.GD_PI_DETAILS][0][func.dbCons.FIELD_PI_DATE]
  } else if (rowGdScoreJson[func.dbCons.COLLECTION_GD_GROUP_DETAILS].length > 0 && rowGdScoreJson[func.dbCons.COLLECTION_GD_GROUP_DETAILS][0][func.dbCons.FIELD_GD_LOCATION] !== undefined) {
    finalJson[func.dbCons.FIELD_GD_LOCATION] = rowGdScoreJson[func.dbCons.COLLECTION_GD_GROUP_DETAILS][0][func.dbCons.FIELD_GD_LOCATION]
    finalJson[func.dbCons.FIELD_GD_DATE] = rowGdScoreJson[func.dbCons.COLLECTION_GD_GROUP_DETAILS][0][func.dbCons.FIELD_GD_DATE]
  } else {
    return null
  }
  if (rowGdScoreJson[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS].length > 0 && rowGdScoreJson[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS][0][func.dbCons.FIELD_DESIGNATION] !== undefined) {
    finalJson[func.dbCons.FIELD_DESIGNATION] = rowGdScoreJson[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS][0][func.dbCons.FIELD_DESIGNATION]
  } else {
    return null
  }
  finalJson[func.dbCons.COLLECTION_CANDIDATE_DETAILS] = getCandidateDetailsFinalArray(stage, rowGdScoreJson)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'createFinalScoreJson()', func.logCons.LOG_EXIT)
  return finalJson
}

function getCandidateDetailsFinalArray (stage, rowGdScoreJson) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsFinalArray()', func.logCons.LOG_ENTER)
  rowGdScoreJson = getCandidateNameDetails(rowGdScoreJson)
  rowGdScoreJson = getAssessorNameDetails(rowGdScoreJson)
  var uniqueCandidateData = []
  var scoreDetailsArray = []
  var scoreDetailsJson = {}
  var candidateDetailJson = {}
  var candidateDetailArray = []
  var candidateIdArray = generateCandidateIdArray(rowGdScoreJson)
  var array = candidateIdArray.filter(function (obj) {
    uniqueCandidateData = (func.filterBasedOnValue(rowGdScoreJson[func.msCons.GD_PI_DETAILS], func.dbCons.FIELD_CANDIDATE_ID, obj))
    candidateDetailJson = {}
    scoreDetailsArray = []
    var array = uniqueCandidateData.filter(function (obj) {
      scoreDetailsJson = {}
      scoreDetailsJson[func.msCons.FIELD_ASSESSOR_NAME] = obj[func.msCons.FIELD_ASSESSOR_NAME]
      scoreDetailsJson[func.dbCons.ASSESSOR_ID] = obj[func.dbCons.ASSESSOR_ID]
      if ((stage == func.dbCons.ENUM_SELECTED_FOR_PI) && (obj[func.dbCons.FIELD_FEEDBACK_JSON] != undefined)) {
        scoreDetailsJson[func.dbCons.SCORE_DETAIL_JSON] = (obj[func.dbCons.FIELD_FEEDBACK_JSON] != undefined && obj[func.dbCons.FIELD_FEEDBACK_JSON] != '') ? JSON.parse(obj[func.dbCons.FIELD_FEEDBACK_JSON]) : ''
        scoreDetailsArray.push(scoreDetailsJson)
      } else if (stage == func.dbCons.ENUM_SELECTED_FOR_GD) {
        scoreDetailsJson[func.dbCons.SCORE_DETAIL_JSON] = (obj[func.dbCons.SCORE_DETAIL_JSON] !== undefined && obj[func.dbCons.SCORE_DETAIL_JSON] != '') ? JSON.parse(obj[func.dbCons.SCORE_DETAIL_JSON]) : ''
        scoreDetailsArray.push(scoreDetailsJson)
      }
    })
    candidateDetailJson[func.dbCons.FIELD_CANDIDATE_ID] = uniqueCandidateData[0][func.dbCons.FIELD_CANDIDATE_ID]
    candidateDetailJson[func.dbCons.FIELD_INSTITUTE_NAME] = uniqueCandidateData[0][func.dbCons.FIELD_INSTITUTE_NAME]
    candidateDetailJson[func.msCons.FIELD_CANDIDATE_NAME] = uniqueCandidateData[0][func.msCons.FIELD_CANDIDATE_NAME]
    candidateDetailJson[func.dbCons.COLLECTION_JSON_STAGE] = uniqueCandidateData[0][func.dbCons.COLLECTION_JSON_STAGE]
    candidateDetailJson[func.dbCons.FIELD_RESUME_FILE] = uniqueCandidateData[0][func.dbCons.FIELD_RESUME_FILE]
    candidateDetailJson[func.dbCons.CANDIDATE_FIELD_PROFILE_IMAGE] = uniqueCandidateData[0][func.dbCons.CANDIDATE_FIELD_PROFILE_IMAGE]
    candidateDetailJson[func.msCons.FIELD_SCORE_DETAILS] = scoreDetailsArray
    if ((stage === func.dbCons.ENUM_SELECTED_FOR_GD) && (((func.filterBasedOnValue(rowGdScoreJson[func.dbCons.COLLECTION_GD_GROUP_DETAILS], func.dbCons.FIELD_CANDIDATE_ID, uniqueCandidateData[0][func.dbCons.FIELD_CANDIDATE_ID]))[0][func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE]) !== undefined)) {
      candidateDetailJson[func.msCons.FIELD_CANDIDATE_SEQUENCE] = (func.filterBasedOnValue(rowGdScoreJson[func.dbCons.COLLECTION_GD_GROUP_DETAILS], func.dbCons.FIELD_CANDIDATE_ID, uniqueCandidateData[0][func.dbCons.FIELD_CANDIDATE_ID]))[0][func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE]
    } else if ((stage === func.dbCons.ENUM_SELECTED_FOR_PI) && (((func.filterBasedOnValue(rowGdScoreJson[func.msCons.GD_PI_DETAILS], func.dbCons.FIELD_CANDIDATE_ID, uniqueCandidateData[0][func.dbCons.FIELD_CANDIDATE_ID]))[0][func.dbCons.FIELD_PI_CANDIDATE_SEQUENCE]) !== undefined)) {
      candidateDetailJson[func.msCons.FIELD_CANDIDATE_SEQUENCE] = (func.filterBasedOnValue(rowGdScoreJson[func.msCons.GD_PI_DETAILS], func.dbCons.FIELD_CANDIDATE_ID, uniqueCandidateData[0][func.dbCons.FIELD_CANDIDATE_ID]))[0][func.dbCons.FIELD_PI_CANDIDATE_SEQUENCE]
    }
    if (scoreDetailsArray.length !== 0) {
      candidateDetailArray.push(candidateDetailJson)
    }
    return candidateDetailArray
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsFinalArray()', func.logCons.LOG_EXIT)
  return candidateDetailArray
}

function generateCandidateIdArray (rowGdScoreJson) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateCandidateIdArray()', func.logCons.LOG_EXIT)
  var candidateIdArray = []
  var array = rowGdScoreJson[func.msCons.GD_PI_DETAILS].filter(function (obj) {
    if (candidateIdArray.indexOf(obj[func.dbCons.FIELD_CANDIDATE_ID]) === -1) {
      candidateIdArray.push(obj[func.dbCons.FIELD_CANDIDATE_ID])
    }
    return (candidateIdArray)
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateCandidateIdArray()', func.logCons.LOG_EXIT)
  return (candidateIdArray)
}

function getCandidateNameDetails (rowGdScoreJson) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateNameDetails()', func.logCons.LOG_ENTER)
  var array = rowGdScoreJson[func.msCons.GD_PI_DETAILS].filter(function (obj) {
    var personId = (func.filterBasedOnValue(rowGdScoreJson[func.dbCons.COLLECTION_CANDIDATE_DETAILS], func.dbCons.FIELD_ID, obj[func.dbCons.FIELD_CANDIDATE_ID]))
    if (personId.length > 0) {
      obj[func.dbCons.FIELD_PERSON_ID] = personId[0][func.dbCons.FIELD_PERSON_ID]
      obj[func.dbCons.COLLECTION_JSON_STAGE] = personId[0][func.dbCons.COLLECTION_JSON_STAGE]
    }
    return rowGdScoreJson
  })
  var array = rowGdScoreJson[func.msCons.GD_PI_DETAILS].filter(function (obj) {
    var candidateName = (func.filterBasedOnValue(rowGdScoreJson[func.dbCons.COLLECTION_PERSON_DETAILS], func.dbCons.FIELD_ID, obj[func.dbCons.FIELD_PERSON_ID]))
    if (candidateName.length > 0) {
      obj[func.msCons.FIELD_CANDIDATE_NAME] = candidateName[0][func.dbCons.FIELD_FIRST_NAME] + ' ' + candidateName[0][func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME] + ' ' + candidateName[0][func.dbCons.FIELD_LAST_NAME]
      obj[func.dbCons.FIELD_RESUME_FILE] = candidateName[0][func.dbCons.FIELD_RESUME_FILE]
      obj[func.dbCons.CANDIDATE_FIELD_PROFILE_IMAGE] = candidateName[0][func.dbCons.CANDIDATE_FIELD_PROFILE_IMAGE]
    }
    return rowGdScoreJson
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateNameDetails()', func.logCons.LOG_EXIT)
  return rowGdScoreJson
}

function getAssessorNameDetails (rowGdScoreJson) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessorNameDetails()', func.logCons.LOG_ENTER)
  var array = rowGdScoreJson[func.msCons.GD_PI_DETAILS].filter(function (obj) {
    var assessorName = func.filterBasedOnValue(rowGdScoreJson[func.dbCons.COLLECTION_USER_DETAILS], func.dbCons.FIELD_USER_CODE, obj[func.dbCons.ASSESSOR_ID])
    if (assessorName.length > 0) {
      obj[func.msCons.FIELD_ASSESSOR_NAME] = assessorName[0][func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_GIVEN_NAME] + ' ' + assessorName[0][func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_FAMILY_NAME]
    }
    return rowGdScoreJson
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessorNameDetails()', func.logCons.LOG_EXIT)
  return rowGdScoreJson
}

exports.GdScoreDetailsHelpers = GdScoreDetailsHelpers
