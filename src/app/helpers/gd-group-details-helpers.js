'use strict'
/**
 * The <code>gd-group-details-helpers.js</code>
 *
 * @author Ashita Shah, Monika Mehta
 */

var func = require('../utils/functions')
var HELPER_CONS = 'HS_GGDH_'
var async = require('async')
var _ = require('lodash')
EmailVerificationHelpers = require('../helpers/email-verification-helpers').EmailVerificationHelpers
var emailVerificationHelpers = new EmailVerificationHelpers()
var configJson = func.config.get('mail_domains')
var isResetPwd = true
var config = func.config.get('front_end')

function GdGroupDetailsHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of gd group details helper')
  DbOperation = require('./db-operations').DbOperation
  dbOp = new DbOperation()
}

GdGroupDetailsHelpers.prototype.getCustomGDPIInstituteList = function(body, orgNameMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCustomGDPIInstituteList()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'Fetch institute details with request body' + JSON.stringify(body), func.logCons.LOG_ENTER)
  var designation = body[func.dbCons.FIELD_DESIGNATION]
  var type = body[func.dbCons.FIELD_ASSESSMENT_TYPE]
  const roundType = body[func.dbCons.FIELD_ROUND_TYPE]
  if (type == 2) var msg = func.msgCons.NO_INSTITUE_FOUND_FOR_GD
  else if (type == 3) var msg = func.msgCons.NO_INSTITUE_FOUND_FOR_PI
  getCustomCampusDriveList(designation, type, roundType, orgNameMap, function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCustomGDPIInstituteList = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCustomGDPIInstituteList()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (response.length === 0 || !response) {
      callback(null, func.responseGenerator([], HELPER_CONS + func.msgCons.CODE_SERVER_OK, msg))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCustomGDPIInstituteList()', func.logCons.LOG_EXIT)
    } else {
      callback(null, func.responseGenerator(response, HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_INSTITUTE_DETAILS_RETRIVED))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCustomGDPIInstituteList()', func.logCons.LOG_EXIT)
    }
  })
}

/**
 *
 * @param {Number} userCode
 * @param {JSON} groupDataToInsert
 * @param {JSON} urlMap
 * @param {Function} callback
 */
GdGroupDetailsHelpers.prototype.addGdGroupDetails = function(userCode, groupDataToInsert, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addGdGroupDetails()', func.logCons.LOG_ENTER)
  getLatestGroupID(urlMap, function(error, latestGroupID) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'addGdGroupDetails dbOperation = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addGdGroupDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, latestGroupID)
    } else if (latestGroupID === undefined) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addGdGroupDetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      insertGdGroupDetails(userCode, groupDataToInsert, latestGroupID, urlMap, callback)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addGdGroupDetails()', func.logCons.LOG_EXIT)
}

/**
 *
 * @param {JSON} groupDataToUpdate
 * @param {JSON} urlMap
 * @param {Function} callback
 */
GdGroupDetailsHelpers.prototype.updateGdGroupDetails = function(groupDataToUpdate, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateGdGroupDetails()', func.logCons.LOG_ENTER)
  generateCandidateMap(groupDataToUpdate[func.msCons.FIELD_CANDIDATE_DETAILS], func.msCons.FIELD_UPDATED_GD_GROUP_DISPLAY_NAME, 0, urlMap, function(error, candidateMap, groupDisplayNamekeys) {
    if (error) {
      return callback(new Error().stack, candidateMap)
    } else {
      var updatedGroupDetailsJson = generateJSONtoUpdate(groupDataToUpdate[func.msCons.FIELD_CANDIDATE_DETAILS], groupDisplayNamekeys)
      var responseArray = []
      async.forEachOf(updatedGroupDetailsJson, function(item, key, callbackinnerloop) {
        updateGroupDataIntoDB(item, urlMap, function(error, updatedResponse) {

          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'updateGdGroupDetails dbOperation = ' + error)
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateGdGroupDetails()', func.logCons.LOG_EXIT)
            return callbackinnerloop(new Error().stack, updatedResponse)
          } else if (!updatedResponse || updatedResponse.length === 0) {
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateGdGroupDetails()', func.logCons.LOG_EXIT)
            return callbackinnerloop(new Error().stack, [])
          } else {
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateGdGroupDetails()', func.logCons.LOG_EXIT)
            for (var i = 0; i < updatedResponse.length; i++) {
              responseArray.push(updatedResponse[i])
            }
            callbackinnerloop(null, updatedResponse)
          }
        })
      }, function(error) {
        if (error) {
          return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP))
        } else {
          callback(null, func.responseGenerator(responseArray, HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_UPDATE_DATA))
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateGdGroupDetails()', func.logCons.LOG_EXIT)
}

/**
 * this function is for updating gd group details by id
 * @param {JSON} dataToUpdate
 * @param {JSON} urlMap
 * @param {function} callback
 */
function updateGroupDataIntoDB(dataToUpdate, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateGroupDataIntoDB()', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, dataToUpdate[func.dbCons.FIELD_ID])
  dbOp.update(query, urlMap, func.dbCons.COLLECTION_GD_GROUP_DETAILS, dbOp.getOperationJson(func.lightBlueCons.OP_SET, dataToUpdate[func.msCons.FIELD_UPDATED_FIELDS]), dbOp.getCommonProjection(), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'updateGroupDataIntoDB : Error while updating gd group details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateGroupDataIntoDB()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateGroupDataIntoDB() No data updated', func.logCons.LOG_EXIT)
      return callback(new Error().stack, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateGroupDataIntoDB()', func.logCons.LOG_EXIT)
      return callback(null, response)
    }
  })
}

function generateJSONtoUpdate(candidate_details, groupDisplayNamekeys) {
  var jsonToUpdate = []
  var updatedFields = {}
  var idArray = []
  var singleData = {}
  var array3 = candidate_details.filter(function(obj) {
    updatedFields = {}
    updatedFields[func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME] = obj[func.msCons.FIELD_UPDATED_GD_GROUP_DISPLAY_NAME]
    if (obj[func.dbCons.FIELD_GD_TOPIC] != undefined) {
      updatedFields[func.dbCons.FIELD_GD_TOPIC] = obj[func.dbCons.FIELD_GD_TOPIC]
    }
    if (obj[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE] != undefined) {
      updatedFields[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE] = obj[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE]
    }
    updatedFields[func.dbCons.FIELD_GD_GROUP_DETAILS_ID] = parseInt(obj[func.msCons.FIELD_UPDATED_GD_GROUP_DETAILS_ID])
    updatedFields[func.dbCons.FIELD_GROUP_SEQUENCE_NUMBER] = parseInt(obj[func.msCons.FIELD_UPDATED_GD_GROUP_DISPLAY_NAME].slice(-1))
    updatedFields[func.dbCons.FIELD_STATUS] = (obj[func.dbCons.FIELD_STATUS].toUpperCase() === func.dbCons.VALUE_GD_GROUP_CANDIDATE_NOT_APPEARED) ? func.dbCons.ENUM_STATUS_CANDIDATE_NOT_APPEARED_IN_GD : func.dbCons.ENUM_STATUS_CANDIDATE_APPEARED_IN_GD
    singleData[func.msCons.FIELD_UPDATED_FIELDS] = updatedFields
    singleData[func.dbCons.FIELD_ID] = parseInt(obj[func.dbCons.FIELD_ID])
    jsonToUpdate.push(singleData)
    singleData = {}
  })
  return jsonToUpdate
}

/**
 * this function is for inserting/adding gd group details by id
 * @param {Number} userCode
 * @param {JSON} reqBody
 * @param {Number} latestGroupID
 * @param {JSON} urlMap
 * @param {function} callback
 */
