'use strict'
/**
 * This function is useful for fetching the candidate list groupwise
 * @author Dipak Savaliya , Monika Mehta
 */

const func = require('../utils/functions')
const DbOperation = require('./db-operations').DbOperation
const dbOp = new DbOperation()
const CandidateDetailsHelpers = require('./candidate-details-helpers').CandidateDetailsHelpers
const candidateDetailsHelpers = new CandidateDetailsHelpers()
const GetAssessmentDetailsHelpers = require('./assessment-details-helpers').GetAssessmentDetailsHelpers
const getAssessmentDetailsHelpers = new GetAssessmentDetailsHelpers()
const HELPER_CONS = 'HI_GCLH_'
var _ = require('lodash')
var fs = require('fs')
var choiceWtMaping = JSON.parse(fs.readFileSync('./json_files/choice-mapping-pi-gd.json'))

function GDCandidateList() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of gd candidate list')
}

/**
 * This function will fetch the candidate details with its score if exist
 * @param  {Integer} grpDetailsId [description]
 * @param  {Integer} assessorId   [description]
 * @param  {JSON} orgNameMap   [description]
 * @param  {String | -1} env          [description]
 * @return {JSON}              [description]
 */
GDCandidateList.prototype.gdCandidateListForAssessor = async function(userCode, roundType, grpDetailsId, assessorId, orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'gdCandidateListForAssessor()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM, `grpDetailsId =${JSON.stringify(grpDetailsId)}, assessorId=${assessorId}, orgNameMap=${orgNameMap}`)
  try {
    let data
    let errors = []
    const gdTopics = await getGroupTopics(grpDetailsId, orgNameMap)
    const candidateGdScores = await getCandidateGdScoresFromIds(grpDetailsId, assessorId, orgNameMap)
    let responseJson = {}
    responseJson[func.dbCons.FIELD_GD_TOPIC] = gdTopics
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidateGdScores =${JSON.stringify(candidateGdScores)}`)
    if (!candidateGdScores || candidateGdScores.length === 0) {
      const insertedCandidateGdScores = await insertCandidateGdScores(userCode, roundType, grpDetailsId, assessorId, orgNameMap)
      responseJson[func.dbCons.COLLECTION_CANDIDATE_DETAILS] = insertedCandidateGdScores.data
      data = responseJson
      errors = insertedCandidateGdScores.errors
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, `insertedCandidateGdScores = ${JSON.stringify(insertedCandidateGdScores)}`)
    } else {
      const inDraftJson = await fetchDraftModeJsonOfGDScores(grpDetailsId, assessorId, orgNameMap)
      responseJson[func.dbCons.COLLECTION_CANDIDATE_DETAILS] = inDraftJson.data
      data = responseJson
      errors = inDraftJson.errors
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, `inDraftJson = ${JSON.stringify(inDraftJson)}`)
    }
    return {
      data: data,
      errors: errors
    }
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while getting candidate List. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'gdCandidateListForAssessor()', func.logCons.LOG_EXIT)
    let error = func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, err)
    throw error
  }
}

async function getGroupTopics(gdGroupId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupTopics()', func.logCons.LOG_ENTER)
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_GD_GROUP_DETAILS_ID, func.lightBlueCons.OP_EQUAL, gdGroupId), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_GD_GROUP_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function(err, gdGroupTopics) {
      if (err) {
        // Lightblue error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching group details. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupTopics()', func.logCons.LOG_EXIT)
        return reject(new Error(`Error while fetching group details. ${err}`))
      } else if (gdGroupTopics.length === 0) {
        return reject(new Error(`group id not found in gd group detai;s${gdGroupId}`))
      }
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupTopics()', func.logCons.LOG_EXIT)
      // const campusSourceId = candidatePerviousDetails[0][func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID]
      return resolve(gdGroupTopics[0][func.dbCons.FIELD_GD_TOPIC])
    })
  })
}

async function insertCandidateGdScores(userCode, roundType, grpDetailsId, assessorId, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertCandidateGdScores()', func.logCons.LOG_ENTER)
  const candidateList = await getCandidateListFromGroupDetails(grpDetailsId, orgNameMap)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidateList = ${JSON.stringify(candidateList)}`)
  const errors = []
  const gdScoreResponseArray = []
  const scoreDataToInsert = []
  let dataInserted = []
  try {
    for (let candidate of candidateList) {
      let candidateId = candidate[func.dbCons.FIELD_CANDIDATE_ID]
      let candidateDetails = await candidateDetailsHelpers.getCandidateDetail(candidateId, orgNameMap)
      if (candidate[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE] != undefined) {
        candidateDetails.data[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE] = candidate[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE]
      }
      let instituteName = await getInstituteNameFromCandidateId(candidateId, orgNameMap)
      const [examScore, paramValues] = await Promise.all([getCandidateExamScore(candidateDetails, orgNameMap), getGdParams(orgNameMap)]).catch(err => {
        errors.push({
          'error': err.message,
          'entry': candidateDetails.data[func.dbCons.FIELD_EMAIL_ADDRESS]
        })
      })
      let piCandidateOnCampusScore = []
      if (roundType !== func.dbCons.VALUE_ROUND_TYPE_ON_CAMPUS) {
        piCandidateOnCampusScore = await getCandidatePiPreviousScore(candidate[func.dbCons.FIELD_CANDIDATE_ID], orgNameMap)
      }
      const gdScoreResponse = await generateSimplifiedInDraftResponse(userCode, examScore, paramValues, candidateDetails, candidate, instituteName, piCandidateOnCampusScore, orgNameMap)
      const gdScoreData = await generateGdScoreDataForInsertion(gdScoreResponse, candidateId, grpDetailsId, assessorId, orgNameMap)
      scoreDataToInsert.push(gdScoreData)
      gdScoreResponseArray.push(gdScoreResponse)
    }
    dataInserted = await insertGdScoreJsonInDb(scoreDataToInsert, orgNameMap)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `score json inserted = ${JSON.stringify(dataInserted)}`)
  } catch (err) {
    let error = func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, err)
    throw error
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertCandidateGdScores()', func.logCons.LOG_EXIT)
  return {
    data: gdScoreResponseArray,
    errors: errors
  }
}

