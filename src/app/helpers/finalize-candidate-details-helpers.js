'use strict'
/**
 * This function is useful for getting candidates whom admin has sent offer-letter
 * @author Monika Mehta
 */
const func = require('../utils/functions')
// const async = require('async')
const DbOperation = require('./db-operations').DbOperation
const dbOp = new DbOperation()
var _ = require('lodash')
const HELPER_CONS = 'HI_FCDH_'

function FinalizeCandidateDetailsHelpers () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of switching candidate')
}

/**
 * [description]
 * @param  {[type]} requestJson [consists of institute name,designation and stage]
 * @param  {[type]} orgNameMap  [description]
 * @param  {[type]} userCode    [description]
 * @param  {[type]} env         [description]
 * @return {[type]}             [description]
 */
FinalizeCandidateDetailsHelpers.prototype.getFinalizedCandidate = async function (requestJson, orgNameMap, userCode, env) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getFinalizedCandidate()', func.logCons.LOG_ENTER)
  try {
    const instituteName = requestJson[func.dbCons.FIELD_INSTITUTE_NAME]
   const designation = requestJson[func.dbCons.FIELD_DESIGNATION]
   const stage =  requestJson[func.dbCons.COLLECTION_JSON_STAGE]
    let instituteDetails = await getInstituteIds(instituteName, orgNameMap)
    let campusDriveDetails = await getCampusDriveDetails(instituteDetails, designation, orgNameMap)
    campusDriveDetails = mappingJson(campusDriveDetails, func.dbCons.FIELD_INSTITUTE_ID, instituteDetails, func.dbCons.FIELD_ID, func.dbCons.FIELD_ID, func.dbCons.FIELD_INSTITUTE_ID)
    let candidateSourceDetails = await getCandidateSourceDetails(campusDriveDetails, orgNameMap)
     campusDriveDetails = mappingJson(campusDriveDetails, func.dbCons.FIELD_ID, candidateSourceDetails, func.dbCons.FIELD_CAMPUS_DRIVE_ID, func.dbCons.FIELD_ID, func.dbCons.FIELD_CANDIDATE_SOURCE_ID)
     let candidateDetails = await getCandidateDetails(campusDriveDetails, stage, orgNameMap)
     candidateDetails = mappingJson(candidateDetails, func.dbCons.FIELD_CANDIDATE_SOURCE_ID, campusDriveDetails, func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.dbCons.FIELD_ID, func.dbCons.FIELD_CAMPUS_DRIVE_ID)
     let personDetails = await getPersonDetails(candidateDetails, orgNameMap)
     personDetails = await encryptEmailIds(personDetails)
     candidateDetails = mappingJson(candidateDetails,func.dbCons.FIELD_PERSON_ID, personDetails, func.dbCons.FILED_ID, func.dbCons.FIELD_ID, func.dbCons.FIELD_PERSON_ID)
     candidateDetails = await getCandidateStageEnum(candidateDetails)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `getFinalizedCandidate =${JSON.stringify(candidateDetails)}`)
   return getReturnJson(candidateDetails)
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while getting finalize candidate details. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getFinalizedCandidate()', func.logCons.LOG_EXIT)
    throw err
  }
}

async function encryptEmailIds(personDetails){

  for(let candidateDetail of personDetails){
    candidateDetail[func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS] = candidateDetail[func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS]
  }
  return personDetails
}

function getReturnJson(response) {
  let data = {}
  let errors = []
  return {
    data: (response === undefined) ? data : response,
    errors: errors,
    // message: (ids.length === 0) ? func.msgCons.NO_CAMPUS_YEAR_FOUND : func.msgCons.SUCCESS_MSG_CAMPUS_YEAR_RETRIEVED
  }
}

async function getCandidateStageEnum(candidateDetails){
  for (let candidate of candidateDetails) {
  candidate[func.dbCons.COLLECTION_JSON_STAGE] = getCandidateStageValue(candidate[func.dbCons.COLLECTION_JSON_STAGE])
  }
  return candidateDetails
}