function insertGdGroupDetails(userCode, reqBody, latestGroupID, urlMap, callback) {

  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside insertGdGroupDetails()', func.logCons.LOG_ENTER)
  var bulkInsertJSON = []
  var designation = reqBody[func.dbCons.FIELD_DESIGNATION]
  var campusYear = reqBody[func.dbCons.CAMPUS_DRIVE_DETAILS_INVITE_YEAR]
  generateCandidateMap(reqBody[func.msCons.FIELD_CANDIDATE_DETAILS], func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME, latestGroupID, urlMap, function(error, candidateMap, groupDisplayNamekeys) {
    if (error) {
      return callback(new Error().stack, candidateMap)
    } else {
      async.forEachOf(reqBody[func.msCons.FIELD_CANDIDATE_DETAILS], function(item, key, callbackinner) {
        getInstituteID(reqBody, campusYear, item[func.dbCons.FIELD_INSTITUTE_NAME], designation, urlMap, function(error, response) {
          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getInstituteID dbOperation = ' + error)
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteID()', func.logCons.LOG_EXIT)
            return callbackinner(new Error().stack, response)
          } else if (!response || response.length === 0) {
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteID()', func.logCons.LOG_EXIT)
            return callbackinner(new Error().stack, [])
          } else {
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteID()', func.logCons.LOG_EXIT)
            var insertJSON = {}
            insertJSON = generateInsertJSON(userCode, response, item, candidateMap, reqBody)
            bulkInsertJSON.push(insertJSON)
            callbackinner(null, [])
          }
        })
      }, function(error) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'insertGdGroupDetails async call = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertGdGroupDetails()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP))
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertGdGroupDetails()', func.logCons.LOG_EXIT)
          insertEntriesIntoDB(bulkInsertJSON, groupDisplayNamekeys, urlMap, callback)
        }
      })
    }
  })
}

/**
 * this function is for inserting/adding gd candidate in a gd group details by id
 * @param {Number} userCode
 * @param {JSON} reqBody
 * @param {Number} latestGroupID
 * @param {JSON} urlMap
 * @param {function} callback
 */
GdGroupDetailsHelpers.prototype.addGdCandidates = function(userCode, urlMap, reqBody, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside addGdCandidates()', func.logCons.LOG_ENTER)
  var bulkInsertJSON = []
  let candidateDetails = reqBody[func.dbCons.COLLECTION_CANDIDATE_DETAILS]
  let roundType = reqBody[func.dbCons.FIELD_ROUND_TYPE]
  generateGroupDisplayNameKeys(reqBody[func.msCons.FIELD_CANDIDATE_DETAILS], func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME, urlMap, function(error, groupDisplayNamekeys) {
    if (error) {
      return callback(new Error().stack, candidateMap)
    } else {
      async.forEachOf(candidateDetails, function(item, key, callbackinner) {
        getDetailsFromGdGrpIds(item[func.dbCons.FIELD_GD_GROUP_DETAILS_ID], urlMap, function(error, response) {
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
          insertEntriesIntoGd(bulkInsertJSON, roundType, groupDisplayNamekeys, urlMap, callback)
        }
      })
    }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addGdCandidates()', func.logCons.LOG_EXIT)
  })
}

function getDetailsFromGdGrpIds(gdGrpId, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromGdGrpIds()', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_GD_GROUP_DETAILS_ID, func.lightBlueCons.OP_EQUAL, gdGrpId)
  dbOp.findByQuery(query, urlMap, func.dbCons.COLLECTION_GD_GROUP_DETAILS, dbOp.getCommonProjection(), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getDetailsFromGdGrpIds : Error while retrieving gdGrpID = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromGdGrpIds()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromGdGrpIds() No relevent InstituteID found', func.logCons.LOG_EXIT)
      return callback(new Error().stack, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromGdGrpIds()', func.logCons.LOG_EXIT)
      return callback(null, response)
    }
  })
}

function updateStageInCandidateDetails(fetchAllCandidateIDS, roundType, urlMap, callback) {
  roundType = getEnumForRoundType(roundType)
  let candidateListArray = func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_ID, fetchAllCandidateIDS)
  var body = {}
  if (roundType === func.dbCons.ENUM_ROUND_TYPE_ON_CAMPUS) {
    body[func.dbCons.COLLECTION_JSON_STAGE] = func.dbCons.ENUM_SELECTED_FOR_GD
  } else {
    body[func.dbCons.COLLECTION_JSON_STAGE] = func.dbCons.ENUM_STAGE_SELECTED_IN_GD_FOR_ONSITE
  }
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidateListArray))
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateStageInCandidateDetails()', func.logCons.LOG_ENTER);
  dbOp.update(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, dbOp.getOperationJson(func.lightBlueCons.OP_SET, body), dbOp.getCommonProjection(), function(error, updatedCandidateDetail) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateExamDetailsById()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, updatedCandidateDetail)
    }
    if (!updatedCandidateDetail || updatedCandidateDetail.length === 0) {
      var response = []
      return callback(null, response)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateStageInCandidateDetails()', func.logCons.LOG_EXIT)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateStageInCandidateDetails()', func.logCons.LOG_EXIT);
}

function generateCandidateMap(candidateDetails, fieldName, latestGroupID, urlMap, callback) {
  var candidateMap = {}
  var groupIDArray = {}
  var groupID = latestGroupID + 1
  var groupDisplayNamekeys = []
  async.forEachOf(candidateDetails, function(item, key, callbackinner) {
    if (groupDisplayNamekeys.indexOf(item[fieldName]) === -1) {
      groupDisplayNamekeys.push(item[fieldName])
      groupIDArray[item[fieldName]] = groupID
      groupID++
    }
    callbackinner()
  }, function(error) {
    if (error) {
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP))
    } else {
      async.forEachOf(candidateDetails, function(item, key, callbackinnerloop) {
        candidateMap[item[func.dbCons.FIELD_CANDIDATE_ID]] = groupIDArray[item[fieldName]]
        callbackinnerloop()
      }, function(error) {
        if (error) {
          return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP))
        } else {
          callback(null, candidateMap, groupDisplayNamekeys)
        }
      })
    }
  })
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

function getInstituteID(body, campusYear, instituteName, designation, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteID()', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_NAME, func.lightBlueCons.OP_EQUAL, instituteName)
  dbOp.findByQuery(query, urlMap, func.dbCons.COLLECTION_INSTITUTE_DETAILS, dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getInstituteID : Error while retrieving InstituteID = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteID()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteID() No relevent InstituteID found', func.logCons.LOG_EXIT)
      return callback(new Error().stack, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteID()', func.logCons.LOG_EXIT)
      getCampusID(body, campusYear, response[0][func.dbCons.FIELD_ID], designation, urlMap, callback)
    }
  })
}

function getCampusID(body, campusYear, instituteID, designation, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusID()', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_INSTITUTE_ID, func.lightBlueCons.OP_EQUAL, instituteID))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_DESIGNATION, func.lightBlueCons.OP_EQUAL, designation))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.CAMPUS_DRIVE_DETAILS_INVITE_YEAR, func.lightBlueCons.OP_EQUAL, campusYear))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCampusID : Error while retrieving CampusID = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusID()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusID() : No relevent CampusID found', func.logCons.LOG_EXIT)
      return callback(new Error().stack, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusID()', func.logCons.LOG_EXIT)
      async.forEachOf(response, function(item, key, callbackinner) {
        getCandidateSourceId(body, item[func.dbCons.FIELD_ID], urlMap, function(error, response) {
          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getDetailsFromGdGrpIds dbOperation = ' + JSON.stringify(error))
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromGdGrpIds()', func.logCons.LOG_EXIT)
            return callbackinner(new Error().stack, response)
          } else if (!response || response.length === 0) {
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromGdGrpIds()', func.logCons.LOG_EXIT)
            return callbackinner(new Error().stack, [])
          } else {
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromGdGrpIds()', func.logCons.LOG_EXIT)
            let insertJSON = fetchCandidateIDfromCandidateSourceId(response, item, body, urlMap, callback)
            callbackinner()
          }
        })
      }, function(error) {
        if (error) {

        } else {
          callback(null, insertJSON)
        }
      })
    }
  })
}

