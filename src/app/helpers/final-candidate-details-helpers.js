var func = require('../utils/functions')
var HELPER_CONS = 'HS_FCDH_'
var async = require('async')
var _ = require('lodash')

function FinalCandidateDetailsHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of gd group details helper')
  DbOperation = require('./db-operations').DbOperation
  dbOp = new DbOperation()
}

FinalCandidateDetailsHelpers.prototype.getFinalCandidateDetails = function(body, userCode, orgNameMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'Fetching candidate details with request param userCode as = ' + userCode, func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getFinalCandidateDetails()', func.logCons.LOG_ENTER)
  fetchCandidateDetailsList(body, userCode, orgNameMap, function(error, candidateDetailsList) {
    if (error) {
      callback(new Error().stack, error)
    } else if (!candidateDetailsList || candidateDetailsList.length === 0) {
      callback(null, func.responseGenerator([], HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_DATA_RETRIEVED))
    } else {
      return callback(null, func.responseGenerator(candidateDetailsList, HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_DATA_RETRIEVED))
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getFinalCandidateDetails()', func.logCons.LOG_EXIT)
}

function fetchCandidateDetailsList(body, userCode, orgNameMap, cbCandidateDetailsList) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchCandidateDetailsList()', func.logCons.LOG_ENTER)
  getPiAssessmentDetailsDataFromLocation(body, userCode, orgNameMap, function(error, piAssessmentDetails) {
    if (error) {
      return cbCandidateDetailsList(new Error().stack, error)
    } else if (!piAssessmentDetails || piAssessmentDetails.length === 0) {
      return cbCandidateDetailsList(null, [])
    } else {
      return cbCandidateDetailsList(null, piAssessmentDetails)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchCandidateDetailsList()', func.logCons.LOG_EXIT)
}

function getPiAssessmentDetailsDataFromLocation(body, userCode, orgNameMap, cbPiAssessmentDetailsDataFromLocation) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPiAssessmentDetailsDataFromLocation()', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROUND_TYPE, func.lightBlueCons.OP_EQUAL, getEnumForRoundType(body[func.dbCons.FIELD_ROUND_TYPE])))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_PI_LOCATION, func.lightBlueCons.OP_EQUAL, body.location))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function(error, piAssessmentDetailsData) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while retrieving pi assessment detail for userCode ' + userCode + 'Error = ' + JSON.stringify(error))
      return cbPiAssessmentDetailsDataFromLocation(new Error().stack, error)
    } else if (!piAssessmentDetailsData || piAssessmentDetailsData.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no pi details found for userCode ' + userCode + 'and location = ' + body.location, func.logCons.LOG_EXIT)
      return cbPiAssessmentDetailsDataFromLocation(null, [])
    } else {
      createPiAssessmentDetailsJson(piAssessmentDetailsData, body, userCode, orgNameMap, cbPiAssessmentDetailsDataFromLocation)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPiAssessmentDetailsDataFromLocation()', func.logCons.LOG_EXIT)
    }
  })
}

