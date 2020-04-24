var func = require('../utils/functions')
var fs = require('fs')
var DbOperation = require('./db-operations').DbOperation
var dbOp = new DbOperation()
var async = require('async')
var globalArray = []
var globalJson = {}

function ShortlistedCampusDriveListHelper () {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'obj created of shortlisted campus details helper')
}
ShortlistedCampusDriveListHelper.prototype.shortlistedCampusDriveListDetails = function (body, stage_Id, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'shortlistedCampusDriveListDetails() request json is ' + body, func.logCons.LOG_ENTER)
  var finalJSON = []
  getStageWiseDetails(stage_Id, urlMap, function (error, stageWiseDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching candidate source id = ' + JSON.stringify(error) + 'for gd: ' + stage_Id)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'shortlistedCampusDriveListDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, stageWiseDetails)
    } else if (!stageWiseDetails || stageWiseDetails.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'shortlistedCampusDriveListDetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'shortlistedCampusDriveListDetails()', func.logCons.LOG_EXIT)
      getCandidateSourceIDArray(stageWiseDetails, function (error, idArray) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while generating candidate source id array = ' + JSON.stringify(error))
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIDArray()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, idArray)
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIDArray()', func.logCons.LOG_EXIT)
          getCampusDriveDetails(body, stage_Id, idArray, urlMap, callback)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'shortlistedCampusDriveListDetails()', func.logCons.LOG_EXIT)
}

function getCampusDriveDetails (body, stage_Id, idArray, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCampusDriveDetails()', func.logCons.LOG_ENTER)
  getCampusDriveId(idArray, urlMap, function (error, campusAndCandidateSourceDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching candidate details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveId()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, campusAndCandidateSourceDetails)
    } else if (!campusAndCandidateSourceDetails || campusAndCandidateSourceDetails.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveId()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      var IdArray = generateIdArray(campusAndCandidateSourceDetails, func.dbCons.FIELD_ID)
      getFlagForGDPI(body, stage_Id, IdArray, campusAndCandidateSourceDetails, urlMap, callback)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCampusDriveDetails()', func.logCons.LOG_EXIT)
}

function getFlagForGDPI (body, stage_Id, IdArray, campusAndCandidateSourceDetails, urlMap, callback) {
  var collectionName = ''
  if (stage_Id == 2 || stage_Id == 5) { collectionName = func.dbCons.COLLECTION_GD_GROUP_DETAILS } else if (stage_Id == 3 || stage_Id == 6) {
    collectionName = func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS
  }
  getGdFlag(body[func.dbCons.FIELD_ROUND_TYPE], IdArray, campusAndCandidateSourceDetails, collectionName, urlMap, function (error, responseGdDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching GD/PI status = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGdFlag()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, responseGdDetails)
    } else if (!responseGdDetails || responseGdDetails.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGdFlag()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGdFlag()', func.logCons.LOG_EXIT)
      getcampusdetails(body[func.dbCons.CAMPUS_DRIVE_DETAILS_INVITE_YEAR], responseGdDetails, urlMap, callback)
    }
  })
}

function getCandidateSourceIDArray (candidateSourceIDS, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateSourceIDArray()', func.logCons.LOG_ENTER)
  var idArray = []
  async.forEachOf(candidateSourceIDS, function (item, key, callbackinner) {
    if (idArray.indexOf(item[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]) === -1) {
      idArray.push(item[func.dbCons.FIELD_CANDIDATE_SOURCE_ID])
    }
    callbackinner()
  }, function (error) {
    if (error) {
      return callback(new Error().stack, [])
    } else {
      return callback(null, idArray)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateSourceIDArray()', func.logCons.LOG_EXIT)
}

function getStageWiseDetails (stage_Id, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getStageWiseDetails()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.COLLECTION_JSON_STAGE, func.lightBlueCons.OP_EQUAL, stage_Id), urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, true, true), function (error, candidateResults) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching candidate source id = ' + JSON.stringify(error) + 'for gd: ' + stage_Id)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'shortlistedCampusDriveListDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, candidateResults)
    } else if (!candidateResults || candidateResults.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'shortlistedCampusDriveListDetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      callback(null, candidateResults)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getStageWiseDetails()', func.logCons.LOG_EXIT)
}

