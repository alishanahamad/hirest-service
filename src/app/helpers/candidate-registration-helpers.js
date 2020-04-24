var func = require('../utils/functions')
var dateFormat = require('dateformat')
LdapUtilityHelpers = require('../helpers/ldap-utility-helper').LdapUtilityHelpers
var ldaputilityhelpers = new LdapUtilityHelpers()
var DbOperation = require('./db-operations').DbOperation
var dbOp = new DbOperation()
var HELPER_CONS = 'HS_ESH_'

// //////////constructor
function CandidateRegisterHelpers () {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'obj created of candidate registarion helpers')
}

CandidateRegisterHelpers.prototype.candidateRegistration = function (dataencrpytion, userData, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'candidateRegistration()', func.logCons.LOG_ENTER)
  userData[func.msCons.FIELD_PERSON_DETAILS_BODY][func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS] = dataencrpytion[func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS]
  userData[func.msCons.FIELD_PERSON_DETAILS_BODY][func.dbCons.CANDIDATE_FIELD_MOBILE_NO] = dataencrpytion[func.dbCons.CANDIDATE_FIELD_MOBILE_NO]
  userData[func.msCons.FIELD_PERSON_DETAILS_BODY][func.dbCons.CANDIDATE_FIELD_ALT_MOBILE_NO] = dataencrpytion[func.dbCons.CANDIDATE_FIELD_ALT_MOBILE_NO]
  var campus_id = userData[func.dbCons.CANDIDATE_FIELD_CAMPUS_ID]
  checkCampusExistence(campus_id, urlMap, function (error, campusDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'checkCampusExistence = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkCampusExistence()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, campusDetails)
    } else if (!campusDetails || campusDetails.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkCampusExistence()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_NO_SUCH_CAMPUS_DRIVE_FOUND), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_NO_SUCH_CAMPUS_DRIVE_FOUND))
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkCampusExistence()', func.logCons.LOG_EXIT)
      saveCandidateData(userData, campus_id, urlMap, callback)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'candidateRegistration()', func.logCons.LOG_EXIT)
}

function checkCampusExistence (campus_id, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In checkCampusExistence()', func.logCons.LOG_ENTER)
  dbOp.findByKey(func.dbCons.FIELD_CAMPUS_ID, func.lightBlueCons.OP_EQUAL, campus_id, urlMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true),
    function (error, campusDetails) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'checkCampusExistence dbOperation = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkCampusExistence()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, campusDetails)
      } else if (!campusDetails || campusDetails.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkCampusExistence()', func.logCons.LOG_EXIT)
        return callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkCampusExistence()', func.logCons.LOG_EXIT)
        callback(null, campusDetails)
      }
    })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In checkCampusExistence()', func.logCons.LOG_EXIT)
}

function saveCandidateData (userData, campus_id, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In saveCandidateData()', func.logCons.LOG_ENTER)
  isCandidateAlreadyThere(userData[func.msCons.FIELD_PERSON_DETAILS_BODY], campus_id, urlMap, function (error, isCandidateExist) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'isCandidateAlreadyThere dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isCandidateAlreadyThere()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, isCandidateExist)
    } else if (!isCandidateExist || isCandidateExist.length === 0) {
      saveDataIntoPersonDetails(userData, campus_id, urlMap, callback)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isCandidateAlreadyThere()', func.logCons.LOG_EXIT)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, '**User Already Exist For this Campus**' + isCandidateExist)
      callback(null, true)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In saveCandidateData()', func.logCons.LOG_EXIT)
}

CandidateRegisterHelpers.prototype.deleteUser = function (userCode, isDeleteEncrDetails, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'deleteUser()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'usercode in helper is ' + userCode)
  func.printLog('Email Field: ' + func.dbCons.FIELD_USER_CODE)
  dbOp.delete(
    dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, userCode),
    urlMap, func.dbCons.COLLECTION_USER_DETAILS,
    function (error, response) {
      if (error) return callback(error)
      if (!isDeleteEncrDetails) return callback(null, response)
      var queryarray = []
      queryarray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ENTITY_UNIQUE_ID, func.lightBlueCons.OP_EQUAL, userCode))
      queryarray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ENTITY_NAME, func.lightBlueCons.OP_EQUAL, 'USER_PROFILE'))
      dbOp.delete(dbOp.getOperationJson(func.lightBlueCons.OP_AND, queryarray), urlMap, func.dbCons.COLLECTION_APP_ENCRYPTION_DETAILS, function (error, response) {
        if (error) return callback(error)
        return callback(null, response)
      })
    })
}