function createPiAssessmentDetailsJson(piAssessmentDetailsData, body, userCode, orgNameMap, cbPiAssessmentDetailsJsonFromLocation) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'createPiAssessmentDetailsJson()', func.logCons.LOG_ENTER)
  var piAssessmentDetailsArray = []
  async.forEachOf(piAssessmentDetailsData, function(item, key, callbackinner) {
    var piAssessmentDetailsJson = {}
    piAssessmentDetailsJson[func.dbCons.ASSESSOR_ID] = item[func.dbCons.ASSESSOR_ID]
    piAssessmentDetailsJson[func.dbCons.FIELD_ACCESSOR_DETAILS] = item[func.dbCons.FIELD_ACCESSOR_DETAILS]
    if (item[func.dbCons.FIELD_DRAFT_FEEDBACK_JSON] !== undefined) {
      if (item[func.dbCons.FIELD_DRAFT_FEEDBACK_JSON].length !== 0) {
        piAssessmentDetailsJson[func.dbCons.FIELD_DRAFT_FEEDBACK_JSON] = JSON.parse(item[func.dbCons.FIELD_DRAFT_FEEDBACK_JSON])
      }
    }
    piAssessmentDetailsJson[func.dbCons.FIELD_CANDIDATE_SOURCE_ID] = item[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]
    if (item[func.dbCons.FIELD_FEEDBACK_JSON] != undefined) {
      piAssessmentDetailsJson[func.dbCons.FIELD_FEEDBACK_JSON] = JSON.parse(item[func.dbCons.FIELD_FEEDBACK_JSON])
    }
    piAssessmentDetailsJson[func.dbCons.FIELD_PI_ASSESSMENT_TYPE] = item[func.dbCons.FIELD_PI_ASSESSMENT_TYPE]
    piAssessmentDetailsJson[func.dbCons.FIELD_CANDIDATE_ID] = item[func.dbCons.FIELD_CANDIDATE_ID]
    piAssessmentDetailsJson[func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID] = item[func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID]
    piAssessmentDetailsJson[func.dbCons.FIELD_UNIVERSITIES] = item[func.dbCons.FIELD_UNIVERSITIES]
    if (item[func.dbCons.FIELD_STATUS] === func.dbCons.ENUM_PI_ASSESSMENT_SELECTED_FOR_PI) {
      piAssessmentDetailsJson[func.dbCons.FIELD_STATUS] = func.msCons.VALUE_PI_ASSESSMENT_SELECTED
    } else if (item[func.dbCons.FIELD_STATUS] === func.dbCons.ENUM_PI_ASSESSMENT_COMPLETED) {
      piAssessmentDetailsJson[func.dbCons.FIELD_STATUS] = func.msCons.VALUE_PI_ASSESSMENT_REJECTED
    } else {
      piAssessmentDetailsJson[func.dbCons.FIELD_STATUS] = func.msCons.VALUE_PI_ASSESSMENT_NOT_ASSESSED
    }
    piAssessmentDetailsArray.push(piAssessmentDetailsJson)
    callbackinner()
  }, function(error) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error in  async call while creating piAssessmentDetails = ' + JSON.stringify(error))
      return cbPiAssessmentDetailsJsonFromLocation(new Error().stack, error)
    } else {
      getPiAssessmentDetailsDataForParticularDesignation(piAssessmentDetailsArray, body, userCode, orgNameMap, cbPiAssessmentDetailsJsonFromLocation)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'createPiAssessmentDetailsJson()', func.logCons.LOG_EXIT)
}

function getPiAssessmentDetailsDataForParticularDesignation(piAssessmentDetailsArray, body, userCode, orgNameMap, cbCandidateDetailsList) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPiAssessmentDetailsDataForParticularDesignation()', func.logCons.LOG_ENTER)
  var finalPiAssessmentDetailsArray = []
  async.forEachOf(piAssessmentDetailsArray, function(item, key, callbackinner) {
    if ((item[func.dbCons.FIELD_DRAFT_FEEDBACK_JSON] !== undefined) && (item[func.dbCons.FIELD_DRAFT_FEEDBACK_JSON][func.dbCons.FIELD_CAMPUS_DRIVE_ID] !== undefined)) {
      getDesignationFromCampusDriveId(item, body, userCode, orgNameMap, function(error, designationDetails) {
        if (error) {
          callbackinner()
        } else {
          if (designationDetails[func.dbCons.FIELD_DRAFT_FEEDBACK_JSON][func.dbCons.FIELD_DESIGNATION] === body.designation) {
            finalPiAssessmentDetailsArray.push(item)
            callbackinner()
          } else {
            callbackinner()
          }
        }
      })
    } else {
      callbackinner()
    }
  }, function(error) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error in  async call while creating piAssessmentDetails = ' + JSON.stringify(error))
      return cbCandidateDetailsList(new Error().stack, error)
    } else {
      // cbCandidateDetailsList(null, finalPiAssessmentDetailsArray)
      generateFinalCandidateDetailsList(finalPiAssessmentDetailsArray, cbCandidateDetailsList)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPiAssessmentDetailsDataForParticularDesignation()', func.logCons.LOG_EXIT)
}