function getCandidateStageValue (stage) {
  switch (stage) {
    case func.dbCons.ENUM_SELECTED_IN_PI_BY_ASSESSOR_FROM_ONSITE:
      return func.dbCons.VALUE_SELECTED_IN_PI_BY_ASSESSOR_FROM_ONSITE
    case func.dbCons.ENUM_SELECTED_IN_PI_BY_ADMIN_FROM_ONSITE:
      return func.dbCons.VALUE_SELECTED_IN_PI_BY_ADMIN_FROM_ONSITE
    case func.dbCons.ENUM_STAGE_TPO_REJECTED_CANDIDATE_OFFER_LETTER:
      return func.dbCons.VALUE_TPO_REJECTED_CANDIDATE_OFFER_LETTER
    case func.dbCons.ENUM_STAGE_TPO_APPROVED_CANDIDATE_OFFER_LETTER:
      return func.dbCons.VALUE_TPO_APPROVED_CANDIDATE_OFFER_LETTER
    case func.dbCons.ENUM_STAGE_ADMIN_APPROVED_CANDIDATE_OFFER_LETTER:
      return func.dbCons.VALUE_ADMIN_APPROVED_CANDIDATE_OFFER_LETTER
    case func.dbCons.ENUM_STAGE_ADMIN_REJECTED_CANDIDATE_OFFER_LETTER:
      return func.dbCons.VALUE_ADMIN_REJECTED_CANDIDATE_OFFER_LETTER
    case func.dbCons.ENUM_STAGE_DOWNLOAD_CANDIDATE_OFFER_LETTER:
      return func.dbCons.VALUE_DOWNLOAD_CANDIDATE_OFFER_LETTER
    case func.dbCons.ENUM_STAGE_UPLOAD_CANDIDATE_OFFER_LETTER:
      return func.dbCons.VALUE_UPLOAD_CANDIDATE_OFFER_LETTER
    default:
      return -1
  }
}


function mappingJson(json1, json1key, json2, json2key, replaceWith, replaceBy) {
  _.map(json1, function(item, index) {
    if (replaceWith !== undefined) {
      json1[index] = _.merge(item, JSON.parse(JSON.stringify(_.find(json2, [json2key, item[json1key]])).replace("\"" + replaceWith + "\":", "\"" + replaceBy + "\":")))
    } else {
      json1[index] = _.merge(item, (_.find(json2, [json2key, item[json1key]])))
    }
  })
  return json1
}


async function getCandidateSourceDetails(campusDriveDetails, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceDetails()', func.logCons.LOG_ENTER)
    let campusDriveIds = func.getValuesArrayFromJson(func.dbCons.FIELD_ID, campusDriveDetails)
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CAMPUS_DRIVE_ID, func.lightBlueCons.OP_IN, campusDriveIds),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_CAMPUS_SOURCE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getCommonProjection(), (err, candidateSourceDetails) => {
        if (err) {
          // Lightblue error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while finding candidate source ids. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceDetails()', func.logCons.LOG_EXIT)
          return reject(new Error(`Error while fetching candidate details. ${err}`))
        } else if (!candidateSourceDetails || candidateSourceDetails.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidate not found for campusDriveIds ${campusDriveIds}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceDetails()', func.logCons.LOG_EXIT)
          return resolve(candidateSourceDetails)
        }
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceDetails()', func.logCons.LOG_EXIT)
        return resolve(candidateSourceDetails)
      })
  })
}

async function getPersonDetails(candidateDetails, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails()', func.logCons.LOG_ENTER)
    let personIds = func.getValuesArrayFromJson(func.dbCons.COLLECTION_JSON_PERSON_ID, candidateDetails)
    let projection = getPersonDetailsProjection()
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, personIds),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_PERSON_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      projection, (err, personDetails) => {
        if (err) {
          // Lightblue error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while finding person details. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetails()', func.logCons.LOG_EXIT)
          return reject(new Error(`Error while fetching personal details. ${err}`))
        } else if (!personDetails || personDetails.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidate not found in person details ${personIds}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetails()', func.logCons.LOG_EXIT)
          return resolve(personDetails)
        }
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetails()', func.logCons.LOG_EXIT)
        return resolve(personDetails)
      })
  })
}

