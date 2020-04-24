'use-strict'
/**
 * The <code>pi-assessment-details-helpers.js</code>
 *
 * @author Ashita Shah,Monika Mehta
 */

var func = require('../utils/functions')
var async = require('async')
var _ = require('lodash')
var map = require('collections/map')
var fs = require('fs')
var choiceWtMaping = JSON.parse(fs.readFileSync('./json_files/choices-mapping.json'))
var assessmentIcons = func.config.get('assessment_param_icons')
var dbOp
var HELPER_CONS = 'HS_PADH_'

function PiAssessmentDetailsHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of update PI assessment details helper')
  DbOperation = require('./db-operations').DbOperation
  dbOp = new DbOperation()
}

PiAssessmentDetailsHelpers.prototype.addPICandidates = function(userCode, urlMap, reqBody, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside addPICandidates()', func.logCons.LOG_ENTER)
  var bulkInsertJSON = []
  let candidateDetails = reqBody[func.dbCons.COLLECTION_CANDIDATE_DETAILS]
  let roundType = reqBody[func.dbCons.FIELD_ROUND_TYPE]
  generateGroupDisplayNameKeys(reqBody[func.msCons.FIELD_CANDIDATE_DETAILS], func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME, urlMap, function(error, groupDisplayNamekeys) {
    if (error) {
      return callback(new Error().stack, candidateMap)
    } else {
      async.forEachOf(candidateDetails, function(item, key, callbackinner) {
        getDetailsFromPiIds(item[func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID], urlMap, function(error, response) {
          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getDetailsFromGdGrpIds dbOperation = ' + JSON.stringify(error))
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromGdGrpIds()', func.logCons.LOG_EXIT)
            return callbackinner(new Error().stack, response)
          } else if (!response || response.length === 0) {
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromGdGrpIds()', func.logCons.LOG_EXIT)
            return callbackinner(new Error().stack, [])
          } else {
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromGdGrpIds()', func.logCons.LOG_EXIT)
            var insertJSON = {}
            insertJSON = generateInsertJSONforAddCandidate(userCode, response[0], item, candidateDetails, reqBody)
            bulkInsertJSON.push(insertJSON)
            callbackinner(null, response)
          }
        })
      }, function(error) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getDetailsFromGdGrpIds async call = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromGdGrpIds()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP))
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromGdGrpIds()', func.logCons.LOG_EXIT)
          insertEntriesIntoPi(bulkInsertJSON, roundType, groupDisplayNamekeys, urlMap, callback)
        }
      })
    }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addPICandidates()', func.logCons.LOG_EXIT)
  })
}

PiAssessmentDetailsHelpers.prototype.updatePiAssessmentDetails = function(piAssessmentDetailsToUpdate, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'update PI assessment details where request body is = ' + JSON.stringify(piAssessmentDetailsToUpdate), func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updatePiAssessmentDetails()', func.logCons.LOG_ENTER)
  upsertPiAssessmentDetails(piAssessmentDetailsToUpdate, urlMap, function(error, updatedPiAssessmentDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'updatePiAssessmentDetails = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updatePiAssessmentDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, updatedPiAssessmentDetails)
    } else if (updatedPiAssessmentDetails.length === 0 || !updatedPiAssessmentDetails) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updatePiAssessmentDetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      callback(null, func.responseGenerator([], HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_PI_ASSESSMENT_DETAILS_UPDATED))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updatePiAssessmentDetails()', func.logCons.LOG_EXIT)
    }
  })
}

PiAssessmentDetailsHelpers.prototype.updatePiAssessmentStatus = function(candidateDetailsToUpdate, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'update PI assessment status where request body is = ' + JSON.stringify(candidateDetailsToUpdate), func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updatePiAssessmentStatus()', func.logCons.LOG_ENTER)
  updatePiAssessmentStatus(candidateDetailsToUpdate, urlMap, function(error, updatedCandidatePiAssessmentDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'updatePiAssessmentStatus = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updatePiAssessmentStatus()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, updatedCandidatePiAssessmentDetails)
    } else if (updatedCandidatePiAssessmentDetails.length === 0 || !updatedCandidatePiAssessmentDetails) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updatePiAssessmentStatus()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      callback(null, updatedCandidatePiAssessmentDetails)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updatePiAssessmentStatus()', func.logCons.LOG_EXIT)
    }
  })
}



