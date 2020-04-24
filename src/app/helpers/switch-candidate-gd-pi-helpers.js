'use strict'
/**
 * This function is useful for switching candidate from gd to pi
 * @author Monika Mehta
 */
const func = require('../utils/functions')
// const async = require('async')
const DbOperation = require('./db-operations').DbOperation
const AddPIDetails = require('./add-pi-details-helpers').AddPIDetails
const GdGroupDetailsHelpers = require('./gd-group-details-helpers').GdGroupDetailsHelpers
const gdGroupDetailsHelpers = new GdGroupDetailsHelpers()
const addPIDetails = new AddPIDetails()
const UpdateCandidateStage = require('./update-candididate-stage-helpers').UpdateCandidateStage
const updateCandidateStage = new UpdateCandidateStage()
const dbOp = new DbOperation()
var _ = require('lodash')
const HELPER_CONS = 'HI_SCGPH_'

function SwitchCandidateGdPiHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of switching candidate')
}

/**
 * [description]
 * @param  {[type]} candidateDetails [candidate details whose entry is to be deleted contains array of candidates]
 * @param  {[type]} orgNameMap       [description]
 * @param  {[type]} env              [description]
 * @return {[type]}                  [description]
 */
SwitchCandidateGdPiHelpers.prototype.switchCandidate = async function (candidateDetails, orgNameMap, userCode, env) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'switchCandidate()', func.logCons.LOG_ENTER)
  try {
    let deletedCandidate = []
    let candidateStage = []
    if (candidateDetails[func.msCons.FIELD_SUFFLE_TYPE] === func.msCons.FIELD_PI_TO_GD) {
      [deletedCandidate, candidateStage] = await Promise.all([deleteCandidatesFromPi(candidateDetails, orgNameMap, userCode, env), changeStageForCandidate(candidateDetails, orgNameMap)])
    } else {
      [deletedCandidate, candidateStage] = await Promise.all([deleteCandidatesFromGd(candidateDetails, orgNameMap, userCode, env), changeStageForCandidate(candidateDetails, orgNameMap)])
    }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `switchCandidate =${JSON.stringify(candidateDetails)}`)
    return deletedCandidate
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while switching candidate from gd to pi or pi to gd. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'switchCandidate()', func.logCons.LOG_EXIT)
    throw err
  }
}

/**
 * [deleteCandidatesFromGd description]
 * @param  {[type]} candidateDetails [All candidate details]
 * @param  {[type]} orgNameMap       [description]
 * @return {[type]}                  [description]
 */
async function deleteCandidatesFromGd (candidateDetails, orgNameMap, userCode, env) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteCandidatesFromGd()', func.logCons.LOG_ENTER)
  let responseJson = []
  let errors = []
  try {
    for (let candidateDetail of candidateDetails[func.dbCons.COLLECTION_CANDIDATE_DETAILS]) {
      const [deletedCandidateGd, deleteCandidateGDScore] = await Promise.all([deleteCandidateGdDbOperation(candidateDetail, candidateDetails[func.dbCons.FIELD_ROUND_TYPE], orgNameMap), deleteCandidateGdScoreDbOperation(candidateDetail, orgNameMap)])
      if (deletedCandidateGd.errors !== undefined) {
        errors.push({
          'message': deletedCandidateGd.errors,
          'candidate_id': candidateDetail[func.dbCons.FIELD_CANDIDATE_ID]
        })
      } else {
        responseJson.push(deletedCandidateGd[0])
      }
    }
    const piAssessmentDetails = insertInPiAssessmentDetails(candidateDetails, orgNameMap, userCode, env)
  } catch (err) {
    let error = func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, err)
    throw error
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteCandidatesFromGd()', func.logCons.LOG_EXIT)
  return {
    data: responseJson,
    errors: errors,
    message: (responseJson.length === 0) ? func.msgCons.ERROR_MSG_FOR_REMOVING_CANDIDATE : func.msgCons.MSG_CANDIDATE_REMOVED_SUCCESSFULLY
  }
}
/**
 * [deleteCandidateGdDbOperation delete candidate from gd group details]
 * @param  {[type]} candidateDetail [particular candidate detail]
 * @param  {[type]} orgNameMap      [description]
 * @return {[type]}                 [description]
 */