function fetchCandidateIDfromCandidateSourceId(response, item, body, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchCandidateIDfromCandidateSourceId()', func.logCons.LOG_ENTER)
  let projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID, true, true))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_EQUAL, response.candidate_source_id), urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, projection, function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'fetchCandidateIDfromCandidateSourceId : Error while retrieving CandidateSourceId = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchCandidateIDfromCandidateSourceId()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_PROPER_DATA), HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_PROPER_DATA))
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchCandidateIDfromCandidateSourceId() : No relevent CandidateId found', func.logCons.LOG_EXIT)
      return callback(new Error().stack, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchCandidateIDfromCandidateSourceId()', func.logCons.LOG_EXIT)
      let json = matchCandidateId(body, response, item, urlMap)
      callback(null, json)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchCandidateIDfromCandidateSourceId()', func.logCons.LOG_EXIT)
}

function matchCandidateId(body, response, item, urlMap) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'matchCandidateId()', func.logCons.LOG_ENTER)
  let json = {}
  async.forEachOf(response, function(b, bCallbackinner) {
    async.forEachOf(body.candidate_details, function(a, aCallbackinner) {
      if (b.id === a.candidate_id) {
        json[func.dbCons.FIELD_CAMPUS_DRIVE_ID] = item[func.dbCons.FIELD_ID]
        json[func.dbCons.FIELD_CANDIDATE_SOURCE_ID] = b[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]
      }
    })
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'matchCandidateId()', func.logCons.LOG_EXIT)
  return json
}

function getCandidateSourceId(body, campusDriveId, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceId()', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CAMPUS_DRIVE_ID, func.lightBlueCons.OP_EQUAL, campusDriveId))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCandidateSourceId : Error while retrieving CandidateSourceId = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceId()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_PROPER_DATA), HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_PROPER_DATA))
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceId() : No relevent CandidateSourceId found', func.logCons.LOG_EXIT)
      return callback(new Error().stack, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceId()', func.logCons.LOG_EXIT)
      var idJSON = {}
      idJSON[func.dbCons.FIELD_CAMPUS_DRIVE_ID] = campusDriveId
      idJSON[func.dbCons.FIELD_CANDIDATE_SOURCE_ID] = response[0][func.dbCons.FIELD_ID]
      return callback(null, idJSON)
    }
  })
}

function getLatestGroupID(urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getLatestGroupID()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_GD_GROUP_DETAILS_ID, true, true))
  dbOp.findByQuery(null, urlMap, func.dbCons.COLLECTION_GD_GROUP_DETAILS, projection, function(error, allGroupDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getLatestGroupID dbOperation = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getLatestGroupID()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, allGroupDetails)
    } else if (!allGroupDetails || allGroupDetails.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getLatestGroupID()', func.logCons.LOG_EXIT)
      return callback(null, 0)
    } else {
      allGroupDetails = func.convertIntoArray(allGroupDetails)
      var sortedGroupDetails = _.sortBy(allGroupDetails, func.dbCons.FIELD_GD_GROUP_DETAILS_ID).reverse()
      var latestGroupID = sortedGroupDetails[0][func.dbCons.FIELD_GD_GROUP_DETAILS_ID]
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getLatestGroupID()', func.logCons.LOG_EXIT)
      callback(null, latestGroupID)
    }
  })
}

function insertEntriesIntoGd(insertJSON, roundType, groupDisplayNamekeys, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertEntriesIntoDB()', func.logCons.LOG_ENTER)
  dbOp.insert(urlMap, func.dbCons.COLLECTION_GD_GROUP_DETAILS, insertJSON, dbOp.getCommonProjection(), function(error, groupDetailsResponse) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'insertEntriesIntoDB : Error while inserting data : ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertEntriesIntoDB()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, groupDetailsResponse)
    } else if (!groupDetailsResponse || groupDetailsResponse.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'insertEntriesIntoDB() : No data inserted', func.logCons.LOG_EXIT)
      return callback(new Error().stack, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertEntriesIntoDB()', func.logCons.LOG_EXIT)
      updateStageInCandidateDetails(insertJSON, roundType, urlMap, function(error, response) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'updateStageInCandidateDetails dbOperation = ' + JSON.stringify(error))
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateStageInCandidateDetails()', func.logCons.LOG_EXIT)
          return callbackinner(new Error().stack, response)
        } else if (!response || response.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateStageInCandidateDetails()', func.logCons.LOG_EXIT)
          return callbackinner(new Error().stack, [])
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateStageInCandidateDetails()', func.logCons.LOG_EXIT)
          var insertJSON = {}
          insertJSON = generateInsertJSONforAddCandidate(userCode, response[0], item, candidateDetails, reqBody)
          bulkInsertJSON.push(insertJSON)
          callbackinner(null, response)
        }
      })
      callback(null, func.responseGenerator(generateResponseJSON(groupDetailsResponse, groupDisplayNamekeys), HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_CANDIDATE_INSERTED_SUCESSFULLY))
    }
  })
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

function insertEntriesIntoDB(insertJSON, groupDisplayNamekeys, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertEntriesIntoDB()', func.logCons.LOG_ENTER)
  dbOp.insert(urlMap, func.dbCons.COLLECTION_GD_GROUP_DETAILS, insertJSON, dbOp.getCommonProjection(), function(error, groupDetailsResponse) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'insertEntriesIntoDB : Error while inserting data : ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertEntriesIntoDB()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, groupDetailsResponse)
    } else if (!groupDetailsResponse || groupDetailsResponse.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'insertEntriesIntoDB() : No data inserted', func.logCons.LOG_EXIT)
      return callback(new Error().stack, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertEntriesIntoDB()', func.logCons.LOG_EXIT)
      callback(null, func.responseGenerator(generateResponseJSON(groupDetailsResponse, groupDisplayNamekeys), HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_DATA_INSERTED_SUCESSFULLY))
    }
  })
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

