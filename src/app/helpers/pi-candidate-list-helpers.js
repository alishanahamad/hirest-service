var func = require('../utils/functions')
var Client = require('node-rest-client').Client
var client = new Client()
var async = require('async')
var _ = require('lodash')
const ROUTER_CONS = 'HS_PCL_'
var dbOp
GetAssessmentDetailsHelpers = require('./assessment-details-helpers').GetAssessmentDetailsHelpers
getAssessmentDetailsHelpers = new GetAssessmentDetailsHelpers()
var fs = require('fs')
var choiceWtMaping = JSON.parse(fs.readFileSync('./json_files/choice-mapping-pi-gd.json'))
var HELPER_CONS = 'HS_PCLH_'

function GetCandidateDetailsForPI() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of get PI details helper')
  DbOperation = require('./db-operations').DbOperation
  dbOp = new DbOperation()
}

function getEnumPIAssessmentType(value) {
  switch (value) {
    case func.msCons.FIELD_FIRST_ROUND_FOR_PI:
      return func.dbCons.ENUM_FIRST_ROUND_FOR_PI
    case func.msCons.FIELD_FINAL_ROUND_FOR_PI:
      return func.dbCons.ENUM_FINAL_ROUND_FOR_PI
    default:
      return -1
  }
}

function getCandidateDetailsFeedBacKJSON (userCode, piAssesentIds, piAssessementType, roleName) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateDetailsFeedBacKJSON()', func.logCons.LOG_ENTER)
  var andArray = []
  andArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID, func.lightBlueCons.OP_IN, piAssesentIds))
  andArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_PI_ASSESSMENT_TYPE, func.lightBlueCons.OP_EQUAL, getEnumPIAssessmentType(piAssessementType)))
  if ((roleName !== func.dbCons.VALUE_ACCOUNT_ADMIN)) {
    andArray.push(dbOp.getQueryJsonForOp(func.dbCons.ASSESSOR_ID, func.lightBlueCons.OP_EQUAL, userCode))
  }
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateDetailsFeedBacKJSON()', func.logCons.LOG_EXIT)
  return andArray
}

function updateParamValues(paramValues) {
  var updatedParams = func.cloneJsonObject(paramValues)

  for (let paramValue of updatedParams) {
    var defaultResponse = {}
    defaultResponse[func.msCons.FIELD_SELECTED_VALUE] = ''
    defaultResponse[func.msCons.FIELD_WEIGHTAGE] = 0
    defaultResponse[func.dbCons.FIELD_ASSESSMENT_PARAM_URL] = paramValue[func.dbCons.FIELD_ASSESSMENT_PARAM_URL]
    paramValue[func.msCons.RESPONSE_GIVEN] = defaultResponse
  }
  return updatedParams
}

function getExamScoreDetailsJSON(userCode, gdGroupDetails, roundType) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getExamScoreDetailsJSON()', func.logCons.LOG_ENTER)
  var arrayOfCandidateIds = func.getValuesArrayFromJson(func.dbCons.FIELD_GD_GROUP_DETAILS_ID, gdGroupDetails)
  var andArray = []
  andArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_GD_GROUP_DETAILS_ID, func.lightBlueCons.OP_IN, arrayOfCandidateIds))
  andArray.push(dbOp.getQueryJsonForOp(func.dbCons.ASSESSOR_ID, func.lightBlueCons.OP_EQUAL, userCode))
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getExamScoreDetailsJSON()', func.logCons.LOG_EXIT)
  return andArray
}

function addDraftJsonDetails(piAssessmentDetailsIDs, assessmentDetaisID, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addDraftJsonDetails()', func.logCons.LOG_ENTER)
  var draftJsonResponse = []
  async.forEachOf(piAssessmentDetailsIDs, function(items, keys, callback) {
      if (items[func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID] === assessmentDetaisID && items[func.dbCons.FIELD_DRAFT_FEEDBACK_JSON] && items[func.dbCons.FIELD_DRAFT_FEEDBACK_JSON] != '') {
        var item = JSON.parse(items[func.dbCons.FIELD_DRAFT_FEEDBACK_JSON])
        draftJsonResponse.push(item)
        callback()
      } else {
        callback()
      }
    },
    function(error) {
      if (error) {
        return callback(new Error().stack, draftJsonResponse)
      } else {
        callback(null, draftJsonResponse)
      }
    })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addDraftJsonDetails()', func.logCons.LOG_EXIT)
}

function finalJsonFromUserDetails(urlMap, userCode, userDetails, responseJsonArray, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'finalJsonFromUserDetails()', func.logCons.LOG_ENTER)
  async.forEachOf(responseJsonArray, function(items, keys, callbackinner) {
      items[func.msCons.FIELD_ASSESSOR_NAME] = userDetails[0].profile_data.name
      callbackinner()
    },
    function(error) {
      if (error) {
        return callback(new Error().stack, responseJsonArray)
      } else {
        callback(null, responseJsonArray)
      }
    })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'finalJsonFromUserDetails()', func.logCons.LOG_EXIT)
}