async function getCandidatePiPreviousScore(candidateId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidatePreviousScore()', func.logCons.LOG_ENTER)
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_ID, func.lightBlueCons.OP_EQUAL, candidateId), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function(err, candidatePerviousDetails) {
      if (err) {
        // Lightblue error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching candidate details. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidatePreviousScore()', func.logCons.LOG_EXIT)
        return reject(new Error(`Error while fetching candidate details. ${err}`))
      } else if (candidatePerviousDetails.length === 0) {
        return reject(new Error(`multiple entry for this candidate id. ${candidateId}`))
      }
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidatePreviousScore()', func.logCons.LOG_EXIT)
      // const campusSourceId = candidatePerviousDetails[0][func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID]
      return resolve(candidatePerviousDetails)
    })
  })
}

async function getInstituteNameFromCandidateId(candidateId, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteNameFromCandidateId()', func.logCons.LOG_ENTER)
  const candidateSorceId = await getCandidateSourceIdfromCandidateId(candidateId, orgNameMap)
  const campusDriveId = await getCampusDriveIdFromCandidateSourceId(candidateSorceId, orgNameMap)
  const instituteId = await getInstituteIdFromCandidateDriveId(campusDriveId, orgNameMap)
  const instituteName = await getInstituteNameFromInstituteId(instituteId, orgNameMap)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `Institute Name from Candidate id = ${instituteName}`)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteNameFromCandidateId()', func.logCons.LOG_EXIT)
  return instituteName
}

async function generateCandidateMap(candidateDetails, candidateList) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateCandidateMap()', func.logCons.LOG_ENTER)
  for (let candidate of candidateDetail) {
    for (let list of candidateList) {
      if (candidate[func.dbCons.FIELD_CANDIDATE_ID] == list[func.dbCons.FIELD_CANDIDATE_ID]) {
        candidate[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE] = list[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE]
      }
    }
  }
  // async.forEachOf(candidateDetails, function (item, key, callback) {
  //   async.forEachOf(candidateList, function (items, keys, callbackinner) {
  //     if (item[func.dbCons.FIELD_CANDIDATE_ID] === items[func.dbCons.FIELD_CANDIDATE_ID]) {
  //       item[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE]=items[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE]
  //     }
  //     callbackinner()
  //   }, function (error) {
  //     if (error) {
  //       return callback(new Error().stack, candidateDetails)
  //     } else {
  //       callback()
  //     }
  //   })
  // }, function (error) {
  //   if (error) {
  //     return callback(new Error().stack, candidateDetails)
  //   } else {
  //     callback(null, candidateDetails)
  //   }
  // })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateCandidateMap()', func.logCons.LOG_EXIT)
  return candidateDetail
}