/**
 * This function will update  candidate status for finalizing candidate for PI using candidate id in pi_assessment_details
 * @param  {JSON}   candidate_details [description]
 * @param  {JSON}   orgNameMap   [description]
 * @param  {String | -1}   env          [description]
 * @param  {Function} callback     [description]
 * @return {JSON}                [description]
 */

PiAssessmentDetailsHelpers.prototype.finalizeCandidateForPi = async function(candidateDetails, orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'finalizeCandidateForPi()', func.logCons.LOG_ENTER)
  try {
    const candidateArray = await generateCandidateArray(candidateDetails[func.msCons.FIELD_CANDIDATE_DETAILS]);

    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidateArray =${JSON.stringify(candidateArray)}`)
    const candidateResponse = await updateParticularStatusForCandidateIds(candidateDetails[func.msCons.FIELD_CANDIDATE_DETAILS], orgNameMap)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidateDetailsResponse =${JSON.stringify(candidateResponse)}`)
    if (candidateResponse === 0 || candidateResponse.length === 0) {
      return candidateResponse
    } else {
      return getReturnJson(candidateResponse)
    }
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while updating candidate status ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'finalizeCandidateForPi()', func.logCons.LOG_EXIT)
    throw err
  }
}


async function generateCandidateArray(candidateDetails) {
  return new Promise((resolve, reject) => {
    let candidateAppearedIds = []
    let candidateNotAppearedIds = []
    let candidateIdsStatus = {}
    let candidateDetailsResponse = []
    for (let candidateDetail of candidateDetails) {
      if (candidateDetail[func.dbCons.FIELD_STATUS] === func.dbCons.VALUE_PI_CANDIDATE_NOT_APPEARED) {
        candidateNotAppearedIds.push(candidateDetail[func.dbCons.FIELD_CANDIDATE_ID])
      } else {
        candidateAppearedIds.push(candidateDetail[func.dbCons.FIELD_CANDIDATE_ID])
      }
    }
    candidateIdsStatus[func.dbCons.FIELD_STATUS] = func.dbCons.ENUM_PI_ASSESSMENT_CANDIDATE_NOT_APPEARED
    candidateIdsStatus[func.dbCons.FIELD_CANDIDATE_ID] = candidateNotAppearedIds
    candidateDetailsResponse.push(candidateIdsStatus)
    candidateIdsStatus = {}
    candidateIdsStatus[func.dbCons.FIELD_STATUS] = func.dbCons.ENUM_PI_ASSESSMENT_CANDIDATE_APPEARED
    candidateIdsStatus[func.dbCons.FIELD_CANDIDATE_ID] = candidateAppearedIds
    candidateDetailsResponse.push(candidateIdsStatus)
    return resolve(candidateDetailsResponse)
  })
}