function getPersonDetailsProjection(){
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_RESUME_FILE))
  projection.push(dbOp.getProjectionJson(func.dbCons.CANDIDATE_FIELD_FIRST_NAME))
  projection.push(dbOp.getProjectionJson(func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME))
  projection.push(dbOp.getProjectionJson(func.dbCons.CANDIDATE_FIELD_LAST_NAME))
  projection.push(dbOp.getProjectionJson(func.dbCons.CANDIDATE_FIELD_GENDER))
  projection.push(dbOp.getProjectionJson(func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS))
  return projection
}


async function getCandidateDetails(campusDriveDetails, stage, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails()', func.logCons.LOG_ENTER)
    let candidateSourceIds = func.getValuesArrayFromJson(func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID, campusDriveDetails)
    let query = getQueryForCandidateDetails(candidateSourceIds, stage)
    dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getCommonProjection(), (err, candidateDetails) => {
        if (err) {
          // Lightblue error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while finding candidate details. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails()', func.logCons.LOG_EXIT)
          return reject(new Error(`Error while fetching candidate details. ${err}`))
        } else if (!candidateDetails || candidateDetails.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidate not found for campusDriveIds ${candidateSourceIds}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails()', func.logCons.LOG_EXIT)
          return resolve(candidateDetails)
        }
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails()', func.logCons.LOG_EXIT)
        return resolve(candidateDetails)
      })
  })
}

function getQueryForCandidateDetails (candidateSourceIds, stage) {
 let query = []
 query.push(dbOp.getQueryJsonForOp(func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_IN, candidateSourceIds))
 query.push(dbOp.getQueryJsonForOp(func.dbCons.COLLECTION_JSON_STAGE, func.lightBlueCons.OP_GREATER_EQUAL, stage))
 return query
}

async function getInstituteIds(institutes, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteIds()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_INSTITUTE_DETAILS_NAME))
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_INSTITUTE_DETAILS_NAME, func.lightBlueCons.OP_EQUAL, institutes),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_INSTITUTE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      projection, (err, instituteResponse) => {
        if (err) {
          // Lightblue error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while finding institute name. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteIds()', func.logCons.LOG_EXIT)
          return reject(new Error(`Error while fetching institute details${institutes}. ${err}`))
        } else if (!instituteResponse || instituteResponse.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `institute not found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteIds()', func.logCons.LOG_EXIT)
          return reject(instituteResponse)
        }
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteIds()', func.logCons.LOG_EXIT)
        return resolve(instituteResponse)
      })
  })
}

async function getCampusDriveDetails(instituteDetails, designation, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDetails()', func.logCons.LOG_ENTER)
    let instituteIds = func.getValuesArrayFromJson(func.dbCons.FIELD_ID, instituteDetails)
    const query = getCampusDriveDetailsQuery(instituteIds, designation)
    dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getCommonProjection(), (err, campusDriveDetails) => {
        if (err) {
          // Lightblue error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while finding campus drive ids. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDetails()', func.logCons.LOG_EXIT)
          return reject(new Error(`Error while fetching campus drive ids. ${err}`))
        } else if (!campusDriveDetails || campusDriveDetails.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidate detail not found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDetails()', func.logCons.LOG_EXIT)
          return resolve(campusDriveDetails)
        }
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDetails()', func.logCons.LOG_EXIT)
        return resolve(campusDriveDetails)
      })
  })
}

function getCampusDriveDetailsQuery(instituteIds, designation) {
  let query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_INSTITUTE_ID, func.lightBlueCons.OP_IN, instituteIds))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.COLLECTION_DESIGNATION, func.lightBlueCons.OP_EQUAL, designation))
  return query
}


exports.FinalizeCandidateDetailsHelpers = FinalizeCandidateDetailsHelpers