function getExistingPersonDetails (candidateData, campus_id, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In getExistingPersonDetails()', func.logCons.LOG_ENTER)
  var emailId = candidateData[func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS]
  dbOp.findByKey(func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS, func.lightBlueCons.OP_EQUAL, emailId, urlMap, func.dbCons.COLLECTION_PERSON_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true),
    function (error, personDetails) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getExistingPersonDetails dbOperation = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExistingPersonDetails()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, personDetails)
      } else if (!personDetails || personDetails.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExistingPersonDetails()', func.logCons.LOG_EXIT)
        return callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExistingPersonDetails()', func.logCons.LOG_EXIT)
        getExistingCandidateSrcId(personDetails, campus_id, urlMap, callback)
      }
    })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In getExistingPersonDetails()', func.logCons.LOG_EXIT)
}

function getExistingCandidateSrcId (PersonDetails, campus_id, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In getExistingCandidateSrcId()', func.logCons.LOG_ENTER)
  var personId = PersonDetails[0][func.dbCons.FIELD_ID]
  dbOp.findByKey(func.dbCons.FIELD_PERSON_ID, func.lightBlueCons.OP_EQUAL, personId, urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true),
    function (error, candidateDetails) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getExistingCandidateSrcId dbOperation = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExistingCandidateSrcId()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, candidateDetails)
      } else if (!candidateDetails || candidateDetails.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExistingCandidateSrcId()', func.logCons.LOG_EXIT)
        return callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExistingCandidateSrcId()', func.logCons.LOG_EXIT)
        getExistingCampusId(candidateDetails, campus_id, urlMap, callback)
      }
    })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExistingCandidateSrcId()', func.logCons.LOG_EXIT)
}

function getExistingCampusId (candidateDetails, campus_id, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In getExistingCampusId()', func.logCons.LOG_ENTER)
  var candidateSrcId = candidateDetails[0][func.dbCons.FIELD_CANDIDATE_SOURCE_ID]
  func.printLog(func.logCons.LOG_LEVEL_INFO, '**existing candidateDetail id is**' + candidateSrcId)
  dbOp.findByKey(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, candidateSrcId, urlMap, func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true),
    function (error, candidateSourceDetails) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getExistingCampusId dbOperation = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExistingCampusId()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, candidateSourceDetails)
      } else if (!candidateSourceDetails || candidateSourceDetails.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExistingCampusId()', func.logCons.LOG_EXIT)
        return callback(null, [])
      } else {
        if (campus_id == candidateSourceDetails[0][func.dbCons.CAMPUS_SOURCE_DETAILS_CAMPUS_ID]) {
          callback(null, candidateSourceDetails)
        } else {
          callback(null, [])
        }
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExistingCampusId()', func.logCons.LOG_EXIT)
      }
    })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExistingCampusId()', func.logCons.LOG_EXIT)
}

function isCandidateAlreadyThere (candidateData, campus_id, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In isCandidateAlreadyThere()', func.logCons.LOG_ENTER)
  getExistingPersonDetails(candidateData, campus_id, urlMap, function (error, alreadyExistData) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getExistingPersonDetails dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExistingPersonDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, alreadyExistData)
    } else if (!alreadyExistData || alreadyExistData.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExistingPersonDetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExistingPersonDetails()', func.logCons.LOG_EXIT)
      callback(null, alreadyExistData)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In isCandidateAlreadyThere()', func.logCons.LOG_EXIT)
}

function isPersonAlreadyThere (personDetailsBody, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In isPersonAlreadyThere()', func.logCons.LOG_ENTER)
  var emailId = personDetailsBody[func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS]
  dbOp.findByKey(func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS, func.lightBlueCons.OP_EQUAL, emailId, urlMap, func.dbCons.COLLECTION_PERSON_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true),
    function (error, PersonDetails) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'isPersonAlreadyThere dbOperation = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isPersonAlreadyThere()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, PersonDetails)
      } else if (!PersonDetails || PersonDetails.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isPersonAlreadyThere()', func.logCons.LOG_EXIT)
        callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isPersonAlreadyThere()', func.logCons.LOG_EXIT)
        callback(null, PersonDetails)
      }
    })
}

