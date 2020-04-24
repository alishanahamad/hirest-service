'use strict'
/**
 * This function is useful for fetching the candidate related information
 * @author Dipak Savaliya
 */

const func = require('../utils/functions')
// const async = require('async')
const DbOperation = require('./db-operations').DbOperation
const dbOp = new DbOperation()

const HELPER_CONS = 'HI_CDH_'
// const fs = require('fs')
// const json2xls = require('json2xls')
const fieldsSequences = [func.dbCons.FILED_FIRST_NAME, func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME, func.dbCons.CANDIDATE_FIELD_LAST_NAME, func.dbCons.CANDIDATE_FIELD_DOB, func.dbCons.CANDIDATE_FIELD_BLOOD_GROUP, func.dbCons.FIELD_GENDER, func.dbCons.FIELD_ADDRESS, func.dbCons.FIELD_TALUKA, func.dbCons.CANDIDATE_FIELD_COUNTRY, func.dbCons.CANDIDATE_FIELD_ZIPCODE, func.dbCons.FIELD_STATE, func.dbCons.FIELD_CITY, func.dbCons.CANDIDATE_FIELD_MOBILE_NO,
  func.dbCons.CANDIDATE_FIELD_ALT_MOBILE_NO, func.dbCons.FIELD_EMAIL_ADDRESS, func.dbCons.CANDIDATE_FIELD_UID_NO, func.dbCons.CANDIDATE_FIELD_PROFILE_IMAGE, func.dbCons.FIELD_FATHER_NAME, func.dbCons.FIELD_MORTHER_NAME, func.dbCons.FIELD_UNCLE_NAME, func.dbCons.FIELD_FATHER_OCCUPATION, func.dbCons.FIELD_BROTHER, func.dbCons.FIELD_SISTER, func.dbCons.CANDIDATE_FIELD_MARITAL_STATUS, func.dbCons.FIELD_RESIDANCE, func.dbCons.FIELD_RESUME_FILE,
  func.dbCons.FIELD_CURRENT_LOCATION, func.dbCons.FIELD_LIVING_WITH, func.dbCons.CANDIDATE_FIELD_ADDRESS_TYPE, func.dbCons.FIELD_REF_CONTACT_NUMBER, func.dbCons.FIELD_REL_WITH_REF
]

function CandidateDetailsHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of candidate details helper')
}

/**
 * This function will fetch the candidate details using its id
 * @param  {JSON}   gdGrpDetails [description]
 * @param  {JSON}   orgNameMap   [description]
 * @param  {String | -1}   env          [description]
 * @param  {Function} callback     [description]
 * @return {JSON}                [description]
 */

CandidateDetailsHelpers.prototype.getCandidateDetail = async function(candidateId, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateDetail()', func.logCons.LOG_ENTER)
  try {
    let data
    let errors = []
    // Get Candidate details from Id
    let personId = await getCandidateDetailsFromId(candidateId, orgNameMap)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `personId =${JSON.stringify(personId)}`)

    let candidateDetail = await getPersonDetailsFromId(personId, orgNameMap)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidateDetail =${JSON.stringify(candidateDetail)}`)
    data = candidateDetail

    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `getCandidateDetail data=${JSON.stringify(data)}`)
    func.printLog(func.logCons.LOG_LEVEL_INFO, `getCandidateDetail errors=${JSON.stringify(errors)}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetail()', func.logCons.LOG_EXIT)
    return {
      data: data,
      errors: errors
    }
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while getting candidate Detail. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetail()', func.logCons.LOG_EXIT)
    throw err
  }
}

/**
 * This function will get candidates from campus drive id
 * @param  {[type]} campusId   [description]
 * @param  {[type]} orgNameMap [description]
 * @param  {[type]} env        [description]
 * @return {[type]}            [description]
 */
CandidateDetailsHelpers.prototype.getCandidatesFromCampusId = async function(campusId, orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateFromCampusId()', func.logCons.LOG_ENTER)
  try {
    let data
    let errors = []
    let message;
    let candidateSourceId = await getCandidateSourceDetailsId(campusId, orgNameMap)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidateSourceId = ${candidateSourceId}`)
    let candidateDetails = await getCandidateDetailsFromSourceId(candidateSourceId, orgNameMap)
    let flattenCandidateDetails = await generateFlattenCandidateJsons(candidateDetails.candidate, candidateDetails.personMap)
    data = flattenCandidateDetails
    // const xls = json2xls(data)
    // fs.writeFileSync('data.xlsx', xls, 'binary')
    return getReturnJson(data)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidateDetails = ${JSON.stringify(candidateDetails)}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateFromCampusId()', func.logCons.LOG_EXIT)
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while getting candidate Detail. ${err}`)
    let error = func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_CANDIDATE_DETAILS_NOT_FOUND), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, err)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateFromCampusId()', func.logCons.LOG_EXIT)
    throw error
  }
}
function getReturnJson (candidateDetails) {
  let errors = []
  return {
    data: candidateDetails,
    errors: errors,
    message: (candidateDetails.length === 0) ? func.msgCons.MSG_CANDIDATE_DETAILS_NOT_FOUND : func.msgCons.MSG_SUCCESS_FETCHED_DATA
  }
}
async function getCandidateDetailsFromId(candidateId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsFromId()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PERSON_ID, true, true))
    dbOp.findByKey(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, candidateId, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), projection, function(err, personId) {
      if (err) {
        // Lightblue Error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching candidate details. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsFromId()', func.logCons.LOG_EXIT)
        return reject(err)
      } else if (!personId || personId.length !== 1) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `multiple candidate details found`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsFromId()', func.logCons.LOG_EXIT)
        return reject(new Error(`invalid candidate id ${candidateId}`))
      }
      return resolve(personId[0][func.dbCons.FIELD_PERSON_ID])
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsFromId()', func.logCons.LOG_EXIT)
  })
}