async function getCandidateSourceIdfromCandidateId(candidateId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIdfromCandidateId()', func.logCons.LOG_ENTER)
    // TODO: Need to check for status field
    let candidateDetailsQuery = dbOp.getQueryJsonForOp(func.dbCons.FILED_ID, func.lightBlueCons.OP_EQUAL, candidateId)
    dbOp.findByQuery(candidateDetailsQuery, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function(err, candidateDetails) {
      if (err) {
        // Lightblue error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching candidate details. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamScore()', func.logCons.LOG_EXIT)
        return reject(new Error(`Error while fetching candidate details. ${err}`))
      } else if (candidateDetails.length !== 1) {
        return reject(new Error(`multiple entry for this candidate id. ${candidateId}`))
      }
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIdfromCandidateId()', func.logCons.LOG_EXIT)
      const campusSourceId = candidateDetails[0][func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID]
      return resolve(campusSourceId)
    })
  })
}

async function getCampusDriveIdFromCandidateSourceId(candidateSorceId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdFromCandidateSourceId()', func.logCons.LOG_ENTER)
    // TODO: Need to check for status field
    let campusDetailsQuery = dbOp.getQueryJsonForOp(func.dbCons.FILED_ID, func.lightBlueCons.OP_EQUAL, candidateSorceId)
    dbOp.findByQuery(campusDetailsQuery, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function(err, campusDetails) {
      if (err) {
        // Lightblue error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching candidate source details. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamScore()', func.logCons.LOG_EXIT)
        return reject(new Error(`Error while fetching candidate source details. ${err}`))
      } else if (campusDetails.length !== 1) {
        return reject(new Error(`multiple entry for this candidateSorceId. ${candidateSorceId}`))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdFromCandidateSourceId()', func.logCons.LOG_EXIT)
        const campusDriveId = campusDetails[0][func.dbCons.FIELD_CAMPUS_DRIVE_ID]
        return resolve(campusDriveId)
      }
    })
  })
}

async function getInstituteIdFromCandidateDriveId(campusDriveId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteIdFromCandidateDriveId()', func.logCons.LOG_ENTER)
    // TODO: Need to check for status field
    let instituteDetailsQuery = dbOp.getQueryJsonForOp(func.dbCons.FILED_ID, func.lightBlueCons.OP_EQUAL, campusDriveId)
    dbOp.findByQuery(instituteDetailsQuery, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function(err, instituteDetails) {
      if (err) {
        // Lightblue error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching institute id. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteDetails()', func.logCons.LOG_EXIT)
        return reject(new Error(`Error while fetching campus drive data. ${err}`))
      } else if (instituteDetails.length !== 1) {
        return reject(new Error(`multiple entry for this campusDriveId. ${campusDriveId}`))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteIdFromCandidateDriveId()', func.logCons.LOG_EXIT)
        const instituteId = instituteDetails[0][func.dbCons.FIELD_INSTITUTE_ID]
        return resolve(instituteId)
      }
    })
  })
}

async function getInstituteNameFromInstituteId(instituteId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteNameFromInstituteId()', func.logCons.LOG_ENTER)
    // TODO: Need to check for status field
    let instituteDetailsQuery = dbOp.getQueryJsonForOp(func.dbCons.FILED_ID, func.lightBlueCons.OP_EQUAL, instituteId)
    dbOp.findByQuery(instituteDetailsQuery, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_INSTITUTE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function(err, instituteDetails) {
      if (err) {
        // Lightblue error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching institute id. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteDetails()', func.logCons.LOG_EXIT)
        return reject(new Error(`Error while fetching institute details data. ${err}`))
      } else if (instituteDetails.length !== 1) {
        return reject(new Error(`multiple entry for this institute id. ${instituteId}`))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteNameFromInstituteId()', func.logCons.LOG_EXIT)
        const instituteName = instituteDetails[0][func.dbCons.FIELD_INSTITUTE_DETAILS_NAME]
        return resolve(instituteName)
      }
    })
  })
}