async function deleteCandidateGdDbOperation (candidateDetail, roundType, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteCandidateGdDbOperation()', func.logCons.LOG_ENTER)
    const query = getDeleteGdQuery(candidateDetail, roundType)
    dbOp.delete(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_GD_GROUP_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      (err, deleteCandidate) => {
        if (err) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while updating tpo details. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteCandidateGdDbOperation()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!deleteCandidate || deleteCandidate.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidate detail not found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteCandidateGdDbOperation()', func.logCons.LOG_EXIT)
          let response = {
            data: candidateDetail,
            errors: 'candidate not found in gd group details'
          }
          return resolve(response)
        }
        return resolve(candidateDetail)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteCandidateGdDbOperation()', func.logCons.LOG_EXIT)
  })
}

/**
 * [deleteCandidateGdScoreDbOperation delete candidate from gd score details]
 * @param  {[type]} candidateDetail [particular candidate detail]
 * @param  {[type]} orgNameMap      [description]
 * @return {[type]}                 [description]
 */
async function deleteCandidateGdScoreDbOperation (candidateDetail, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteCandidateGdScoreDbOperation()', func.logCons.LOG_ENTER)
    const query = getDeleteGdScoreQuery(candidateDetail)
    dbOp.delete(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_GD_SCORE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      (err, deleteCandidate) => {
        if (err) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while deleting candidate from gd score details. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteCandidateGdScoreDbOperation()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!deleteCandidate || deleteCandidate.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidate detail not found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteCandidateGdScoreDbOperation()', func.logCons.LOG_EXIT)
          return resolve(deleteCandidate)
        }
        return resolve(deleteCandidate)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteCandidateGdScoreDbOperation()', func.logCons.LOG_EXIT)
  })
}

/**
 * [getDeleteGdQuery query to delete candidate from gd_group_details and gd_score_details]
 * @param  {[type]} candidateDetail [particular candidate cetail]
 * @return {[type]}                 [description]
 */
function getDeleteGdQuery (candidateDetail, roundType) {
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.GD_GROUP_DETAILS_ID, func.lightBlueCons.OP_EQUAL, candidateDetail[func.dbCons.GD_GROUP_DETAILS_ID]))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_ID, func.lightBlueCons.OP_EQUAL, candidateDetail[func.dbCons.FIELD_CANDIDATE_ID]))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROUND_TYPE, func.lightBlueCons.OP_EQUAL, getEnumForRoundType(roundType)))
  return query
}

function getDeleteGdScoreQuery (candidateDetail) {
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.GD_GROUP_DETAILS_ID, func.lightBlueCons.OP_EQUAL, candidateDetail[func.dbCons.GD_GROUP_DETAILS_ID]))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_ID, func.lightBlueCons.OP_EQUAL, candidateDetail[func.dbCons.FIELD_CANDIDATE_ID]))
  return query
}

/**
 * [insertInPiAssessmentDetails INSERT CANDIDATE IN PI_ASSESSMENT_DETAILS]
 * @param  {[type]} candidateDetails [candidateDetails]
 * @param  {[type]} orgNameMap       [description]
 * @param  {[type]} userCode         [description]
 * @param  {[type]} env              [description]
 * @return {[type]}                  [description]
 */