function getUserNameFromUserDetails(urlMap, userCode, responseJsonArray, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getUserNameFromUserDetails()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, userCode), urlMap, func.dbCons.FIELD_USER_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, userDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getUserNameFromUserDetails = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserNameFromUserDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, userDetails)
    }
    if (!userDetails || userDetails.length === 0) {
      callback(null, responseJsonArray)
    } else {
      finalJsonFromUserDetails(urlMap, userCode, userDetails, responseJsonArray, function(error, finalJSON) {
        if (error) return callback(new Error().stack, responseJsonArray)
        if (!finalJSON || finalJSON.length === 0) {
          callback(null, responseJsonArray)
        } else {
          callback(null, finalJSON)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getUserNameFromUserDetails()', func.logCons.LOG_EXIT)
}

function finalJsonFromInstituteDetails(urlMap, userCode, instituteDetails, responseJsonArray, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'finalJsonFromInstituteDetails()', func.logCons.LOG_ENTER)
  async.forEachOf(responseJsonArray, function(item, key, callback) {
    instituteIdResponseJsonArray = item[func.dbCons.FIELD_INSTITUTE_ID]
    async.forEachOf(instituteDetails, function(items, keys, callbackinner) {
        if (instituteDetails[keys][func.dbCons.FIELD_ID] === instituteIdResponseJsonArray) {
          item[func.dbCons.FIELD_UNIVERSITY_NAME] = items[func.dbCons.FIELD_NAME] != '' ? items[func.dbCons.FIELD_NAME] : ''
        }
        callbackinner()
      },
      function(error) {
        if (error) {
          return callback(new Error().stack, responseJsonArray)
        } else {
          callback()
        }
      })
  }, function(error) {
    if (error) {
      return callback(new Error().stack, responseJsonArray)
    } else {
      getUserNameFromUserDetails(urlMap, userCode, responseJsonArray, function(error, userName) {
        if (error) return callback(new Error().stack, userName)
        if (!userName || userName.length === 0) {
          callback(null, responseJsonArray)
        } else {
          callback(null, userName)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'finalJsonFromInstituteDetails()', func.logCons.LOG_EXIT)
}

function getInstituteNameFromDB(urlMap, userCode, responseJsonArray, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getInstituteNameFromDB()', func.logCons.LOG_ENTER)
  var instituteDetailsIDArray = func.getValuesArrayFromJson(func.dbCons.FIELD_INSTITUTE_ID, responseJsonArray)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_NAME))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, instituteDetailsIDArray), urlMap, func.dbCons.COLLECTION_INSTITUTE_DETAILS, projection, function(error, instituteName) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getInstituteNameFromDB = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteNameFromDB()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, instituteName)
    }
    if (!instituteName || instituteName.length === 0) {
      callback(null, responseJsonArray)
    } else {
      finalJsonFromInstituteDetails(urlMap, userCode, instituteName, responseJsonArray, function(error, finalInstituteDetailsJSON) {
        if (error) return callback(new Error().stack, finalInstituteDetailsJSON)
        if (!finalInstituteDetailsJSON || finalInstituteDetailsJSON.length === 0) {
          callback(null, finalInstituteDetailsJSON)
        } else {
          callback(null, finalInstituteDetailsJSON)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getInstituteNameFromDB()', func.logCons.LOG_EXIT)
}

function finalJsonFromCampusDriveDetails(urlMap, userCode, instituteDetails, responseJsonArray, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'finalJsonFromCampusDriveDetails()', func.logCons.LOG_ENTER)
  async.forEachOf(responseJsonArray, function(item, key, callback) {
    campusIdFromResponseJsonArray = item[func.dbCons.FIELD_CAMPUS_DRIVE_ID]
    async.forEachOf(instituteDetails, function(items, keys, callbackinner) {
        if (instituteDetails[keys][func.dbCons.FIELD_ID] === campusIdFromResponseJsonArray) {
          item[func.dbCons.FIELD_INSTITUTE_ID] = items[func.dbCons.FIELD_INSTITUTE_ID] != '' ? items[func.dbCons.FIELD_INSTITUTE_ID] : ''
        }
        callbackinner()
      },
      function(error) {
        if (error) {
          return callback(new Error().stack, responseJsonArray)
        } else {
          callback()
        }
      })
  }, function(error) {
    if (error) {
      return callback(new Error().stack, responseJsonArray)
    } else {
      getInstituteNameFromDB(urlMap, userCode, responseJsonArray, function(error, instituteDetailsJSON) {
        if (error) return callback(new Error().stack, instituteDetailsJSON)
        if (!instituteDetailsJSON || instituteDetailsJSON.length === 0) {
          callback(null, responseJsonArray)
        } else {
          callback(null, instituteDetailsJSON)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'finalJsonFromCampusDriveDetails()', func.logCons.LOG_EXIT)
}

function getInstituteDetailsFromDB(urlMap, userCode, responseJsonArray, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getInstituteDetailsFromDB()', func.logCons.LOG_ENTER)
  var campusDriveDetailsIDArray = func.getValuesArrayFromJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, responseJsonArray)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_INSTITUTE_ID))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, campusDriveDetailsIDArray), urlMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, projection, function(error, instituteDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getFeedBackJsonFromPiAssessmentDetails = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getFeedBackJsonFromPiAssessmentDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, instituteDetails)
    }
    if (!instituteDetails || instituteDetails.length === 0) {
      callback(null, instituteDetails)
    } else {
      finalJsonFromCampusDriveDetails(urlMap, userCode, instituteDetails, responseJsonArray, function(error, campusDriveIdJSON) {
        if (error) return callback(new Error().stack, campusDriveIdJSON)
        else {
          callback(null, campusDriveIdJSON)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getInstituteDetailsFromDB()', func.logCons.LOG_EXIT)
}

function finalJsonFromCandidateSourceDetails(urlMap, userCode, campusDriveDetails, responseJsonArray, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'finalJsonFromCandidateSourceDetails()', func.logCons.LOG_ENTER)
  async.forEachOf(responseJsonArray, function(item, key, callback) {
    candidateIdFromResponseJsonArray = item[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]
    async.forEachOf(campusDriveDetails, function(items, keys, callbackinner) {
        if (campusDriveDetails[keys][func.dbCons.FIELD_ID] === candidateIdFromResponseJsonArray) {
          item[func.dbCons.FIELD_CAMPUS_DRIVE_ID] = items[func.dbCons.FIELD_CAMPUS_DRIVE_ID] != '' ? items[func.dbCons.FIELD_CAMPUS_DRIVE_ID] : ''
        }
        callbackinner()
      },
      function(error) {
        if (error) {
          return callback(new Error().stack, responseJsonArray)
        } else {
          callback()
        }
      })
  }, function(error) {
    if (error) {
      return callback(new Error().stack, responseJsonArray)
    } else {
      getInstituteDetailsFromDB(urlMap, userCode, responseJsonArray, function(error, instituteDetailsJSON) {
        if (error) return callback(new Error().stack, instituteDetailsJSON)
        if (!instituteDetailsJSON || instituteDetailsJSON.length === 0) {
          callback(null, responseJsonArray)
        } else {
          callback(null, instituteDetailsJSON)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'finalJsonFromCandidateSourceDetails()', func.logCons.LOG_EXIT)
}

function findCampusDriveIdsFromDB(urlMap, userCode, responseJsonArray, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'findCampusDriveIdsFromDB()', func.logCons.LOG_ENTER)
  var candidateSourceIdsArray = func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, responseJsonArray)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidateSourceIdsArray), urlMap, func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, projection, function(error, campusDriveDetailsID) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'findCampusDriveIdsFromDB = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findCampusDriveIdsFromDB()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, campusDriveDetailsID)
    }
    if (!campusDriveDetailsID || campusDriveDetailsID.length === 0) {
      callback(null, campusDriveDetailsID)
    } else {
      // callback(null, campusDriveDetailsID)
      finalJsonFromCandidateSourceDetails(urlMap, userCode, campusDriveDetailsID, responseJsonArray, function(error, instituteJSON) {
        if (error) return callback(new Error().stack, instituteJSON)
        else {
          callback(null, instituteJSON)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'findCampusDriveIdsFromDB()', func.logCons.LOG_EXIT)
}

function finalFeedBackJson(urlMap, userCode, piAssessmentDetailsIDs, piAssessmentDetails, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'finalFeedBackJson()', func.logCons.LOG_ENTER)
  var piAssessmentDetailIdAndDraftJson = func.cloneJsonObject(piAssessmentDetails)
  var responseJsonArray = []
  async.forEachOf(piAssessmentDetailIdAndDraftJson, function(item, key, callback) {
      var assessmentDetaisID = item[func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID]
      addDraftJsonDetails(piAssessmentDetailsIDs, assessmentDetaisID, function(error, changedResponseJsonArray) {
        if (changedResponseJsonArray.length > 0) {
          responseJsonArray.push(changedResponseJsonArray[0])
        } else {
          responseJsonArray.push(item)
        }
        callback()
      })
    },
    function(error) {
      if (error) {
        return callback(new Error().stack, responseJsonArray)
      } else {
        findCampusDriveIdsFromDB(urlMap, userCode, responseJsonArray, function(error, campusDriveIds) {
          if (error) return callback(new Error().stack, campusDriveIds)
          if (!campusDriveIds || campusDriveIds.length === 0) {
            callback(null, responseJsonArray)
          } else {
            callback(null, campusDriveIds)
          }
        })
      }
    })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'finalFeedBackJson()', func.logCons.LOG_EXIT)
}

function alreadyExitsDraftJSON(urlMap, userCode, piAssessmentDetails, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'alreadyExitsDraftJSON()', func.logCons.LOG_ENTER)
  var piAssessmentDetailsIdsArray = func.getValuesArrayFromJson(func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID, piAssessmentDetails)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_DRAFT_FEEDBACK_JSON))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID, func.lightBlueCons.OP_IN, piAssessmentDetailsIdsArray), urlMap, func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, projection, function(error, piAssessmentDetailsIDs) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'alreadyExitsDraftJSON = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'alreadyExitsDraftJSON()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, piAssessmentDetails)
    }
    if (!piAssessmentDetailsIDs || piAssessmentDetailsIDs.length === 0) {
      callback(null, piAssessmentDetails)
    } else {
      finalFeedBackJson(urlMap, userCode, piAssessmentDetailsIDs, piAssessmentDetails, function(error, draftJSON) {
        if (error) return callback(new Error().stack, draftJSON)
        else {
          callback(null, draftJSON)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'alreadyExitsDraftJSON()', func.logCons.LOG_EXIT)
}

function finalExamScoreJson(isScoreDetailsBlank, urlMap, userCode, scoreDetails, piAssessmentDetails, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'finalExamScoreJson()', func.logCons.LOG_ENTER)
  async.forEachOf(piAssessmentDetails, function(item, key, callback) {
      let piCandidateId = item[func.dbCons.FIELD_CANDIDATE_ID]
      var mailAddress = item[func.dbCons.FIELD_EMAIL_ADDRESS]
      async.forEachOf(scoreDetails, function(items, keys, callbackinner) {
          if (isScoreDetailsBlank) {
            if (scoreDetails[keys][func.dbCons.FIELD_EMAIL_ADDRESS] === mailAddress) {
              item[func.msCons.FIELD_DIRECT_PI] = true
              var json = {}
              json[func.dbCons.COLLECTION_EXAM_SCORE_DETAILS] = items[func.dbCons.FIELD_CALCULATED_SCORE_DETAILS] != '' ? JSON.parse(items[func.dbCons.FIELD_CALCULATED_SCORE_DETAILS]) : ''
              json[func.dbCons.COLLECTION_GD_SCORE_DETAILS] = ''
              item[func.dbCons.FIELD_EXAM_SCORE] = json
            }
          } else {
            if (scoreDetails[keys][func.dbCons.FIELD_CANDIDATE_ID] === piCandidateId) {
              item[func.msCons.FIELD_DIRECT_PI] = false
              var paramValuesofGDScoreDetails = JSON.parse(items[func.dbCons.FIELD_DRAFT_SCORE_DETAILS_JSON])
              var paramValuesDetails = paramValuesofGDScoreDetails[func.msCons.PARAM_VALUES]
              item[func.msCons.FIELD_GD_PARAM_VALUES] = paramValuesDetails
              var json={}
              var exam_score_details=JSON.parse(items['draft_score_detail_json'])['exam_score_details']
              json[func.dbCons.COLLECTION_EXAM_SCORE_DETAILS]=exam_score_details
              item[func.dbCons.FIELD_EXAM_SCORE] = items[func.dbCons.SCORE_DETAIL_JSON] != '' ? JSON.parse(items[func.dbCons.SCORE_DETAIL_JSON]) : json

            }
            //console.log("itemm",item);
          }
          callbackinner()
        },
        function(error) {
          if (error) {
            return callback(new Error().stack, piAssessmentDetails)
          } else {
            callback()
          }
        })
    },
    function(error) {
      if (error) {
        return callback(new Error().stack, piAssessmentDetails)
      } else {
        alreadyExitsDraftJSON(urlMap, userCode, piAssessmentDetails, function(error, finalDraftJSON) {
          if (error) return callback(new Error().stack, finalDraftJSON)
          else {
            callback(null, finalDraftJSON)
          }
        })
      }
    })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'finalExamScoreJson()', func.logCons.LOG_EXIT)
}

function addCategoryTypeForGDInJSON (urlMap, userCode, fetchCalculatedScore, assessmentDetailsForGD, piAssessmentDetails, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addCategoryTypeForGDInJSON()', func.logCons.LOG_ENTER)
  async.forEachOf(piAssessmentDetails, function(items, keys, callbackinner) {
      var paramValuesGDArray = []
      paramValuesGDArray = updateParamValues(assessmentDetailsForGD)
      items[func.msCons.FIELD_GD_PARAM_VALUES] = paramValuesGDArray
      callbackinner()
    },
    function(error) {
      if (error) {
        return callback(new Error().stack, piAssessmentDetails)
      } else {
        finalExamScoreJson(true, urlMap, userCode, fetchCalculatedScore, piAssessmentDetails, function(error, personDetailIDs) {
          if (error) return callback(new Error().stack, personDetailIDs)
          else {
            callback(null, personDetailIDs)
          }
        })
      }
    })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addCategoryTypeForGDInJSON()', func.logCons.LOG_EXIT)
}

function getCalculatedScoreDetailsFromDB (urlMap, userCode, piAssessmentDetails, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCalculatedScoreDetailsFromDB()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_EMAIL_ADDRESS))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CALCULATED_SCORE_DETAILS))
  var fetchAllEmailIDSArray = func.getValuesArrayFromJson(func.dbCons.FIELD_EMAIL_ADDRESS, piAssessmentDetails)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_EMAIL_ADDRESS, func.lightBlueCons.OP_IN, fetchAllEmailIDSArray), urlMap, func.dbCons.COLLECTION_EXAM_SCORE_DETAILS, projection, function(error, fetchCalculatedScore) {
    if (error) return callback(new Error().stack, fetchCalculatedScore)
    if (!fetchCalculatedScore || fetchCalculatedScore.length === 0) {
      fetchCalculatedScore = []
      callback(null, fetchCalculatedScore)
    } else {
      getAssessmentDetailsHelpers.getAssessmentDetails(func.dbCons.ENUM_ASSESSMNET_CATEGORY_TYPE_GD, urlMap, function(error, assessmentDetailsForGD) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getAssessmentDetails = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessmentDetails()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, assessmentDetailsForGD)
        } else {
          addCategoryTypeForGDInJSON(urlMap, userCode, fetchCalculatedScore, assessmentDetailsForGD, piAssessmentDetails, function(error, gdPIJSON) {
            if (error) return callback(new Error().stack, gdPIJSON)
            else {
              callback(null, gdPIJSON)
            }
          })
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCalculatedScoreDetailsFromDB()', func.logCons.LOG_EXIT)
}

function getExamScoreDetailsFromDB (roundType, userCode, urlMap, piAssessmentDetails,gdGroupDetails, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getExamScoreDetailsFromDB()', func.logCons.LOG_ENTER)
  queryForDB = getExamScoreDetailsJSON(userCode, gdGroupDetails, roundType)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.SCORE_DETAIL_JSON))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_DRAFT_SCORE_DETAILS_JSON))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_ID))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, queryForDB), urlMap, func.dbCons.COLLECTION_GD_SCORE_DETAILS, projection, function(error, scoreDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getExamScoreDetailsFromDB = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamScoreDetailsFromDB()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, piAssessmentDetails)
    }
    //console.log('scoreDetails',scoreDetails)
    if (!scoreDetails || scoreDetails.length === 0) {
      getCalculatedScoreDetailsFromDB(urlMap, userCode, piAssessmentDetails, function(error, scoreJSON) {
        if (error) return callback(new Error().stack, scoreJSON)
        else {
          callback(null, scoreJSON)
        }
      })
    } else {
      finalExamScoreJson(false, urlMap, userCode, scoreDetails, piAssessmentDetails, function(error, personDetailIDs) {
        if (error) return callback(new Error().stack, personDetailIDs)
        else {
          callback(null, personDetailIDs)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getExamScoreDetailsFromDB()', func.logCons.LOG_EXIT)
}

function createFinalJSON (userCode, roundType, urlMap, piAssessmentDetails, fetchAllPersonDetails, getAssessmentDetails, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'createFinalJSON()', func.logCons.LOG_ENTER)
  if (roundType === func.dbCons.ENUM_ROUND_TYPE_ON_SITE) {
    getPreviousScoreJson(piAssessmentDetails, userCode, urlMap, function(error, piCandidateDetails) {
      generateScoreJson(roundType, userCode, urlMap, piCandidateDetails, fetchAllPersonDetails, getAssessmentDetails, callback)
    })
  } else {
    generateScoreJson(roundType, userCode, urlMap, piAssessmentDetails, fetchAllPersonDetails, getAssessmentDetails, callback)
  }
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'createFinalJSON()', func.logCons.LOG_EXIT)
}

function generateScoreJson (roundType, userCode, urlMap, piCandidateDetails, fetchAllPersonDetails, getAssessmentDetails, generateCb) {
  var paramValueDetails = updateParamValues(getAssessmentDetails)
  async.forEachOf(piCandidateDetails, function(item, key, callback) {
    let personId = item[func.dbCons.FIELD_PERSON_ID]
    async.forEachOf(fetchAllPersonDetails, function(items, keys, callbackinner) {
        if (fetchAllPersonDetails[keys][func.dbCons.FIELD_ID] === personId) {
          item[func.dbCons.FIELD_FIRST_NAME] = items[func.dbCons.FIELD_FIRST_NAME]
          item[func.dbCons.FIELD_LAST_NAME] = items[func.dbCons.FIELD_LAST_NAME]
          item[func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME] = items[func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME]
          item[func.dbCons.FIELD_EMAIL_ADDRESS] = items[func.dbCons.FIELD_EMAIL_ADDRESS]
          item[func.dbCons.FIELD_RESUME_FILE] = items[func.dbCons.FIELD_RESUME_FILE]
          item[func.msCons.PARAM_VALUES] = paramValueDetails
        }
        callbackinner()
      },
      function(error) {
        if (error) {
          return callback(new Error().stack, piCandidateDetails)
        } else {
          callback()
        }
      })
  }, function (error) {
    if (error) {
      return callback(new Error().stack, piCandidateDetails)
    } else {
      fetchGdGroupDetails(roundType, userCode, urlMap, piCandidateDetails, function (error, gdGroupDetails) {
        if(error) return generateCb(new Error().stack, gdGroupDetails)
        if(gdGroupDetails.length === 0){
          getCalculatedScoreDetailsFromDB(urlMap, userCode, piCandidateDetails, function(error, scoreJSON) {
            if (error) return generateCb(new Error().stack, scoreJSON)
            else {
              generateCb(null, scoreJSON)
            }
          })
        } else if (gdGroupDetails.length != piCandidateDetails.length) {
          let finalJSON = []
          async.forEachOf(piCandidateDetails, function(item) {
            async.forEachOf(gdGroupDetails, function(gdItem) {
            if (item.candidate_id === gdItem.candidate_id) {
              let json = []
              json.push(item)
              getExamScoreDetailsFromDB(roundType, userCode, urlMap, json, gdGroupDetails, function(error, examScore) {
                if (error) return callback(new Error().stack, examScore)
                if (!examScore || examScore.length === 0) {
                  examScore = []
                  generateCb(null, examScore)
                } else {
                  for (let item of examScore)
                    finalJSON.push(item)
                    if(finalJSON.length === piCandidateDetails.length){
                    generateCb(null, finalJSON)}
                }
              })
            } else {
              let json = []
              json.push(item)
              getCalculatedScoreDetailsFromDB(urlMap, userCode, json, function(error, scoreJSON) {
                if (error) return generateCb(new Error().stack, scoreJSON)
                else {
                  for (let item of scoreJSON)
                    finalJSON.push(item)
                  if(finalJSON.length === piCandidateDetails.length){
                  generateCb(null, finalJSON)}
                }
              })
            }
          },function(err){
            if (error) {
              return generateCb(new Error().stack, error)
            } else {
              generateCb(null, finalJSON)
            }
          })
          }, function(error) {
            if (error) {
              return generateCb(new Error().stack, error)
            } else {
            }
          })

    }
        else{
        getExamScoreDetailsFromDB(roundType, userCode, urlMap, piCandidateDetails, gdGroupDetails, function(error, examScore) {
          if (error) return callback(new Error().stack, examScore)
          if (!examScore || examScore.length === 0) {
            examScore = []
            generateCb(null, examScore)
          } else {
            generateCb(null, examScore)
          }
        })
      }
      })
    }
      // getExamScoreDetailsFromDB(roundType, userCode, urlMap, piCandidateDetails, function(error, examScore) {
      //   if (error) return callback(new Error().stack, examScore)
      //   if (!examScore || examScore.length === 0) {
      //     examScore = []
      //     generateCb(null, examScore)
      //   } else {
      //     generateCb(null, examScore)
      //   }
      // })
    })
  // })
}

function fetchGdGroupDetails (roundType, userCode, urlMap, piCandidateDetails, cbGdGroup) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchGdGroupDetails()', func.logCons.LOG_ENTER)
  let query = getGdGroupDetailsJSON(userCode, piCandidateDetails, roundType)
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, func.dbCons.COLLECTION_GD_GROUP_DETAILS, dbOp.getCommonProjection(), function (error, gdGroupDetailsData) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching gd score details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchGdGroupDetails()', func.logCons.LOG_EXIT)
      return cbGdGroup(new Error().stack, gdGroupDetailsData)
    } else if (!gdGroupDetailsData || gdGroupDetailsData.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no gd group details = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchGdGroupDetails()', func.logCons.LOG_EXIT)
      return cbGdGroup(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'GdScoreDetails: ', gdGroupDetailsData)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchGdGroupDetails()', func.logCons.LOG_EXIT)
      cbGdGroup(null, gdGroupDetailsData)
    }
  })
}