async function insertGdScoreJsonInDb(scoreDataToInsert, orgNameMap) {
  return new Promise((resolve, reject) => {
    dbOp.insert(orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_GD_SCORE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), scoreDataToInsert, 10, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function(err, scoreInserted) {
      if (err) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while inserting candidate gd score. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertGdScoreJsonInDb()', func.logCons.LOG_EXIT)
        return reject(new Error(`Error while inserting candidate gd score data. ${err}`))
      }
      return resolve(scoreInserted)
    })
  })
}

async function generateGdScoreDataForInsertion(gdScoreResponse, candidateId, grpDetailsId, assessorId, instituteName, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateGdScoreDataForInsertion()', func.logCons.LOG_ENTER)
  const gdScoreJson = {}
  gdScoreJson[func.dbCons.FIELD_CANDIDATE_ID] = parseInt(candidateId)
  gdScoreJson[func.dbCons.ASSESSOR_ID] = parseInt(assessorId)
  gdScoreJson[func.dbCons.GD_GROUP_DETAILS_BODY_FIELD_ID] = grpDetailsId
  gdScoreJson[func.dbCons.SCORE_DETAIL_JSON] = ''
  gdScoreJson[func.dbCons.FIELD_DRAFT_SCORE_DETAILS_JSON] = JSON.stringify(gdScoreResponse).toString()
  gdScoreJson[func.dbCons.FIELD_GD_SCORE_STATUS] = func.dbCons.ENUM_GD_SCORE_IN_DRAFT
  gdScoreJson[func.dbCons.COMMON_CREATED_BY] = assessorId.toString()
  gdScoreJson[func.dbCons.COMMON_UPDATED_BY] = assessorId.toString()
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateGdScoreDataForInsertion()', func.logCons.LOG_EXIT)
  return gdScoreJson
}