function generateInsertJSONforAddCandidate(userCode, responseJson, singleData) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateInsertJSON()', func.logCons.LOG_ENTER)
  var GDGroupDetailJson = {}
  GDGroupDetailJson[func.dbCons.FIELD_GD_DATE] = responseJson[func.dbCons.FIELD_GD_DATE]
  GDGroupDetailJson[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE] = singleData[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE]
  GDGroupDetailJson[func.dbCons.FIELD_ROUND_TYPE] = responseJson[func.dbCons.FIELD_ROUND_TYPE]
  GDGroupDetailJson[func.dbCons.FIELD_GD_LOCATION] = responseJson[func.dbCons.FIELD_GD_LOCATION]
  var diff = getDifferenceinArrays(responseJson[func.dbCons.FIELD_UNIVERSITIES], singleData[func.dbCons.FIELD_UNIVERSITIES])
  if (diff.length != 0) {
    var diffArr = []
    diffArr = responseJson[func.dbCons.FIELD_UNIVERSITIES]
    var diffArr = diffArr.concat(diff)
    GDGroupDetailJson[func.dbCons.FIELD_UNIVERSITIES] = diffArr
  } else {
    GDGroupDetailJson[func.dbCons.FIELD_UNIVERSITIES] = responseJson[func.dbCons.FIELD_UNIVERSITIES]
  }
  GDGroupDetailJson[func.dbCons.FIELD_GD_DISCUSSION_LEVEL] = responseJson[func.dbCons.FIELD_GD_DISCUSSION_LEVEL]
  GDGroupDetailJson[func.dbCons.FIELD_ACCESSOR_DETAILS] = responseJson[func.dbCons.FIELD_ACCESSOR_DETAILS]
  GDGroupDetailJson[func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME] = singleData[func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME]
  GDGroupDetailJson[func.dbCons.FIELD_GD_GROUP_DETAILS_ID] = singleData[func.dbCons.FIELD_GD_GROUP_DETAILS_ID]
  GDGroupDetailJson[func.dbCons.FIELD_GROUP_SEQUENCE_NUMBER] = responseJson[func.dbCons.FIELD_GROUP_SEQUENCE_NUMBER]
  GDGroupDetailJson[func.dbCons.FIELD_CANDIDATE_ID] = singleData[func.dbCons.FIELD_CANDIDATE_ID]
  if (responseJson[func.dbCons.FIELD_GD_TOPIC] !== undefined) {
    GDGroupDetailJson[func.dbCons.FIELD_GD_TOPIC] = responseJson[func.dbCons.FIELD_GD_TOPIC]
  }
  if (responseJson[func.dbCons.FIELD_ACCOMODATION] !== undefined) {
    GDGroupDetailJson[func.dbCons.FIELD_ACCOMODATION] = responseJson[func.dbCons.FIELD_ACCOMODATION]
  }
  if (responseJson[func.dbCons.UNIVERSITY_GROUP_NAME] !== undefined) {
    GDGroupDetailJson[func.dbCons.UNIVERSITY_GROUP_NAME] = responseJson[func.dbCons.UNIVERSITY_GROUP_NAME]
  }
  if (responseJson[func.dbCons.FIELD_PICKUP_DROP] !== undefined) {
    GDGroupDetailJson[func.dbCons.FIELD_PICKUP_DROP] = responseJson[func.dbCons.FIELD_PICKUP_DROP]
  }
  GDGroupDetailJson[func.dbCons.FIELD_FOOD_HABITS] = responseJson[func.dbCons.FIELD_FOOD_HABITS]
  GDGroupDetailJson[func.dbCons.FIELD_CAMPUS_DRIVE_ID] = singleData[func.dbCons.FIELD_CAMPUS_DRIVE_ID]
  GDGroupDetailJson[func.dbCons.FIELD_CANDIDATE_SOURCE_ID] = singleData[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]
  GDGroupDetailJson[func.dbCons.COMMON_CREATED_BY] = userCode
  GDGroupDetailJson[func.dbCons.COMMON_UPDATED_BY] = userCode
  GDGroupDetailJson[func.dbCons.FIELD_STATUS] = responseJson[func.dbCons.FIELD_STATUS]
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateInsertJSON()', func.logCons.LOG_EXIT)
  return GDGroupDetailJson
}

function generateInsertJSON(userCode, idJSON, singleData, candidateMap, reqBody) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateInsertJSONforAddCandidate()', func.logCons.LOG_ENTER)
  var GDGroupDetailJson = {}
  GDGroupDetailJson[func.dbCons.FIELD_GD_DATE] = reqBody[func.dbCons.FIELD_GD_DATE]
  GDGroupDetailJson[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE] = singleData[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE]
  GDGroupDetailJson[func.dbCons.FIELD_ROUND_TYPE] = getEnumForRoundType(reqBody[func.dbCons.FIELD_ROUND_TYPE])
  GDGroupDetailJson[func.dbCons.FIELD_GD_LOCATION] = reqBody[func.dbCons.FIELD_GD_LOCATION]
  GDGroupDetailJson[func.dbCons.FIELD_UNIVERSITIES] = reqBody[func.msCons.FIELD_INSTITUTE_ARRAY]
  GDGroupDetailJson[func.dbCons.FIELD_GD_DISCUSSION_LEVEL] = getEnumGDDiscussionLevel(reqBody[func.dbCons.FIELD_GD_DISCUSSION_LEVEL])
  GDGroupDetailJson[func.dbCons.FIELD_ACCESSOR_DETAILS] = reqBody[func.dbCons.FIELD_ACCESSOR_DETAILS]
  GDGroupDetailJson[func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME] = singleData[func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME]
  GDGroupDetailJson[func.dbCons.FIELD_GD_GROUP_DETAILS_ID] = candidateMap[singleData[func.dbCons.FIELD_CANDIDATE_ID].toString()]
  GDGroupDetailJson[func.dbCons.FIELD_GROUP_SEQUENCE_NUMBER] = parseInt(singleData[func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME].slice(-1))
  GDGroupDetailJson[func.dbCons.FIELD_CANDIDATE_ID] = singleData[func.dbCons.FIELD_CANDIDATE_ID]
  GDGroupDetailJson[func.dbCons.FIELD_GD_PINCODE] = reqBody[func.dbCons.FIELD_PINCODE]

  if (singleData[func.dbCons.FIELD_GD_TOPIC] !== undefined) {
    GDGroupDetailJson[func.dbCons.FIELD_GD_TOPIC] = singleData[func.dbCons.FIELD_GD_TOPIC]
  }
  if (reqBody[func.dbCons.FIELD_ACCOMODATION] !== undefined) {
    GDGroupDetailJson[func.dbCons.FIELD_ACCOMODATION] = reqBody[func.dbCons.FIELD_ACCOMODATION]
  }
  if (reqBody[func.dbCons.UNIVERSITY_GROUP_NAME] !== undefined) {
    GDGroupDetailJson[func.dbCons.UNIVERSITY_GROUP_NAME] = reqBody[func.dbCons.UNIVERSITY_GROUP_NAME]
  }
  if (reqBody[func.dbCons.FIELD_PICKUP_DROP] !== undefined) {
    GDGroupDetailJson[func.dbCons.FIELD_PICKUP_DROP] = reqBody[func.dbCons.FIELD_PICKUP_DROP]
  }
  GDGroupDetailJson[func.dbCons.FIELD_FOOD_HABITS] = reqBody[func.dbCons.FIELD_FOOD_HABITS]
  GDGroupDetailJson[func.dbCons.FIELD_CAMPUS_DRIVE_ID] = idJSON[func.dbCons.FIELD_CAMPUS_DRIVE_ID]
  GDGroupDetailJson[func.dbCons.FIELD_CANDIDATE_SOURCE_ID] = idJSON[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]
  GDGroupDetailJson[func.dbCons.COMMON_CREATED_BY] = userCode
  GDGroupDetailJson[func.dbCons.COMMON_UPDATED_BY] = userCode
  GDGroupDetailJson[func.dbCons.FIELD_STATUS] = func.dbCons.ENUM_STATUS_GROUP_CREATED
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateInsertJSONforAddCandidate()', func.logCons.LOG_EXIT)
  return GDGroupDetailJson
}

function generateResponseJSON(response, groupDisplayNamekeys) {
  var responseJson = []
  var singleGroupData = {}
  var singleCandidateDetails = {}
  for (var i = 0; i < groupDisplayNamekeys.length; i++) {
    singleGroupData = {}
    singleGroupData[func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME] = groupDisplayNamekeys[i]
    singleGroupData[func.dbCons.FIELD_GD_GROUP_DETAILS_ID] = 0
    singleGroupData[func.msCons.FIELD_CANDIDATE_DETAILS] = []
    for (var j = 0; j < response.length; j++) {
      singleCandidateDetails = {}
      if (response[j][func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME] == singleGroupData[func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME]) {
        singleGroupData[func.dbCons.FIELD_GD_GROUP_DETAILS_ID] = response[j][func.dbCons.FIELD_GD_GROUP_DETAILS_ID]
        singleCandidateDetails[func.dbCons.FIELD_CANDIDATE_ID] = response[j][func.dbCons.FIELD_CANDIDATE_ID]
        singleCandidateDetails[func.dbCons.FIELD_CAMPUS_DRIVE_ID] = response[j][func.dbCons.FIELD_CAMPUS_DRIVE_ID]
        singleGroupData[func.msCons.FIELD_CANDIDATE_DETAILS].push(singleCandidateDetails)
      }
    }
    responseJson.push(singleGroupData)
  }
  return responseJson
}