function generateIdArray (originalJSON, fieldName) {
  var idArray = []
  var array = originalJSON.filter(function (obj) {
    idArray.push(obj[fieldName])
    return idArray
  })
  return idArray
}

function getCampusDriveId (responseJSON, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCampusDriveId()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, true, true))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ENTITY_DETAILS_ID, func.lightBlueCons.OP_IN, responseJSON), urlMap, func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, projection, function (error, candidateSoureResults) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching campus drive id = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveId()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, candidateSoureResults)
    } else if (!candidateSoureResults || candidateSoureResults.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveId()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_INFO, JSON.stringify(candidateSoureResults), func.logCons.LOG_EXIT)
      return callback(null, candidateSoureResults)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCampusDriveId()', func.logCons.LOG_EXIT)
}

function getProjectionForCampusDriveDetails () {
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_INSTITUTE_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_DESIGNATION, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_STREAM, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_COURSE, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_INVITE_YEAR, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  return projection
}

function getcampusdetails (campusDriveYear, campusDriveDetails, urlMap, callback) {
  var campusDriveIdArray = generateIdArray(campusDriveDetails, func.dbCons.FIELD_CAMPUS_DRIVE_ID)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.CAMPUS_DRIVE_DETAILS_ID, func.lightBlueCons.OP_IN, campusDriveIdArray), urlMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, getProjectionForCampusDriveDetails(), function (error, campusResults) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching campus details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getcampusdetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, campusResults)
    } else if (!campusResults || campusResults.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getcampusdetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_INFO, JSON.stringify(campusResults), func.logCons.LOG_EXIT)
      var instituteIDArray = generateIdArray(campusResults, func.dbCons.FIELD_INSTITUTE_ID)
      getInstitueName(instituteIDArray, urlMap, function (error, instituteNameArray) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching institute details = ' + JSON.stringify(error))
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstitueName()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, instituteNameArray)
        } else if (!instituteNameArray || instituteNameArray.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstitueName()', func.logCons.LOG_EXIT)
          return callback(null, [])
        } else {
          var JSON = generateFinalJSON(campusDriveYear, campusDriveDetails, instituteNameArray, campusResults)
          return callback(null, JSON)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getcampusdetails()', func.logCons.LOG_ENTER)
}