async function generateSimplifiedInDraftResponse(userCode, examScore, paramValues, candidateDetails, gdCandidate, instituteName, piPreviousCandidate, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateSimplifiedInDraftResponse()', func.logCons.LOG_ENTER)
  const inDraftJson = {}
  inDraftJson[func.msCons.FIELD_EXAM_SCORE] = JSON.parse(examScore[func.dbCons.FIELD_CALCULATED_SCORE_DETAILS])
  inDraftJson[func.msCons.PARAM_VALUES] = await updateParamValues(paramValues)
  inDraftJson[func.msCons.NAME] = candidateDetails.data[func.dbCons.CANDIDATE_FIELD_FIRST_NAME] + ' ' + candidateDetails.data[func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME] + ' ' + candidateDetails.data[func.dbCons.CANDIDATE_FIELD_LAST_NAME]
  inDraftJson[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE] = candidateDetails.data[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE]
  inDraftJson[func.dbCons.FIELD_INSTITUTE_NAME] = instituteName
  inDraftJson[func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME] = gdCandidate[func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME]
  inDraftJson[func.dbCons.FIELD_CANDIDATE_ID] = gdCandidate[func.dbCons.FIELD_CANDIDATE_ID]
  inDraftJson[func.dbCons.GD_GROUP_DETAILS_ID] = gdCandidate[func.dbCons.GD_GROUP_DETAILS_ID]
  inDraftJson[func.dbCons.FIELD_EMAIL_ADDRESS] = candidateDetails.data[func.dbCons.FIELD_EMAIL_ADDRESS]
  inDraftJson[func.dbCons.FIELD_GD_STATUS] = func.dbCons.VALUE_GD_SCORE_IN_DRAFT
  if (piPreviousCandidate.length !== 0) {
    let previousScores = await generateCandidatePreviousScore(userCode, piPreviousCandidate, orgNameMap)
    inDraftJson[func.msCons.FIELD_PREVIOUS_SCORES] = previousScores[func.dbCons.COLLECTION_CANDIDATE_DETAILS]
    if (previousScores[func.msCons.FIELD_AVERAGE_OF_GD_AND_PI] !== undefined) {
      inDraftJson[func.msCons.FIELD_AVERAGE_OF_GD_AND_PI] = previousScores[func.msCons.FIELD_AVERAGE_OF_GD_AND_PI]
    }
    if (previousScores[func.msCons.FIELD_ASSESSOR_AVERAGE_SCORE] !== undefined) {
      inDraftJson[func.msCons.FIELD_ASSESSOR_AVERAGE_SCORE] = previousScores[func.msCons.FIELD_ASSESSOR_AVERAGE_SCORE]
    }
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateSimplifiedInDraftResponse()', func.logCons.LOG_EXIT)
  return inDraftJson
}

async function generateCandidatePreviousScore(userCode, gdPreviousCandidateResponses, orgNameMap) {
  const candidatePreviousScores = []
  let candidateScoresWithAverage = []
  let assessorAverageScore = []
  let averageOfAssessor = ''
  for (let gdPreviousCandidateResponse of gdPreviousCandidateResponses) {
    var defaultResponse = {}
    if (gdPreviousCandidateResponse[func.dbCons.FIELD_FEEDBACK_JSON] !== undefined) {
      defaultResponse[func.msCons.FIELD_ASSESSOR_NAME] = await getAssesserName(gdPreviousCandidateResponse[func.dbCons.ASSESSOR_ID], orgNameMap)
      defaultResponse[func.dbCons.FIELD_FEEDBACK_JSON] = JSON.parse(gdPreviousCandidateResponse[func.dbCons.FIELD_FEEDBACK_JSON])
      defaultResponse[func.msCons.FIELD_ASSESSOR_AVERAGE_SCORE] = await generateAverageJson(JSON.parse(gdPreviousCandidateResponse[func.dbCons.FIELD_FEEDBACK_JSON]))
      candidatePreviousScores.push(defaultResponse)
      assessorAverageScore.push((defaultResponse[func.msCons.FIELD_ASSESSOR_AVERAGE_SCORE][func.msCons.FIELD_AVERAGE_OF_SCORE]))
      if (gdPreviousCandidateResponse[func.dbCons.ASSESSOR_ID] === Number(userCode)) {
        averageOfAssessor = defaultResponse[func.msCons.FIELD_ASSESSOR_AVERAGE_SCORE]
      }
    }
  }
  let selectedValueArray = func.getValuesArrayFromJson(func.msCons.FIELD_WEIGHTAGE, assessorAverageScore)
  let overAllAverage = {}
  overAllAverage[func.msCons.FIELD_AVERAGE_OF_SCORE] = {}
  overAllAverage[func.msCons.FIELD_AVERAGE_OF_SCORE][func.msCons.FIELD_SELECTED_VALUE] = recognizeNumber(func.averageOfNumber(selectedValueArray))
  overAllAverage[func.msCons.FIELD_AVERAGE_OF_SCORE][func.msCons.FIELD_WEIGHTAGE] = func.averageOfNumber(selectedValueArray)
  candidateScoresWithAverage[func.dbCons.COLLECTION_CANDIDATE_DETAILS] = candidatePreviousScores
  candidateScoresWithAverage[func.msCons.FIELD_AVERAGE_OF_GD_AND_PI] = overAllAverage
  if (averageOfAssessor !== '') {
    candidateScoresWithAverage[func.msCons.FIELD_ASSESSOR_AVERAGE_SCORE] = averageOfAssessor
  }
  return candidateScoresWithAverage
}

async function generateAverageJson(gdPiScoreJson) {
  let gdPiAverage = {}
  if (gdPiScoreJson[func.msCons.FIELD_GD_SCORE_DETAILS] !== undefined) {
    gdPiAverage = _.merge(gdPiScoreJson[func.msCons.FIELD_PI_SCORE_DETAILS], gdPiScoreJson[func.msCons.FIELD_GD_SCORE_DETAILS])
  } else {
    gdPiAverage = gdPiScoreJson[func.msCons.FIELD_PI_SCORE_DETAILS]
  }
  delete gdPiAverage[func.msCons.FIELD_AVERAGE_OF_SCORE]
  delete gdPiAverage[func.msCons.FIELD_RATING]
  delete gdPiAverage[func.msCons.FIELD_GD_COMMENTS]
  delete gdPiAverage[func.msCons.FIELD_SELECTED]
  delete gdPiAverage[func.msCons.RECOMMENDED_FOR_PI]
  delete gdPiAverage[func.msCons.FIELD_REMARKS]
  delete gdPiAverage[func.msCons.RECOMMENDED_FOR_PI_CAP]
  const gdPiFinalAverage = await getAverageOfResponse(gdPiAverage)
  return gdPiFinalAverage
}

async function getAverageOfResponse(gdScoreJson) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAverageOfResponse()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + `gdScoreJson =  ${JSON.stringify(gdScoreJson)}`)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `choiceWtMaping =  ${JSON.stringify(choiceWtMaping)}`)
  var weightageOfResponse = []
  for (let key in gdScoreJson) {
    let score = gdScoreJson[key][func.msCons.FIELD_SELECTED_VALUE]
    weightageOfResponse.push(choiceWtMaping[key][score])
  }
  let averageScore = {}
  averageScore[func.msCons.FIELD_AVERAGE_OF_SCORE] = {}
  averageScore[func.msCons.FIELD_AVERAGE_OF_SCORE][func.msCons.FIELD_SELECTED_VALUE] = recognizeNumber(func.averageOfNumber(weightageOfResponse))
  averageScore[func.msCons.FIELD_AVERAGE_OF_SCORE][func.msCons.FIELD_WEIGHTAGE] = func.averageOfNumber(weightageOfResponse)
  return averageScore
}


