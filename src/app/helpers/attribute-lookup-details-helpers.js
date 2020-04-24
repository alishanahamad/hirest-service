/**
 * The <code>attribute-lookup-details-helpers.js </code> use to retrieve lookup details for given attribute data
 *
 * @author Kavish Kapadia
 */

var func = require('../utils/functions')
var async = require('async')
var DbOperation = require('./db-operations').DbOperation
var dbOp = new DbOperation()

/**
 * [ExamReportDetailsHelpers is a constructor to create required objects]
 * @constructor
 */
function AttributeLookupDetailsHelpers () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'exam-report-details-helpers obj created')
}
AttributeLookupDetailsHelpers.prototype.getParentChildAttribute = function(value, orgNameMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getParentChildAttribute()', func.logCons.LOG_ENTER)
  fetchParentId(value, orgNameMap, function (error, parentIdResponse) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'fetchParentId = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchParentId()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, parentIdResponse)
    } else if (parentIdResponse.length === 0 || !parentIdResponse) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchParentId()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      fetchParentName(parentIdResponse, orgNameMap, function (error, lookupResponse) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'fetchParentName = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchParentName()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, response)
        } else if (lookupResponse.length === 0 || !lookupResponse) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchParentName()', func.logCons.LOG_EXIT)
          return callback(null, [])
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchParentName()', func.logCons.LOG_EXIT)
          callback(null, lookupResponse)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParentChildAttribute()', func.logCons.LOG_EXIT)
}
AttributeLookupDetailsHelpers.prototype.getAttributeDetails = function (attributeType, orgNameMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAttributeDetails', func.logCons.LOG_ENTER)
  getAttributeDetailsByType(attributeType, orgNameMap, function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getAttributeDetails = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAttributeDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (response.length === 0 || !response) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAttributeDetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAttributeDetails()', func.logCons.LOG_EXIT)
      callback(null, response)
    }
  })
}
AttributeLookupDetailsHelpers.prototype.getParentAttributeDetails = function (attributeIds, orgNameMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParentAttributeDetails', func.logCons.LOG_ENTER)
  if (attributeIds.length === 0) {
    return callback(null, [])
  } else {
    getParentDetails(attributeIds, orgNameMap, function (error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getParentAttributeDetails = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParentAttributeDetails()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, response)
      } else if (response.length === 0 || !response) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParentAttributeDetails()', func.logCons.LOG_EXIT)
        return callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParentAttributeDetails()', func.logCons.LOG_EXIT)
        callback(null, response)
      }
    })
  }
}
AttributeLookupDetailsHelpers.prototype.getParentAttributeDetailsByID = function (attributeIds, orgNameMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParentAttributeDetailsByID', func.logCons.LOG_ENTER)
  if (attributeIds.length === 0) {
    return callback(null, [])
  } else {
    getParentDetailsByID(attributeIds, orgNameMap, function (error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getParentAttributeDetailsByID = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParentAttributeDetailsByID()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, response)
      } else if (response.length === 0 || !response) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParentAttributeDetailsByID()', func.logCons.LOG_EXIT)
        return callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParentAttributeDetailsByID()', func.logCons.LOG_EXIT)
        callback(null, response)
      }
    })
  }
}
AttributeLookupDetailsHelpers.prototype.getInstituteListFromDesignation = function (designation, orgNameMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteListFromDesignation', func.logCons.LOG_ENTER)
  getInstituteList(designation, orgNameMap, function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getInstituteListFromDesignation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteListFromDesignation()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (response.length === 0 || !response) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteListFromDesignation()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteListFromDesignation()', func.logCons.LOG_EXIT)
      callback(null, response)
    }
  })
}
function fetchParentId (lookupValue, orgNameMap, callbackResponse) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchParentId()', func.logCons.LOG_ENTER)
  let projection=[]
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PARENT_ATTRIBUTE_ID, true, true))
  let query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ATTRIBUTE_VALUE, func.lightBlueCons.OP_EQUAL, lookupValue, true, true))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, func.dbCons.COLLECTION_LOOKUP_DETAILS, projection, function(error, lookupResponse) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'fetchParentId dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchParentId()', func.logCons.LOG_ENTER)
      return callbackResponse(new Error().stack, lookupResponse)
    } else if (!lookupResponse || lookupResponse.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchParentId()', func.logCons.LOG_ENTER)
      return callbackResponse(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchParentId()', func.logCons.LOG_ENTER)
      callbackResponse(null, lookupResponse)
    }
  })
}
function fetchParentName (lookupValue, orgNameMap, callbackResponse) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchParentDetails()', func.logCons.LOG_ENTER)
  let projection=[]
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ATTRIBUTE_VALUE, true, true))
  let query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_LOOKUP_DETAILS_ID, func.lightBlueCons.OP_EQUAL, lookupValue[0][func.dbCons.FIELD_PARENT_ATTRIBUTE_ID], true, true))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, func.dbCons.COLLECTION_LOOKUP_DETAILS, projection, function(error, lookupResponse) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'fetchParentName dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchParentName()', func.logCons.LOG_ENTER)
      return callbackResponse(new Error().stack, lookupResponse)
    } else if (!lookupResponse || lookupResponse.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchParentName()', func.logCons.LOG_ENTER)
      return callbackResponse(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchParentName()', func.logCons.LOG_ENTER)
      callbackResponse(null, lookupResponse)
    }
  })
}
function getParentDetailsByID (attributeIds, orgNameMap, callbackResponse) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParentDetailsByID', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_LOOKUP_DETAILS_ID, func.lightBlueCons.OP_IN, attributeIds))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_EQUAL, func.dbCons.FIELD_STATUS_ACTIVE))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_LOOKUP_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), getProjectionOverLookupDetails(), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getParentDetailsByID dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParentDetailsByID()', func.logCons.LOG_EXIT)
      return callbackResponse(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParentDetailsByID()', func.logCons.LOG_EXIT)
      return callbackResponse(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParentDetails()', func.logCons.LOG_EXIT)
      callbackResponse(null, response)
    }
  })
}
function getAttributeDetailsByType (attributeType, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAttributeDetailsByType', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ATTRIBUTE_TYPE, func.lightBlueCons.OP_EQUAL, attributeType))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_EQUAL, func.dbCons.FIELD_STATUS_ACTIVE))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_LOOKUP_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), getProjectionOverLookupDetails(), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getAttributeDetailsByType dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAttributeDetailsByType()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAttributeDetailsByType()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAttributeDetailsByType()', func.logCons.LOG_EXIT)
      callback(null, response)
    }
  })
}
function getReturnJson(response) {
  let data = {}
  let errors = []
  return {
    data: (response === undefined || response.length == 0) ? data : response,
    errors: errors,
    message: (response === undefined || response.length == 0) ? func.msgCons.LOOKUP_DETAIL_FOUND : func.msgCons.LOOKUP_DETAILS_NOT_FOUND
  }
}
function getParentDetails (attributeIds, orgNameMap, callbackResponse) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParentDetails', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_PARENT_ATTRIBUTE_ID, func.lightBlueCons.OP_IN, attributeIds))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_EQUAL, func.dbCons.FIELD_STATUS_ACTIVE))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_LOOKUP_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), getProjectionOverLookupDetails(), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getParentDetails dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParentDetails()', func.logCons.LOG_EXIT)
      return callbackResponse(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParentDetails()', func.logCons.LOG_EXIT)
      return callbackResponse(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParentDetails()', func.logCons.LOG_EXIT)
      callbackResponse(null, response)
    }
  })
}
function getProjectionOverLookupDetails () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverLookupDetails()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ATTRIBUTE_TYPE, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ATTRIBUTE_VALUE, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PARENT_ATTRIBUTE_ID, true, true))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverLookupDetails()', func.logCons.LOG_EXIT)
  return projection
}
function getInstituteList (designation, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteList', func.logCons.LOG_ENTER)
  var query = []
  var query1 = []
  var queryJson = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_DESIGNATION, func.lightBlueCons.OP_EQUAL, designation))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_EQUAL, func.dbCons.ENUM_CAMPUS_DRIVE_CLOSED))
  query1.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_EQUAL, func.dbCons.ENUM_DEACTIVATED))
  query1.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_DESIGNATION, func.lightBlueCons.OP_EQUAL, designation))
  let a = dbOp.getOperationJson(func.lightBlueCons.OP_AND, query)
  let b = dbOp.getOperationJson(func.lightBlueCons.OP_AND, query1)
  queryJson.push(a)
  queryJson.push(b)
  let finalQuery = dbOp.getOperationJson(func.lightBlueCons.OP_OR, queryJson)
  dbOp.findByQuery(finalQuery, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), getProjectionOverCampusDriveDetails(), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getInstituteList dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteList()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteList()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      getInstituteListFromId(response, orgNameMap, function (error, responseJson) {
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
}
function getInstituteListFromId (response, orgNameMap, callbackResponse) {
  var responseJson = []
  async.forEachOf(response, function (item, key, callbackinner) {
    getInstituteFromId(item, orgNameMap, function (error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getInstituteFromId async call = ' + error)
        callbackinner()
      } else if (!response || response.length === 0) {
		func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getInstituteFromId async call = ' + error)
        callbackinner()
	  } else {
        item[func.dbCons.FIELD_INSTITUTE_NAME] = response[0][func.dbCons.FIELD_NAME]
        responseJson.push(item)
        callbackinner()
      }
    })
  }, function (error) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getInstituteFromId async call = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteFromId()', func.logCons.LOG_EXIT)
      return callbackResponse(new Error().stack, responseJson)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteFromId()', func.logCons.LOG_EXIT)
      callbackResponse(null, responseJson)
    }
  })
}
function getInstituteFromId (item, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteFromId', func.logCons.LOG_ENTER)
  var query = []
  var query1 = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, item[func.dbCons.FIELD_ASSIGNED_INSTITUTE_ID]))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_EQUAL, func.dbCons.ENUM_APPROVED))
  let q = dbOp.getOperationJson(func.lightBlueCons.OP_AND, query)
  dbOp.findByQuery(q, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_INSTITUTE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), getProjectionOverInstituteDetails(), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getInstituteFromId dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteFromId()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteFromId()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteFromId()', func.logCons.LOG_EXIT)
      callback(null, response)
    }
  })
}
function getProjectionOverCampusDriveDetails () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverCampusDriveDetails()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ASSIGNED_INSTITUTE_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_COURSES, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_STREAM, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_INVITE_YEAR, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_DESIGNATION, true, true))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverCampusDriveDetails()', func.logCons.LOG_EXIT)
  return projection
}
function getProjectionOverInstituteDetails () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverInstituteDetails()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_NAME, true, true))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverInstituteDetails()', func.logCons.LOG_EXIT)
  return projection
}
exports.AttributeLookupDetailsHelpers = AttributeLookupDetailsHelpers
