'use strict'
/**
 * This function is useful for adding  candidate assessment
 * @author Ekta Kakadia
 */
const func = require('../utils/functions')
const DbOperation = require('./db-operations').DbOperation
const dbOp = new DbOperation()
var _ = require('lodash')
const HELPER_CONS = 'HI_UCDH_'

function AssessmentCandidateDetails() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of adding candidate assessment details')
}

AssessmentCandidateDetails.prototype.addCandidateAssessment = async function (body, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addCandidateAssessment()', func.logCons.LOG_ENTER)
  try {
    let response = await updateAssessmentCandidate(body, orgNameMap)
    response = await updateCandidateHistory(response, orgNameMap)
    return response
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while updating candidate details. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addCandidateAssessment()', func.logCons.LOG_EXIT)
    throw err
  }
}
AssessmentCandidateDetails.prototype.getCandidateAssessment = async function (body, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateAssessment()', func.logCons.LOG_ENTER)
  try {
    let response = await getCandidateAssessmentFromHistory(body, orgNameMap)
    return response
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while updating candidate details. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateAssessment()', func.logCons.LOG_EXIT)
    throw err
  }
}
AssessmentCandidateDetails.prototype.editCandidateAssessment = async function (body, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'editCandidateAssessment()', func.logCons.LOG_ENTER)
  try {
    let response = await editCandidateAssessmentFromHistory(body, orgNameMap)
    return response
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while updating candidate details. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'editCandidateAssessment()', func.logCons.LOG_EXIT)
    throw err
  }
}
AssessmentCandidateDetails.prototype.deleteCandidateAssessment = async function (candidateHistoryId, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'deleteCandidateAssessment()', func.logCons.LOG_ENTER)
  try {
    let response = await deleteCandidateAssessmentFromHistory(candidateHistoryId, orgNameMap)
    if (response === 1) {
      response = 'Assessment deleted successfully'
    } else if (response === 0) {
      response = 'candidate history id does not exist'
    }
    return response
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while delete candidate history details. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteCandidateAssessment()', func.logCons.LOG_EXIT)
    throw err
  }
}
async function deleteCandidateAssessmentFromHistory (candidateHistoryId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteCandidateAssessmentFromHistory()', func.logCons.LOG_ENTER)
    dbOp.delete(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, candidateHistoryId), orgNameMap,   dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_HISTORY_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), (error, response) => {
      if (error) {
        return reject(error)
      } else {
        return resolve(response)
        }
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteCandidateAssessmentFromHistory()', func.logCons.LOG_EXIT)
  })
}
async function editCandidateAssessmentFromHistory (body, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'editCandidateAssessmentFromHistory()', func.logCons.LOG_ENTER)
    let jsonToUpdate = {}
    jsonToUpdate['assessment'] = body.assessment_details
    dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, body.candidate_history_id),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_HISTORY_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getOperationJson(func.lightBlueCons.OP_SET, jsonToUpdate),
      dbOp.getCommonProjection(), (err, updatedJSON) => {
        console.log("---------------------------", updatedJSON)
        if (err) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while updating assessment in history details. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'editCandidateAssessmentFromHistory()', func.logCons.LOG_EXIT)
          return reject(err)
        }
        return resolve(updatedJSON)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'editCandidateAssessmentFromHistory()', func.logCons.LOG_EXIT)
  })
}
async function getCandidateAssessmentFromHistory (body, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateAssessmentFromHistory()', func.logCons.LOG_ENTER)
    let query = []
    query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_PROCESS_TYPE, func.lightBlueCons.OP_EQUAL, 10, true, true))
    query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_ID, func.lightBlueCons.OP_EQUAL, body.candidate_id, true, true))
    query.push(dbOp.getQueryJsonForOp(func.dbCons.COLLECTION_JSON_STATUS, func.lightBlueCons.OP_EQUAL, 7, true, true))
    dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_HISTORY_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getCommonProjection(), (err, historyResponse) => {
        if (err) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while finding candidate history details. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateAssessmentFromHistory()', func.logCons.LOG_EXIT)
          return reject(new Error(`Error while history details  $ {historyResponse}. ${err}`))
        } else if (!historyResponse || historyResponse.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_WARN, `person id not found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateAssessmentFromHistory()', func.logCons.LOG_EXIT)
          return resolve(historyResponse)
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateAssessmentFromHistory()', func.logCons.LOG_EXIT)
          // historyResponse = decryptDetails(historyResponse)
          return resolve(historyResponse)
        }
      })
  })
}
async function updateAssessmentCandidate(data, orgNameMap) {
  let response = []
  data.candidate_details.forEach(element => {
    let historyJson = getJSONforCandidateHistory(element, data)
    response.push(historyJson)
  });
  return response
}
async function updateCandidateHistory(data, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateCandidateHistory()', func.logCons.LOG_ENTER)
    dbOp.insert(orgNameMap, func.dbCons.COLLECTION_CANDIDATE_HISTORY_DETAILS, data, dbOp.getCommonProjection(), function (error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while adding data in candidate history details ${error}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateHistory()', func.logCons.LOG_EXIT)
        return reject(error)
      } else if (response.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while adding  data in candidate history details ${error}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateHistory()', func.logCons.LOG_EXIT)
        return reject(response)
      } else {
        return resolve(response)
      }
    })
  })
}

function getJSONforCandidateHistory(candidateDetails, body) {
  let requestJSON = {}
  requestJSON[func.dbCons.FIELD_HEAD_ROLE] = func.dbCons.VALUE_ACCOUNT_ADMIN
  requestJSON[func.dbCons.FIELD_PROCESS_TYPE] = 10 // assessment given 
  requestJSON[func.dbCons.FIELD_CANDIDATE_ID] = candidateDetails.candidate_id
  requestJSON[func.dbCons.COMMON_CREATED_BY] = body.user_code
  requestJSON[func.dbCons.COMMON_UPDATED_BY] = body.user_code
  requestJSON[func.dbCons.FIELD_STATUS] = 7 // assessment given
  requestJSON[func.dbCons.FIELD_ROUND] = candidateDetails.round
  requestJSON[func.dbCons.FIELD_DESIGNATION] = candidateDetails.designation
  requestJSON[func.dbCons.FIELD_ASSESSMENT] = body.assessment_details
  return requestJSON
}
exports.AssessmentCandidateDetails = AssessmentCandidateDetails