function saveDataIntoPersonDetails (userData, campus_id, urlMap, callback) {
  isPersonAlreadyThere(userData[func.msCons.FIELD_PERSON_DETAILS_BODY], urlMap, function (error, personExists) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'isPersonAlreadyThere dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isPersonAlreadyThere()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, personExists)
    } else if (!personExists || personExists.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isPersonAlreadyThere()', func.logCons.LOG_EXIT)
      insertNewCandidate(userData, campus_id, urlMap, callback)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isPersonAlreadyThere()', func.logCons.LOG_EXIT)
      updateCandidateDataIntoPersonDetails(userData, urlMap, callback)
    }
  })
}

function updateCandidateDataIntoPersonDetails (userData, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In updateCandidateDataIntoPersonDetails()', func.logCons.LOG_ENTER)
  var emailId = userData[func.msCons.FIELD_PERSON_DETAILS_BODY][func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS]
  dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_EMAIL_ADDRESS, func.lightBlueCons.OP_EQUAL, userData[func.msCons.FIELD_PERSON_DETAILS_BODY][func.dbCons.FIELD_EMAIL_ADDRESS]), urlMap, func.dbCons.COLLECTION_PERSON_DETAILS, dbOp.getOperationJson(func.lightBlueCons.OP_SET, userData[func.msCons.FIELD_PERSON_DETAILS_BODY]), dbOp.getCommonProjection(), function (error, updatedPersonDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'updateCandidateDataIntoPersonDetails dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateDataIntoPersonDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, updatedPersonDetails)
    } else if (!updatedPersonDetails || updatedPersonDetails.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateDataIntoPersonDetails()', func.logCons.LOG_EXIT)
      callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateDataIntoPersonDetails()', func.logCons.LOG_EXIT)
      updateCandidateDataIntoUserDetails(userData, updatedPersonDetails, urlMap, callback)
    }
  })
}

function updateCandidateDataIntoCandidateDetails (userData, updatedPersonDetails, updatedUserDetails, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In updateCandidateDataIntoCandidateDetails()', func.logCons.LOG_ENTER)
  var candidateJSON = {}
  candidateJSON[func.dbCons.COLLECTION_JSON_PERSON_ID] = updatedPersonDetails[0].id
  candidateJSON[func.dbCons.COLLECTION_JSON_USER_ID] = updatedUserDetails[0].user_code
  isCampusIdAlreadyThere(userData[func.dbCons.CANDIDATE_FIELD_CAMPUS_ID], urlMap, function (error, isCandidateSourceDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'isCampusIdAlreadyThere dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isCampusIdAlreadyThere()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, isCandidateSourceDetails)
    } else if (!isCandidateSourceDetails || isCandidateSourceDetails.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isCampusIdAlreadyThere()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isCampusIdAlreadyThere()', func.logCons.LOG_EXIT)
      candidateJSON[func.dbCons.FIELD_CANDIDATE_SOURCE_ID] = isCandidateSourceDetails[0].id
      getDetailsFromCampusDrive(userData[func.dbCons.CANDIDATE_FIELD_CAMPUS_ID], urlMap, function (error, campusDetails) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getDetailsFromCampusDrive dbOperation = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromCampusDrive()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, campusDetails)
        } else if (!campusDetails || campusDetails.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromCampusDrive()', func.logCons.LOG_EXIT)
          return callback(null, [])
        } else {
          candidateJSON[func.dbCons.COLLECTION_JSON_COURSE] = campusDetails[0].course[0]
          candidateJSON[func.dbCons.COLLECTION_JSON_STREAM] = campusDetails[0].stream[0]
          candidateJSON[func.dbCons.COLLECTION_JSON_STATUS] = func.dbCons.ENUM_CANDIDATE_ACTIVATED
          candidateJSON[func.dbCons.COLLECTION_JSON_STAGE] = func.dbCons.ENUM_CANDIDATE_STAGE_ACTIVATED
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'campusDetails:' + JSON.stringify(campusDetails))
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'candidateJSON:' + JSON.stringify(candidateJSON))
          updateDataToCandidateDetails(candidateJSON, urlMap, function (error, candidateDetails) {
            if (error) {
              func.printLog(func.logCons.LOG_LEVEL_ERROR, 'updateDataToCandidateDetails dbOperation = ' + error)
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateDataToCandidateDetails()', func.logCons.LOG_EXIT)
              return callback(new Error().stack, candidateDetails)
            } else if (!candidateDetails || candidateDetails.length === 0) {
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateDataToCandidateDetails()', func.logCons.LOG_EXIT)
              callback(null, [])
            } else {
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateDataToCandidateDetails()', func.logCons.LOG_EXIT)
              updatedUserDetails[func.dbCons.FIELD_PERSON_ID] = candidateDetails[0][func.dbCons.FIELD_PERSON_ID]
              deleteLdapEntry(userData, urlMap, function (error, deletedData) {
                if (error) {
                  if (error === 1) {
                    func.printLog(func.logCons.LOG_LEVEL_ERROR, 'This problem occured during ldapdelete: ' + error)
                    return callback(new Error().stack, func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_LDAP_REMOVE))
                  } else if (error === 2) {
                    func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Please try after some time')
                    return callback(new Error().stack, func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, func.msgCons.CODE_OK, true))
                  }
                } else {
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Entry ' + deletedData.email + ' deleted successfully from LDAP')
                  callback(null, updatedUserDetails)
                }
              })
            }
          })
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In updateCandidateDataIntoCandidateDetails()', func.logCons.LOG_EXIT)
}