function getEnumGDDiscussionLevel(value) {
  switch (value) {
    case func.msCons.FIELD_ACROSS_INSTITUTE_LEVEL:
      return func.dbCons.ENUM_ACROSS_INSTITUTE_LEVEL_DISCUSSION
    case func.msCons.FIELD_INSTITUTE_LEVEL:
      return func.dbCons.ENUM_INSTITUTE_LEVEL_DISCUSSION
    default:
      return -1
  }
}

GdGroupDetailsHelpers.prototype.getInstituteListFromDesignationWithoutGd = function(body, orgNameMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteListFromDesignationWithoutGd()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'Fetch institute details with request body' + JSON.stringify(body), func.logCons.LOG_ENTER)
  var designation = body[func.dbCons.FIELD_DESIGNATION]
  var type = body[func.dbCons.FIELD_ASSESSMENT_TYPE]
  var year = body[func.dbCons.FIELD_CAMPUS_YEAR]
  const roundType = body[func.dbCons.FIELD_ROUND_TYPE]
  if (type == 2) var msg = func.msgCons.NO_INSTITUE_FOUND_FOR_GD
  else if (type == 3) var msg = func.msgCons.NO_INSTITUE_FOUND_FOR_PI
  getCampusDriveList(designation, type, roundType, year, orgNameMap, function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getInstituteListFromDesignation = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteListFromDesignation()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (response.length === 0 || !response) {
      callback(null, func.responseGenerator([], HELPER_CONS + func.msgCons.CODE_SERVER_OK, msg))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteListFromDesignation()', func.logCons.LOG_EXIT)
    } else {
      callback(null, func.responseGenerator(response, HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_INSTITUTE_DETAILS_RETRIVED))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteListFromDesignation()', func.logCons.LOG_EXIT)
    }
  })
}

function getProjectionOverInstituteDetails() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverInstituteDetails()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_NAME, true, true))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverInstituteDetails()', func.logCons.LOG_EXIT)
  return projection
}

function getCustomCampusDriveList(designation, type, roundType, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCustomCampusDriveList()', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_DESIGNATION, func.lightBlueCons.OP_EQUAL, designation))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_EQUAL, func.dbCons.ENUM_CAMPUS_DRIVE_CLOSED))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), getProjectionOverCampusDriveDetails(), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error in fetching campus drive details for designation ' + designation + ' Error is ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCustomCampusDriveList()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no campus drive details found for designation ' + designation)
      return callback(null, [])
    } else {
      let campusDriveListArray = func.getValuesArrayFromJson(func.dbCons.FIELD_ID, response)
      getCandidateSourceIdsFromCampusDriveIds(campusDriveListArray, orgNameMap, function(error, candidateSourceDetails) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while converting json to array of campus_drive_id using async loop for json ' + JSON.stringify(response) + ' error: ' + JSON.stringify(error))
          return callback(new Error().stack, response)
        } else {
          getCandidateIdsfromCandidateSrcIds(candidateSourceDetails, orgNameMap, function(error, candidateList) {
            if (error) {
              func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getGroupDetailListOverCampusDriveId()', func.logCons.LOG_EXIT)
              return callback(new Error().stack, candidateList)
            } else if (candidateList.length == 0) {
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupDetailListOverCampusDriveId()', func.logCons.LOG_EXIT)
              return callback(null, [])
            } else {
              let campusArray = getCampusArrayfromStatus(candidateList, roundType, type)
              campusArray = _.uniq(campusArray)
              var filterInstitueArrayFromCampusDriveId = []
              var array3 = campusArray.filter(function(obj) {
                filterInstitueArrayFromCampusDriveId.push((func.filterBasedOnValue(response, 'id', obj))[0])
                return (func.filterBasedOnValue(response, 'id', obj))
              })
              getInstituteListFromId(filterInstitueArrayFromCampusDriveId, orgNameMap, function(error, responseJson) {
                if (error) {
                  func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getInstituteList dbOperation = ' + error)
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteList()', func.logCons.LOG_EXIT)
                  return callback(new Error().stack, response)
                } else if (!response || response.length === 0) {
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteList()', func.logCons.LOG_EXIT)
                  return callback(null, [])
                } else {
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteList()', func.logCons.LOG_EXIT)
                  return callback(null, responseJson)
                }
              })
            }
          })
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveList()', func.logCons.LOG_EXIT)
        }
      })
    }
  })
}

function getCampusArrayfromStatus(candidateList, roundType, type) {
  let campusArray = []
  if (type == 2) {
    for (let candidate of candidateList) {
      if (roundType != func.dbCons.VALUE_ROUND_TYPE_ON_SITE) {
        if (candidate[func.dbCons.COLLECTION_JSON_STAGE] === func.dbCons.ENUM_SELECTED_FOR_GD) {
          campusArray.push(candidate[func.dbCons.FIELD_CAMPUS_DRIVE_ID])
        }
      } else {
        if (candidate[func.dbCons.COLLECTION_JSON_STAGE] === func.dbCons.ENUM_STAGE_SELECTED_IN_GD_FOR_ONSITE) {
          campusArray.push(candidate[func.dbCons.FIELD_CAMPUS_DRIVE_ID])
        }
      }
    }
  } else if (type == 3) {
    for (let candidate of candidateList) {
      if (roundType != func.dbCons.VALUE_ROUND_TYPE_ON_SITE) {
        if (candidate[func.dbCons.COLLECTION_JSON_STAGE] === func.dbCons.ENUM_SELECTED_FOR_PI) {
          campusArray.push(candidate[func.dbCons.FIELD_CAMPUS_DRIVE_ID])
        }
      } else {
        if (candidate[func.dbCons.COLLECTION_JSON_STAGE] === func.dbCons.ENUM_STAGE_SELECTED_IN_PI_FOR_ONSITE) {
          campusArray.push(candidate[func.dbCons.FIELD_CAMPUS_DRIVE_ID])
        }
      }
    }
  }
  return campusArray
}

function getCampusDriveList(designation, type, roundType, year, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveList()', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_DESIGNATION, func.lightBlueCons.OP_EQUAL, designation))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.CAMPUS_DRIVE_DETAILS_INVITE_YEAR, func.lightBlueCons.OP_EQUAL, year))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_EQUAL, func.dbCons.ENUM_CAMPUS_DRIVE_CLOSED))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), getProjectionOverCampusDriveDetails(), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error in fetching campus drive details for designation ' + designation + ' Error is ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveList()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no campus drive details found for designation ' + designation)
      return callback(null, [])
    } else {
      let campusDriveListArray = func.getValuesArrayFromJson(func.dbCons.FIELD_ID, response)
      getCandidateSourceIdsFromCampusDriveIds(campusDriveListArray, orgNameMap, function(error, candidateSourceDetails) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while converting json to array of campus_drive_id using async loop for json ' + JSON.stringify(response) + ' error: ' + JSON.stringify(error))
          return callback(new Error().stack, response)
        } else {
          getGroupDetailListWithoutCampusDriveID(candidateSourceDetails, type, roundType, orgNameMap, function(error, campusDriveListWithoutGd) {
            if (error) {
              func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getGroupDetailListOverCampusDriveId()', func.logCons.LOG_EXIT)
              return callback(new Error().stack, response)
            } else if (campusDriveListWithoutGd.length == 0) {
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupDetailListOverCampusDriveId()', func.logCons.LOG_EXIT)
              return callback(null, [])
            } else {
              var filterInstitueArrayFromCampusDriveId = []
              var array3 = campusDriveListWithoutGd.filter(function(obj) {
                filterInstitueArrayFromCampusDriveId.push((func.filterBasedOnValue(response, 'id', obj))[0])
                return (func.filterBasedOnValue(response, 'id', obj))
              })
              getInstituteListFromId(filterInstitueArrayFromCampusDriveId, orgNameMap, function(error, responseJson) {
                if (error) {
                  func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getInstituteList dbOperation = ' + error)
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteList()', func.logCons.LOG_EXIT)
                  return callback(new Error().stack, response)
                } else if (!response || response.length === 0) {
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteList()', func.logCons.LOG_EXIT)
                  return callback(null, [])
                } else {
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteList()', func.logCons.LOG_EXIT)
                  return callback(null, responseJson)
                }
              })
            }
          })
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveList()', func.logCons.LOG_EXIT)
        }
      })
    }
  })
}