function getGdGroupDetailsJSON (userCode, piAssesentIds, roundType) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getGdGroupDetailsJSON()', func.logCons.LOG_ENTER)
  var arrayOfCandidateIds = func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_ID, piAssesentIds)
  var andArray = []
  andArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_ID, func.lightBlueCons.OP_IN, arrayOfCandidateIds))
  andArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROUND_TYPE, func.lightBlueCons.OP_EQUAL, roundType))
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getGdGroupDetailsJSON()', func.logCons.LOG_EXIT)
  return andArray
}

function getPreviousScoreJson (piAssessmentDetails, userCode, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPreviousScoreJson()', func.logCons.LOG_ENTER)
  let temp
  var groupByCandidateId = _(piAssessmentDetails)
    .groupBy(func.dbCons.FIELD_CANDIDATE_ID)
    .map((candidate_details, candidate_id) => ({
      candidate_id,
      candidate_details
    }))
    .value()
  let candidateDetailsArray = []
  async.eachOfSeries(groupByCandidateId, function (candidate, key, outerAsyncCb) {
    let previousScore = []
    let averageWeightageArray = []
    let candidateDetailsJson = {}
    async.eachOfSeries(candidate[func.msCons.FIELD_CANDIDATE_DETAILS], function (obj, key, asynCb) {
      if ((obj[func.dbCons.FIELD_ROUND_TYPE] === 0) && (obj[func.dbCons.FIELD_FEEDBACK_JSON] !== undefined)) {
        let previousCandidateJson = generateAverageJson(JSON.parse(obj[func.dbCons.FIELD_FEEDBACK_JSON]))
        getAverageOfResponse(previousCandidateJson, function (error, response) {
          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, `error = ${JSON.stringify(error)}`)
            asynCb()
          } else {
            let defaultResponse = {}
            fetchAssessorName(obj[func.dbCons.ASSESSOR_ID], urlMap, function (error, assessorName) {
              defaultResponse[func.dbCons.ASSESSOR_ID] = obj[func.dbCons.ASSESSOR_ID]
              defaultResponse[func.msCons.FIELD_ASSESSOR_NAME] = assessorName
              defaultResponse[func.dbCons.FIELD_FEEDBACK_JSON] = JSON.parse(obj[func.dbCons.FIELD_FEEDBACK_JSON])
              defaultResponse[func.msCons.FIELD_ASSESSOR_AVERAGE_SCORE] = response
              previousScore.push(defaultResponse)
              averageWeightageArray.push(response[func.msCons.FIELD_AVERAGE_OF_SCORE][func.msCons.FIELD_WEIGHTAGE])
              asynCb()
            })
          }
        })
      } else {
        temp = func.cloneJsonObject(obj)
        asynCb()
      }
    }, function (error) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error in async call = ' + error)
        outerAsyncCb()
      } else {
        candidateDetailsJson[func.dbCons.ASSESSOR_ID] = temp[func.dbCons.ASSESSOR_ID]
        candidateDetailsJson[func.dbCons.FIELD_ROUND_TYPE] = temp[func.dbCons.FIELD_ROUND_TYPE]
        candidateDetailsJson[func.dbCons.FIELD_CANDIDATE_ID] = temp[func.dbCons.FIELD_CANDIDATE_ID]
        candidateDetailsJson[func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID] = temp[func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID]
        candidateDetailsJson[func.dbCons.FIELD_STATUS] = temp[func.dbCons.FIELD_STATUS]
        candidateDetailsJson[func.msCons.FIELD_PREVIOUS_SCORES] = previousScore
        candidateDetailsJson[func.dbCons.COLLECTION_JSON_PERSON_ID] = temp[func.dbCons.COLLECTION_JSON_PERSON_ID]
        candidateDetailsJson[func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID] = temp[func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID]
        let averageForSpecificAssessor = func.filterBasedOnValue(previousScore, func.dbCons.ASSESSOR_ID, temp[func.dbCons.ASSESSOR_ID])
        if (averageForSpecificAssessor.length !== 0) {
          candidateDetailsJson[func.msCons.FIELD_ASSESSOR_AVERAGE_SCORE] = averageForSpecificAssessor[0][func.msCons.FIELD_ASSESSOR_AVERAGE_SCORE]
        }
        let averageScore = {}
        averageScore[func.msCons.FIELD_AVERAGE_OF_SCORE] = {}
        averageScore[func.msCons.FIELD_AVERAGE_OF_SCORE][func.msCons.FIELD_SELECTED_VALUE] = recognizeNumber(func.averageOfNumber(averageWeightageArray))
        averageScore[func.msCons.FIELD_AVERAGE_OF_SCORE][func.msCons.FIELD_WEIGHTAGE] = func.averageOfNumber(averageWeightageArray)
        candidateDetailsJson[func.msCons.FIELD_AVERAGE_OF_GD_AND_PI] = averageScore
        candidateDetailsArray.push(candidateDetailsJson)
        candidateDetailsJson = {}
        outerAsyncCb()
      }
    })
  }, function (err) {
    if (err) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error in outer async call = ' + error)
      callback(new Error().stack, func.errorsArrayGenrator(func.errorObjectGenrator(HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
    } else {
      callback(null, candidateDetailsArray)
    }
  })
}