function deleteLdapEntry (userData, urlMap, callback) {
  var inputJSON = {}
  inputJSON[func.dbCons.FIELD_EMAIL] = userData[func.msCons.FIELD_PERSON_DETAILS_BODY][func.dbCons.FIELD_EMAIL_ADDRESS]
  inputJSON[func.ldapCons.FIELD_ORGANIZATION] = urlMap[func.urlCons.PARAM_ORG_NAME] + '_' + urlMap[func.urlCons.PARAM_DOMAIN_NAME]
  ldaputilityhelpers.ldapDeleteUser(inputJSON, callback)
}

function updateDataToCandidateDetails (candidateJSON, urlMap, callback) {
  var person_id = candidateJSON[func.dbCons.COLLECTION_JSON_PERSON_ID]
  isPersonIdInCandidateDetails(person_id, urlMap, function (error, existCandidateDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'isPersonIdInCandidateDetails dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isPersonIdInCandidateDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, existCandidateDetails)
    } else if (!existCandidateDetails || existCandidateDetails.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isPersonIdInCandidateDetails()', func.logCons.LOG_EXIT)
      callback(null, [])
    } else {
      dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, existCandidateDetails[0][func.dbCons.FIELD_ID]), urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, dbOp.getOperationJson(func.lightBlueCons.OP_SET, candidateJSON), dbOp.getCommonProjection(), function (error, updatedCandidateDetails) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'updateCandidateDataIntoUserDetails dbOperation = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateDataIntoUserDetails()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, updatedCandidateDetails)
        } else if (!updatedCandidateDetails || updatedCandidateDetails.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateDataIntoUserDetails()', func.logCons.LOG_EXIT)
          callback(null, [])
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateDataIntoUserDetails()', func.logCons.LOG_EXIT)
          callback(null, updatedCandidateDetails)
        }
      })
    }
  })
}

function isPersonIdInCandidateDetails (person_id, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In isPersonIdInCandidateDetails()', func.logCons.LOG_ENTER)
  dbOp.findByKey(func.dbCons.FIELD_PERSON_ID, func.lightBlueCons.OP_EQUAL, person_id, urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true),
    function (error, candidateDetails) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'isPersonIdInCandidateDetails dbOperation = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isPersonIdInCandidateDetails()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, candidateDetails)
      } else if (!candidateDetails || candidateDetails.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isPersonIdInCandidateDetails()', func.logCons.LOG_EXIT)
        callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isPersonIdInCandidateDetails()', func.logCons.LOG_EXIT)
        callback(null, candidateDetails)
      }
    })
}

