var func = require('../utils/functions');
var dbOp;
var fs = require('fs');
var async = require('async');
var _ = require('lodash');
var HELPER_CONS = 'HS_GCD_';


function GetCampusDetails() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of get campus details');
  DbOperation = require('./db-operations').DbOperation;
  dbOp = new DbOperation();
}

function deselectWithOutGDPI(urlMap, requestBodyFromPIDetailsList, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'deselectWithOutGDPI()', func.logCons.LOG_ENTER);
  var finalInstituteArray = []
  async.forEachOf(requestBodyFromPIDetailsList[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS], function(item, key, callback) {
      if (item[func.dbCons.FIELD_IS_GD] == 0 && item[func.dbCons.FIELD_IS_PI] == 0) {
        callback()
      } else {
        finalInstituteArray.push(item)
        callback()
      }
    },
    function(error) {
      if (error) {
        return callback(new Error().stack, requestBodyFromPIDetailsList)
      } else {
        var resJson = {};
        resJson[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS] = finalInstituteArray;
        var requestBodyFromPIDetailsListDetails = _(resJson[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS])
          .groupBy(func.dbCons.FIELD_NAME)
          .map((campus_drive_details, institute_name) => ({
            campus_drive_details,
            institute_name
          }))
          .value()
        callback(null, requestBodyFromPIDetailsListDetails)
      }
    });
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deselectWithOutGDPI()', func.logCons.LOG_EXIT)
}


function addUniversityNameInBody(urlMap, instituteName, requestBodyFromPIDetailsList, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addUniversityNameInBody()', func.logCons.LOG_ENTER);
  async.forEachOf(requestBodyFromPIDetailsList[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS], function(item, key, callback) {
    instituteId = item[func.dbCons.FIELD_INSTITUTE_ID]
    async.forEachOf(instituteName, function(items, keys, callbackinner) {
      if (items[func.dbCons.FIELD_ID] === instituteId) {
        item[func.dbCons.FIELD_NAME] = items[func.dbCons.FIELD_NAME]
      }
      callbackinner()
    }, function(error) {
      if (error) {
        return callback(new Error().stack, requestBodyFromPIDetailsList)
      } else {
        callback()
      }
    })
  }, function(error) {
    if (error) {
      return callback(new Error().stack, requestBodyFromPIDetailsList)
    } else {
      deselectWithOutGDPI(urlMap, requestBodyFromPIDetailsList, function(error, finalUniversitiesJsonFromCampusYR) {
        if (error) return callback(new Error().stack, finalUniversitiesJsonFromCampusYR)
        if (!finalUniversitiesJsonFromCampusYR || finalUniversitiesJsonFromCampusYR.length === 0) {
          finalUniversitiesJsonFromCampusYR = []
          callback(null, finalUniversitiesJsonFromCampusYR)
        } else {
          callback(null, finalUniversitiesJsonFromCampusYR)
        }
      })
    }
  });
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addUniversityNameInBody()', func.logCons.LOG_EXIT)
}