function fetchAssessorName (assessorId, urlMap, cbAssessorName) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchAssessorName()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, assessorId), urlMap, func.dbCons.COLLECTION_USER_DETAILS, dbOp.getCommonProjection(), function(error, assesserName) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching assessor name = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchAssessorName()', func.logCons.LOG_EXIT)
      return cbAssessorName(new Error().stack, assesserName)
    } else if (!assesserName || assesserName.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'no assessor found  = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchAssessorName()', func.logCons.LOG_EXIT)
      return cbAssessorName(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchAssessorName: ', assesserName)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'fetchAssessorName()', func.logCons.LOG_EXIT)
      cbAssessorName(null, assesserName[0][func.dbCons.FIELD_USER_DATA][func.dbCons.FIELD_NAME])
    }
  })
}

function generateAverageJson (gdPiScoreJson) {
  let gdPiAverage = {}
  if (gdPiScoreJson[func.msCons.FIELD_GD_SCORE_DETAILS] !== undefined){
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
  //  const gdPiFinalAverage = await getAverageOfResponse(gdPiAverage)
  return gdPiAverage
}

function getAverageOfResponse (gdScoreJson, cbAverageValue) {
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
    let averageScore = {}
    averageScore[func.msCons.FIELD_AVERAGE_OF_SCORE] = {}
    averageScore[func.msCons.FIELD_AVERAGE_OF_SCORE][func.msCons.FIELD_SELECTED_VALUE] = recognizeNumber(func.averageOfNumber(weightageOfResponse))
    averageScore[func.msCons.FIELD_AVERAGE_OF_SCORE][func.msCons.FIELD_WEIGHTAGE] = func.averageOfNumber(weightageOfResponse)
    cbAverageValue(null, averageScore)
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAverageOfResponse()', func.logCons.LOG_EXIT)
}

function recognizeNumber (value) {
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


function addPersonDetailsInJSON (userCode, roundType, urlMap, fetchAllPersonDetails, piAssessmentDetails, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addPersonDetailsInJSON()', func.logCons.LOG_ENTER)
  getAssessmentDetailsHelpers.getAssessmentDetails(func.dbCons.ENUM_ASSESSMNET_CATEGORY_TYPE_PI, urlMap, function(error, getAssessmentDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'addPersonDetailsInJSON = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addPersonDetailsInJSON()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, personDetails)
    }
    if (!getAssessmentDetails || getAssessmentDetails.length === 0) {
      getAssessmentDetails = []
      createFinalJSON(userCode, roundType, urlMap, piAssessmentDetails, fetchAllPersonDetails, getAssessmentDetails, function(error, finalCandidateJSON) {
        if (error) return callback(new Error().stack, piAssessmentDetails)
        if (!finalCandidateJSON || finalCandidateJSON.length === 0) {
          finalCandidateJSON = []
          callback(null, finalCandidateJSON)
        } else {
          callback(null, finalCandidateJSON)
        }
      })
    } else {
      createFinalJSON(userCode, roundType, urlMap, piAssessmentDetails, fetchAllPersonDetails, getAssessmentDetails, function(error, finalCandidateJSON) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'addPersonDetailsInJSON = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addPersonDetailsInJSON()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, piAssessmentDetails)
        }
        if (!finalCandidateJSON || finalCandidateJSON.length === 0) {
          finalCandidateJSON = []
          callback(null, finalCandidateJSON)
        } else {
          callback(null, finalCandidateJSON)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addPersonDetailsInJSON()', func.logCons.LOG_EXIT)
}

function getPersonDetailsFromDB(userCode, roundType, urlMap, piAssessmentDetails, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getPersonDetailsFromDB()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_FIRST_NAME))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_LAST_NAME))
  projection.push(dbOp.getProjectionJson(func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_EMAIL_ADDRESS))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_RESUME_FILE))
  var fetchAllCandidateIDS = func.getValuesArrayFromJson(func.dbCons.FIELD_PERSON_ID, piAssessmentDetails)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, fetchAllCandidateIDS), urlMap, func.dbCons.COLLECTION_PERSON_DETAILS, projection, function(error, fetchAllPersonDetails) {
    if (error) return callback(new Error().stack, fetchAllPersonIDS)
    if (!fetchAllPersonDetails || fetchAllPersonDetails.length === 0) {
      fetchAllPersonDetails = []
      callback(null, fetchAllPersonDetails)
    } else {
      addPersonDetailsInJSON(userCode, roundType, urlMap, fetchAllPersonDetails, piAssessmentDetails, function(error, updateJSON) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getPersonDetailsFromDB = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromDB()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, updateJSON)
        } else {
          callback(null, updateJSON)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getPersonDetailsFromDB()', func.logCons.LOG_EXIT)
}

function addPersonIdInJSON(userCode, roundType, urlMap, fetchAllPersonIDS, piAssessmentDetails, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addPersonIdInJSON()', func.logCons.LOG_ENTER)
  async.forEachOf(piAssessmentDetails, function(item, key, callback) {
    candidateId = item[func.dbCons.FIELD_CANDIDATE_ID]
    async.forEachOf(fetchAllPersonIDS, function(items, keys, callbackinner) {
        if (fetchAllPersonIDS[keys][func.dbCons.FIELD_ID] === candidateId) {
          item[func.dbCons.FIELD_PERSON_ID] = items[func.dbCons.FIELD_PERSON_ID]
          item[func.dbCons.FIELD_CANDIDATE_SOURCE_ID] = items[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]
        }
        callbackinner()
      },
      function(error) {
        if (error) {
          return callback(new Error().stack, piAssessmentDetails)
        } else {
          callback()
        }
      })
  }, function(error) {
    if (error) {
      return callback(new Error().stack, piAssessmentDetails)
    } else {
      getPersonDetailsFromDB(userCode, roundType, urlMap, piAssessmentDetails, function(error, personDetails) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getPersonDetailsFromDB = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromDB()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, personDetails)
        }
        if (!personDetails || personDetails.length === 0) {
          personDetails = []
          callback(null, personDetails)
        } else {
          callback(null, personDetails)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addPersonIdInJSON()', func.logCons.LOG_EXIT)
}

function getPersonDetailsID(userCode, roundType, urlMap, piAssessmentDetails, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getPersonDetailsID()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PERSON_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID))
  var fetchAllCandidateIDS = func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_ID, piAssessmentDetails)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, fetchAllCandidateIDS), urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, projection, function(error, fetchAllPersonIDS) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getPersonDetailsID = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsID()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, fetchAllPersonIDS)
    }
    if (!fetchAllPersonIDS || fetchAllPersonIDS.length === 0) {
      fetchAllPersonIDS = []
      callback(null, fetchAllPersonIDS)
    } else {
      addPersonIdInJSON(userCode, roundType, urlMap, fetchAllPersonIDS, piAssessmentDetails, function(error, updateJSON) {
        if (error) return callback(new Error().stack, updateJSON)
        else {
          callback(null, updateJSON)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getPersonDetailsID()', func.logCons.LOG_EXIT)
}

function getFeedBackJsonFromPiAssessmentDetails(roundType, userCode, PIAssesentIds, PiAssessementType, roleName, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getFeedBackJsonFromPiAssessmentDetails()', func.logCons.LOG_ENTER)
  queryForDB = getCandidateDetailsFeedBacKJSON(userCode, PIAssesentIds, PiAssessementType, roleName)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_FEEDBACK_JSON))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_STATUS))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ROUND_TYPE))
  projection.push(dbOp.getProjectionJson(func.dbCons.ASSESSOR_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PI_CANDIDATE_SEQUENCE))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, queryForDB), urlMap, func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, projection, function(error, piAssessmentDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getFeedBackJsonFromPiAssessmentDetails = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getFeedBackJsonFromPiAssessmentDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, piAssessmentDetails)
    }
    if (!piAssessmentDetails || piAssessmentDetails.length === 0) {
      piAssessmentDetails = []
      callback(null, piAssessmentDetails)
    } else {
      if (roundType === func.dbCons.ENUM_ROUND_TYPE_ON_SITE) {
        var candidateIds = func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_ID, piAssessmentDetails)
        getOnCampusDetailsOfCandidates(candidateIds, urlMap, function(error, onCampusCandidateDetails) {
          if (error) return callback(new Error().stack)
          else {
            piAssessmentDetails = piAssessmentDetails.concat(onCampusCandidateDetails)
            getPersonDetailsID(userCode, roundType, urlMap, piAssessmentDetails, function(error, personDetailIDs) {
              if (error) return callback(new Error().stack, personDetailIDs)
              else {
                callback(null, personDetailIDs)
              }
            })
          }
        })
      } else {
        getPersonDetailsID(userCode, roundType, urlMap, piAssessmentDetails, function(error, personDetailIDs) {
          if (error) return callback(new Error().stack, personDetailIDs)
          else {
            callback(null, personDetailIDs)
          }
        })
      }
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getFeedBackJsonFromPiAssessmentDetails()', func.logCons.LOG_EXIT)
}