function updateCandidateDataIntoUserDetails (userData, updatedPersonDetails, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In updateCandidateDataIntoUserDetails()', func.logCons.LOG_ENTER)
  var emailInDb = func.dbCons.FIELD_PROFILE_DATA + '.' + func.dbCons.FIELD_EMAIL
  var emailId = userData[func.msCons.FIELD_USER_DETAILS_BODY][func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_EMAIL]
  isUserAlreadyThere(emailId, emailInDb, urlMap, function (error, userDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'isUserAlreadyThere dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isUserAlreadyThere()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, userDetails)
    } else if (!userDetails || userDetails.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isUserAlreadyThere()', func.logCons.LOG_EXIT)
      callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isUserAlreadyThere()', func.logCons.LOG_EXIT)
      dbOp.update(dbOp.getQueryJsonForOp(emailInDb, func.lightBlueCons.OP_EQUAL, emailId), urlMap, func.dbCons.COLLECTION_USER_DETAILS, dbOp.getOperationJson(func.lightBlueCons.OP_SET, userData[func.msCons.FIELD_USER_DETAILS_BODY]), dbOp.getCommonProjection(), function (error, updatedUserDetails) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'updateCandidateDataIntoUserDetails dbOperation = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateDataIntoUserDetails()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, updatedUserDetails)
        } else if (!updatedUserDetails || updatedUserDetails.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateDataIntoUserDetails()', func.logCons.LOG_EXIT)
          callback(null, [])
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateDataIntoUserDetails()', func.logCons.LOG_EXIT)
          updateCandidateDataIntoCandidateDetails(userData, updatedPersonDetails, updatedUserDetails, urlMap, callback)
        }
      })
    }
  })
}

function isUserAlreadyThere (emailId, emailInDb, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In isUserAlreadyThere()', func.logCons.LOG_ENTER)
  dbOp.findByKey(emailInDb, func.lightBlueCons.OP_EQUAL, emailId, urlMap, func.dbCons.COLLECTION_USER_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true),
    function (error, userDetails) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'isUserAlreadyThere dbOperation = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isUserAlreadyThere()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, userDetails)
      } else if (!userDetails || userDetails.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isUserAlreadyThere()', func.logCons.LOG_EXIT)
        callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isUserAlreadyThere()', func.logCons.LOG_EXIT)
        callback(null, userDetails)
      }
    })
}

function insertNewCandidate (userData, campus_id, urlMap, callback) {
  var candidateJSON = {}
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In insertNewCandidate()', func.logCons.LOG_ENTER)
  saveDataToPersonDetails(userData[func.msCons.FIELD_PERSON_DETAILS_BODY], urlMap, function (error, insertedPersoncode) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'saveDataToPersonDetails dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDataToPersonDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, insertedPersoncode)
    } else if (!insertedPersoncode || insertedPersoncode.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDataToPersonDetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      candidateJSON[func.dbCons.COLLECTION_JSON_PERSON_ID] = insertedPersoncode[0].id
      saveDatatoUserDetails(userData[func.msCons.FIELD_USER_DETAILS_BODY], urlMap, function (error, insertedUserCode) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'saveDatatoUserDetails dbOperation = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDatatoUserDetails()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, insertedUserCode)
        } else if (!insertedUserCode || insertedUserCode.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDatatoUserDetails()', func.logCons.LOG_EXIT)
          return callback(null, [])
        } else {
          saveDatatoUserRoleDetails(createUserRoleJSON(insertedUserCode[0].user_code), urlMap, function (error, userRoleResponse) {
            if (error) {
              func.printLog(func.logCons.LOG_LEVEL_ERROR, 'saveDatatoUserRoleDetails dbOperation = ' + error)
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDatatoUserRoleDetails()', func.logCons.LOG_EXIT)
              return callback(new Error().stack, userRoleResponse)
            } else if (!userRoleResponse || userRoleResponse.length === 0) {
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDatatoUserRoleDetails()', func.logCons.LOG_EXIT)
              return callback(null, [])
            } else {
              candidateJSON[func.dbCons.COLLECTION_JSON_USER_ID] = insertedUserCode[0].user_code
              isCampusIdAlreadyThere(campus_id, urlMap, function (error, isCampusIdAlreadyThereResponse) {
                if (error) {
                  func.printLog(func.logCons.LOG_LEVEL_ERROR, 'isCampusIdAlreadyThere dbOperation = ' + error)
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isCampusIdAlreadyThere()', func.logCons.LOG_EXIT)
                  return callback(new Error().stack, isCampusIdAlreadyThereResponse)
                } else if (!isCampusIdAlreadyThereResponse || isCampusIdAlreadyThereResponse.length === 0) {
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isCampusIdAlreadyThere()', func.logCons.LOG_EXIT)
                  return callback(null, [])
                } else {
                  candidateJSON[func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID] = isCampusIdAlreadyThereResponse[0].id
                  getDetailsFromCampusDrive(campus_id, urlMap, function (error, campusDriveResponse) {
                    if (error) {
                      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getDetailsFromCampusDrive dbOperation = ' + error)
                      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromCampusDrive()', func.logCons.LOG_EXIT)
                      return callback(new Error().stack, campusDriveResponse)
                    } else if (!campusDriveResponse || campusDriveResponse.length === 0) {
                      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromCampusDrive()', func.logCons.LOG_EXIT)
                      return callback(null, [])
                    } else {
                      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'campusDriveResponse:' + JSON.stringify(campusDriveResponse), func.logCons.LOG_ENTER)
                      candidateJSON[func.dbCons.COLLECTION_JSON_COURSE] = campusDriveResponse[0].course[0]
                      candidateJSON[func.dbCons.COLLECTION_JSON_STREAM] = campusDriveResponse[0].stream[0]
                      candidateJSON[func.dbCons.COLLECTION_JSON_STATUS] = func.dbCons.ENUM_CANDIDATE_ACTIVATED
                      candidateJSON[func.dbCons.COLLECTION_JSON_STAGE] = func.dbCons.ENUM_CANDIDATE_STAGE_ACTIVATED
                      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'candidateJSON:' + JSON.stringify(candidateJSON), func.logCons.LOG_ENTER)
                      saveDataToCandidateDetails(candidateJSON, urlMap, function (error, candidateResponse) {
                        if (error) {
                          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'saveDataToCandidateDetails dbOperation = ' + error)
                          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDataToCandidateDetails()', func.logCons.LOG_EXIT)
                          return callback(new Error().stack, candidateResponse)
                        } else if (!candidateResponse || candidateResponse.length === 0) {
                          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDataToCandidateDetails()', func.logCons.LOG_EXIT)
                          return callback(null, [])
                        } else {
                          insertedUserCode[func.dbCons.FIELD_PERSON_ID] = candidateResponse[0][func.dbCons.FIELD_PERSON_ID]
                          callback(null, insertedUserCode)
                        }
                      })
                    }
                  })
                }
              })
            }
          })
        }
      })
    }
  })
}

