var func = require('../utils/functions')
var HELPER_CONS = 'HS_LAGDH_'
var async = require('async')
var _ = require('lodash')

function LocationAndGroupDetailsHelpers () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of gd group details helper')
  DbOperation = require('./db-operations').DbOperation
  dbOp = new DbOperation()
}

LocationAndGroupDetailsHelpers.prototype.getGroupLocations = function (stage, userCode, orgNameMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'Fetching location with request param userCode as = ' + userCode, func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupLocations()', func.logCons.LOG_ENTER)
  getGroupLocationByAssessorId(stage, userCode, orgNameMap, function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getGroupLocations = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupLocations()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (response.length === 0 || !response) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupLocations()', func.logCons.LOG_EXIT)
      return callback(null, func.responseGenerator([], HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.NO_LOCATION_FOUND))
    } else {
      var responseJSON = {}
      responseJSON[func.msCons.FIELD_LOCATIONS] = response
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupLocations()', func.logCons.LOG_EXIT)
      return callback(null, func.responseGenerator(responseJSON, HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_LOCATION_FETCHED))
    }
  })
}

function getGroupLocationByAssessorId (stage, userCode, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupLocationByAssessorId', func.logCons.LOG_ENTER)
  var query = {}
  var elemMatchValue = dbOp.getQueryJsonForOp(func.dbCons.ASSESSOR_ID, func.lightBlueCons.OP_EQUAL, userCode)
  query[func.lightBlueCons.FIELD_ARRAY] = func.dbCons.FIELD_ACCESSOR_DETAILS
  query[func.lightBlueCons.FIELD_ELEM_MATCH] = elemMatchValue
  if (stage === func.dbCons.ENUM_SELECTED_FOR_GD) {
    fetchGdLocationDetails(query, userCode, orgNameMap, callback)
  } else if (stage === func.dbCons.ENUM_SELECTED_FOR_PI) {
    fetchPiLocationDetails(query, userCode, orgNameMap, callback)
  } else {
    callback(null, [])
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupLocationByAssessorId', func.logCons.LOG_EXIT)
}

function fetchGdLocationDetails (query, userCode, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchGdLocationDetails()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(query, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_GD_GROUP_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), getProjectionToGetGdLocation(), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while retrieving gd group detail for userCode ' + userCode + 'Error = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchGdLocationDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no gd group details found for assessor_id ' + userCode, func.logCons.LOG_EXIT)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchGdLocationDetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      var filterLocationArray = []
      var array3 = response.filter(function (obj) {
        if (filterLocationArray.indexOf(obj[func.dbCons.FIELD_GD_LOCATION]) === -1) {
          filterLocationArray.push(obj[func.dbCons.FIELD_GD_LOCATION])
        }
      })
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchGdLocationDetails()', func.logCons.LOG_EXIT)
      callback(null, filterLocationArray)
    }
  })
}

function fetchPiLocationDetails (query, userCode, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchPiLocationDetails()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(query, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), getProjectionToGetPiLocation(), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while retrieving pi assessment detail for userCode ' + userCode + 'Error = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchPiLocationDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no pi assessment details found for assessor_id ' + userCode, func.logCons.LOG_EXIT)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchPiLocationDetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      var filterLocationArray = []
      var array3 = response.filter(function (obj) {
        if (filterLocationArray.indexOf(obj[func.dbCons.FIELD_PI_LOCATION]) === -1) {
          filterLocationArray.push(obj[func.dbCons.FIELD_PI_LOCATION])
        }
      })
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchPiLocationDetails()', func.logCons.LOG_EXIT)
      callback(null, filterLocationArray)
    }
  })
}

function getProjectionToGetGdLocation () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionToGetGdLocation()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_GD_LOCATION, true, true))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionToGetGdLocation()', func.logCons.LOG_EXIT)
  return projection
}

function getProjectionToGetPiLocation () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionToGetPiLocation()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PI_LOCATION, true, true))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionToGetPiLocation()', func.logCons.LOG_EXIT)
  return projection
}