function getInstituteDetailsFromDB(urlMap, requestBodyFromPIDetailsList, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteDetailsFromDB()', func.logCons.LOG_ENTER)
  var arrayOfInstituteIds = func.getValuesArrayFromJson(func.dbCons.FIELD_INSTITUTE_ID, requestBodyFromPIDetailsList[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS])
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FILED_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_NAME))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FILED_ID, func.lightBlueCons.OP_IN, arrayOfInstituteIds), urlMap, func.dbCons.COLLECTION_INSTITUTE_DETAILS, projection, function(error, instituteName) {
    if (error) return callback(new Error().stack, instituteName)
    if (!instituteName || instituteName.length === 0) {
      instituteName = []
      callback(null, instituteName)
    } else {
      addUniversityNameInBody(urlMap, instituteName, requestBodyFromPIDetailsList, function(error, finalJSONInstituteDetails) {
        if (error) return callback(new Error().stack, finalJSONInstituteDetails)
        if (!finalJSONInstituteDetails || finalJSONInstituteDetails.length === 0) {
          finalJSONInstituteDetails = []
          callback(null, finalJSONInstituteDetails)
        } else {
          callback(null, finalJSONInstituteDetails)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteDetailsFromDB()', func.logCons.LOG_EXIT)
};

function addPIAssesmentDeatilsInBody(urlMap, piAssessmentDetailsIds, requestBodyFromPI, newCandidateSourceIds, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addPIAssesmentDeatilsInBody()', func.logCons.LOG_ENTER);
  async.forEachOf(requestBodyFromPI[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS], function(item, key, callback) {
    candidateSourceId = item[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]
    async.forEachOf(piAssessmentDetailsIds, function(items, keys, callbackinner) {
      if (piAssessmentDetailsIds[keys][func.dbCons.FIELD_CANDIDATE_SOURCE_ID] === candidateSourceId) {
        // item[func.dbCons.FIELD_IS_GD] = func.dbCons.FIELD_IS_GD_VALUE_TRUE
        item[func.dbCons.FIELD_IS_PI] = func.dbCons.FIELD_IS_PI_VALUE_TRUE
      }
      callbackinner()
    }, function(error) {
      if (error) {
        return callback(new Error().stack, requestBodyFromPI)
      } else {
        callback()
      }
    })
  }, function(error) {
    if (error) {
      return callback(new Error().stack, requestBodyFromPI)
    } else {
      getInstituteDetailsFromDB(urlMap, requestBodyFromPI, function(error, institueDetails) {
        if (error) {
          return callback(new Error().stack, institueDetails)
        } else {
          callback(null, institueDetails)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addPIAssesmentDeatilsInBody()', func.logCons.LOG_EXIT)
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

function checkCandidateSourceIdFromPIAssesmentDetails(urlMap, reqData, newCandidateSourceIds, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkCandidateSourceIdFromPIAssesmentDetails()', func.logCons.LOG_ENTER)
  var arrayOfCandidateSourceIds = func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, reqData[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS])
  var projection = []
  var query1 = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID))
  query1.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROUND_TYPE, func.lightBlueCons.OP_EQUAL, getEnumForRoundType(reqData[func.dbCons.FIELD_ROUND_TYPE])))
  query1.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_IN, arrayOfCandidateSourceIds))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query1), urlMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), projection, function(error, piAssessmentDetailsIds) {

    //  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_IN, arrayOfCandidateSourceIds), urlMap, func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, projection, function(error, piAssessmentDetailsIds) {
    if (error) return callback(new Error().stack, piAssessmentDetailsIds)
    // if (!piAssessmentDetailsIds || piAssessmentDetailsIds.length === 0) {
    //   callback(null, reqData)
    // } else {
    addPIAssesmentDeatilsInBody(urlMap, piAssessmentDetailsIds, reqData, newCandidateSourceIds, function(error, finalJSONFromPIDetails) {
      if (error) return callback(new Error().stack, finalJSONFromPIDetails)
      if (!finalJSONFromPIDetails || finalJSONFromPIDetails.length === 0) {
        finalJSONFromPIDetails = []
        callback(null, finalJSONFromPIDetails)
      } else {
        callback(null, finalJSONFromPIDetails)
      }
    })
    //  }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkCandidateSourceIdFromPIAssesmentDetails()', func.logCons.LOG_EXIT)
};

function ifGdNotExits(urlMap, requestBody, newCandidateSourceIds, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'ifGdNotExits()', func.logCons.LOG_ENTER);
  async.forEachOf(requestBody[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS], function(item, key, callback) {
      if (!item[func.dbCons.FIELD_IS_GD]) {
        item[func.dbCons.FIELD_IS_GD] = func.dbCons.FIELD_IS_GD_VALUE_FALSE
        item[func.dbCons.FIELD_IS_PI] = func.dbCons.FIELD_IS_PI_VALUE_FALSE
        callback()
      } else {
        callback()
      }
    },
    function(error) {
      if (error) {
        return callback(new Error().stack, requestBody)
      } else {
        checkCandidateSourceIdFromPIAssesmentDetails(urlMap, requestBody, newCandidateSourceIds, function(error, finalDetailsJson) {
          if (error) {
            return callback(new Error().stack, finalDetailsJson)
          } else {
            callback(null, finalDetailsJson)
          }
        })
      }
    });
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'ifGdNotExits()', func.logCons.LOG_EXIT)
}

function addGdGroupIdInBody(urlMap, gdGroupDetailsIds, requestBody, newCandidateSourceIds, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addGdGroupIdInBody()', func.logCons.LOG_ENTER);
  async.forEachOf(requestBody[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS], function(item, key, callback) {
    candidateSourceId = item[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]
    async.forEachOf(gdGroupDetailsIds, function(items, keys, callbackinner) {
      if (items[func.dbCons.FIELD_CANDIDATE_SOURCE_ID] === candidateSourceId) {
        item[func.dbCons.FIELD_IS_GD] = func.dbCons.FIELD_IS_GD_VALUE_TRUE
        item[func.dbCons.FIELD_IS_PI] = func.dbCons.FIELD_IS_PI_VALUE_FALSE
      }
      callbackinner()
    }, function(error) {
      if (error) {
        return callback(new Error().stack, requestBody)
      } else {
        callback()
      }
    })
  }, function(error) {
    if (error) {
      return callback(new Error().stack, requestBody)
    } else {
      ifGdNotExits(urlMap, requestBody, newCandidateSourceIds, function(error, gdFlag) {
        if (error) {
          return callback(new Error().stack, gdFlag)
        } else {
          callback(null, gdFlag)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addGdGroupIdInBody()', func.logCons.LOG_EXIT);
}

function checkCandidateSourceIdFromGDDetails (urlMap, body, userCode, roleType, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIdFromCandidateDetails()', func.logCons.LOG_ENTER)
  var arrayOfCandidateSourceIds = func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, body[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS])
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.GD_GROUP_DETAILS_ID))
  //dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_IN, arrayOfCandidateSourceIds), urlMap, func.dbCons.COLLECTION_GD_GROUP_DETAILS, projection, function(error, gdGroupDetailsIds) {
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROUND_TYPE, func.lightBlueCons.OP_EQUAL, getEnumForRoundType(body[func.dbCons.FIELD_ROUND_TYPE])))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_IN, arrayOfCandidateSourceIds))
  if ((roleType !== func.dbCons.VALUE_ACCOUNT_ADMIN)) {
    var arrayMatchQuery = {};
    var elemMatchValue = dbOp.getQueryJsonForOp(func.dbCons.ASSESSOR_ID, func.lightBlueCons.OP_EQUAL, userCode)
    arrayMatchQuery[func.lightBlueCons.FIELD_ARRAY] = func.dbCons.FIELD_ACCESSOR_DETAILS
    arrayMatchQuery[func.lightBlueCons.FIELD_ELEM_MATCH] = elemMatchValue
    query.push(arrayMatchQuery)
  }
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_GD_GROUP_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), projection, function(error, gdGroupDetailsIds) {

    if (error) return callback(new Error().stack, gdGroupDetailsIds)
    // if (!gdGroupDetailsIds || gdGroupDetailsIds.length === 0) {
    //   gdGroupDetailsIds = []
    //   callback(null, gdGroupDetailsIds)
    // } else {
      var newCandidateSourceIds = _.difference(arrayOfCandidateSourceIds, func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, gdGroupDetailsIds));
      addGdGroupIdInBody(urlMap, gdGroupDetailsIds, body, newCandidateSourceIds, function(error, finalJSONFromGDDetails) {
        if (error) return callback(new Error().stack, finalJSON)
        if (!finalJSONFromGDDetails || finalJSONFromGDDetails.length === 0) {
          finalJSONFromGDDetails = []
          callback(null, finalJSONFromGDDetails)
        } else {
          callback(null, finalJSONFromGDDetails)
        }
      })
    // }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkCandidateSourceIdFromGDDetails()', func.logCons.LOG_EXIT)
};


