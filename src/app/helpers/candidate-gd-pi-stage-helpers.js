const func = require('../utils/functions')
//const async = require('async')
const DbOperation = require('./db-operations').DbOperation
const dbOp = new DbOperation()
const HELPER_CONS = 'HI_CGPS_'
var _ = require('lodash')

function CandidateGdPiStageHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of updating candidate stage and status')
}

CandidateGdPiStageHelpers.prototype.updateCandidateStageGdPiStatus = async function(body, stage, orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateCandidateStageGdPiStatus()', func.logCons.LOG_ENTER)
  try {
    let candidateJson = {}
    candidateJson[func.dbCons.FIELD_CANDIDATE_ID] = body[func.dbCons.FIELD_CANDIDATE_ID]
    candidateJson[func.dbCons.COLLECTION_JSON_STAGE] = getEnumStatusFromValue(body[func.dbCons.COLLECTION_JSON_STAGE])
    const candidateStage = await updateCandidateStage(candidateJson, orgNameMap)
    candidateJson = {}
    // candidateJson[func.dbCons.FIELD_ROUND_TYPE] = getEnumForRoundType(body[func.dbCons.FIELD_ROUND_TYPE])
    let candidateResponse = {}
    if (stage === func.dbCons.ENUM_SELECTED_FOR_GD) {
      candidateJson[func.dbCons.COLLECTION_JSON_STATUS] = getEnumForGdStatus(body[func.dbCons.COLLECTION_JSON_STATUS])
      candidateResponse = await updateCandidateGdStatus(body[func.dbCons.FIELD_CANDIDATE_ID], candidateJson, orgNameMap)
    } else {
      candidateJson[func.dbCons.COLLECTION_JSON_STATUS] = getEnumForPiStatus(body[func.dbCons.COLLECTION_JSON_STATUS])
      candidateResponse = await updateCandidatePiStatus(body[func.dbCons.FIELD_CANDIDATE_ID], candidateJson, orgNameMap)
    }


    return getReturnJson(candidateResponse)
    //  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidateSourceIds =${JSON.stringify(candidateSourceIds)}`)
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while getting campus years. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateStageGdPiStatus()', func.logCons.LOG_EXIT)
    throw err
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateStageGdPiStatus()', func.logCons.LOG_EXIT)
}

function getReturnJson(ids, response) {
  let data = {}
  let errors = []
  return {
    data: (response === undefined) ? data : response,
    errors: errors,
    message: (ids.length === 0) ? func.msgCons.MSG_GD_PI_STATUS_NOT_UPDATED : func.msgCons.MSG_GD_PI_STATUS_UPDATED
  }
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

async function updateCandidateStage(candidateDetails, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateStage()', func.logCons.LOG_ENTER)
    let projection = []
    let updateJson = {}
    updateJson[func.dbCons.COLLECTION_JSON_STAGE] = candidateDetails[func.dbCons.COLLECTION_JSON_STAGE]
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
    dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidateDetails[func.dbCons.FIELD_CANDIDATE_ID]),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getOperationJson(func.lightBlueCons.OP_SET, updateJson),
      projection,
      function(err, updatedCandidateDetails) {
        if (err) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while updating candidate stage ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateStage()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!updatedCandidateDetails || updatedCandidateDetails.length == 0) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `no candidate stage updated`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateStage()', func.logCons.LOG_EXIT)
          return reject(updatedCandidateDetails)
        }

        const candidateUniqueIds = _.uniq(func.getValuesArrayFromJson(func.dbCons.FIELD_ID, updatedCandidateDetails))
        return resolve(candidateUniqueIds)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIds()', func.logCons.LOG_EXIT)
  })
}


async function updateCandidatePiStatus(candidateIds, candidateDetails, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidatePiStatus()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_ID, true, true))
    dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_ID, func.lightBlueCons.OP_IN, candidateIds),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getOperationJson(func.lightBlueCons.OP_SET, candidateDetails),
      projection,
      function(err, updatedCandidateDetails) {
        if (err) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while updating candidate status in pi_assessment_details ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidatePiStatus()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!updatedCandidateDetails || updatedCandidateDetails.length == 0) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `no candidate status updated`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidatePiStatus()', func.logCons.LOG_EXIT)
          return reject(updatedCandidateDetails)
        }

        const candidateUniqueIds = _.uniq(func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_ID, updatedCandidateDetails))
        return resolve(candidateUniqueIds)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidatePiStatus()', func.logCons.LOG_EXIT)
  })
}

async function updateCandidateGdStatus(candidateIds, candidateDetails, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateGdStatus()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_ID, true, true))

    dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_ID, func.lightBlueCons.OP_IN, candidateIds),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_GD_GROUP_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getOperationJson(func.lightBlueCons.OP_SET, candidateDetails),
      projection,
      function(err, updatedCandidateDetails) {
        if (err) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while updating candidate status in gd_group_details ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateGdStatus()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!updatedCandidateDetails || updatedCandidateDetails.length == 0) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `no candidate status updated`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateGdStatus()', func.logCons.LOG_EXIT)
          return resolve(updatedCandidateDetails)
        }

        const candidateUniqueIds = _.uniq(func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_ID, updatedCandidateDetails))
        return resolve(candidateUniqueIds)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateGdStatus()', func.logCons.LOG_EXIT)
  })
}


function getEnumStatusFromValue(value) {
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
    default:
      return -1
  }
}

function getEnumForPiStatus(status) {
  switch (status) {
    case func.dbCons.VALUE_PI_ASSESSMENT_SELECTED_FOR_PI:
      return func.dbCons.ENUM_PI_ASSESSMENT_SELECTED_FOR_PI
    case func.dbCons.VALUE_PI_ASSESSMENT_IN_DRAFT:
      return func.dbCons.ENUM_PI_ASSESSMENT_IN_DRAFT
    case func.dbCons.VALUE_PI_ASSESSMENT_COMPLETED:
      return func.dbCons.ENUM_PI_ASSESSMENT_COMPLETED
    case func.dbCons.VALUE_PI_ASSESSMENT_SELECTED_BY_HR:
      return func.dbCons.ENUM_PI_ASSESSMENT_SELECTED_BY_HR
    case func.dbCons.VALUE_PI_CANDIDATE_NOT_APPEARED:
      return func.dbCons.ENUM_PI_ASSESSMENT_CANDIDATE_NOT_APPEARED
    case func.dbCons.VALUE_PI_ASSESSMENT_SELECTED_FOR_ONSITE:
      return func.dbCons.ENUM_PI_ASSESSMENT_SELECTED_FOR_ONSITE_PI
    default:
      return -1
  }
}

function getEnumForGdStatus(status) {
  switch (status) {
    case func.dbCons.VALUE_GD_GROUP_CANDIDATE_IN_DRAFT:
      return func.dbCons.ENUM_STATUS_GD_GROUP_IN_DRAFT
    case func.dbCons.VALUE_GD_GROUP_CANDIDATE_COMPLETED:
      return func.dbCons.ENUM_STATUS_GROUP_EVALUATION_DONE
    case func.dbCons.VALUE_GD_GROUP_CANDIDATE_NOT_APPEARED:
      return func.dbCons.ENUM_STATUS_CANDIDATE_NOT_APPEARED_IN_GD
    case func.dbCons.VALUE_STATUS_SELECTED_FOR_ONSITE_GD:
      return func.dbCons.ENUM_STATUS_SELECTED_FOR_ONSITE_GD
    default:
      return -1
  }
}

exports.CandidateGdPiStageHelpers = CandidateGdPiStageHelpers
