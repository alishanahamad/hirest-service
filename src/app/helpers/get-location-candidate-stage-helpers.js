/**
 * [func description]
 * @type {[type]}
 */
var func = require('../utils/functions')
var async = require('async')
var DbOperation = require('./db-operations').DbOperation
var dbOp = new DbOperation()

function GetLocationCandidateStageHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of GetLocationCandidateStageHelpers')
}

function jsonToArray(myJson, callback) {
  var myArr = []
  async.forEachOf(myJson, function(value, key, callbackinner) {
    myArr.push(value.id)
    callbackinner()
  })
  callback(null, myArr)
}

function jsonObjectToArray(myJson, callback) {
  var myArr = []
  async.forEachOf(myJson, function(value, key, callbackinner) {
    myArr.push(value.pi_location)
  })
  callback(null, myArr)
}

GetLocationCandidateStageHelpers.prototype.getLocation = function(urlMap, designation, status, round_type, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getLocation()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'designation = ' + designation + ', status =' + status + ',round_type = ' + round_type)
  getCampusDriveIdsArray(urlMap, designation, function(error, driveIds) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'after getCampusDriveIdsArray()', func.logCons.LOG_ENTER)
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error from getCampusDriveIdsArray= ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'after getCampusDriveIdsArray()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, error)
    } else if (!driveIds || driveIds.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no specific drive Ids')
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'after getCampusDriveIdsArray()', func.logCons.LOG_EXIT)
      callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'after success of getCampusDriveIdsArray()', func.logCons.LOG_ENTER)
      getCandidateSourceIds(urlMap, driveIds, function(error, candidateSourceIds) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error from getCandidateSourceIds= ' + JSON.stringify(error))
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'after getCandidateSourceIds()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, error)
        } else if (!candidateSourceIds || candidateSourceIds.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'no specific candidate source Ids')
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'after getCandidateSourceIds()', func.logCons.LOG_EXIT)
          callback(null, [])
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'after success of getCandidateSourceIds()', func.logCons.LOG_ENTER)
          getPILocation(urlMap, candidateSourceIds, status, round_type, callback)
        }
      })
    }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'after getCampusDriveIdsArray()', func.logCons.LOG_ENTER)
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getLocation()', func.logCons.LOG_EXIT)
}

function getUniqueIdentity(piLocation, orgValue, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUniqueIdentity()', func.logCons.LOG_ENTER)
  var uniqueFlag = false;
  piLocation.map((page) => {
    if (page[func.dbCons.FIELD_PI_LOCATION] === orgValue) {
      uniqueFlag = true;
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUniqueIdentity()', func.logCons.LOG_EXIT)
  callback(uniqueFlag)
}

/*
 * DB Calling function to get PI Locations
 */
function getPILocation(urlMap, candidateSourceIds, status, round_type, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPILocation()', func.logCons.LOG_ENTER)
  var piLocation = []
  async.forEachOf(candidateSourceIds, function(value, key, callbackinner) {
    dbOperationToGetPILocation(urlMap, value, status, round_type, function(error, result) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error from dbOperationToGetPILocation= ' + JSON.stringify(error))
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'after dbOperationToGetPILocation()', func.logCons.LOG_EXIT)
        callbackinner()
      } else if (!result || result.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no specific location')
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'after dbOperationToGetPILocation()', func.logCons.LOG_EXIT)
        callbackinner()
      } else {
        var myJSON = {}
        jsonObjectToArray(result, function(error, res) {
          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'inside while converting jsonObjectToArray= ' + JSON.stringify(error))
            callbackinner()
          } else {
            func.printLog(func.logCons.LOG_LEVEL_INFO, 'jsonObjectToArray converted and data is=' + res)
            var res2 = [...new Set(res)]
            var myJSON = {}
            myJSON[func.dbCons.FIELD_PI_LOCATION] = res2[0]
            getUniqueIdentity(piLocation, res2[0], function(uniqueFlag) {
              if (!uniqueFlag) {
                piLocation.push(myJSON)
              }
            });
            callbackinner()
          }
        })
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'after dbOperationToGetPILocation()', func.logCons.LOG_EXIT)
      }
    })
  }, function(error) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'inside error while fetching pi locations= ' + JSON.stringify(error))
      return callback(new Error().stack, error)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'jsonObjectToArray() completed', func.logCons.LOG_EXIT)
      callback(null, piLocation)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPILocation()', func.logCons.LOG_EXIT)
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