LocationAndGroupDetailsHelpers.prototype.getParticularLocationDetail = function (userCode, body, orgNameMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'Fetching location with request param userCode as = ' + userCode, func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParticularLocationDetail()', func.logCons.LOG_ENTER)
  var stage = body[func.dbCons.COLLECTION_JSON_STAGE]
  getGroupLocationByAssessorIdAndLocation(stage, userCode, body, orgNameMap, function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getParticularLocationDetail = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParticularLocationDetail()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (response.length === 0 || !response) {
      callback(null, func.responseGenerator([], HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.NO_DATA_FOUND_FOR_PARTICULAR_LOCATION))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParticularLocationDetail()', func.logCons.LOG_EXIT)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getParticularLocationDetail()', func.logCons.LOG_EXIT)
      return callback(null, func.responseGenerator(response, HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_LIST_OF_GD_UNIVERSITY_AND_GROUP_FETCHED))
    }
  })
}

function getGroupLocationByAssessorIdAndLocation (stage, userCode, body, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupLocationByAssessorIdAndLocation', func.logCons.LOG_ENTER)
  var query = []
  var queryForAssessorId = {}
  var location = []
  let queryJson = {}
  if (body[func.dbCons.FIELD_ROLE_NAME] !== func.dbCons.VALUE_ACCOUNT_ADMIN) {
    var elemMatchValue = dbOp.getQueryJsonForOp(func.dbCons.ASSESSOR_ID, func.lightBlueCons.OP_EQUAL, userCode)
    queryForAssessorId[func.lightBlueCons.FIELD_ARRAY] = func.dbCons.FIELD_ACCESSOR_DETAILS
    queryForAssessorId[func.lightBlueCons.FIELD_ELEM_MATCH] = elemMatchValue
    query.push(queryForAssessorId)
  }
  location.push(body[func.dbCons.COLLECTION_LOCATION])
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROUND_TYPE, func.lightBlueCons.OP_EQUAL, getEnumForRoundType(body[func.dbCons.FIELD_ROUND_TYPE])))
  if (body[func.dbCons.FIELD_ROUND_TYPE] === func.dbCons.VALUE_ROUND_TYPE_ON_CAMPUS){
    query.push(dbOp.getQueryJsonArrayForOp(func.dbCons.FIELD_UNIVERSITIES, func.lightBlueCons.OP_ALL, location))
  } else {
    query.push(dbOp.getQueryJsonForOp(func.dbCons.UNIVERSITY_GROUP_NAME, func.lightBlueCons.OP_EQUAL, body[func.dbCons.UNIVERSITY_GROUP_NAME]))
  }
  if (stage === func.dbCons.ENUM_SELECTED_FOR_GD) {
  //  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_NOT_EQUAL, func.dbCons.ENUM_STATUS_CANDIDATE_NOT_APPEARED_IN_GD))
    queryJson = dbOp.getOperationJson(func.lightBlueCons.OP_AND, query)
    fetchGdLocationDetailsFromGdLocation(stage, body, queryJson, userCode, orgNameMap, callback)
  } else if (stage === func.dbCons.ENUM_SELECTED_FOR_PI) {
    //query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_NOT_EQUAL, func.dbCons.ENUM_PI_ASSESSMENT_CANDIDATE_NOT_APPEARED))
    queryJson = dbOp.getOperationJson(func.lightBlueCons.OP_AND, query)
    fetchPiLocationDetailsFromPiLocation(stage, body, queryJson, userCode, orgNameMap, callback)
  } else {
    return callback(null, [])
  }
}

function getEnumForRoundType (value) {
  switch (value) {
    case func.dbCons.VALUE_ROUND_TYPE_ON_CAMPUS:
      return func.dbCons.ENUM_ROUND_TYPE_ON_CAMPUS
    case func.dbCons.VALUE_ROUND_TYPE_ON_SITE:
      return func.dbCons.ENUM_ROUND_TYPE_ON_SITE
    default:
      return -1
  }
}

