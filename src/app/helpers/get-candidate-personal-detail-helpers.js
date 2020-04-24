'use strict'
/**
 * This function is useful for getting candidate personal detail
 * @author Leena Patoliya
 */
const func = require('../utils/functions')
// const async = require('async')
const DbOperation = require('./db-operations').DbOperation
const dbOp = new DbOperation()
var _ = require('lodash')
const HELPER_CONS = 'HI_GCPD_'

function GetCandidatePersonalDetailsHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of fetching candidate personal details')
}

/**
 * [description]
 * @param  {[type]} candidateId [candidateId]
 * @param  {[type]} orgNameMap  [description]
 * @return {[type]}             [description]
 */
GetCandidatePersonalDetailsHelpers.prototype.getCandidatePersonalDetails = async function(candidateId, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidatePersonalDetails()', func.logCons.LOG_ENTER)
  try {
    const personId = await getPersonId(candidateId, orgNameMap)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `Person ID =${personId}`)
    const personDetail = await getPersonDetailsFromPersonId(personId, orgNameMap)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `Candidate personal detail =${JSON.stringify(personDetail)}`)
    return getReturnJson(personDetail)
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while getting candidate personal details. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidatePersonalDetails()', func.logCons.LOG_EXIT)
    throw err
  }
}

function getReturnJson(response) {
  let data = {}
  let errors = []
  return {
    data: (response === undefined) ? data : response,
    errors: errors,
    message: (response.length === 0) ? func.msgCons.ERROR_MSG_CANDIDATE_DETAILS_NOT_FOUND : func.msgCons.SUCCESS_MSG_DATA_RETRIEVED
  }
}
/**
 * [get person id from candidate detail]
 * @param  {[type]} candidateId [particular person Id]
 * @param  {[type]} orgNameMap      [description]
 * @return {[type]}                 [description]
 */
async function getPersonId(candidateId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonId()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PERSON_ID))
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, candidateId),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      projection, (err, candidateDetailResponse) => {
        if (err) {
          // Lightblue error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while finding person Id. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonId()', func.logCons.LOG_EXIT)
          return reject(new Error(`Error while fetching candidate person Id $ {candidateId}. ${err}`))
        } else if (!candidateDetailResponse || candidateDetailResponse.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Candidate personId not found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonId()', func.logCons.LOG_EXIT)
          return reject(candidateDetailResponse)
        }
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonId()', func.logCons.LOG_EXIT)
        return resolve(candidateDetailResponse[0][func.dbCons.FIELD_PERSON_ID])
      })
  })
}

/**
 * [get candidate personal detail]
 * @param  {[type]} personId  [personId]
 * @param  {[type]} orgNameMap [description]
 * @return {[type]}            [description]
 */
async function getPersonDetailsFromPersonId(personId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetails()', func.logCons.LOG_ENTER)
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, personId),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_PERSON_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true),
      (err, personDetailResponse) => {
        if (err) {
          // Lightblue error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while finding candidate personal detail. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetails()', func.logCons.LOG_EXIT)
          return reject(new Error(`Error while fetching candidate personal details${personId}. ${err}`))
        } else if (!personDetailResponse || personDetailResponse.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `candidate personal detail not found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetails()', func.logCons.LOG_EXIT)
          return reject(personDetailResponse)
        }
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetails()', func.logCons.LOG_EXIT)
        personDetailResponse[0][func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS] = personDetailResponse[0][func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS]
        personDetailResponse[0][func.dbCons.CANDIDATE_FIELD_MOBILE_NO] = personDetailResponse[0][func.dbCons.CANDIDATE_FIELD_MOBILE_NO]
        personDetailResponse[0][func.dbCons.CANDIDATE_FIELD_ALT_MOBILE_NO] = personDetailResponse[0][func.dbCons.CANDIDATE_FIELD_ALT_MOBILE_NO]
        return resolve(personDetailResponse)
      })
  })
}
exports.GetCandidatePersonalDetailsHelpers = GetCandidatePersonalDetailsHelpers