async function insertInPiAssessmentDetails (candidateDetails, orgNameMap, userCode, env) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertInPiAssessmentDetails()', func.logCons.LOG_ENTER)
    const requestJson = getPiAssessmentRequestJson(candidateDetails)
    addPIDetails.addPIDetailsFromDB(requestJson, orgNameMap, userCode, env, function(err, piAssessmentDetails) {
      if (err) {
        return reject(err)
      } else if (!piAssessmentDetails || piAssessmentDetails.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidates not inserted in pi_assessment_details`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertInPiAssessmentDetails()', func.logCons.LOG_EXIT)
        return reject(new Error(`candidates not inserted in pi_assessment_details${candidateDetails}`))
      }
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertInPiAssessmentDetails()', func.logCons.LOG_EXIT)
      return resolve(piAssessmentDetails)
    })
  })
}

/**
 * [getPiAssessmentRequestJson GET ALL CANDIDATE'S universities_of_candidates]
 * @param  {[type]} candidateDetails [description]
 * @return {[type]}                  [description]
 */
function getPiAssessmentRequestJson (candidateDetails) {
  let universityOfCandidates = func.getValuesArrayFromJson(func.dbCons.FIELD_INSTITUTE_NAME, candidateDetails[func.dbCons.COLLECTION_CANDIDATE_DETAILS])
  candidateDetails[func.dbCons.FIELD_UNIVERSITIES] = _.uniq(universityOfCandidates)
  return candidateDetails
}
/**
 * [changeStageForCandidate change stage of candidate]
 * @param  {[type]} candidateDetails [description]
 * @param  {[type]} orgNameMap       [description]
 * @return {[type]}                  [description]
 */
async function changeStageForCandidate (candidateDetails, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'changeStageForCandidate()', func.logCons.LOG_ENTER)
    const requestJson = getCandidateStageRequestJson(candidateDetails[func.dbCons.COLLECTION_CANDIDATE_DETAILS], candidateDetails[func.dbCons.COLLECTION_JSON_STAGE])
    updateCandidateStage.updateStageForCandidate(requestJson, orgNameMap, function (err, candidateStage) {
      if (err) {
        return reject(err)
      } else if (!candidateStage || candidateStage.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidates stage not updated`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'changeStageForCandidate()', func.logCons.LOG_EXIT)
        return reject(new Error(`candidates stage not updated in candidate_details${candidateDetails}`))
      }
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'changeStageForCandidate()', func.logCons.LOG_EXIT)
      return resolve(candidateStage)
    })
  })
}

/**
 * [getCandidateStageRequestJson description]
 * @param  {[type]} candidateDetails [get candidate id array and stage json]
 * @return {[type]}                  [description]
 */
function getCandidateStageRequestJson (candidateDetails, stage) {
  let requestJson = {}
  requestJson[func.dbCons.FIELD_CANDIDATE_ID] = func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_ID, candidateDetails)
  // requestJson[func.dbCons.COLLECTION_JSON_STAGE] = func.dbCons.VALUE_SELECTED_IN_PI_FOR_ONSITE
  requestJson[func.dbCons.COLLECTION_JSON_STAGE] = stage
  return requestJson
}

/**
 * [deleteCandidatesFromPi delete candidate from pi and add candidate in gd]
 * @param  {[type]} candidateDetails [candidate details with gd group details]
 * @param  {[type]} orgNameMap       [description]
 * @param  {[type]} userCode         [description]
 * @param  {[type]} env              [description]
 * @return {[type]}                  [description]
 */

async function deleteCandidatesFromPi (candidateDetails, orgNameMap, userCode, env) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteCandidatesFromPi()', func.logCons.LOG_ENTER)
  let errors = []
  try {
    const candidateIds = func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_ID, candidateDetails[func.dbCons.COLLECTION_CANDIDATE_DETAILS])
    const [deletedCandidatePi, candidateGd] = await Promise.all([deleteCandidatePiDbOperation(candidateIds, candidateDetails[func.dbCons.FIELD_ROUND_TYPE], orgNameMap), insertInGdGroupDetails(candidateDetails, orgNameMap, userCode, env)])
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteCandidatesFromPi()', func.logCons.LOG_EXIT)
    return {
      data: candidateGd.data,
      errors: errors,
      message: (candidateGd.data.length === 0) ? func.msgCons.ERROR_MSG_FOR_REMOVING_CANDIDATE_FROM_PI : func.msgCons.MSG_CANDIDATE_REMOVED_SUCCESSFULLY
    }
  }
  catch (err) {
    let error = func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, err)
    throw error
  }
}

/**
 * [deleteCandidatePiDbOperation db operation to delete candidate from pi]
 * @param  {[type]} candidateIds [candidateId array]
 * @param  {[type]} roundType    [description]
 * @param  {[type]} orgNameMap   [description]
 * @return {[type]}              [description]
 */