function addCandidateSourceID(urlMap, fetchAllCandidateSourceIds, reqBody, userCode, roleType, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addCandidateSourceID()', func.logCons.LOG_ENTER);
  async.forEachOf(reqBody[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS], function(item, key, callback) {
    campusDriveId = item[func.dbCons.FIELD_CAMPUS_DRIVE_ID]
    async.forEachOf(fetchAllCandidateSourceIds, function(items, keys, callbackinner) {
      if (fetchAllCandidateSourceIds[keys][func.dbCons.FIELD_CAMPUS_DRIVE_ID] === campusDriveId) {
        item[func.dbCons.FIELD_CANDIDATE_SOURCE_ID] = items[func.dbCons.FIELD_ID]
      }
      callbackinner()
    }, function(error) {
      if (error) {
        return callback(new Error().stack, reqBody)
      } else {
        callback()
      }
    })
  }, function(error) {
    if (error) {
      return callback(new Error().stack, reqBody)
    } else {
      checkCandidateSourceIdFromGDDetails(urlMap, reqBody, userCode, roleType, function(error, finalDetailsJson) {
        if (error) {
          return callback(new Error().stack, finalDetailsJson)
        } else {
          callback(null, finalDetailsJson)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addCandidateSourceID()', func.logCons.LOG_EXIT);
}

GetCampusDetails.prototype.getCampusListFromYr = function (req, urlMap, userCode, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCampusListFromYr()', func.logCons.LOG_ENTER);
  var arrayOfCampusDriveIds = func.getValuesArrayFromJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, req[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS])
  var projection = [];
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID));
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID));
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CAMPUS_DRIVE_ID, func.lightBlueCons.OP_IN, arrayOfCampusDriveIds), urlMap, func.dbCons.COLLECTION_CAMPUS_SOURCE_DETAILS, projection, function(error, fetchAllCandidateSourceIds) {
    if (error) return callback(new Error().stack, fetchAllCandidateSourceIds);
    if (!fetchAllCandidateSourceIds || fetchAllCandidateSourceIds.length === 0) {
      fetchAllCandidateSourceIds = []
      callback(null, fetchAllCandidateSourceIds);
    } else {
      let roleType = req[func.dbCons.FIELD_ROLE_NAME]
      addCandidateSourceID(urlMap, fetchAllCandidateSourceIds, req, userCode, roleType, function(error, addCandidateSourceIDs) {
        if (error) return callback(new Error().stack, personData);
        if (!addCandidateSourceIDs || addCandidateSourceIDs.length === 0) {
          var addCandidateSourceIDs = []
          callback(null, addCandidateSourceIDs);
        } else {
          callback(null, addCandidateSourceIDs);
        }
      });
    }
  });
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCampusListFromYr()', func.logCons.LOG_EXIT);
};
exports.GetCampusDetails = GetCampusDetails