/*
 * DB function to get PI Locations
 */
function dbOperationToGetPILocation(urlMap, id, status, round_type, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetPILocation()', func.logCons.LOG_EXIT)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PI_LOCATION, true, true))
  var statuses = []
  statuses.push(parseInt(status))
  statuses.push(func.dbCons.ENUM_PI_ASSESSMENT_SELECTED_FOR_PI)
  statuses.push(func.dbCons.ENUM_PI_ASSESSMENT_SELECTED_BY_HR)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_EQUAL, id))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROUND_TYPE, func.lightBlueCons.OP_EQUAL, getEnumForRoundType(round_type)))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_IN, statuses))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, projection, function(error, location) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'inside error while fetching pi locations= ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetPILocation()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, error)
    } else if (!location || location.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'no specific source id')
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside null dbOperationToGetPILocation()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetPILocation()', func.logCons.LOG_EXIT)
      return callback(null, location)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetPILocation()', func.logCons.LOG_EXIT)
}

/*
 * DB calling function to get candidate source ids
 */
function getCandidateSourceIds(urlMap, driveIds, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIds()', func.logCons.LOG_ENTER)
  dbOperationToGetCandidateSourceIds(urlMap, driveIds, function(error, idsArray) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'dbOperationToGetCandidateSourceIds dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToGetCandidateSourceIds()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, error)
    } else if (!idsArray || idsArray.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToGetCandidateSourceIds()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToGetCandidateSourceIds()', func.logCons.LOG_EXIT)
      jsonToArray(idsArray, function(error, ids) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while converting json to array = ' + error)
          return callback(new Error().stack, error)
        } else {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'successfully converted json to array = ' + ids)
          callback(null, ids)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIds()', func.logCons.LOG_EXIT)
}
/*
 * DB function to get candidate source ids
 */
function dbOperationToGetCandidateSourceIds(urlMap, driveIds, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetCandidateSourceIds()', func.logCons.LOG_EXIT)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.CAMPUS_SOURCE_DETAILS_CAMPUS_ID, func.lightBlueCons.OP_IN, driveIds), urlMap, func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, projection, function(error, candidateID) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'inside error while fetching campus drive ids= ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetCandidateSourceIds()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, error)
    } else if (!candidateID || candidateID.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'no specific source id')
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside null dbOperationToGetCandidateSourceIds()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetCandidateSourceIds()', func.logCons.LOG_EXIT)
      return callback(null, candidateID)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetSpecificRoleUsers()', func.logCons.LOG_EXIT)
}

/*
 * DB calling function to get campus drive ids
 */
function getCampusDriveIdsArray(urlMap, designation, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdsArray()', func.logCons.LOG_ENTER)
  dbOperationToGetCampusDriveIds(urlMap, designation, function(error, idsArray) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'dbOperationToGetCampusDriveIds dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToGetCampusDriveIds()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, error)
    } else if (!idsArray || idsArray.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToGetCampusDriveIds()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToGetCampusDriveIds()', func.logCons.LOG_EXIT)
      jsonToArray(idsArray, function(error, ids) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while converting json to array = ' + error)
          return callback(new Error().stack, error)
        } else {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'successfully converted json to array = ' + ids)
          callback(null, ids)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdsArray()', func.logCons.LOG_EXIT)
}
/*
 * DB function to get campus drive ids
 */
function dbOperationToGetCampusDriveIds(urlMap, designation, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetCampusDriveIds()', func.logCons.LOG_EXIT)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.CAMPUS_DRIVE_DETAILS_ID, true, true))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_DESIGNATION, func.lightBlueCons.OP_EQUAL, designation), urlMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, projection, function(error, driveID) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'inside error while fetching campus drive ids= ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetCampusDriveIds()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, error)
    } else if (!driveID || driveID.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'no specific drive id')
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside null dbOperationToGetCampusDriveIds()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetCampusDriveIds()', func.logCons.LOG_EXIT)
      return callback(null, driveID)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetSpecificRoleUsers()', func.logCons.LOG_EXIT)
}

exports.GetLocationCandidateStageHelpers = GetLocationCandidateStageHelpers