function recognizeNumber(value) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'recognizeNumber()', func.logCons.LOG_ENTER)
  var scoreMap = choiceWtMaping[func.configCons.FIELD_AVERAGE_SCORE]
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `scoreMap =  ${JSON.stringify(scoreMap)}`)
  var possibleScores = Object.keys(scoreMap)
  var closest = possibleScores.reduce(function(prev, curr) {
    return (Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev)
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'recognizeNumber()', func.logCons.LOG_EXIT)
  return scoreMap[closest]
}

async function getAssesserName(assessorId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssesserName()', func.logCons.LOG_ENTER)
    let queryForAssessorName = dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, assessorId)
    dbOp.findByQuery(queryForAssessorName, orgNameMap, dbOp.setCollectionJson(func.dbCons.FIELD_USER_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function(err, assesserName) {
      if (err) {
        // Lightblue error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching assessor name ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssesserName()', func.logCons.LOG_EXIT)
        return reject(new Error(`Error while fetching assessor name ${err}`))
      } else if (assesserName.length !== 1) {
        return reject(new Error(`multiple entry of candidate. ${assesserName}`))
      }
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssesserName()', func.logCons.LOG_EXIT)
      return resolve(assesserName[0][func.dbCons.FIELD_USER_DATA][func.dbCons.FIELD_NAME])
    })
  })
}


async function updateParamValues(paramValues) {
  const updatedParams = []
  for (let paramValue of paramValues) {
    var defaultResponse = {}
    defaultResponse[func.msCons.FIELD_SELECTED_VALUE] = ''
    defaultResponse[func.msCons.FIELD_WEIGHTAGE] = 0
    defaultResponse[func.dbCons.FIELD_ASSESSMENT_PARAM_URL] = paramValue[func.dbCons.FIELD_ASSESSMENT_PARAM_URL]
    paramValue[func.msCons.RESPONSE_GIVEN] = defaultResponse
    updatedParams.push(paramValue)
  }
  return updatedParams
}

async function getCandidateExamScore(candidateDetails, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamScore()', func.logCons.LOG_ENTER)
    // TODO: Need to check for status field
    let queryForExamScore = dbOp.getQueryJsonForOp(func.dbCons.FIELD_EMAIL_ADDRESS, func.lightBlueCons.OP_EQUAL, candidateDetails.data[func.dbCons.FIELD_EMAIL_ADDRESS])
    dbOp.findByQuery(queryForExamScore, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_EXAM_SCORE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function(err, candidateExamScores) {
      if (err) {
        // Lightblue error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching candidate gd score. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamScore()', func.logCons.LOG_EXIT)
        return reject(new Error(`Error while fetching candidate score data. ${err}`))
      } else if (candidateExamScores.length !== 1) {
        return reject(new Error(`multiple entry of candidate. ${candidateDetails.data[func.dbCons.FIELD_EMAIL_ADDRESS]}`))
      }
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamScore()', func.logCons.LOG_EXIT)
      return resolve(candidateExamScores[0])
    })
  })
}