function createUserRoleJSON (userCode) {
  var userRoleJSON = {}
  var entityDetails = {}
  var newDate = dateFormat(new Date(), func.dbCons.FIELD_LIGHTBLUE_DATE_FORMAT)
  userRoleJSON[func.dbCons.FIELD_ROLE_NAME] = func.dbCons.FIELD_CANDIDATE_ROLE_NAME
  entityDetails[func.dbCons.FIELD_ENTITY_DETAILS_ID] = userCode
  entityDetails[func.dbCons.FIELD_ENTITY_DETAILS_TYPE] = 'USER'
  userRoleJSON[func.dbCons.FIELD_ENTITY_DETAILS] = entityDetails
  userRoleJSON[func.dbCons.FIELD_EFFECTIVE_DATE_TO] = '9999-12-12T00:00:00.000+0530'
  userRoleJSON[func.dbCons.FIELD_EFFECTIVE_DATE_FROM] = newDate
  return userRoleJSON
}

function saveDatatoUserRoleDetails (userRoleDetailsBody, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In saveDatatoUserRoleDetails()', func.logCons.LOG_ENTER)
  var roleData = []
  generateDataToSave(userRoleDetailsBody, function (responseOfCandidateData) {
    roleData.push(userRoleDetailsBody)
    var projection = []
    projection.push(dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true))
    func.printLog(func.logCons.LOG_LEVEL_INFO, '**DATA TO BE SENT IN roleData**' + JSON.stringify(roleData))
    dbOp.insert(urlMap, func.dbCons.COLLECTION_USER_ROLE_DETAILS, roleData, projection, function (error, insertedCandidatecode) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'saveDatatoUserRoleDetails dbOperation = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDatatoUserRoleDetails()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, insertedCandidatecode)
      } else if (!insertedCandidatecode || insertedCandidatecode.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDatatoUserRoleDetails()', func.logCons.LOG_EXIT)
        return callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDatatoUserRoleDetails()', func.logCons.LOG_EXIT)
        callback(null, insertedCandidatecode)
      }
    })
  })
}