function updateStageInCandidateDetails(fetchAllCandidateIDS, roundType, urlMap, callback) {
  roundType = getEnumForRoundType(roundType)
  let candidateListArray = func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_ID, fetchAllCandidateIDS)
  var body = {}
  if (roundType === func.dbCons.ENUM_ROUND_TYPE_ON_CAMPUS) {
    body[func.dbCons.COLLECTION_JSON_STAGE] = func.dbCons.ENUM_SELECTED_FOR_PI
  } else {
    body[func.dbCons.COLLECTION_JSON_STAGE] = func.dbCons.SELECTED_IN_PI_FOR_ONSITE
  }
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidateListArray))
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateStageInCandidateDetails()', func.logCons.LOG_ENTER);
  dbOp.update(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, dbOp.getOperationJson(func.lightBlueCons.OP_SET, body), dbOp.getCommonProjection(), function(error, updatedCandidateDetail) {
    console.log("updatedCandidateDetail",updatedCandidateDetail)
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateExamDetailsById()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, updatedCandidateDetail)
    }
    if (!updatedCandidateDetail || updatedCandidateDetail.length === 0) {
      var response = []
      return callback(null, response)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateStageInCandidateDetails()', func.logCons.LOG_EXIT)
      return callback(null, updatedCandidateDetail)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateStageInCandidateDetails()', func.logCons.LOG_EXIT);
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

function insertEntriesIntoPi(insertJSON, roundType, groupDisplayNamekeys, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertEntriesIntoDB()', func.logCons.LOG_ENTER)
  dbOp.insert(urlMap, func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, insertJSON, dbOp.getCommonProjection(), function(error, piDetailsResponse) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'insertEntriesIntoDB : Error while inserting data : ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertEntriesIntoDB()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, piDetailsResponse)
    } else if (!piDetailsResponse || piDetailsResponse.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'insertEntriesIntoDB() : No data inserted', func.logCons.LOG_EXIT)
      return callback(new Error().stack, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertEntriesIntoDB()', func.logCons.LOG_EXIT)
      updateStageInCandidateDetails(insertJSON, roundType, urlMap, function(error, response) {
        console.log("parita",response)
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'updateStageInCandidateDetails dbOperation = ' + JSON.stringify(error))
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateStageInCandidateDetails()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, response)
        } else if (!response || response.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateStageInCandidateDetails()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, [])
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateStageInCandidateDetails()', func.logCons.LOG_EXIT)
          callback(null, response)
        }
      })
      // callback(null, func.responseGenerator(generateResponseJSON(piDetailsResponse, groupDisplayNamekeys), HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_CANDIDATE_INSERTED_SUCESSFULLY))
    }
  })
}

function generateResponseJSON(response, groupDisplayNamekeys) {
  var responseJson = []
  var singleGroupData = {}
  var singleCandidateDetails = {}
  for (var i = 0; i < groupDisplayNamekeys.length; i++) {
    singleGroupData = {}
    singleGroupData[func.msCons.FIELD_CANDIDATE_DETAILS] = []
    for (var j = 0; j < response.length; j++) {
      singleCandidateDetails = {}
      if (response[j][func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID] == singleGroupData[func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID]) {
        singleGroupData[func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID] = response[j][func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID]
        singleCandidateDetails[func.dbCons.FIELD_CANDIDATE_ID] = response[j][func.dbCons.FIELD_CANDIDATE_ID]
        singleGroupData[func.msCons.FIELD_CANDIDATE_DETAILS].push(singleCandidateDetails)
      }
    }
    responseJson.push(singleGroupData)
  }
  return responseJson
}
function getDifferenceinArrays(destination, source) {
  var bIds = {}
  destination.forEach(function(obj) {
    bIds[obj] = obj;
  });
  return source.filter(function(obj) {
    return !(obj in bIds);
  });
}