function generateFinalJSON (campusDriveYear, campusDriveDetails, instituteNameArray, campusResults) {
  var singleCampusData = {}
  var finalResponse = []
  var campusDriveYearValue = func.configCons.FIELD_CAMPUS_DRIVE_DETAILS_INVITE_YEAR_PREFIX + campusDriveYear
  var array = campusDriveDetails.filter(function (obj) {
    if ((campusDriveYear === undefined) || (func.filterBasedOnValue(campusResults, func.dbCons.FIELD_ID, obj[func.dbCons.FIELD_CAMPUS_DRIVE_ID]))[0][func.dbCons.FIELD_CAMPUS_INVITE_YEAR] === campusDriveYearValue) {
      singleCampusData[func.dbCons.FIELD_CAMPUS_DRIVE_ID] = obj[func.dbCons.FIELD_CAMPUS_DRIVE_ID]
      singleCampusData[func.dbCons.FIELD_CANDIDATE_SOURCE_ID] = obj[func.dbCons.FIELD_ID]
      singleCampusData[func.dbCons.CAMPUS_DRIVE_DETAILS_STREAM] = (func.filterBasedOnValue(campusResults, func.dbCons.FIELD_ID, obj[func.dbCons.FIELD_CAMPUS_DRIVE_ID]))[0][func.dbCons.FIELD_STREAM]
      singleCampusData[func.dbCons.CAMPUS_DRIVE_DETAILS_COURSE] = (func.filterBasedOnValue(campusResults, func.dbCons.FIELD_ID, obj[func.dbCons.FIELD_CAMPUS_DRIVE_ID]))[0][func.dbCons.FIELD_COURSE]
      singleCampusData[func.dbCons.FIELD_STATUS] = obj[func.dbCons.FIELD_STATUS]
      singleCampusData[func.dbCons.COLLECTION_DESIGNATION] = (func.filterBasedOnValue(campusResults, func.dbCons.FIELD_ID, obj[func.dbCons.FIELD_CAMPUS_DRIVE_ID]))[0][func.dbCons.FIELD_DESIGNATION]
      singleCampusData[func.dbCons.CAMPUS_DRIVE_DETAILS_INSTITUTE_ID] = (func.filterBasedOnValue(campusResults, func.dbCons.FIELD_ID, obj[func.dbCons.FIELD_CAMPUS_DRIVE_ID]))[0][func.dbCons.FIELD_INSTITUTE_ID]
      singleCampusData[func.dbCons.CAMPUS_DRIVE_DETAILS_INVITE_YEAR] = (func.filterBasedOnValue(campusResults, func.dbCons.FIELD_ID, obj[func.dbCons.FIELD_CAMPUS_DRIVE_ID]))[0][func.dbCons.FIELD_CAMPUS_INVITE_YEAR]
      finalResponse.push(singleCampusData)
    }
    singleCampusData = {}
    return (singleCampusData)
  })
  var array = finalResponse.filter(function (obj) {
    finalResponse[finalResponse.indexOf(obj)][func.dbCons.FIELD_NAME] = (func.filterBasedOnValue(instituteNameArray, func.dbCons.FIELD_ID, obj[func.dbCons.FIELD_INSTITUTE_ID]))[0][func.dbCons.FIELD_NAME]
    return singleCampusData
  })
  return finalResponse
}

function getInstitueName (responseJSON, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getInstitueName()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_NAME, true, true))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, responseJSON), urlMap, func.dbCons.COLLECTION_INSTITUTE_DETAILS, projection, function (error, instituteResults) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching institute details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstitueName()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, instituteResults)
    } else if (!instituteResults || instituteResults.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstitueName()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_INFO, JSON.stringify(instituteResults), func.logCons.LOG_EXIT)
      return callback(null, instituteResults)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getInstitueName()', func.logCons.LOG_EXIT)
}

function getGDDetails (roundType, responseJSON, collectionName, urlMap, callback) {
  var projection = dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, true, true)
  var queryArray = []
  queryArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_IN, responseJSON))
  queryArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROUND_TYPE, func.lightBlueCons.OP_EQUAL, roundType))
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getGDDetails()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, queryArray), urlMap, collectionName, projection, function (error, groupresult) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching group details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGDDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, groupresult)
    } else if (!groupresult || groupresult.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGDDetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_INFO, JSON.stringify(groupresult), func.logCons.LOG_EXIT)
      return callback(null, groupresult)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getGDDetails()', func.logCons.LOG_EXIT)
}

function getGdFlag (roundType, idArray, campusAndCandidateSourceDetails, collectionName, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getGdFlag()', func.logCons.LOG_ENTER)
  getGDDetails(roundType, idArray, collectionName, urlMap, function (error, responseGdDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching Gd status = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGdFlag()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, responseGdDetails)
    } else {
      async.forEachOf(campusAndCandidateSourceDetails, function (item, key, callbackinner) {
        if (responseGdDetails.length === 0) {
          item[func.dbCons.FIELD_STATUS] = 0
        } else {
          for (var i = 0; i < responseGdDetails.length; i++) {
            if (responseGdDetails[i][func.dbCons.FIELD_CANDIDATE_SOURCE_ID] === item[func.dbCons.FIELD_ID]) {
              item[func.dbCons.FIELD_STATUS] = 1
              break
            } else {
              item[func.dbCons.FIELD_STATUS] = 0
            }
          }
        }
        callbackinner()
      }, function (error) {
        if (error) {
          return callback(new Error().stack, [])
        } else {
          return callback(null, campusAndCandidateSourceDetails)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getGdFlag()', func.logCons.LOG_EXIT)
}

exports.ShortlistedCampusDriveListHelper = ShortlistedCampusDriveListHelper