function generateFinalCandidateDetailsList(finalPiAssessmentDetailsArray, cbCandidateDetailsList) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateFinalCandidateDetailsList()', func.logCons.LOG_ENTER)
  let sameUniData = _.groupBy(finalPiAssessmentDetailsArray, (piAssessmentDetail) => {
    return piAssessmentDetail[func.dbCons.FIELD_UNIVERSITIES]
  })

  let finalJsonArray = []
  for (let key in sameUniData) {
    let finalJson = {}
    finalJson[func.dbCons.FIELD_UNIVERSITIES] = func.convertIntoArray(key)
    finalJson[func.msCons.STAGE_DETAIL_ID] = func.getValuesArrayFromJson(func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID, sameUniData[key])
    finalJson[func.msCons.FIELD_NUMBER_OF_CANDIDATES] = (_.uniqBy(sameUniData[key], func.dbCons.FIELD_CANDIDATE_ID)).length
    finalJsonArray.push(finalJson)
  }
  cbCandidateDetailsList(null, finalJsonArray)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateFinalCandidateDetailsList()', func.logCons.LOG_EXIT)
}

function getDesignationFromCampusDriveId(item, body, userCode, orgNameMap, cbDesignationDetails) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDesignationFromCampusDriveId()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, item[func.dbCons.FIELD_DRAFT_FEEDBACK_JSON][func.dbCons.FIELD_CAMPUS_DRIVE_ID]), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function(error, designationDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while retrieving pi assessment detail for userCode ' + userCode + 'Error = ' + JSON.stringify(error))
      return cbDesignationDetails(new Error().stack, error)
    } else if (!designationDetails || designationDetails.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no pi details found for userCode ' + userCode + 'and location = ' + body.location, func.logCons.LOG_EXIT)
      return cbDesignationDetails(null, [])
    } else {
      getDesignationNameIntoDraftFeedbackJson(item, designationDetails, body, userCode, orgNameMap, cbDesignationDetails)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDesignationFromCampusDriveId()', func.logCons.LOG_EXIT)
    }
  })
}

function getDesignationNameIntoDraftFeedbackJson(item, designationDetails, body, userCode, orgNameMap, cb) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDesignationNameIntoDraftFeedbackJson()', func.logCons.LOG_ENTER)
  async.forEachOf(designationDetails, function(designationData, key, callbackinner) {
    if (item[func.dbCons.FIELD_DRAFT_FEEDBACK_JSON][func.dbCons.FIELD_CAMPUS_DRIVE_ID] === designationData[func.dbCons.FIELD_ID]) {
      item[func.dbCons.FIELD_DRAFT_FEEDBACK_JSON][func.dbCons.FIELD_DESIGNATION] = designationData[func.dbCons.FIELD_DESIGNATION]
    }
    callbackinner()
  }, function(error) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error in  async call while getting  designation = ' + JSON.stringify(error))
      return cb(new Error().stack, error)
    } else {
      return cb(null, item)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDesignationNameIntoDraftFeedbackJson()', func.logCons.LOG_EXIT)
}

function getEnumForRoundType(value) {
  switch (value) {
    case func.dbCons.VALUE_ROUND_TYPE_ON_CAMPUS:
      return func.dbCons.ENUM_ROUND_TYPE_ON_CAMPUS
    case func.dbCons.VALUE_ROUND_TYPE_ON_SITE:
      return func.dbCons.ENUM_ROUND_TYPE_ON_SITE
    default:
      return -1
  }
}
exports.FinalCandidateDetailsHelpers = FinalCandidateDetailsHelpers