function saveDataToCandidateDetails (candidateDetailsBody, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In saveDataToCandidateDetails()', func.logCons.LOG_ENTER)
  var candidateData = []
  generateDataToSave(candidateDetailsBody, function (responseOfCandidateData) {
    candidateData.push(responseOfCandidateData)
    var projection = []
    projection.push(dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true))
    func.printLog(func.logCons.LOG_LEVEL_INFO, '**DATA TO BE SENT IN candidateData**' + JSON.stringify(candidateData))
    dbOp.insert(urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, candidateData, projection, function (error, insertedCandidatecode) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'saveDataToCandidateDetails dbOperation = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDataToCandidateDetails()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, insertedCandidatecode)
      } else if (!insertedCandidatecode || insertedCandidatecode.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDataToCandidateDetails()', func.logCons.LOG_EXIT)
        return callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDataToCandidateDetails()', func.logCons.LOG_EXIT)
        callback(null, insertedCandidatecode)
      }
    })
  })
}

function saveDatatoUserDetails (userDetailsBody, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In saveDatatoUserDetails()', func.logCons.LOG_ENTER)
  var dataUserDetails = []
  generateDataToSave(userDetailsBody, function (responseOfUserDetails) {
    dataUserDetails.push(responseOfUserDetails)
    func.printLog(func.logCons.LOG_LEVEL_INFO, '**DATA TO BE SENT IN USER DETAILS**' + JSON.stringify(dataUserDetails))
    var projection = []
    projection.push(dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true))
    dbOp.insert(urlMap, func.dbCons.COLLECTION_USER_DETAILS, dataUserDetails, projection, function (error, insertedUsercode) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'saveDatatoUserDetails dbOperation = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDatatoUserDetails()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, insertedUsercode)
      } else if (!insertedUsercode || insertedUsercode.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDatatoUserDetails()', func.logCons.LOG_EXIT)
        return callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDatatoUserDetails()', func.logCons.LOG_EXIT)
        callback(null, insertedUsercode)
      }
    })
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In saveDatatoUserDetails()', func.logCons.LOG_EXIT)
}

function saveDetailsToCampusSourceDetails (campusId, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In saveDetailsToCampusSourceDetails()', func.logCons.LOG_ENTER)
  var dataCampusSourceDetails = []
  var campusSourceDetails = {}
  campusSourceDetails[func.dbCons.CAMPUS_SOURCE_DETAILS_SOURCE_TYPE] = 'CAMPUS'
  campusSourceDetails[func.dbCons.CAMPUS_SOURCE_DETAILS_CAMPUS_ID] = campusId
  campusSourceDetails[func.dbCons.CAMPUS_SOURCE_DETAILS_WEB_URL] = 'dev-app.hirest.net'
  campusSourceDetails[func.dbCons.CAMPUS_SOURCE_DETAILS_STAFFING_REF_ID] = 0
  generateDataToSave(campusSourceDetails, function (responseOfCampusSourceData) {
    dataCampusSourceDetails.push(responseOfCampusSourceData)
    func.printLog(func.logCons.LOG_LEVEL_INFO, '**DATA TO BE SENT CAMPUS SOURCE DETAILS**' + JSON.stringify(dataCampusSourceDetails))
    var projection = []
    projection.push(dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true))
    dbOp.insert(urlMap, func.dbCons.COLLECTION_CAMPUS_SOURCE_DETAILS, dataCampusSourceDetails, projection, function (error, insertedCampusSourcecode) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'saveDetailsToCampusSourceDetails dbOperation = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDetailsToCampusSourceDetails()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, insertedCampusSourcecode)
      } else if (!insertedCampusSourcecode || insertedCampusSourcecode.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDetailsToCampusSourceDetails()', func.logCons.LOG_EXIT)
        return callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDetailsToCampusSourceDetails()', func.logCons.LOG_EXIT)
        callback(null, insertedCampusSourcecode)
      }
    })
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In saveDetailsToCampusSourceDetails()', func.logCons.LOG_EXIT)
}

function getDetailsFromCampusDrive (campusId, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In getDetailsFromCampusDrive()', func.logCons.LOG_ENTER)
  dbOp.findByKey(func.dbCons.CAMPUS_DRIVE_DETAILS_ID, func.lightBlueCons.OP_EQUAL, campusId, urlMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true),
    function (error, campusDriveResponse) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getDetailsFromCampusDrive dbOperation = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromCampusDrive()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, campusDriveResponse)
      } else if (!campusDriveResponse || campusDriveResponse.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromCampusDrive()', func.logCons.LOG_EXIT)
        return callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDetailsFromCampusDrive()', func.logCons.LOG_EXIT)
        callback(null, campusDriveResponse)
      }
    })
}