function fetchGdLocationDetailsFromGdLocation (stage, body, query, userCode, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchGdLocationDetailsFromGdLocation()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(query, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_GD_GROUP_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), function (error, gdGroupDetailsData) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while retrieving gd group detail for userCode ' + userCode + 'Error = ' + JSON.stringify(error))
      return callback(new Error().stack, gdGroupDetailsData)
    } else if (!gdGroupDetailsData || gdGroupDetailsData.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no gd group details found for assessor_id ' + userCode + 'and location = ' + body[func.dbCons.COLLECTION_LOCATION], func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupLocationByAssessorIdAndLocation()', func.logCons.LOG_EXIT)
      callAsyncToGetCampusDriveDesignation(stage, gdGroupDetailsData, userCode, body, orgNameMap, function (error, campusDriveDesignationResponse) {
        if (error) {
          return callback(new Error().stack, error)
        } else {
          return callback(null, campusDriveDesignationResponse)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchGdLocationDetailsFromGdLocation()', func.logCons.LOG_EXIT)
}

function fetchPiLocationDetailsFromPiLocation (stage, body, query, userCode, orgNameMap, cbPiLocationDetails) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchPiLocationDetailsFromPiLocation()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(query, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), function (error, piAssessmentDetailsData) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while retrieving pi detail for userCode ' + userCode + 'Error = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchPiLocationDetailsFromPiLocation()', func.logCons.LOG_EXIT)
      return cbPiLocationDetails(new Error().stack, error)
    } else if (!piAssessmentDetailsData || piAssessmentDetailsData.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no pi details found for assessor_id ' + userCode + 'and location = ' + body[func.dbCons.COLLECTION_LOCATION], func.logCons.LOG_EXIT)
      return cbPiLocationDetails(null, [])
    } else {
      getCandidateSourceDetailsFromCandidateSourceId(stage, piAssessmentDetailsData, body, userCode, orgNameMap, cbPiLocationDetails)
    }
  })
}

function callAsyncToGetCampusDriveDesignation (stage, response, userCode, body, orgNameMap, cbAsyncCampusDriveDesignation) {
  async.forEachOf(response, function (item, key, callbackinner) {
    getCampusDriveDesignationFromId(item[func.dbCons.FIELD_CAMPUS_DRIVE_ID], body, orgNameMap, function (error, responseCAmpusDrive) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error in async call for fetching particular institute name from instituteId = ' + JSON.stringify(error))
        callbackinner()
      } else if (!responseCAmpusDrive || responseCAmpusDrive.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'No designation found for campus_drive_id ' + item[func.dbCons.FIELD_CAMPUS_DRIVE_ID])
        callbackinner()
      } else {
        response[key][func.msCons.DESIGNATION] = responseCAmpusDrive
        callbackinner()
      }
    })
  }, function (error) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error in  async call to fetch designation = ' + JSON.stringify(error))
      return cbAsyncCampusDriveDesignation(new Error().stack, error)
    } else {
      var responseJson = createJson(stage, userCode, response)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Fetched all details for location = ' + body[func.dbCons.COLLECTION_LOCATION] + 'and user_code = ' + userCode, func.logCons.LOG_EXIT)
      return cbAsyncCampusDriveDesignation(null, responseJson)
    }
  })
}
function getCandidateSourceDetailsFromCandidateSourceId (stage, piAssessmentDetailsData, body, userCode, orgNameMap, cbCandidateSourceDetails) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceDetailsFromCandidateSourceId', func.logCons.LOG_ENTER)
  fetchCampusDriveDesignation(stage, piAssessmentDetailsData, body, userCode, orgNameMap, function (error, campusDriveDetailsResponse) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceDetailsFromCandidateSourceId', func.logCons.LOG_EXIT)
      return cbCandidateSourceDetails(new Error().stack, error)
    } else if (!campusDriveDetailsResponse || campusDriveDetailsResponse.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceDetailsFromCandidateSourceId', func.logCons.LOG_EXIT)
      return cbCandidateSourceDetails(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceDetailsFromCandidateSourceId', func.logCons.LOG_EXIT)
      return cbCandidateSourceDetails(null, campusDriveDetailsResponse)
    }
  })
}