async function getPersonDetailsFromId(personId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromId()', func.logCons.LOG_ENTER)
    dbOp.findByKey(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, personId, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_PERSON_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function(err, personDetails) {
      if (err) {
        // Lightblue Error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching candidate details. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsFromId()', func.logCons.LOG_EXIT)
        return reject(err)
      } else if (!personDetails || personDetails.length !== 1) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `multiple person details found`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromId()', func.logCons.LOG_EXIT)
        return reject(new Error(`invalid candidate id ${personId}`))
      }
      return resolve(personDetails[0])
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromId()', func.logCons.LOG_EXIT)
  })
}

async function getCandidateSourceDetailsId(campusId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceDetailsId()', func.logCons.LOG_ENTER)
    dbOp.findByKey(func.dbCons.FIELD_CAMPUS_DRIVE_ID, func.lightBlueCons.OP_EQUAL, campusId, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(),
      (error, candidateSourceId) => {
        if (error) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching candidate details. ${error}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceDetailsId()', func.logCons.LOG_EXIT)
          return reject(error)
        } else if (!candidateSourceId || candidateSourceId.length !== 1) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `multiple candidate details found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceDetailsId()', func.logCons.LOG_EXIT)
          return reject(new Error(`invalid candidate id ${campusId}`))
        }
        return resolve(candidateSourceId[0][func.dbCons.FIELD_ID])
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceDetailsId()', func.logCons.LOG_EXIT)
  })
}

async function getCandidateDetailsFromSourceId(candidateSourceId, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsFromSourceId()', func.logCons.LOG_ENTER)
  let candidateRawDetails = await getCandidateRawDetailsFromSourceId(candidateSourceId, orgNameMap)
  let personMapJson = {}
  candidateRawDetails.map(candidatePerson => {
    personMapJson[candidatePerson[func.dbCons.FIELD_PERSON_ID]] = candidatePerson[func.dbCons.FIELD_ID]
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `personMapJson = ${JSON.stringify(personMapJson)}`)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidateRawDetails = ${JSON.stringify(candidateRawDetails)}`)
  let personIds = func.getValuesArrayFromJson(func.dbCons.FIELD_PERSON_ID, candidateRawDetails)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `personIds = ${JSON.stringify(personIds)}`)
  let personDetails = await getPersonDetailsFromIds(personIds, orgNameMap)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `personDetails = ${JSON.stringify(personDetails)}`)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsFromSourceId()', func.logCons.LOG_EXIT)
  return {
    candidate: personDetails,
    personMap: personMapJson
  }
}

async function getCandidateRawDetailsFromSourceId(candidateSourceId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateRawDetailsFromSourceId()', func.logCons.LOG_ENTER)
    dbOp.findByKey(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_EQUAL, candidateSourceId, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(),
      (error, candidates) => {
        if (error) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching candidate details. ${error}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceDetailsId()', func.logCons.LOG_EXIT)
          return reject(error)
        }
        return resolve(candidates)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateRawDetailsFromSourceId()', func.logCons.LOG_EXIT)
  })
}

async function getPersonDetailsFromIds(personIds, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromIds()', func.logCons.LOG_ENTER)
    let projection = dbOp.getCommonProjection()
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_LANGUAGES + '#', false, false))
    projection.push(dbOp.getProjectionJson(func.dbCons.CANDIDATE_FIELD_QUALIFICATION + '#', false, false))
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, personIds), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_PERSON_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      projection,
      (error, persons) => {
        if (error) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching candidate details. ${error}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromIds()', func.logCons.LOG_EXIT)
          return reject(error)
        }
        return resolve(persons)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromIds()', func.logCons.LOG_EXIT)
  })
}