function isCampusIdAlreadyThere (campusId, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In isCampusIdAlreadyThere()', func.logCons.LOG_ENTER)
  dbOp.findByKey(func.dbCons.CAMPUS_SOURCE_DETAILS_CAMPUS_ID, func.lightBlueCons.OP_EQUAL, campusId, urlMap, func.dbCons.COLLECTION_CAMPUS_SOURCE_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true),
    function (error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'isCampusIdAlreadyThere dbOperation = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isCampusIdAlreadyThere()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, response)
      }
       else if (response!=undefined && response.length != 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'isCampusIdAlreadyThere()', func.logCons.LOG_EXIT)
        return callback(null,response)
      }
      else {
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'Response of isCampusIdAlreadyThere() ' + JSON.stringify(response))
        checkNULLResponse(response, function (responseFlag) {
          if (responseFlag) {
            saveDetailsToCampusSourceDetails(campusId, urlMap, function (error, insertedCampusSourcecode) {
              if (error) {
                func.printLog(func.logCons.LOG_LEVEL_ERROR, 'saveDetailsToCampusSourceDetails dbOperation = ' + error)
                func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDetailsToCampusSourceDetails()', func.logCons.LOG_EXIT)
                return callback(new Error().stack, insertedCampusSourcecode)
              } else if (!insertedCampusSourcecode || insertedCampusSourcecode.length === 0) {
                func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDetailsToCampusSourceDetails()', func.logCons.LOG_EXIT)
                return callback(null, [])
              } else {
                func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDetailsToCampusSourceDetails()', func.logCons.LOG_EXIT)
                callback(null, insertedCampusSourcecode)
              }
            })
          } else {
            callback(null, response)
          }
        })
      }
    })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In isCampusIdAlreadyThere()', func.logCons.LOG_EXIT)
}

function checkNULLResponse (response, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In checkNULLResponse()', func.logCons.LOG_ENTER)
  if (response.length <= 0) {
    callback(true)
  } else {
    callback(false)
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In checkNULLResponse()', func.logCons.LOG_EXIT)
}

function saveDataToPersonDetails (personDetailsBody, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'In saveDataToPersonDetails()', func.logCons.LOG_ENTER)
  var dataz = []
  generateDataToSave(personDetailsBody, function (responseOfPersonDetails) {
    dataz.push(responseOfPersonDetails)
    func.printLog(func.logCons.LOG_LEVEL_INFO, '**DATA TO BE SENT IN PERSON DETAILS**' + JSON.stringify(dataz))
    var projection = []
    projection.push(dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true))
    dbOp.insert(urlMap, func.dbCons.COLLECTION_CANDIDATE_PERSON_DETAILS, dataz, projection, function (error, insertedPersoncode) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'saveDataToPersonDetails dbOperation = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDataToPersonDetails()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, insertedPersoncode)
      } else if (!insertedPersoncode || insertedPersoncode.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDataToPersonDetails()', func.logCons.LOG_EXIT)
        return callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveDataToPersonDetails()', func.logCons.LOG_EXIT)
        callback(null, insertedPersoncode)
      }
    })
  })
}

function getUserCodeProjection () {
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_USER_CODE, true))
  return projection
}

function generateDataToSave (jsonData, callback) {
  jsonData[func.dbCons.COMMON_CREATED_BY] = 'URS'
  jsonData[func.dbCons.COMMON_UPDATED_BY] = 'URS'
  callback(jsonData)
}

function updateUserCode (userId) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'userid in userdata:' + userId)
  var json = {}
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'user unique json:' + JSON.stringify(json))
  dbOp.updateSequesnceIds(json, function (error, data) {})
}
/**
 * get number for gender from string
 *
 *
 * @param {String}  value of gender
 * @return {Integer} 0,1,2 depending on gender
 */
function convertGenderStringToNumber (gender) {
  if (!gender) return gender
  gender = gender.toLowerCase()
  if (gender === 'm' || gender === 'male') {
    return 1
  } else if (gender === 'f' || gender === 'female') {
    return 2
  } else if (gender === 'o' || gender === 'other') {
    return 3
  }
}
/**
 * get String for gender from number
 *
 * @param {Integer} 0,1,2 depending on value stored in DB
 * @return {String} gender value
 */
function convertNumberToGenderString (number) {
  if (number === 1) {
    return 'male'
  } else if (number === 2) {
    return 'female'
  } else if (number === 3) {
    return 'other'
  }
}
exports.CandidateRegisterHelpers = CandidateRegisterHelpers
exports.dbOp = dbOp