function getOnCampusDetailsOfCandidates(candidateIds, urlMap, callback) {
  var andArray = []
  andArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_ID, func.lightBlueCons.OP_IN, candidateIds))

  andArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROUND_TYPE, func.lightBlueCons.OP_EQUAL, func.dbCons.ENUM_ROUND_TYPE_ON_CAMPUS))
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_FEEDBACK_JSON))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_STATUS))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ROUND_TYPE))
  projection.push(dbOp.getProjectionJson(func.dbCons.ASSESSOR_ID))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, andArray), urlMap, func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, projection, function(error, piAssessmentDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getFeedBackJsonFromPiAssessmentDetails = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getFeedBackJsonFromPiAssessmentDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack)
    }
    if (!piAssessmentDetails || piAssessmentDetails.length === 0) {
      piAssessmentDetails = []
      callback(null, piAssessmentDetails)
    } else {
      callback(null, piAssessmentDetails)
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
      return func.dbCons.ENUM_ROUND_TYPE_ON_CAMPUS
  }
}
GetCandidateDetailsForPI.prototype.getPIDetailsFromDB = function(userCode, body, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addPIDetailsFromDB()', func.logCons.LOG_ENTER)
  var piAssessementType = body[func.dbCons.FIELD_PI_ASSESSMENT_TYPE]
  var piAssesentIds = body[func.dbCons.FIELD_PI_ASSESSMENT_DETAIS_ID]
  var roundType = getEnumForRoundType(body[func.dbCons.FIELD_ROUND_TYPE])
  let roleName = body[func.dbCons.FIELD_ROLE_NAME]
  getFeedBackJsonFromPiAssessmentDetails(roundType, userCode, piAssesentIds, piAssessementType, roleName, urlMap, function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getFeedBackJsonFromPiAssessmentDetails = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getFeedBackJsonFromPiAssessmentDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (response.length === 0) {
      return callback(null, [])
    } else {
      generateFinalResponse(response, callback)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addPIDetailsFromDB()', func.logCons.LOG_EXIT)
}

function generateFinalResponse(response, callback) {
  let candidates = []
  response.filter(function(candidateDetail) {
    if (candidateDetail[func.dbCons.FIELD_STATUS] !== func.dbCons.ENUM_PI_ASSESSMENT_CANDIDATE_NOT_APPEARED) {
      candidates.push(candidateDetail)
    }
  })
  callback(null, candidates)
}

exports.GetCandidateDetailsForPI = GetCandidateDetailsForPI