async function deleteCandidatePiDbOperation (candidateIds, roundType, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteCandidatePiDbOperation()', func.logCons.LOG_ENTER)
    const query = getDeletePiQuery(candidateIds, roundType)
    dbOp.delete(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      (err, deleteCandidate) => {
        if (err) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while deleting candidate from pi_assessment_details. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteCandidatePiDbOperation()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!deleteCandidate || deleteCandidate.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidate detail not found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteCandidatePiDbOperation()', func.logCons.LOG_EXIT)
          return resolve(deleteCandidate)
        }
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteCandidatePiDbOperation()', func.logCons.LOG_EXIT)
        return resolve(deleteCandidate)
      })
  })
}

/**
 * [getDeletePiQuery query array for pi_assessment_details]
 * @param  {[type]} candidateIds [description]
 * @param  {[type]} roundType    [description]
 * @return {[type]}              [description]
 */
function getDeletePiQuery (candidateIds, roundType) {
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_ID, func.lightBlueCons.OP_IN, candidateIds))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROUND_TYPE, func.lightBlueCons.OP_EQUAL, getEnumForRoundType(roundType)))
  return query
}

/**
 * [insertInGdGroupDetails add candidate in gd_group_details using addGdGroup API helper]
 * @param  {[type]} candidateDetails [request json]
 * @param  {[type]} orgNameMap       [description]
 * @param  {[type]} userCode         [description]
 * @param  {[type]} env              [description]
 * @return {[type]}                  [description]
 */
async function insertInGdGroupDetails (candidateDetails, orgNameMap, userCode, env) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertInGdGroupDetails()', func.logCons.LOG_ENTER)
    const requestJson = getGdGroupRequestJson(candidateDetails)
    gdGroupDetailsHelpers.addGdGroupDetails(userCode, requestJson, orgNameMap, function (err, gdGroupDetails) {
      if (err) {
        return reject(err)
      } else if (!gdGroupDetails || gdGroupDetails.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidates not inserted in gd_group_details`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertInPiAssessmentDetails()', func.logCons.LOG_EXIT)
        return reject(new Error(`candidates not inserted in gd_group_details{candidateDetails}`))
      }
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertInGdGroupDetails()', func.logCons.LOG_EXIT)
      return resolve(gdGroupDetails)
    })
  })
}

/**
 * [getGdGroupRequestJson request json to internally call gdGroupDetailsHelpers.addGdGroupDetails function]
 * @param  {[type]} candidateDetails [description]
 * @return {[type]}                  [description]
 */
function getGdGroupRequestJson (candidateDetails) {
  delete candidateDetails[func.msCons.FIELD_SUFFLE_TYPE]
  delete candidateDetails[func.msCons.COLLECTION_JSON_STAGE]
  let universityOfCandidates = func.getValuesArrayFromJson(func.dbCons.FIELD_INSTITUTE_NAME, candidateDetails[func.dbCons.COLLECTION_CANDIDATE_DETAILS])
  candidateDetails[func.msCons.FIELD_INSTITUTE_ARRAY] = _.uniq(universityOfCandidates)
  candidateDetails[func.dbCons.FIELD_GD_DISCUSSION_LEVEL] = (candidateDetails[func.msCons.FIELD_INSTITUTE_ARRAY].length === 1) ? func.msCons.FIELD_INSTITUTE_LEVEL : func.msCons.FIELD_ACROSS_INSTITUTE_LEVEL
  return candidateDetails
}

/**
 * [getEnumForRoundType enum for round_type]
 * @param  {[type]} value [description]
 * @return {[type]}       [description]
 */
function getEnumForRoundType (value) {
  switch (value) {
    case func.dbCons.VALUE_ROUND_TYPE_ON_CAMPUS:
      return func.dbCons.ENUM_ROUND_TYPE_ON_CAMPUS
    case func.dbCons.VALUE_ROUND_TYPE_ON_SITE:
      return func.dbCons.ENUM_ROUND_TYPE_ON_SITE
    default:
      return -1
  }
}
exports.SwitchCandidateGdPiHelpers = SwitchCandidateGdPiHelpers