function generateInsertJSONforAddCandidate(userCode, responseJson, singleData) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateInsertJSONforAddCandidate()', func.logCons.LOG_ENTER)
  var piAssessmentJson = {}
  piAssessmentJson[func.dbCons.FIELD_PI_DATE] = responseJson[func.dbCons.FIELD_PI_DATE]
  piAssessmentJson[func.dbCons.ASSESSOR_ID] = responseJson[func.dbCons.ASSESSOR_ID]
  piAssessmentJson[func.dbCons.FIELD_PI_CANDIDATE_SEQUENCE] = singleData[func.dbCons.FIELD_PI_CANDIDATE_SEQUENCE]
  piAssessmentJson[func.dbCons.FIELD_ROUND_TYPE] = responseJson[func.dbCons.FIELD_ROUND_TYPE]
  piAssessmentJson[func.dbCons.FIELD_PI_LOCATION] = responseJson[func.dbCons.FIELD_PI_LOCATION]
    var diff = getDifferenceinArrays(responseJson[func.dbCons.FIELD_UNIVERSITIES], singleData[func.dbCons.FIELD_UNIVERSITIES])
  if (diff.length != 0) {
    var diffArr = []
    diffArr = responseJson[func.dbCons.FIELD_UNIVERSITIES]
    var diffArr = diffArr.concat(diff)
    piAssessmentJson[func.dbCons.FIELD_UNIVERSITIES] = diffArr
  } else {
    piAssessmentJson[func.dbCons.FIELD_UNIVERSITIES] = responseJson[func.dbCons.FIELD_UNIVERSITIES]
  }
  piAssessmentJson[func.dbCons.FIELD_PI_INSTITUTE_LEVEL] = responseJson[func.dbCons.FIELD_PI_INSTITUTE_LEVEL]
  piAssessmentJson[func.dbCons.FIELD_PI_ASSESSMENT_TYPE] = responseJson[func.dbCons.FIELD_PI_ASSESSMENT_TYPE]
  piAssessmentJson[func.dbCons.FIELD_ACCESSOR_DETAILS] = responseJson[func.dbCons.FIELD_ACCESSOR_DETAILS]
  piAssessmentJson[func.dbCons.FIELD_PI_ASSESSMENT_DETAILS_ID] = singleData[func.dbCons.FIELD_PI_ASSESSMENT_DETAILS_ID]
  piAssessmentJson[func.dbCons.FIELD_CANDIDATE_ID] = singleData[func.dbCons.FIELD_CANDIDATE_ID]
  piAssessmentJson[func.dbCons.FIELD_CANDIDATE_SOURCE_ID] = singleData[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]
  piAssessmentJson[func.dbCons.COMMON_CREATED_BY] = userCode
  piAssessmentJson[func.dbCons.COMMON_UPDATED_BY] = userCode
  piAssessmentJson[func.dbCons.FIELD_STATUS] = responseJson[func.dbCons.FIELD_STATUS]
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateInsertJSONforAddCandidate()', func.logCons.LOG_EXIT)
  return piAssessmentJson
}

function getDetailsFromPiIds(gdGrpId, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromPiIds()', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID, func.lightBlueCons.OP_EQUAL, gdGrpId)
  dbOp.findByQuery(query, urlMap, func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, dbOp.getCommonProjection(), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getDetailsFromPiIds : Error while retrieving gdGrpID = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromPiIds()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromPiIds() No relevent InstituteID found', func.logCons.LOG_EXIT)
      return callback(new Error().stack, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromPiIds()', func.logCons.LOG_EXIT)
      return callback(null, response)
    }
  })
}

async function updateParticularStatusForCandidateIds(candidateDetailsList, orgNameMap) {
  let candidateResponses = []
  for (let candidateDetail of candidateDetailsList) {
    let x = await updateCandidateDetailsForPi(candidateDetail, orgNameMap)
    candidateResponses.push(x)
  }
  return candidateResponses
}

function generateGroupDisplayNameKeys(candidateDetails, fieldName, urlMap, callback) {
  var groupDisplayNamekeys = []
  async.forEachOf(candidateDetails, function(item, key, callbackinner) {
    if (groupDisplayNamekeys.indexOf(item[fieldName]) === -1) {
      groupDisplayNamekeys.push(item[fieldName])
    }
    callbackinner()
  }, function(error) {
    if (error) {
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP))
    } else {
      callback(null, groupDisplayNamekeys)
    }
  })
}