function fetchCampusDriveDesignation (stage, piAssessmentDetailsData, body, userCode, orgNameMap, cbCampusDriveDesignation) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchCampusDriveDesignation', func.logCons.LOG_EXIT)
  const candidateSourceIdArray = getCandidateSourceIdArray(piAssessmentDetailsData)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, true, true))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidateSourceIdArray), orgNameMap, func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, projection, function (error, candidateSourceDetailsData) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching Gd Group details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchCampusDriveDesignation()', func.logCons.LOG_EXIT)
      return cbCampusDriveDesignation(new Error().stack, error)
    } else if (!candidateSourceDetailsData || candidateSourceDetailsData.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no Gd Group details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchCampusDriveDesignation()', func.logCons.LOG_EXIT)
      return cbCampusDriveDesignation(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchCampusDriveDesignation: ', candidateSourceDetailsData)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchCampusDriveDesignation()', func.logCons.LOG_EXIT)
      piAssessmentDetailsData = getPiAssessmentJson(piAssessmentDetailsData, candidateSourceDetailsData)
      callAsyncToGetCampusDriveDesignation(stage, piAssessmentDetailsData, userCode, body, orgNameMap, cbCampusDriveDesignation)
    }
  })
}

function getCandidateSourceIdArray (piAssessmentDetailsData) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIdArray()', func.logCons.LOG_EXIT)
  var candidateSourceIdArray = []
  var array = piAssessmentDetailsData.filter(function (obj) {
    if (candidateSourceIdArray.indexOf(obj[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]) === -1) {
      candidateSourceIdArray.push(obj[func.dbCons.FIELD_CANDIDATE_SOURCE_ID])
    }
    return (candidateSourceIdArray)
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIdArray()', func.logCons.LOG_EXIT)
  return (candidateSourceIdArray)
}

function getPiAssessmentJson (piAssessmentDetailsData, candidateSourceDetailsData) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPiAssessmentJson()', func.logCons.LOG_EXIT)
  var array = piAssessmentDetailsData.filter(function (obj) {
    var candidateId = (func.filterBasedOnValue(candidateSourceDetailsData, func.dbCons.FIELD_ID, obj[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]))
    if (candidateId.length > 0) {
      obj[func.dbCons.FIELD_CAMPUS_DRIVE_ID] = candidateId[0][func.dbCons.FIELD_CAMPUS_DRIVE_ID]
    }
    return piAssessmentDetailsData
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPiAssessmentJson()', func.logCons.LOG_EXIT)
  return piAssessmentDetailsData
}

function getCampusDriveDesignationFromId (campusDriveId, body, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDesignationFromId', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, campusDriveId))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.CAMPUS_DRIVE_DETAILS_INVITE_YEAR, func.lightBlueCons.OP_EQUAL, func.configCons.FIELD_CAMPUS_DRIVE_DETAILS_INVITE_YEAR_PREFIX + body[func.dbCons.CAMPUS_DRIVE_DETAILS_INVITE_YEAR]))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CAMPUS_DRIVE_DESIGNATION, func.lightBlueCons.OP_EQUAL, body[func.dbCons.FIELD_CAMPUS_DRIVE_DESIGNATION]))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getProjectionJson(func.dbCons.FIELD_DESIGNATION, true, true), function (error, designationResponse) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while retrieving campus_drive desgination for campus_drive_id' + campus_drive_id + 'Error = ' + JSON.stringify(error))
      return callback(new Error().stack, designationResponse)
    } else if (!designationResponse || designationResponse.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no designation found for campus drive id' + campusDriveId, func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDesignationFromId()', func.logCons.LOG_EXIT)
      return callback(null, designationResponse[0][func.dbCons.FIELD_DESIGNATION])
    }
  })
}

function createJson (stage, userCode, response) {
  var groupByDesignation = _(response)
    .groupBy(func.msCons.DESIGNATION)
    .map((candidate_details, designation) => ({
      designation,
      candidate_details
    }))
    .value()
  groupByDesignation = groupByDesignation.filter(function (objResponse, index) {
    if ((objResponse[func.dbCons.COLLECTION_DESIGNATION] === 'undefined') || (objResponse[func.dbCons.COLLECTION_DESIGNATION] === undefined)) {
      return
    } else {
      return generateFinalJson(stage, userCode, objResponse)
    }
  })
  return groupByDesignation
}

