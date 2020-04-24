const func = require('../utils/functions')
const async = require('async')
const DbOperation = require('./db-operations').DbOperation
const dbOp = new DbOperation()
const HELPER_CONS = 'HS_CJD_'
var _ = require('lodash')

function CandidateJoiningDetailsHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created to get candidate  joining details')
}

CandidateJoiningDetailsHelpers.prototype.getCandidateJoiningDetails = async function (user_code, orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateJoiningDetails()', func.logCons.LOG_ENTER)
  try {
    let data = {}
    let errors = []
    let originalKeys = []
    let replaceKeys = []
    let finalJSON
    let candidateJoinDetails = await getJoinningDetailsOfCandidate(user_code, orgNameMap)
    if (candidateJoinDetails.length === 0) {
      return getReturnJson(candidateJoinDetails)
    }
    originalKeys.push(func.dbCons.FIELD_ID)
    replaceKeys.push(func.dbCons.FIELD_CANDIDATE_ID)
    let candidateJson = await getRenamedKeysinJSON(candidateJoinDetails, originalKeys, replaceKeys)
    if (candidateJson[0][func.dbCons.FIELD_DESIGNATION === undefined]) {
      let campusDriveDetails = await getCampusDriveIdfromCandidateSourceDetails(candidateJson, orgNameMap)
      finalJSON = await getDesignationfromID(campusDriveDetails, orgNameMap)
    } else {
      finalJSON = candidateJson
    }
    data[func.dbCons.JOINING_DETAILS] = finalJSON
    return {
      data: data,
      errors: errors
    }
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while getting candidate joining Detail. ${err}`)
    let error = func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, err)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateJoiningDetails()', func.logCons.LOG_EXIT)
    throw error
  }
}

function getReturnJson(ids) {
  let data = {}
  let errors = []
  return {
    data: (ids === undefined) ? data : ids,
    errors: errors,
    message: (ids.length === 0) ? func.msgCons.JOINING_DETAILS_NOT_FOUND : func.msgCons.JOINING_DETAILS_FETCHED
  }
}

async function getDesignationfromID(candidateJson, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDesignationfromID()', func.logCons.LOG_ENTER)
    let queryForCampusDetails = []
    queryForCampusDetails.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, candidateJson[0][func.dbCons.FIELD_CAMPUS_DRIVE_ID]))
    let queryJsonForCandidate = dbOp.getOperationJson(func.lightBlueCons.OP_AND, queryForCampusDetails)
    dbOp.findByQuery(queryJsonForCandidate, orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getCommonProjection(), (err, campusDetails) => {
        if (err) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDesignationfromID()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!campusDetails || campusDetails.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `no campus details found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDesignationfromID()', func.logCons.LOG_EXIT)
          return reject(campusDetails)
        }
        candidateJson[0][func.dbCons.COLLECTION_DESIGNATION] = campusDetails[0][func.dbCons.COLLECTION_DESIGNATION]
        return resolve(candidateJson)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDesignationfromID()', func.logCons.LOG_EXIT)
  })
}

async function getCampusDriveIdfromCandidateSourceDetails(candidateJson, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdfromCandidateSourceDetails()', func.logCons.LOG_ENTER)
    let queryForCandidateDetails = []
    queryForCandidateDetails.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, candidateJson[0][func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID]))
    let queryJsonForCandidate = dbOp.getOperationJson(func.lightBlueCons.OP_AND, queryForCandidateDetails)
    dbOp.findByQuery(queryJsonForCandidate, orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getCommonProjection(), (err, candidateSourceDetails) => {
        if (err) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdfromCandidateSourceDetails()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!candidateSourceDetails || candidateSourceDetails.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `no candidate joining detailsfound`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdfromCandidateSourceDetails()', func.logCons.LOG_EXIT)
          return reject(candidateSourceDetails)
        }
        candidateJson[0][func.dbCons.FIELD_CAMPUS_DRIVE_ID] = candidateSourceDetails[0][func.dbCons.FIELD_CAMPUS_DRIVE_ID]
        return resolve(candidateJson)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdfromCandidateSourceDetails()', func.logCons.LOG_EXIT)
  })
}

async function getJoinningDetailsOfCandidate(user_code, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getJoinningDetailsOfCandidate()', func.logCons.LOG_ENTER)
    let queryForCandidateDetails = []
    // let projection = []
    queryForCandidateDetails.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_ID, func.lightBlueCons.OP_EQUAL, user_code))
    queryForCandidateDetails.push(dbOp.getQueryJsonForOp(func.dbCons.COLLECTION_JSON_STAGE, func.lightBlueCons.OP_GREATER_THAN, func.dbCons.ENUM_SELECTED_IN_PI_BY_ASSESSOR_FROM_ONSITE))
    let queryJsonForCandidate = dbOp.getOperationJson(func.lightBlueCons.OP_AND, queryForCandidateDetails)

    dbOp.findByQuery(queryJsonForCandidate, orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getCommonProjection(), (err, candidateDetails) => {

        if (err) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching candidate joining  details. ${err} for userCode = ${user_code}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getJoinningDetailsOfCandidate()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!candidateDetails || candidateDetails.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `no candidate joining detailsfound`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getJoinningDetailsOfCandidate()', func.logCons.LOG_EXIT)
          return resolve(candidateDetails)
        }
        return resolve(candidateDetails)
      })

    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getJoinningDetailsOfCandidate()', func.logCons.LOG_EXIT)
  })
}

async function getRenamedKeysinJSON(finalJSON, originalKeys, replaceKeys) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getRenamedKeysinJSON()', func.logCons.LOG_ENTER)
    for (var i = 0; i < originalKeys.length; i++) {
      for (let obj of finalJSON) {
        var key = originalKeys[i]

        var replacekey = replaceKeys[i]

        obj[replacekey] = obj[key]
        delete obj[key]
      }
    }

    return resolve(finalJSON)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getRenamedKeysinJSON()', func.logCons.LOG_EXIT)
  })
}
exports.CandidateJoiningDetailsHelpers = CandidateJoiningDetailsHelpers