async function generateFlattenCandidateJsons(candidateDetails, personMap) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateFlattenJson()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidateDetails = ${JSON.stringify(candidateDetails)}`)
  let candidates = []
  await Promise.all(candidateDetails.map(async (candidate) => {
    let flatCandidate = await generateFlattenCandidate(candidate, personMap)
    let sequenceFlatCandidate = await arrangeSequceOfCandidate(flatCandidate)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `flatCandidate =${JSON.stringify(flatCandidate)}`)
    candidates.push(sequenceFlatCandidate)
  }))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateFlattenJson()', func.logCons.LOG_EXIT)
  return candidates
}

function arrangeSequceOfCandidate(flatCandidate) {
  let candidateJson = {}
  for (let fieldsSequce of fieldsSequences) {
    candidateJson[fieldsSequce] = flatCandidate[fieldsSequce]
    delete flatCandidate[fieldsSequce]
  }
  return func.mergeJsons(candidateJson, flatCandidate)
}

async function generateFlattenCandidate(candidate, personMap) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateFlattenCandidate()', func.logCons.LOG_ENTER)
  let flatObject = {}
  for (let key in candidate) {
    if (Array.isArray(candidate[key]) && (key === func.dbCons.CANDIDATE_FIELD_QUALIFICATION)) {
      let flattenArrayJson = await generateFlattenObjectFromJsonArray(candidate[key], key)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, `flattenArrayJson =${JSON.stringify(flattenArrayJson)}`)
      flatObject = func.mergeJsons(flattenArrayJson, flatObject)
    } else if (key === func.dbCons.FIELD_HOBBIES || key === func.dbCons.FIELD_PREFERED_LOCATION) {
      let flattenArrayJsonObj = await func.generateFlattenJsonFromArrayObject(candidate[key], key)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, `flattenArrayJsonObj =${JSON.stringify(flattenArrayJsonObj)}`)
      flatObject = func.mergeJsons(flattenArrayJsonObj, flatObject)
    } else if (key === func.dbCons.FIELD_JOB_PROFILE) {
      let flattenNestedJson = func.generateFlattenJsonFromNestedJsonObject(candidate[key], key)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, `flattenNestedJson =${JSON.stringify(flattenNestedJson)}`)
      flatObject = func.mergeJsons(flattenNestedJson, flatObject)
    } else if (key === func.dbCons.FIELD_EMAIL_ADDRESS || key === func.dbCons.FIELD_MOBILE_NUMBER || key === func.dbCons.FIELD_ALTERNATE_MOBILE_NUMBER) {
      flatObject[key] = candidate[key]
    } else if (key === func.dbCons.FIELD_LANGUAGES) {
      let flatLaungaugeJson = await getFlattenJsonOfLang(candidate[key], key)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, `flatLaungaugeJson =${JSON.stringify(flatLaungaugeJson)}`)
      flatObject = func.mergeJsons(flatLaungaugeJson, flatObject)
    }else {
      flatObject[key] = candidate[key]
    }
  }
  if(func.dbCons.FIELD_GENDER === func.dbCons.ENUM_MALE){
    flatObject[func.dbCons.FIELD_GENDER] = func.dbCons.FIELD_MALE;
  }else{
    flatObject[func.dbCons.FIELD_GENDER] = func.dbCons.FIELD_FEMALE;
  }
  delete flatObject[func.dbCons.CANDIDATE_FIELD_UID_NO];
  delete flatObject[func.dbCons.FIELD_SISTER_DETAILS];
  delete flatObject[func.dbCons.FIELD_RELATIVE_DETAILS];
  delete flatObject[func.dbCons.FIELD_CHILDREN_DETAILS];
  delete flatObject[func.dbCons.HOBBIES];
  delete flatObject[func.dbCons.FIELD_BROTHER_DETAILS];
  delete flatObject[func.dbCons.FIELD_ADDITIONAL_ATTRIBUTES];
  delete flatObject[func.dbCons.FIELD_UNCLE_DETAILS];
  delete flatObject[func.dbCons.FIELD_PREFFERED_LOCATION];
  flatObject[func.dbCons.FIELD_CANDIDATE_ID] = personMap[candidate[func.dbCons.FIELD_ID]]
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateFlattenCandidate()', func.logCons.LOG_EXIT)
  return flatObject
}

async function generateFlattenObjectFromJsonArray(arrayJson, pkey) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateFlattenObjectFromArray()', func.logCons.LOG_ENTER)
  let flatJson = {}
  let count = 1
  for (let obj of arrayJson) {
    for (let key in obj) {
      flatJson[pkey + '_' + count + '_' + key] = obj[key]
    }
    count++
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateFlattenObjectFromArray()', func.logCons.LOG_EXIT)
  return flatJson
}

async function getFlattenJsonOfLang(langJsonArray, key) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getFlattenJsonOfLang()', func.logCons.LOG_ENTER)
  let flatLangJson = {}
  for (let obj of langJsonArray) {
    let keyPrefix = key + '_' + obj[func.dbCons.FIELD_LANGUAGE] + '_'
    for (let key in obj) {
      if (Array.isArray(obj[key])) {
        let flatSpecificLangJson = await func.generateFlattenJsonFromArrayObject(obj[key], keyPrefix + key)
        flatLangJson = func.mergeJsons(flatSpecificLangJson, flatLangJson)
      } else {
        func.printLog(func.logCons.LOG_LEVEL_VERBOSE, 'Do nothing!')
      }
    }
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getFlattenJsonOfLang()', func.logCons.LOG_EXIT)
  return flatLangJson
}

exports.CandidateDetailsHelpers = CandidateDetailsHelpers