function generateFinalJson (stage, userCode, candidateDetails) {
  var arrayOfGroupId = []
  var particularDesignationGroupStatus = []
  var arrayOfCandidateId = []
  let candidatesStatus = candidateDetails[func.msCons.FIELD_CANDIDATE_DETAILS]
  if(stage === func.dbCons.ENUM_SELECTED_FOR_GD){
    candidateDetails[func.msCons.FIELD_CANDIDATE_DETAILS] = _.reject(candidateDetails[func.msCons.FIELD_CANDIDATE_DETAILS],{ 'status': func.dbCons.ENUM_STATUS_CANDIDATE_NOT_APPEARED_IN_GD})
  }
  else{
    candidateDetails[func.msCons.FIELD_CANDIDATE_DETAILS] = _.reject(candidateDetails[func.msCons.FIELD_CANDIDATE_DETAILS],{ 'status': func.dbCons.ENUM_PI_ASSESSMENT_CANDIDATE_NOT_APPEARED})
  }
  candidateDetails[func.msCons.FIELD_CANDIDATE_DETAILS].filter(function (obj) {
    if (stage === func.dbCons.ENUM_SELECTED_FOR_GD) {
      arrayOfGroupId.push(obj[func.dbCons.FIELD_GD_GROUP_DETAILS_ID])
    } else {
      arrayOfGroupId.push(obj[func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID])
      arrayOfCandidateId.push(obj[func.dbCons.FIELD_CANDIDATE_ID])
    }
    candidateDetails[func.dbCons.FIELD_UNIVERSITIES] = obj[func.dbCons.FIELD_UNIVERSITIES]
    if (obj[func.dbCons.FIELD_GD_STATUS] !== undefined) {
      particularDesignationGroupStatus.push(obj[func.dbCons.FIELD_GD_STATUS])
    }
    obj[func.dbCons.FIELD_ACCESSOR_DETAILS].filter(function (objAssessorDetails) {
      if (objAssessorDetails[func.dbCons.ASSESSOR_ID] === userCode) {
        candidateDetails[func.msCons.FIELD_IS_CHIEF_ASSESSOR] = objAssessorDetails[func.msCons.FIELD_IS_CHIEF_ASSESSOR]
        candidateDetails[func.dbCons.ASSESSOR_ID] = objAssessorDetails[func.dbCons.ASSESSOR_ID]
      }
    })
  })
  var length = 0
  particularDesignationGroupStatus.filter(function (obj) {
    if (obj === func.dbCons.ENUM_STATUS_GROUP_CREATED) {
      length++
    }
  })
  if (stage === func.dbCons.ENUM_SELECTED_FOR_GD) {
    candidateDetails[func.msCons.GROUPS] = _.uniq(arrayOfGroupId)
    candidateDetails[func.msCons.FIELD_NO_OF_GROUPS] = candidateDetails[func.msCons.GROUPS].length
    candidateDetails[func.dbCons.FIELD_GD_STATUS] = (_.every(candidatesStatus, [func.dbCons.FIELD_STATUS, func.dbCons.ENUM_STATUS_GROUP_CREATED]))
  } else {
    candidateDetails[func.msCons.CANDIDATES_ID_LIST] = _.uniq(arrayOfCandidateId)
    candidateDetails[func.dbCons.FIELD_PI_ASSESSMENT_DETAILS_ID_ARRAY] = _.uniq(arrayOfGroupId)
    candidateDetails[func.msCons.FIELD_NUMBER_OF_CANDIDATES] = candidateDetails[func.msCons.CANDIDATES_ID_LIST].length
    candidateDetails[func.dbCons.FIELD_GD_STATUS] = (_.every(candidatesStatus, [func.dbCons.FIELD_STATUS, func.dbCons.ENUM_PI_ASSESSMENT_CREATED]))
  }
  return candidateDetails
}

exports.LocationAndGroupDetailsHelpers = LocationAndGroupDetailsHelpers