function getCandidateIdsfromCandidateSrcIds(candidateSrcIdArray, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIdsFromCampusDriveIds()', func.logCons.LOG_ENTER)
  let candidateSrcIdArrayList = func.getValuesArrayFromJson(func.dbCons.FIELD_ID, candidateSrcIdArray)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_STATUS, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.COLLECTION_JSON_STAGE, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, true, true))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_IN, candidateSrcIdArrayList), orgNameMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, projection, function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching candidate source array detail = ' + response + ' from candidate_source_details collection ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIdsFromCampusDriveIds()', func.logCons.LOG_EXIT)
      var originalKeys = []
      var replaceKeys = []
      originalKeys.push('id')
      replaceKeys.push('candidate_source_id')
      candidateSrcIdArray = getRenamedKeysinJSON(candidateSrcIdArray, originalKeys, replaceKeys)
      var sourceField = func.dbCons.FIELD_CANDIDATE_SOURCE_ID
      var destSourceField = func.dbCons.FIELD_CANDIDATE_SOURCE_ID
      var destinationFields = []
      destinationFields.push(func.dbCons.FIELD_CAMPUS_DRIVE_ID)
      mappingJson(response, candidateSrcIdArray, sourceField, destSourceField, destinationFields, function(error, jsonResponse) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
          return callback(new Error().stack, jsonResponse)
        } else if (!jsonResponse || jsonResponse.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
          return callback(new Error().stack, jsonResponse)
        } else {
          originalKeys = []
          replaceKeys = []
          originalKeys.push('id')
          replaceKeys.push('candidate_id')
          jsonResponse = getRenamedKeysinJSON(jsonResponse, originalKeys, replaceKeys)
          return callback(null, jsonResponse)
        }
      })
    }
  })
}

function getRenamedKeysinJSON(finalJSON, originalKeys, replaceKeys) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getRenamedKeysinJSON()', func.logCons.LOG_ENTER)
  for (var i = 0; i < originalKeys.length; i++) {
    for (let obj of finalJSON) {
      var key = originalKeys[i]

      var replacekey = replaceKeys[i]

      obj[replacekey] = obj[key]
      delete obj[key]
    }
  }
  return finalJSON
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getRenamedKeysinJSON()', func.logCons.LOG_EXIT)
}

function mappingJson(sourceJson, destinationJson, sourceField, destSourceField, destinationField, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'mappingJson()', func.logCons.LOG_ENTER)
  async.forEachOf(sourceJson, function(sourceItem, key, sourceCallbackinner) {
    async.forEachOf(destinationJson, function(destinationItem, key, destinationCallbackinner) {
      if (sourceItem[sourceField] == destinationItem[destSourceField]) {
        for (let destObj of destinationField) {
          sourceItem[destObj] = destinationItem[destObj]
        }
        destinationCallbackinner()
      } else {
        destinationCallbackinner()
      }
    }, function(error) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'mappingJson()', func.logCons.LOG_EXIT)
        return sourceCallbackinner(new Error().stack, sourceJson)
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'mappingJson()', func.logCons.LOG_EXIT)
        sourceCallbackinner(null, sourceJson)
      }
    })
  }, function(error) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'mappingJson()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, sourceJson)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'mappingJson()', func.logCons.LOG_EXIT)
      callback(null, sourceJson)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'mappingJson()', func.logCons.LOG_EXIT)
}

function getCandidateSourceIdsFromCampusDriveIds(campusDriveListArray, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIdsFromCampusDriveIds()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CAMPUS_DRIVE_ID, func.lightBlueCons.OP_IN, campusDriveListArray), orgNameMap, func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, projection, function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching candidate source array detail = ' + response + ' from candidate_source_details collection ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIdsFromCampusDriveIds()', func.logCons.LOG_EXIT)
      return callback(null, response)
    }
  })
}

function getCustomLengthforArray(campusDriveList, candidateIdList) {
  let campusDriveArray = _.uniq(func.getValuesArrayFromJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, candidateIdList))
  let campusDriveListDetails = []
  for (let i of campusDriveArray) {
    var length1 = 0,
      length2 = 0
    for (let j of candidateIdList) {
      if (j['campus_drive_id'] === i) {
        length1++;
      }
    }
    for (let k of campusDriveList) {
      if (k['campus_drive_id'] === i) {
        length2++;
      }
    }
    if (length1 !== length2) {
      campusDriveListDetails.push(i)
    }
  }
  return campusDriveListDetails
}


function findByCampusDriveIDList(collectionName, roundType, orgNameMap, candidateSourceDetails, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByCampusDriveID()', func.logCons.LOG_ENTER)
  var query = []
  let campusDriveListArray = func.getValuesArrayFromJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, candidateSourceDetails)
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CAMPUS_DRIVE_ID, func.lightBlueCons.OP_IN, campusDriveListArray))
  if (roundType !== func.dbCons.VALUE_ROUND_TYPE_ON_CAMPUS) {
    query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROUND_TYPE, func.lightBlueCons.OP_NOT_EQUAL, getEnumForRoundType(roundType)))
  }
  var projection = []
  var campusDriveListDetails = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID, true, true))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, collectionName, projection, function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching campus_drive_id array detail = ' + campusDriveListArray + ' from gd_group_details collection ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetched campus_drive_id which exist in gd_group_details collection ' + JSON.stringify(response))
      let campusDriveArray = getCustomLengthforArray(response, candidateSourceDetails)
      if (roundType !== func.dbCons.VALUE_ROUND_TYPE_ON_CAMPUS) {
        let campusDriveWithCandidateSource = _.xorBy(response, candidateSourceDetails, func.dbCons.FIELD_CAMPUS_DRIVE_ID)
        getCandidateSrcfromPIAssessmentOfOnCampus(func.getValuesArrayFromJson(func.dbCons.FIELD_ID, campusDriveWithCandidateSource), orgNameMap, function(error, candidatesPiSrcs) {
          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCandidateSrcfromPIAssessmentOfOnCampus = ' + JSON.stringify(error))
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSrcfromPIAssessmentOfOnCampus()', func.logCons.LOG_EXIT)
            return callback(new Error().stack, candidatesPiSrcs)
          } else {
            if (candidatesPiSrcs.length === 0) {
              return callback(null, _.uniq(campusDriveListArrayWithGd))
            } else {
              campusDriveWithCandidateSource = JSON.parse(JSON.stringify(campusDriveWithCandidateSource).replace(/\"id":/g, '"candidate_source_id":'))
              let candidateSourceWithDirectPi = _.intersectionBy(campusDriveWithCandidateSource, candidatesPiSrcs, func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID)
              let candidateSourceIdsWithDirectPi = _.uniq(func.getValuesArrayFromJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, candidateSourceWithDirectPi))
              campusDriveListArrayWithGd = campusDriveListArrayWithGd.concat(candidateSourceIdsWithDirectPi)
              return callback(null, _.uniq(campusDriveListArrayWithGd))
            }
          }
        })
      } else {
        var campusDriveListArrayWithoutGd = campusDriveListArray.filter(function(obj) {
          return campusDriveListArrayWithGd.indexOf(obj) == -1
        })
        return callback(null, _.uniq(campusDriveListArrayWithGd))
      }
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveArrayOverCampusDriveId()', func.logCons.LOG_EXIT)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByCampusDriveID()', func.logCons.LOG_EXIT)
}