async function getGdParams(orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGdParams()', func.logCons.LOG_ENTER)
    getAssessmentDetailsHelpers.getAssessmentDetails(func.dbCons.ENUM_ASSESSMNET_CATEGORY_TYPE_GD, orgNameMap, function(err, gdParams) {
      if (err) {
        return reject(err)
      }
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, `gdParams. ${gdParams}`)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGdParams()', func.logCons.LOG_ENTER)
      return resolve(gdParams)
    })
  })
}

async function fetchDraftModeJsonOfGDScores(grpDetailsId, assessorId, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchDraftModeJsonOfGDScores()', func.logCons.LOG_ENTER)
  let errors = []
  const scoreJsons = await getCandidateGdScoresFromIds(grpDetailsId, assessorId, orgNameMap)
  const inDraftJsons = await getIndraftScoreJson(scoreJsons)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchDraftModeJsonOfGDScores()', func.logCons.LOG_EXIT)
  return {
    data: inDraftJsons,
    errors: errors
  }
}

async function getIndraftScoreJson(scoreJsons) {
  const draftJsons = []
  for (let scoreJson of scoreJsons) {
    draftJsons.push(JSON.parse(scoreJson[func.dbCons.FIELD_DRAFT_SCORE_DETAILS_JSON]))
  }
  return draftJsons
}

async function getCandidateGdScoresFromIds(grpDetailsId, assessorId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateGdScoresFromIds()', func.logCons.LOG_ENTER)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM, `grpDetailsId =${JSON.stringify(grpDetailsId)}`)
    let queryForGdScore = getQueryJsonForGdScores(grpDetailsId, assessorId)
    dbOp.findByQuery(queryForGdScore, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_GD_SCORE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function(err, candidateScores) {
      if (err) {
        // Lightblue error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching candidate gd score. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateListFromGroupDetails()', func.logCons.LOG_EXIT)
        return reject(new Error(`Error while fetching candidate score data. ${err}`))
      }
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateGdScoresFromIds()', func.logCons.LOG_EXIT)
      return resolve(candidateScores)
    })
  })
}

function getQueryJsonForGdScores(grpDetailsId, assessorId) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateGdScoresFromIds()', func.logCons.LOG_EXIT)
  let andQuery = []
  andQuery.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_GD_GROUP_DETAILS_ID, func.lightBlueCons.OP_EQUAL, grpDetailsId))
  andQuery.push(dbOp.getQueryJsonForOp(func.dbCons.ASSESSOR_ID, func.lightBlueCons.OP_EQUAL, assessorId))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateGdScoresFromIds()', func.logCons.LOG_EXIT)
  return dbOp.getOperationJson(func.lightBlueCons.OP_AND, andQuery)
}

function getQueryJsonForGdGrpStatus(grpDetailsId) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getQueryJsonForGdGrpStatus()', func.logCons.LOG_EXIT)
  let andQuery = []
  andQuery.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_GD_GROUP_DETAILS_ID, func.lightBlueCons.OP_EQUAL, grpDetailsId))
  andQuery.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_GD_STATUS, func.lightBlueCons.OP_NOT_EQUAL, func.dbCons.ENUM_STATUS_CANDIDATE_NOT_APPEARED_IN_GD))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getQueryJsonForGdGrpStatus()', func.logCons.LOG_EXIT)
  return dbOp.getOperationJson(func.lightBlueCons.OP_AND, andQuery)
}

async function getCandidateListFromGroupDetails(gdGrpDetailId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateListFromGroupDetails()', func.logCons.LOG_ENTER)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM, `gdGrpDetails : ${JSON.stringify(gdGrpDetailId)} `)
    let queryForGdGrpStatus = getQueryJsonForGdGrpStatus(gdGrpDetailId)
    dbOp.findByQuery(queryForGdGrpStatus, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_GD_GROUP_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function(err, gdGrpCandidates) {
      if (err) {
        // Lightblue error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching gd candidate data. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateListFromGroupDetails()', func.logCons.LOG_EXIT)
        return reject(new Error(`Error while fetching candidate list data. ${err}`))
      }
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateListFromGroupDetails()', func.logCons.LOG_EXIT)
      return resolve(gdGrpCandidates)
    })
  })
}

exports.GDCandidateList = GDCandidateList
