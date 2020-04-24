var func = require('../utils/functions')
var dbOp
var fs = require('fs')
var async = require('async')
var http = require('http')
var smtp = func.config.get('smtp')
var nodemailer = require('nodemailer')
var dateFormat = require('dateformat')
var HELPER_CONS = 'SS_CLFA_'
var _ = require('lodash')

function GetCandidateListForAssessor () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of get candidate list for accessor')
  DbOperation = require('./db-operations').DbOperation
  dbOp = new DbOperation()
}

function addInstituteName (finalStatus, urlMap, candidateDetailsFromScoreDetails, instituteName, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addInstituteName()', func.logCons.LOG_ENTER)
  async.forEachOf(candidateDetailsFromScoreDetails, function (item, key, callback) {
    instituteID = item[func.dbCons.FIELD_INSTITUTE_ID]

    async.forEachOf(instituteName, function (items, keys, callbackinner) {
      if (instituteName[keys][func.dbCons.FIELD_ID] === instituteID) {
        item[func.dbCons.FIELD_INSTITUTE_NAME] = items[func.dbCons.FIELD_INSTITUTE_DETAILS_NAME]
      }
      callbackinner()
    }, function (error) {
      if (error) {
        return callback(new Error().stack, candidateDetailsFromScoreDetails)
      } else {
        callback()
      }
    })
  }, function (error) {
    if (error) {
      return callback(new Error().stack, candidateDetailsFromScoreDetails)
    } else {
      let responseJson = {}
      responseJson[func.dbCons.COLLECTION_CANDIDATE_DETAILS] = candidateDetailsFromScoreDetails
      responseJson[func.dbCons.FIELD_STATUS] = finalStatus
      callback(null, responseJson)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addInstituteName()', func.logCons.LOG_EXIT)
}

function getInstituteNameFromInstituteDetails (finalStatus, urlMap, candidateDetailsFromScoreDetails, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getInstituteIdFromCampusDriveDetails()', func.logCons.LOG_ENTER)
  var instituteIdsArray = func.getValuesArrayFromJson(func.dbCons.FIELD_INSTITUTE_ID, candidateDetailsFromScoreDetails)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_INSTITUTE_DETAILS_NAME))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, instituteIdsArray), urlMap, func.dbCons.COLLECTION_INSTITUTE_DETAILS, projection, function (error, instituteName) {
    if (error) return callback(new Error().stack, instituteName)
    if (!instituteName || instituteName.length === 0) {
      instituteName = []
      callback(null, instituteName)
    } else {
      addInstituteName(finalStatus, urlMap, candidateDetailsFromScoreDetails, instituteName, function (error, instituteNameFromInstituteDetails) {
        if (error) return callback(new Error().stack, instituteNameFromInstituteDetails)
        if (!instituteNameFromInstituteDetails || instituteNameFromInstituteDetails.length === 0) {
          callback(null, candidateDetailsFromScoreDetails)
        } else {
          callback(null, instituteNameFromInstituteDetails)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getInstituteIdFromCampusDriveDetails()', func.logCons.LOG_EXIT)
}

function addInstituteId (finalStatus, urlMap, candidateDetailsFromScoreDetails, instituteIdsFromCampusDrive, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addInstituteId()', func.logCons.LOG_ENTER)
  async.forEachOf(candidateDetailsFromScoreDetails, function (item, key, callback) {
    campusDriveID = item[func.dbCons.FIELD_CAMPUS_DRIVE_ID]
    async.forEachOf(instituteIdsFromCampusDrive, function (items, keys, callbackinner) {
      if (instituteIdsFromCampusDrive[keys][func.dbCons.FIELD_ID] === campusDriveID) {
        item[func.dbCons.FIELD_INSTITUTE_ID] = items[func.dbCons.FIELD_INSTITUTE_ID]
      }
      callbackinner()
    }, function (error) {
      if (error) {
        return callback(new Error().stack, candidateDetailsFromScoreDetails)
      } else {
        callback()
      }
    })
  }, function (error) {
    if (error) {
      return callback(new Error().stack, candidateDetailsFromScoreDetails)
    } else {
      getInstituteNameFromInstituteDetails(finalStatus, urlMap, candidateDetailsFromScoreDetails, function (error, instituteIds) {
        if (error) {
          return callback(new Error().stack, instituteIds)
        } else {
          callback(null, instituteIds)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addInstituteId()', func.logCons.LOG_EXIT)
}

function getInstituteIdFromCampusDriveDetails (finalStatus, urlMap, candidateDetailsFromScoreDetails, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getInstituteIdFromCampusDriveDetails()', func.logCons.LOG_ENTER)
  var candidateDriveIdsArray = func.getValuesArrayFromJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, candidateDetailsFromScoreDetails)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_INSTITUTE_ID))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidateDriveIdsArray), urlMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, projection, function (error, instituteIdsFromCampusDrive) {
    if (error) return callback(new Error().stack, instituteIdsFromCampusDrive)
    if (!instituteIdsFromCampusDrive || instituteIdsFromCampusDrive.length === 0) {
      instituteIdsFromCampusDrive = []
      callback(null, instituteIdsFromCampusDrive)
    } else {
      addInstituteId(finalStatus, urlMap, candidateDetailsFromScoreDetails, instituteIdsFromCampusDrive, function (error, addCandidateSourceIds) {
        if (error) return callback(new Error().stack, addCandidateSourceIds)
        if (!addCandidateSourceIds || addCandidateSourceIds.length === 0) {
          callback(null, candidateDetailsFromScoreDetails)
        } else {
          callback(null, addCandidateSourceIds)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getInstituteIdFromCampusDriveDetails()', func.logCons.LOG_EXIT)
}

function addCandidateSourceId (finalStatus, urlMap, candidateDetailsFromScoreDetails, fetchCandidateIds, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addCandidateSourceId()', func.logCons.LOG_ENTER)
  async.forEachOf(candidateDetailsFromScoreDetails, function (item, key, callback) {
    candidateSourceID = item[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]
    async.forEachOf(fetchCandidateIds, function (items, keys, callbackinner) {
      if (fetchCandidateIds[keys][func.dbCons.FIELD_ID] === candidateSourceID) {
        item[func.dbCons.FIELD_CAMPUS_DRIVE_ID] = items[func.dbCons.FIELD_CAMPUS_DRIVE_ID]
      }
      callbackinner()
    }, function (error) {
      if (error) {
        return callback(new Error().stack, candidateDetailsFromScoreDetails)
      } else {
        callback()
      }
    })
  }, function (error) {
    if (error) {
      return callback(new Error().stack, candidateDetailsFromScoreDetails)
    } else {
      getInstituteIdFromCampusDriveDetails(finalStatus, urlMap, candidateDetailsFromScoreDetails, function (error, instituteIds) {
        if (error) {
          return callback(new Error().stack, instituteIds)
        } else {
          callback(null, instituteIds)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addCandidateSourceId()', func.logCons.LOG_EXIT)
}

function getCandidateSourceID (finalStatus, urlMap, candidateDetailsFromScoreDetails, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateSourceID()', func.logCons.LOG_ENTER)
  var candidateSourceIdsArray = func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, candidateDetailsFromScoreDetails)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidateSourceIdsArray), urlMap, func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, projection, function (error, fetchCandidateIds) {
    if (error) return callback(new Error().stack, fetchCandidateIds)
    if (!fetchCandidateIds || fetchCandidateIds.length === 0) {
      var fetchCandidateIds = []
      callback(null, fetchCandidateIds)
    } else {
      // callback(null, fetchCandidateIds)
      addCandidateSourceId(finalStatus,urlMap, candidateDetailsFromScoreDetails, fetchCandidateIds, function (error, addCandidateSourceIds) {
        if (error) return callback(new Error().stack, addCandidateSourceIds)
        if (!addCandidateSourceIds || addCandidateSourceIds.length === 0) {
          var addCandidateSourceIds = []
          callback(null, addCandidateSourceIds)
        } else {
          callback(null, addCandidateSourceIds)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateSourceID()', func.logCons.LOG_EXIT)
}

function finalCandidateJSonFromScoreDetails (urlMap, fetchCandidateScoreData, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'finalCandidateJSonFromScoreDetails()', func.logCons.LOG_ENTER)
  var candidateDetailsFromScoreDetails = []
  let finalStatus = (_.every(fetchCandidateScoreData, [func.dbCons.FIELD_STATUS, func.dbCons.ENUM_STATUS_GROUP_CREATED]))
  fetchCandidateScoreData = _.reject(fetchCandidateScoreData,{'status': func.dbCons.ENUM_STATUS_CANDIDATE_NOT_APPEARED_IN_GD})
  async.forEachOf(fetchCandidateScoreData, function (items, keys, callbackinner) {
    var scoreDetailsJson = {}
    if (fetchCandidateScoreData[keys][func.dbCons.FIELD_CALCULATED_SCORE_DETAILS] !== 'N/A') {
      scoreDetailsJson[func.dbCons.FIELD_CALCULATED_SCORE_DETAILS] = items[func.dbCons.FIELD_CALCULATED_SCORE_DETAILS]
      scoreDetailsJson[func.dbCons.FIELD_NAME] = items[func.dbCons.FIELD_NAME]
      scoreDetailsJson[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE] = items[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE]
      scoreDetailsJson[func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME] = items[func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME]
      scoreDetailsJson[func.dbCons.FIELD_CANDIDATE_ID] = items[func.dbCons.FIELD_CANDIDATE_ID]
      scoreDetailsJson[func.dbCons.FIELD_ID] = items[func.dbCons.FIELD_ID]
      scoreDetailsJson[func.dbCons.FIELD_GD_GROUP_DETAILS_ID] = items[func.dbCons.FIELD_GD_GROUP_DETAILS_ID]
      scoreDetailsJson[func.dbCons.FIELD_EMAIL_ADDRESS] = items[func.dbCons.FIELD_EMAIL_ADDRESS]
      scoreDetailsJson[func.dbCons.FIELD_STATUS] = items[func.dbCons.FIELD_STATUS]
      scoreDetailsJson[func.dbCons.FIELD_CANDIDATE_SOURCE_ID] = items[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]
      scoreDetailsJson[func.dbCons.FIELD_GD_TOPIC] = items[func.dbCons.FIELD_GD_TOPIC]
      scoreDetailsJson[func.dbCons.FIELD_UNIVERSITIES] = items[func.dbCons.FIELD_UNIVERSITIES]
      scoreDetailsJson[func.dbCons.FIELD_ACCESSOR_DETAILS] = items[func.dbCons.FIELD_ACCESSOR_DETAILS]
      candidateDetailsFromScoreDetails.push(scoreDetailsJson)
    }
    callbackinner()
  }, function (error) {
    if (error) {
      return callback(new Error().stack, candidateDetailsFromScoreDetails)
    } else {
      // callback(null, candidateDetailsFromScoreDetails)
      getCandidateSourceID(finalStatus,urlMap, candidateDetailsFromScoreDetails, function (error, candidateSourecIDs) {
        if (error) {
          return callback(new Error().stack, candidateSourecIDs)
        } else {
          callback(null, candidateSourecIDs)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'finalCandidateJSonFromScoreDetails()', func.logCons.LOG_EXIT)
}

function createScoreDetailsJson (urlMap, fetchCandidateScore, fetchAllPersonData, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'createScoreDetailsJson()', func.logCons.LOG_ENTER)
  async.forEachOf(fetchCandidateScore, function (item, key, callback) {
    emailAddress = item[func.dbCons.FIELD_EMAIL_ADDRESS]
    scoreJson = item[func.dbCons.FIELD_CALCULATED_SCORE_DETAILS]
    async.forEachOf(fetchAllPersonData, function (items, keys, callbackinner) {
      if (fetchAllPersonData[keys][func.dbCons.FIELD_EMAIL_ADDRESS] === emailAddress) {
        item[func.dbCons.FIELD_CALCULATED_SCORE_DETAILS] = scoreJson
        item[func.dbCons.FIELD_NAME] = items[func.dbCons.FIELD_FIRST_NAME]
        item[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE] = items[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE]
        item[func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME] = items[func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME]
        item[func.dbCons.FIELD_CANDIDATE_ID] = items[func.dbCons.FIELD_CANDIDATE_ID]
        item[func.dbCons.FIELD_ID] = items[func.dbCons.FIELD_ID]
        item[func.dbCons.FIELD_GD_GROUP_DETAILS_ID] = items[func.dbCons.FIELD_GD_GROUP_DETAILS_ID]
        item[func.dbCons.FIELD_STATUS] = items[func.dbCons.FIELD_STATUS]
        item[func.dbCons.FIELD_CANDIDATE_SOURCE_ID] = items[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]
        item[func.dbCons.FIELD_EMAIL_ADDRESS] = emailAddress
        item[func.dbCons.FIELD_GD_TOPIC]=items[func.dbCons.FIELD_GD_TOPIC]
        item[func.dbCons.FIELD_UNIVERSITIES] = items[func.dbCons.FIELD_UNIVERSITIES]
        item[func.dbCons.FIELD_ACCESSOR_DETAILS] = items[func.dbCons.FIELD_ACCESSOR_DETAILS]
      }
      callbackinner()
    }, function (error) {
      if (error) {
        return callback(new Error().stack, fetchCandidateScore)
      } else {
        callback()
      }
    })
  }, function (error) {
    if (error) {
      return callback(new Error().stack, fetchCandidateScore)
    } else {
      finalCandidateJSonFromScoreDetails(urlMap, fetchCandidateScore, function (error, finalDetailsJson) {
        if (error) {
          return callback(new Error().stack, finalDetailsJson)
        } else {
          callback(null, finalDetailsJson)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'createScoreDetailsJson()', func.logCons.LOG_EXIT)
}

function getCandidateScoreFromScoreDetals (urlMap, fetchAllPersonData, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateScoreFromScoreDetals()', func.logCons.LOG_ENTER)
  var personEmailIdFromPersonDetails = func.getValuesArrayFromJson(func.dbCons.FIELD_EMAIL_ADDRESS, fetchAllPersonData)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_EMAIL_ADDRESS))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CALCULATED_SCORE_DETAILS))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_EMAIL_ADDRESS, func.lightBlueCons.OP_IN, personEmailIdFromPersonDetails), urlMap, func.dbCons.COLLECTION_EXAM_SCORE_DETAILS, projection, function (error, fetchCandidateScore) {
    if (error) return callback(new Error().stack, fetchPersonEmailIds)
    if (!fetchCandidateScore || fetchCandidateScore.length === 0) {
      var fetchCandidateScore = []
      callback(null, fetchCandidateScore)
    } else {
      createScoreDetailsJson(urlMap, fetchCandidateScore, fetchAllPersonData, function (error, scoreJSON) {
        if (error) return callback(new Error().stack, scoreJSON)
        if (!scoreJSON || scoreJSON.length === 0) {
          var scoreJSON = []
          callback(null, scoreJSON)
        } else {
          callback(null, scoreJSON)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateScoreFromScoreDetals()', func.logCons.LOG_EXIT)
}

function createpersonDetailsJson (urlMap, fetchPersonEmailIds, fetchAllCandidateData, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'createpersonDetailsJson()', func.logCons.LOG_ENTER)
  async.forEachOf(fetchPersonEmailIds, function (item, key, callback) {
    personId = item[func.dbCons.FIELD_ID]
    emailAddress = item[func.dbCons.FIELD_EMAIL_ADDRESS]
    firstName = item[func.dbCons.FIELD_FIRST_NAME]
    lastName = item[func.dbCons.FIELD_LAST_NAME]
    middleName = item[func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME]
    async.forEachOf(fetchAllCandidateData, function (items, keys, callbackinner) {
      if (fetchAllCandidateData[keys][func.dbCons.FIELD_PERSON_ID] === personId) {
        item[func.dbCons.FIELD_FIRST_NAME] = firstName + ' ' + middleName + ' ' + lastName
        item[func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME] = items[func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME]
        item[func.dbCons.FIELD_CANDIDATE_ID] = items[func.dbCons.FIELD_CANDIDATE_ID]
        item[func.dbCons.FIELD_ID] = items[func.dbCons.FIELD_ID]
        item[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE] = items[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE]
        item[func.dbCons.FIELD_GD_GROUP_DETAILS_ID] = items[func.dbCons.FIELD_GD_GROUP_DETAILS_ID]
        item[func.dbCons.FIELD_STATUS] = items[func.dbCons.FIELD_STATUS]
        item[func.dbCons.FIELD_CANDIDATE_SOURCE_ID] = items[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]
        item[func.dbCons.FIELD_GD_TOPIC]= items[func.dbCons.FIELD_GD_TOPIC]
        item[func.dbCons.FIELD_UNIVERSITIES] = items[func.dbCons.FIELD_UNIVERSITIES]
        item[func.dbCons.FIELD_ACCESSOR_DETAILS] = items[func.dbCons.FIELD_ACCESSOR_DETAILS]
      }
      callbackinner()
    }, function (error) {
      if (error) {
        return callback(new Error().stack, fetchPersonEmailIds)
      } else {
        callback()
      }
    })
  }, function (error) {
    if (error) {
      return callback(new Error().stack, fetchPersonEmailIds)
    } else {
      getCandidateScoreFromScoreDetals(urlMap, fetchPersonEmailIds, function (error, scoreDetails) {
        if (error) return callback(new Error().stack, scoreDetails)
        if (!scoreDetails || scoreDetails.length === 0) {
          var scoreDetails = []
          callback(null, scoreDetails)
        } else {
          callback(null, scoreDetails)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'createpersonDetailsJson()', func.logCons.LOG_EXIT)
}

function getPersonDataFromPersonDetails (urlMap, fetchAllCandidateData, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getPersonDataFromPersonDetails()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_EMAIL_ADDRESS))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_FIRST_NAME))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_LAST_NAME))
  projection.push(dbOp.getProjectionJson(func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME))
  var personIDsFromGdDetails = func.getValuesArrayFromJson(func.dbCons.FIELD_PERSON_ID, fetchAllCandidateData)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, personIDsFromGdDetails), urlMap, func.dbCons.COLLECTION_PERSON_DETAILS, projection, function (error, fetchPersonEmailIds) {
    if (error) return callback(new Error().stack, fetchPersonEmailIds)
    if (!fetchPersonEmailIds || fetchPersonEmailIds.length === 0) {
      var fetchPersonEmailIds = []
      callback(null, fetchPersonEmailIds)
    } else {
      createpersonDetailsJson(urlMap, fetchPersonEmailIds, fetchAllCandidateData, function (error, personJSON) {
        if (error) return callback(new Error().stack, personJSON)
        if (!personJSON || personJSON.length === 0) {
          var personJSON = []
          callback(null, personJSON)
        } else {
          callback(null, personJSON)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getPersonDataFromPersonDetails()', func.logCons.LOG_EXIT)
}

function createcandidateJson (urlMap, fetchAllIDS, fetchPersonIds, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'createcandidateJson()', func.logCons.LOG_ENTER)
  async.forEachOf(fetchPersonIds, function (item, key, callback) {
    candidateId = item[func.dbCons.FIELD_ID]
    personId = item[func.dbCons.FIELD_PERSON_ID]
    candidateSourceIds = item[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]
    async.forEachOf(fetchAllIDS, function (items, keys, callbackinner) {
      if (fetchAllIDS[keys][func.dbCons.FIELD_CANDIDATE_ID] === candidateId) {
        item[func.dbCons.FIELD_PERSON_ID] = personId
        item[func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME] = items[func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME]
        item[func.dbCons.FIELD_CANDIDATE_ID] = items[func.dbCons.FIELD_CANDIDATE_ID]
        item[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE] = items[func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE]
        item[func.dbCons.FIELD_ID] = items[func.dbCons.FIELD_ID]
        item[func.dbCons.FIELD_GD_GROUP_DETAILS_ID] = items[func.dbCons.FIELD_GD_GROUP_DETAILS_ID]
        item[func.dbCons.FIELD_STATUS] = items[func.dbCons.FIELD_STATUS]
        item[func.dbCons.FIELD_CANDIDATE_SOURCE_ID] = candidateSourceIds
        item[func.dbCons.FIELD_GD_TOPIC]=  items[func.dbCons.FIELD_GD_TOPIC]
        item[func.dbCons.FIELD_UNIVERSITIES] = items[func.dbCons.FIELD_UNIVERSITIES]
        item[func.dbCons.FIELD_ACCESSOR_DETAILS] = items[func.dbCons.FIELD_ACCESSOR_DETAILS]
      }
      callbackinner()
    }, function (error) {
      if (error) {
        return callback(new Error().stack, fetchPersonIds)
      } else {
        callback()
      }
    })
  }, function (error) {
    if (error) {
      return callback(new Error().stack, fetchPersonIds)
    } else {
      getPersonDataFromPersonDetails(urlMap, fetchPersonIds, function (error, personsData) {
        if (error) return callback(new Error().stack, personsData)
        if (!personsData || personsData.length === 0) {
          var personsData = []
          callback(null, personsData)
        } else {
          callback(null, personsData)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'createcandidateJson()', func.logCons.LOG_EXIT)
}

function getPersonIdFromPersonDetails (urlMap, fetchAllIDS, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getPersonIdFromPersonDetails()', func.logCons.LOG_ENTER)
  var candidateIDsFromGdDetails = func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_ID, fetchAllIDS)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PERSON_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidateIDsFromGdDetails), urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, projection, function (error, fetchPersonIds) {
    if (error) return callback(new Error().stack, fetchPersonIds)
    if (!fetchPersonIds || fetchPersonIds.length === 0) {
      var fetchPersonIds = []
      callback(null, fetchPersonIds)
    } else {
      createcandidateJson(urlMap, fetchAllIDS, fetchPersonIds, function (error, candidateJSON) {
        if (error) return callback(new Error().stack, fetchAllIDS)
        if (!candidateJSON || candidateJSON.length === 0) {
          var candidateJSON = []
          callback(null, candidateJSON)
        } else {
          callback(null, candidateJSON)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getPersonIdFromPersonDetails()', func.logCons.LOG_EXIT)
}
GetCandidateListForAssessor.prototype.getCandidateList = function (req, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateList()', func.logCons.LOG_ENTER)
  var gdGroupDetailsIDs = req.body[func.dbCons.FIELD_GD_GROUP_DETAILS_ID]
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_STATUS, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_GD_GROUP_DISPLAY_NAME, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_GD_GROUP_DETAILS_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_GD_TOPIC, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_GD_CANDIDATE_SEQUENCE, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_UNIVERSITIES, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ACCESSOR_DETAILS, true, true))
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_GD_GROUP_DETAILS_ID, func.lightBlueCons.OP_IN, gdGroupDetailsIDs))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, func.dbCons.COLLECTION_GD_GROUP_DETAILS, projection, function (error, fetchAllIDS) {
    if (error) return callback(new Error().stack, fetchAllIDS)
    if (!fetchAllIDS || fetchAllIDS.length === 0) {
      var fetchAllIDS = []
      callback(null, fetchAllIDS)
    } else {
      getPersonIdFromPersonDetails(urlMap, fetchAllIDS, function (error, personDetailData) {
        if (error) return callback(new Error().stack, personDetailData)
        if (!personDetailData || personDetailData.length === 0) {
          var personDetailData = []
          callback(null, personDetailData)
        } else {
          callback(null, personDetailData)
        }
      })
    }
  })

  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateList()', func.logCons.LOG_EXIT)
}
exports.GetCandidateListForAssessor = GetCandidateListForAssessor