function getGroupDetailListWithCampusDriveID(candidateSourceDetails, type, roundType, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupDetailListWithoutCampusDriveID()', func.logCons.LOG_ENTER)
  let campusDriveListArray = func.getValuesArrayFromJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, candidateSourceDetails)
  if (type == 2) {
    var collectionName = func.dbCons.COLLECTION_GD_GROUP_DETAILS
    findByCampusDriveIDList(collectionName, roundType, orgNameMap, candidateSourceDetails, function(error, responseJson) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'findByCampusDriveID dbOperation = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByCampusDriveID()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, responseJson)
      } else if (!responseJson || responseJson.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByCampusDriveID()', func.logCons.LOG_EXIT)
        return callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByCampusDriveID()', func.logCons.LOG_EXIT)
        return callback(null, responseJson)
      }
    })
  } else if (type == 3) {
    var collectionName = func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS
    findByCandidateSourceID(collectionName, roundType, orgNameMap, campusDriveListArray, function(error, responseJson) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'findByCandidateSourceID dbOperation = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByCandidateSourceID()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, responseJson)
      } else if (!responseJson || responseJson.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByCandidateSourceID()', func.logCons.LOG_EXIT)
        return callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByCandidateSourceID()', func.logCons.LOG_EXIT)
        return callback(null, responseJson)
      }
    })
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupDetailListWithoutCampusDriveID()', func.logCons.LOG_EXIT)
}

function getGroupDetailListWithoutCampusDriveID(candidateSourceDetails, type, roundType, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupDetailListWithoutCampusDriveID()', func.logCons.LOG_ENTER)
  let campusDriveListArray = func.getValuesArrayFromJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, candidateSourceDetails)
  if (type == 2) {
    var collectionName = func.dbCons.COLLECTION_GD_GROUP_DETAILS
    findByCampusDriveID(collectionName, roundType, orgNameMap, candidateSourceDetails, function(error, responseJson) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'findByCampusDriveID dbOperation = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByCampusDriveID()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, responseJson)
      } else if (!responseJson || responseJson.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByCampusDriveID()', func.logCons.LOG_EXIT)
        return callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByCampusDriveID()', func.logCons.LOG_EXIT)
        return callback(null, responseJson)
      }
    })
  } else if (type == 3) {
    var collectionName = func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS
    findByCandidateSourceID(collectionName, roundType, orgNameMap, campusDriveListArray, function(error, responseJson) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'findByCandidateSourceID dbOperation = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByCandidateSourceID()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, responseJson)
      } else if (!responseJson || responseJson.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByCandidateSourceID()', func.logCons.LOG_EXIT)
        return callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByCandidateSourceID()', func.logCons.LOG_EXIT)
        return callback(null, responseJson)
      }
    })
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupDetailListWithoutCampusDriveID()', func.logCons.LOG_EXIT)
}

function findByCampusDriveID(collectionName, roundType, orgNameMap, candidateSourceDetails, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByCampusDriveID()', func.logCons.LOG_ENTER)
  var query = []
  let campusDriveListArray = func.getValuesArrayFromJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, candidateSourceDetails)
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CAMPUS_DRIVE_ID, func.lightBlueCons.OP_IN, campusDriveListArray))
  if (roundType !== func.dbCons.VALUE_ROUND_TYPE_ON_CAMPUS) {
    query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROUND_TYPE, func.lightBlueCons.OP_NOT_EQUAL, getEnumForRoundType(roundType)))
  }
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID, true, true))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, collectionName, projection, function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching campus_drive_id array detail = ' + campusDriveListArray + ' from gd_group_details collection ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetched campus_drive_id which exist in gd_group_details collection ' + JSON.stringify(response))
      let campusDriveListArrayWithGd = func.getValuesArrayFromJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, response)
      if (roundType !== func.dbCons.VALUE_ROUND_TYPE_ON_CAMPUS) {
        let campusDriveWithCandidateSource = _.xorBy(response, candidateSourceDetails, func.dbCons.FIELD_CAMPUS_DRIVE_ID)
        getCandidateSrcfromPIAssessmentOfOnCampus(func.getValuesArrayFromJson(func.dbCons.FIELD_ID, campusDriveWithCandidateSource), orgNameMap, function(error, candidatesPiSrcs) {
          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCandidateSrcfromPIAssessmentOfOnCampus = ' + JSON.stringify(error))
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSrcfromPIAssessmentOfOnCampus()', func.logCons.LOG_EXIT)
            return callback(new Error().stack, candidatesPiSrcs)
          } else {
            if (candidatesPiSrcs.length === 0) {
              return callback(null, _.uniq(campusDriveListArrayWithGd))
            } else {
              campusDriveWithCandidateSource = JSON.parse(JSON.stringify(campusDriveWithCandidateSource).replace(/\"id":/g, '"candidate_source_id":'))
              let candidateSourceWithDirectPi = _.intersectionBy(campusDriveWithCandidateSource, candidatesPiSrcs, func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID)
              let candidateSourceIdsWithDirectPi = _.uniq(func.getValuesArrayFromJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, candidateSourceWithDirectPi))
              campusDriveListArrayWithGd = campusDriveListArrayWithGd.concat(candidateSourceIdsWithDirectPi)
              return callback(null, _.uniq(campusDriveListArrayWithGd))
            }
          }
        })
      } else {
        var campusDriveListArrayWithoutGd = campusDriveListArray.filter(function(obj) {
          return campusDriveListArrayWithGd.indexOf(obj) == -1
        })
        return callback(null, campusDriveListArrayWithoutGd)
      }
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveArrayOverCampusDriveId()', func.logCons.LOG_EXIT)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByCampusDriveID()', func.logCons.LOG_EXIT)
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

function findByCandidateSourceID(collectionName, roundType, orgNameMap, campusDriveListArray, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByCandidateSourceID()', func.logCons.LOG_ENTER)
  getCampusIDArrayfromCampusIDs(collectionName, roundType, orgNameMap, campusDriveListArray, function(error, campusIDArrayfromCampusIDs) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCampusIDArrayfromCampusIDs = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusIDArrayfromCampusIDs()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, campusIDArrayfromCampusIDs)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByCandidateSourceID()', func.logCons.LOG_EXIT)
      return callback(null, campusIDArrayfromCampusIDs)
    }
  })
}