async function updateCandidateDetailsForPi(particularCandidateDetail, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateDetailsForPi()', func.logCons.LOG_ENTER)
    if (particularCandidateDetail[func.dbCons.FIELD_STATUS] === func.dbCons.VALUE_PI_CANDIDATE_NOT_APPEARED) {
      particularCandidateDetail[func.dbCons.FIELD_STATUS] = func.dbCons.ENUM_PI_ASSESSMENT_CANDIDATE_NOT_APPEARED
    } else {
      particularCandidateDetail[func.dbCons.FIELD_STATUS] = func.dbCons.ENUM_PI_ASSESSMENT_CANDIDATE_APPEARED
    }
    let projection = []
    let jsonToUpdate = {}
    let responseJson = {}
    jsonToUpdate[func.dbCons.FIELD_STATUS] = particularCandidateDetail[func.dbCons.FIELD_STATUS]
    jsonToUpdate[func.dbCons.FIELD_PI_CANDIDATE_SEQUENCE] = particularCandidateDetail[func.dbCons.FIELD_PI_CANDIDATE_SEQUENCE]
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_ID, true, true))
    dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_ID, func.lightBlueCons.OP_EQUAL, particularCandidateDetail[func.dbCons.FIELD_CANDIDATE_ID]), orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getOperationJson(func.lightBlueCons.OP_SET, jsonToUpdate),
      projection, (err, updateCandidateStatus) => {
        if (err) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while updating candidate status ${err} for candidateIds = ${particularCandidateDetail[func.dbCons.FIELD_CANDIDATE_ID]}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateDetailsForPi()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!updateCandidateStatus || updateCandidateStatus.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `no candidates found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateDetailsForPi()', func.logCons.LOG_EXIT)
          return resolve(updateCandidateStatus)
        }
        responseJson[func.dbCons.PARAM_ERROR] = _.difference(func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_ID, updateCandidateStatus), particularCandidateDetail[func.dbCons.FIELD_CANDIDATE_ID])
        return resolve(responseJson)
      })
  })
}

function getReturnJson(ids, response) {
  let data = {}
  let errors = []
  return {
    data: (response === undefined) ? data : response,
    errors: errors,
    message: (ids.length === 0) ? func.msgCons.ERROR_MSG_UPDATE_DATA : func.msgCons.SUCCESS_MSG_UPDATE_DATA
  }
}


function updatePiAssessmentStatus(candidateDetailsToUpdate, urlMap, callback) {
  var query = []
  var updateJSON = {}
  var errorCandidateIds = []
  updateJSON[func.dbCons.FIELD_STATUS] = getEnumForPiStatus(candidateDetailsToUpdate[func.dbCons.FIELD_STATUS])
  async.forEachOf(candidateDetailsToUpdate[func.msCons.FIELD_CANDIDATE_IDS_ARRAY], function(candidateId, index, callbackInner) {
    query = generateUpdateQueryForPiStatus(candidateDetailsToUpdate[func.dbCons.FIELD_PI_ASSESSMENT_TYPE], candidateDetailsToUpdate[func.dbCons.FIELD_PI_LOCATION], candidateId)
    dbOperationToUpdatePIStatus(query, updateJSON, urlMap, function(error, updatedSingleCandidatePiStatus) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while updating status in pi assessment details = ' + JSON.stringify(error))
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToUpdatePIStatus()', func.logCons.LOG_EXIT)
        errorCandidateIds.push(candidateId)
        callbackInner()
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToUpdatePIStatus()', func.logCons.LOG_EXIT)
        callbackInner(null, updatedSingleCandidatePiStatus)
      }
    })
  }, function(error) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'updatePiAssessmentStatus async call = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updatePiAssessmentStatus()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_UPDATE_DATA), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_UPDATE_DATA))
    } else {
      var errorCandidateIdsJson = {}
      if (errorCandidateIds.length != 0) {
        errorCandidateIdsJson[func.msgCons.PARAM_ERROR_MSG] = func.msgCons.ERROR_MSG_UPDATE_CANDIDATE_ID
        errorCandidateIdsJson[func.dbCons.FIELD_CANDIDATE_ID] = errorCandidateIds
      }
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updatePiAssessmentStatus()', func.logCons.LOG_EXIT)
      callback(null, func.responseGenerator([], HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_UPDATE_PI_STATUS, errorCandidateIdsJson))
    }
  })
}

function dbOperationToUpdatePIStatus(queryToUpdate, updateJSON, urlMap, callback) {
  dbOp.update(dbOp.getOperationJson(func.lightBlueCons.OP_AND, queryToUpdate), urlMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getOperationJson(func.lightBlueCons.OP_SET, updateJSON), dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, updatedPiStatusDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while updating status in pi assessment details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToUpdatePIStatus()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, [])
    } else if (!updatedPiStatusDetails || updatedPiStatusDetails.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Data is not updated successfully in pi_assessment_details ')
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToUpdatePIStatus()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToUpdatePIStatus()', func.logCons.LOG_EXIT)
      callback(null, updatedPiStatusDetails)
    }
  })
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
    default:
      return -1
  }
}

function generateUpdateQueryForPiStatus(pi_assessment_type, pi_location, candidate_id) {
  var updateQuery = []
  updateQuery.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_PI_ASSESSMENT_TYPE, func.lightBlueCons.OP_EQUAL, parseInt(pi_assessment_type)))
  updateQuery.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_PI_LOCATION, func.lightBlueCons.OP_EQUAL, pi_location))
  updateQuery.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_ID, func.lightBlueCons.OP_EQUAL, candidate_id))
  return updateQuery
}

function upsertPiAssessmentDetails(piAssessmentDetailsToUpdate, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'upsertPiAssessmentDetails()', func.logCons.LOG_ENTER)
  var assessorId = piAssessmentDetailsToUpdate[func.dbCons.ASSESSOR_ID]
  var piAssessmentDetailsId
  var candidateId
  var updateJSON = {}
  async.forEachOf(piAssessmentDetailsToUpdate[func.msCons.FIELD_CANDIDATE_SCORES], function(candidateScore, index, callbackInner) {
    updateJSON = {}
    if (piAssessmentDetailsToUpdate[func.dbCons.FIELD_STATUS] === func.dbCons.VALUE_PI_ASSESSMENT_IN_DRAFT) {
      updateJSON[func.dbCons.FIELD_DRAFT_FEEDBACK_JSON] = (JSON.stringify(candidateScore)).toString()
      updateJSON[func.dbCons.FIELD_STATUS] = func.dbCons.ENUM_PI_ASSESSMENT_IN_DRAFT
    } else if (piAssessmentDetailsToUpdate[func.dbCons.FIELD_STATUS] === func.dbCons.VALUE_PI_ASSESSMENT_COMPLETED) {
      generateUpdateJSON(candidateScore, function(error, updateJSONForPI) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `error = ${JSON.stringify(error)}`)
          callbackInner()
        } else {
          updateJSON = updateJSONForPI
          // dbOperationToUpdate(assessorId, gdGroupDetailsId, candidateId, updateJSON, urlMap, callbackInner)
        }
      })
    }
    candidateId = candidateScore[func.dbCons.FIELD_CANDIDATE_ID]
    piAssessmentDetailsId = candidateScore[func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID]
    dbOperationToUpdate(assessorId, piAssessmentDetailsId, candidateId, updateJSON, urlMap, function(error, updatedPiAssessmentIndb) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'dbOperationToUpdate = ' + JSON.stringify(error))
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToUpdate()', func.logCons.LOG_EXIT)
        return callbackInner(new Error().stack, updatedPiAssessmentIndb)
      } else if (updatedPiAssessmentIndb.length === 0 || !updatedPiAssessmentIndb) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToUpdate()', func.logCons.LOG_EXIT)
        return callbackInner(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToUpdate()', func.logCons.LOG_EXIT)
        callbackInner(null, func.responseGenerator([], HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_PI_ASSESSMENT_DETAILS_UPDATED))
      }
    })
  }, function(error) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'upsertPiAssessmentDetails async call = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'upsertPiAssessmentDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_UPDATE_DATA), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_UPDATE_DATA))
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'upsertPiAssessmentDetails()', func.logCons.LOG_EXIT)
      callback(null, func.responseGenerator([], HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_UPDATE_DATA))
    }
  })
}

function generateUpdateJSON(candidateScore, cb) {
  var finalJSON = {}
  var scoreDetailJson = {}
  var gdScoreDetailsJson = {}
  var gdScoreJson = {}
  candidateScore[func.msCons.PARAM_VALUES].filter(function(obj) {
    scoreDetailJson[obj[func.msCons.FIELD_PARAM_DISPLAY_NAME]] = obj[func.msCons.RESPONSE_GIVEN]
  })
  if (candidateScore[func.msCons.FIELD_DIRECT_PI]) {
    candidateScore[func.msCons.FIELD_GD_PARAM_VALUES].filter(function(obj) {
      gdScoreDetailsJson[obj[func.msCons.FIELD_PARAM_DISPLAY_NAME]] = obj[func.msCons.RESPONSE_GIVEN]
    })
    getAverageOfResponse(gdScoreDetailsJson, function(error, updatedScoreDetailsJson) {
      if (error) return cb(new Error().stack, 'error in genrateing avg score')
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, `updatedScoreDetailsJson = ${JSON.stringify(updatedScoreDetailsJson)}`)
      finalJSON = generateUpdateJSONWithGdScore(updatedScoreDetailsJson, scoreDetailJson, candidateScore)
      return cb(null, finalJSON)
    })
  } else {
    gdScoreDetailsJson = candidateScore[func.dbCons.FIELD_EXAM_SCORE][func.msCons.FIELD_GD_SCORE_DETAILS]
    finalJSON = generateUpdateJSONWithGdScore(gdScoreDetailsJson, scoreDetailJson, candidateScore)
    cb(null, finalJSON)
  }
}

function generateUpdateJSONWithGdScore(gdScoreDetailsJson, scoreDetailJson, candidateScore) {
  var updateJSON = {}
  var gdScoreJson = {}
  gdScoreJson[func.msCons.FIELD_PI_SCORE_DETAILS] = scoreDetailJson
  gdScoreJson[func.msCons.FIELD_GD_SCORE_DETAILS] = gdScoreDetailsJson
  gdScoreJson[func.msCons.FIELD_EXAM_SCORE] = candidateScore[func.dbCons.FIELD_EXAM_SCORE][func.msCons.FIELD_EXAM_SCORE]
  if (candidateScore[func.msCons.FIELD_PREVIOUS_SCORES] !== undefined) {
    gdScoreJson[func.msCons.FIELD_PREVIOUS_SCORES] = candidateScore[func.msCons.FIELD_PREVIOUS_SCORES]
  }
  updateJSON[func.dbCons.FIELD_FEEDBACK_JSON] = (JSON.stringify(gdScoreJson)).toString()
  updateJSON[func.dbCons.FIELD_STATUS] = func.dbCons.ENUM_GD_SCORE_COMPLETED
  updateJSON[func.dbCons.FIELD_DRAFT_FEEDBACK_JSON] = (JSON.stringify(candidateScore)).toString()
  return updateJSON
}

getAverageOfResponse = function(gdScoreJson, cbAverageValue) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAverageOfResponse()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + `gdScoreJson =  ${JSON.stringify(gdScoreJson)}`)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `choiceWtMaping =  ${JSON.stringify(choiceWtMaping)}`)
  var weightageOfResponse = []
  async.forEachOf(gdScoreJson, function(scoreValue, catName, callback) {
    if (!choiceWtMaping[catName]) {
      return callback()
    }
    weightageOfResponse.push(choiceWtMaping[catName][scoreValue[func.msCons.FIELD_SELECTED_VALUE]])
    callback()
  }, function(err) {
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

function dbOperationToUpdate(assessorId, piAssessmentDetailsId, candidateId, updateJSON, urlMap, callback) {
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.ASSESSOR_ID, func.lightBlueCons.OP_EQUAL, parseInt(assessorId)))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID, func.lightBlueCons.OP_EQUAL, piAssessmentDetailsId))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_ID, func.lightBlueCons.OP_EQUAL, parseInt(candidateId)))
  dbOp.update(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getOperationJson(func.lightBlueCons.OP_SET, updateJSON), dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, updatedPiAssessment) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while updating score in pi assessment details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToUpdate()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, updatedPiAssessment)
    } else if (!updatedPiAssessment || updatedPiAssessment.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Data is not updated successfully in gd_score_details ')
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToUpdate()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_PROPER_DATA), HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_PROPER_DATA))
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToUpdate()', func.logCons.LOG_EXIT)
      callback(null, updatedPiAssessment)
    }
  })
}

exports.PiAssessmentDetailsHelpers = PiAssessmentDetailsHelpers