function getCampusIDArrayfromCampusIDs(collectionName, roundType, orgNameMap, campusDriveListArray, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusIDArrayfromCampusIDs()', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_CAMPUS_DRIVE_ID, func.lightBlueCons.OP_IN, campusDriveListArray)
  dbOp.findByQuery(query, orgNameMap, func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching campus_drive_id array detail = ' + campusDriveListArray + ' from gd_group_details collection ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetched campus_drive_id which exist in gd_group_details collection ' + response)
      getCampusDriveArrayOverCampusDriveId(func.dbCons.FIELD_ID, response, orgNameMap, function(error, candidateSourceArray) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCampusDriveArrayOverCampusDriveId = ' + JSON.stringify(error))
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveArrayOverCampusDriveId()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, candidateSourceArray)
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveArrayOverCampusDriveId()', func.logCons.LOG_EXIT)
          getCandidateSrcfromPIAssessment(candidateSourceArray, roundType, orgNameMap, collectionName, function(error, candidatesSrcs) {
            if (error) {
              func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCandidateSrcfromPIAssessment = ' + JSON.stringify(error))
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSrcfromPIAssessment()', func.logCons.LOG_EXIT)
              return callback(new Error().stack, candidatesSrcs)
            } else {
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSrcfromPIAssessment()', func.logCons.LOG_EXIT)
              getCampusIDfromCandidateSrc(candidatesSrcs, orgNameMap, function(error, campusIDs) {
                if (error) {
                  func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCampusIDfromCandidateSrc = ' + JSON.stringify(error))
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusIDfromCandidateSrc()', func.logCons.LOG_EXIT)
                  return callback(new Error().stack, campusIDs)
                } else {
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusIDfromCandidateSrc()', func.logCons.LOG_EXIT)
                  return callback(null, campusIDs)
                }
              })
            }
          })
        }
      })
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusIDArrayfromCampusIDs()', func.logCons.LOG_EXIT)
    }
  })
}

function getCandidateSrcfromPIAssessmentOfOnCampus(candidateSourceArray, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSrcfromPIAssessmentOfOnCampus()', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_IN, candidateSourceArray))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROUND_TYPE, func.lightBlueCons.OP_EQUAL, func.dbCons.ENUM_ROUND_TYPE_ON_CAMPUS))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_EQUAL, func.dbCons.ENUM_PI_ASSESSMENT_SELECTED_FOR_PI))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, true, true), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching candidate source array detail = ' + candidateSourceArray + ' from pi_assessment_details collection ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetched candidate_source_id which exist in pi_assessment_details collection ' + response)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSrcfromPIAssessmentOfOnCampus()', func.logCons.LOG_EXIT)
      return callback(null, response)
    }
  })
}

function getCandidateSrcfromPIAssessment(candidateSourceArray, roundType, orgNameMap, collectionName, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSrcfromPIAssessment()', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_IN, candidateSourceArray))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROUND_TYPE, func.lightBlueCons.OP_EQUAL, getEnumForRoundType(roundType)))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, collectionName, dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, true, true), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching candidate source array detail = ' + candidateSourceArray + ' from pi_assessment_details collection ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetched candidate_source_id which exist in pi_assessment_details collection ' + response)
      getCampusDriveArrayOverCampusDriveId('candidate_source_id', response, orgNameMap, function(error, candidateSrcArray) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCampusDriveArrayOverCampusDriveId = ' + JSON.stringify(error))
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveArrayOverCampusDriveId()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, response)
        } else {
          var candidateSrcArray = candidateSourceArray.filter(function(obj) {
            return candidateSrcArray.indexOf(obj) == -1
          })
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSrcfromPIAssessment()', func.logCons.LOG_EXIT)
          return callback(null, candidateSrcArray)
        }
      })
    }
  })
}

function getCampusIDfromCandidateSrc(candidateSrcArray, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusIDfromCandidateSrc()', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidateSrcArray)
  dbOp.findByQuery(query, orgNameMap, func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, true, true), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching candidate_source_id array detail = ' + candidateSrcArray + ' from pi_assessment_details collection ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetched candidate_source_id which exist in pi_assessment_details collection ' + response)
      getCampusDriveArrayOverCampusDriveId(func.dbCons.FIELD_CAMPUS_DRIVE_ID, response, orgNameMap, function(error, remainingCampusDriveIDS) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCampusDriveArrayOverCampusDriveId = ' + JSON.stringify(error))
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveArrayOverCampusDriveId()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, remainingCampusDriveIDS)
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusIDfromCandidateSrc()', func.logCons.LOG_EXIT)
          return callback(null, remainingCampusDriveIDS)
        }
      })
    }
  })
}

function getCampusDriveArrayOverCampusDriveId(id, campusDriveDetails, orgNameMap, callback) {
  var campusDriveIds = []
  async.eachOfSeries(campusDriveDetails, function(item, key, callbackInnerData) {
      campusDriveIds.push(item[id])
      callbackInnerData()
    },
    function(err) {
      if (err) {
        return []
      } else {
        callback(null, campusDriveIds)
      }
    })
}

function getInstituteListFromId(response, orgNameMap, callbackResponse) {
  var responseJson = []
  async.forEachOf(response, function(item, key, callbackinner) {
    getInstituteFromId(item, orgNameMap, function(error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error in async call for fetching particular institute name from instituteId = ' + JSON.stringify(error))
        callbackinner()
      } else if (!response || response.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'No institute found in async call= ')
        callbackinner()
      } else {
        item[func.dbCons.FIELD_INSTITUTE_NAME] = response[0][func.dbCons.FIELD_NAME]
        responseJson.push(item)
        callbackinner()
      }
    })
  }, function(error) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getInstituteFromId async call = ' + error)
      return callbackResponse(new Error().stack, responseJson)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetched all institute name from instituteID json', func.logCons.LOG_EXIT)
      callbackResponse(null, responseJson)
    }
  })
}

function getInstituteFromId(item, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteFromId', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, item[func.dbCons.FIELD_ASSIGNED_INSTITUTE_ID]))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_EQUAL, func.dbCons.ENUM_APPROVED))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_INSTITUTE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), getProjectionOverInstituteDetails(), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching institute details for institute_id ' + item[func.dbCons.FIELD_ASSIGNED_INSTITUTE_ID] + 'Error = ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no institute details found with institute id ' + item[func.dbCons.FIELD_ASSIGNED_INSTITUTE_ID] + ' and status as approved', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteFromId()', func.logCons.LOG_EXIT)
      callback(null, response)
    }
  })
}

function getProjectionOverCampusDriveDetails() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverCampusDriveDetails()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ASSIGNED_INSTITUTE_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_COURSES, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_STREAM, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_INVITE_YEAR, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_DESIGNATION, true, true))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverCampusDriveDetails()', func.logCons.LOG_EXIT)
  return projection
}

GdGroupDetailsHelpers.prototype.SendMailAssessorhelpers = function(orgNameMap, body, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'SendMailAssessorhelpers()', func.logCons.LOG_ENTER)
  var path = '/auth/assessor-login'
  var url = func.generateUrl(config[func.configCons.FIELD_PROTOCOL], config[func.configCons.FIELD_HOST], config[func.configCons.FIELD_PORT], env, orgNameMap, path)
  var email = body.email
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'send send to assessor')
  var mailBody = {}
  async.forEachOf(email, function(obj, index, callback) {
    mailBody['url'] = url
    mailBody['date'] = body.date
    mailBody['venue'] = body.venue
    if (body.accommodation != null) {
      mailBody['accommodation'] = body.accommodation
    } else {
      mailBody['accommodation'] = 'No'
    }
    if (body.pickup_drop != null) {
      mailBody['pickup_drop'] = body.pickup_drop
    } else {
      mailBody['pickup_drop'] = 'No'
    }
    if(body.food_habits!==null){
      mailBody['food_habits']=body.food_habits
    }
    mailBody['name'] = body.name[index]
    emailVerificationHelpers.sendMailTpo(obj, env, orgNameMap, mailBody, configJson[func.configCons.FIELD_INTIMATION_TO_ASSESSOR], func.msgCons.INTIMATION_FOR_CAMPUS_DRIVE, isResetPwd, function(err, resp) {
      if (err) {
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'mail sent successully')
        return callback(null, func.responseGenerator([], func.msgCons.CODE_UAM_SUCCESS, func.msgCons.MSG_UAM_MEMBER_INSERTED))
      }
    })
    mailBody = {}
  }, function(err) {
    if (err) return callback(new Error().stack)
    callback(null, 'Please try after some time')
  })
  callback(null, email)
}
exports.GdGroupDetailsHelpers = GdGroupDetailsHelpers
