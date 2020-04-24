var func = require('../utils/functions')
var async = require('async')
var HELPERS_CONST_STATUS = 'HS_CDLH_'
var config = func.config.get('front_end')
var DbOperation = require('./db-operations').DbOperation
var dbOp = new DbOperation()

var nunjucks = require('nunjucks')
var pdf = require('html-pdf')
var smtp = func.config.get('smtp')
var nodemailer = require('nodemailer')
var dest = func.config.get('report')
var EmailTemplates = require('swig-email-templates')
var templates = new EmailTemplates()
var dynamicDomain = func.config.get('mail_domain_dynamic')
var smtpTransport = nodemailer.createTransport(smtp)
var bcc_email = func.config.get('_in_bcc_email')
var smtpSrkCareer = func.config.get('smtp_srkCareer')
var smtpSrkCareerTransport = nodemailer.createTransport(smtpSrkCareer)
var demoHirest = func.config.get('smtp_demo')
var demoHirestTransport = nodemailer.createTransport(demoHirest)

const smtpConnections = {
  'app': smtpSrkCareerTransport,
  'demo': demoHirestTransport,
  'career': smtpSrkCareerTransport,
  undefined: smtpTransport
}

HELPER_CONS = 'HS_CDLH_'

EmailVerificationHelpers = require('../helpers/email-verification-helpers').EmailVerificationHelpers
var emailVerificationHelpers = new EmailVerificationHelpers()
var configJson = func.config.get('mail_domains')
var isResetPwd = true

function CampusDriveListHelper() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of campus driver helper data helper')
}

/*
 * getCampusData() Method for get campus drive list
 */

CampusDriveListHelper.prototype.getCampusData = function (urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCampusDriveList()', func.logCons.LOG_ENTER)
  getCampusDriveList(urlMap, function (error, CampusDriveList) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCampusDriveList = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveList()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, CampusDriveList)
    } else {
      if (!CampusDriveList) {
        return callback(null, func.responseGenerator(CampusDriveList, HELPERS_CONST_STATUS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_CAMPUS_DRIVE_DETAILS_UPDATED))
      }
      var respJSONArray = []
      async.forEachOf(CampusDriveList, function (campusDetail, key, callbackInnerCap) {
        var respJSON = {}
        getTpoUserList(campusDetail[func.dbCons.CAMPUS_DRIVE_DETAILS_INSTITUTE_ID], urlMap, function (error, TpoUserList) {
          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getTpoUserList = ' + error)
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getTpoUserList()', func.logCons.LOG_EXIT)
            callbackInnerCap()
          } else {
            if (!TpoUserList || TpoUserList.length === 0) {
              respJSON[func.msgCons.FIELD_TPO_DETAILS_ARRAY] = TpoUserList
              respJSON[func.msgCons.FIELD_CAMPUS_DRIVE_LIST_ARRAY] = campusDetail
              respJSONArray.push(respJSON)
              callbackInnerCap()
            } else {
              async.forEachOf(TpoUserList, function (tpoDetail, key, callbackinnerTpo) {
                var userId = func.dbCons.FIELD_USER_ID
                getUserList(tpoDetail[userId], urlMap, function (error, UserList) {
                  if (error) {
                    func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getUserList = ' + error)
                    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserList()', func.logCons.LOG_EXIT)
                    callbackinnerTpo()
                  } else {
                    if (!UserList || UserList.length === 0) {
                      callbackinnerTpo()
                    } else {
                      TpoUserList[key][func.dbCons.FIELD_USER_NAME] = UserList[0].profile_data.name
                      TpoUserList[key][func.dbCons.FIELD_GIVEN_NAME] = UserList[0].profile_data.given_name
                      TpoUserList[key][func.dbCons.FIELD_LAST_NAME] = UserList[0].profile_data.family_name
                      var decryptEmail = UserList[0].profile_data.email
                      decryptEmail = decryptEmail
                      TpoUserList[key][func.dbCons.FIELD_EMAIL] = decryptEmail
                      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'TpoUserList()', func.logCons.LOG_EXIT)
                      getInstituteList(campusDetail[func.dbCons.CAMPUS_DRIVE_DETAILS_INSTITUTE_ID], urlMap, function (error, UserList) {
                        if (error) {
                          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getUserList = ' + error)
                          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserList()', func.logCons.LOG_EXIT)
                          callbackinnerTpo()
                        } else {
                          if (!UserList || UserList.length === 0) {
                            callbackinnerTpo()
                          } else {
                            TpoUserList[key][func.dbCons.FIELD_INSTITUTE_NAME] = UserList[0].name
                            TpoUserList[key][func.dbCons.FIELD_WEBSITE_URL] = UserList[0][func.dbCons.FIELD_WEBSITE_URL]
                            TpoUserList[key][func.dbCons.FIELD_STATE] = UserList[0][func.dbCons.FIELD_STATE]
                            TpoUserList[key][func.dbCons.FIELD_ADDRESS] = UserList[0][func.dbCons.FIELD_ADDRESS]
                            TpoUserList[key][func.dbCons.FIELD_CITY] = UserList[0][func.dbCons.FIELD_CITY]
                            TpoUserList[key][func.dbCons.FIELD_ZIPCODE] = UserList[0][func.dbCons.FIELD_ZIPCODE]
                            TpoUserList[key][func.dbCons.FIELD_LANDLINE_NUMBER] = UserList[0][func.dbCons.FIELD_LANDLINE_NUMBER]
                            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'TpoUserList()', func.logCons.LOG_EXIT)
                            callbackinnerTpo()
                          }
                        }
                      })
                    }
                  }
                })
              }, function (error) {
                if (error) {
                  func.printLog(func.logCons.LOG_LEVEL_ERROR, 'generateResponseJson = ' + error)
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateResponseJson()', func.logCons.LOG_EXIT)
                } else {
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateResponseJson()', func.logCons.LOG_EXIT)
                  respJSON[func.msgCons.FIELD_TPO_DETAILS_ARRAY] = TpoUserList
                  respJSON[func.msgCons.FIELD_CAMPUS_DRIVE_LIST_ARRAY] = campusDetail
                  respJSONArray.push(respJSON)
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'TpoUserList()', func.logCons.LOG_EXIT)
                  callbackInnerCap()
                }
              })
            }
          }
        })
      }, function (error) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'hello = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'hello()', func.logCons.LOG_EXIT)
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'hello()', func.logCons.LOG_EXIT)
          return callback(null, func.responseGenerator(respJSONArray, HELPERS_CONST_STATUS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_INSTITUTE_DETAILS_UPDATED))
        }
      })
    }
  })
}

CampusDriveListHelper.prototype.changeCandidateExamStatus = function (campusDriveId, examStatus, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'changeCandidateExamStatus()', func.logCons.LOG_ENTER)
  dbOp.findByKey(func.dbCons.FIELD_CAMPUS_DRIVE_ID, func.lightBlueCons.OP_EQUAL, campusDriveId, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function (error, candidateSourceDocument) {
    if (error) return callback(new Error().stack, candidateSourceDocument)
    else if (!candidateSourceDocument || candidateSourceDocument.length === 0) {
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_PROPER_DATA), HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_PROPER_DATA))
    } else {
      var jsonToUpdate = {}
      jsonToUpdate[func.dbCons.CANDIDATE_EXAM_DETAILS_STATUS] = getEnumStatusFromValue(examStatus.toUpperCase())
      let query = []
      query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_EQUAL, candidateSourceDocument[0][func.dbCons.FIELD_ID]))
      let verifyStatus = getStatusToBeChecked(examStatus)
      query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_IN, verifyStatus))
      dbOp.update(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_EXAM_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getOperationJson(func.lightBlueCons.OP_SET, jsonToUpdate), dbOp.getCommonProjection(), function (error, updatedCandidateExam) {
        if (error) return callback(new Error().stack, updatedCandidateExam)
        else if (!updatedCandidateExam || updatedCandidateExam.length === 0) {
          return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_UPDATE_DATA), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_UPDATE_DATA))
        } else {
          callback(null, updatedCandidateExam)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'changeCandidateExamStatus()', func.logCons.LOG_EXIT)
}

function getStatusToBeChecked(examStatus) {
  var responseArray = []
  if (getEnumStatusFromValue(examStatus.toUpperCase()) === func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_AVAILABLE) {
    responseArray.push(func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_PUBLISHED)
  } else {
    responseArray.push(func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_IN_PROGRESS)
    responseArray.push(func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_COMPLETED)
    responseArray.push(func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_SYSTEM_CLOSED)
    responseArray.push(func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_AVAILABLE)
  }
  return responseArray
}

function getEnumStatusFromValue(value) {
  switch (value) {
    case func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_AVAILABLE:
      return func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_AVAILABLE
    case func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_IN_PROGRESS:
      return func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_IN_PROGRESS
    case func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_COMPLETED:
      return func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_COMPLETED
    case func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_SYSTEM_CLOSED:
      return func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_SYSTEM_CLOSED
    case func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_CLOSED:
      return func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_CLOSED
    default:
      return -1
  }
}

function getInstituteList(id, urlMap, callback) {
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, id), urlMap, func.dbCons.COLLECTION_INSTITUTE_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting institute details = ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else if (response === undefined) {
      return callback(new Error().stack, [])
    } else if (response.length === 0) {
      return callback(null, [])
    } else {
      callback(null, response)
    }
  })
}

function getCampusDriveList(urlMap, callback) {
  dbOp.findByQuery(null, urlMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting Campus details = ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else if (response === undefined) {
      return callback(new Error().stack, [])
    } else if (response.length === 0) {
      return callback(null, [])
    } else {
      callback(null, response)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCampusDriveList()', func.logCons.LOG_EXIT)
}

function getTpoUserList(id, urlMap, callback) {
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_INSTITUTE_ID, func.lightBlueCons.OP_EQUAL, id), urlMap, func.dbCons.COLLECTION_TPO_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting tpo details = ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else if (response === undefined) {
      return callback(new Error().stack, [])
    } else if (response.length === 0) {
      return callback(null, [])
    } else {
      callback(null, response)
    }
  })
}

function getUserList(userCode, urlMap, callback) {
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_USER_CODE, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PROFILE_DATA, true, true))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, userCode), urlMap, func.dbCons.COLLECTION_USER_DETAILS, projection, function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting user details = ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else if (response === undefined) {
      return callback(new Error().stack, [])
    } else if (response.length === 0) {
      return callback(null, [])
    } else {
      return callback(null, response)
    }
  })
}

/*
 * updateCampusDriveListStatus() Method for update campus drive list Status
 */

CampusDriveListHelper.prototype.updateCampusDriveListStatus = function (campusId, urlMap, body, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateCampusDriveListStatus()', func.logCons.LOG_ENTER)
  var status = body[func.dbCons.FIELD_STATUS]
  if (status == 4) {
    updateSignupCandidateUrl(campusId, body, urlMap, status, env, function (error, outputJson) {
      if (error) {
        return callback(new Error().stack, outputJson)
      } else {
        callback(null, outputJson)
      }
    })
  } else {
    updateStatus(campusId, env, body, urlMap, status, function (error, response) {
      if (error) {
        return callback(new Error().stack, response)
      } else {
        callback(null, response)
      }
    })
  }
}

/*
 * updateSignupCandidateUrl() Method get called by updateCampusDriveListStatus for update campus drive list Status and candidate_url_link
 */

function updateSignupCandidateUrl(instituteId, body, urlMap, status, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateSignupCandidateUrl()', func.logCons.LOG_ENTER)
  var path = '/user/cs/' + instituteId
  var url = func.generateUrl(config[func.configCons.FIELD_PROTOCOL], config[func.configCons.FIELD_HOST], config[func.configCons.FIELD_PORT], env, urlMap, path)
  var json = {}
  json['candidate_signup_url'] = url
  dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CAMPUS_ID, func.lightBlueCons.OP_EQUAL, instituteId), urlMap, 'campus_drive_details', dbOp.getOperationJson(func.lightBlueCons.OP_SET, json), dbOp.getCommonProjection(), function (error, modifiedCount) {
    if (error) return callback(new Error().stack, modifiedCount)
    else if (modifiedCount.length == 0) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'modified counts:' + JSON.stringify(modifiedCount))
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.ERROR_CODE_ASH_DATA_INSERT, func.msgCons.ERROR_MSG_ASH_DATA_UPDATE + func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS), func.msgCons.ERROR_CODE_ASH_DATA_INSERT, func.msgCons.ERROR_MSG_ASH_DATA_UPDATE + func.msgCons.SURVEY_DETAILS))
    } else {
      updateStatus(instituteId, env, body, urlMap, status, function (error, response) {
        if (error) {
          return callback(new Error().stack, response)
        } else {
          callback(null, response)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateSignupCandidateUrl()', func.logCons.LOG_EXIT)
}

/*
 * updateStatus() Method get called by updateCampusDriveListStatus for update campus drive list Status only
 */

function updateStatus(campusId, env, body, urlMap, status, callback) {
  var json = {}
  json[func.dbCons.FIELD_STATUS] = status
  dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CAMPUS_ID, func.lightBlueCons.OP_EQUAL, campusId), urlMap, 'campus_drive_details', dbOp.getOperationJson(func.lightBlueCons.OP_SET, json), dbOp.getCommonProjection(), function (error, modifiedCount) {
    if (error) return callback(new Error().stack, modifiedCount)
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'modified counts:' + JSON.stringify(modifiedCount))
    if (modifiedCount === 0) {
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.ERROR_CODE_ASH_DATA_INSERT, func.msgCons.ERROR_MSG_ASH_DATA_UPDATE + func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS), func.msgCons.ERROR_CODE_ASH_DATA_INSERT, func.msgCons.ERROR_MSG_ASH_DATA_UPDATE + func.msgCons.SURVEY_DETAILS))
    } else {
      if (status == 8 && body[func.dbCons.FIELD_INSTITUTE_ID] !== undefined) {
        getTpoDetails(body.institute_id, urlMap, function (error, tpoData) {
          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getUserList = ' + error)
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserList()', func.logCons.LOG_EXIT)
            callback(error)
          } else {
            var user_code = []
            async.forEachOf(tpoData, function (userCode, index, callbackinner) {
              user_code.push(userCode.user_id)
              callbackinner()
            },
              function (error) {
                if (error) {
                  return callback(new Error().stack, tpoData)
                }
              })
            getTpoEmail(user_code, urlMap, function (error, email) {
              if (error) {
                func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getUserList = ' + error)
                func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserList()', func.logCons.LOG_EXIT)
                callback(error)
              } else {
                var emailId = []
                async.forEachOf(email, function (mail_id, index, callbackinner) {
                  emailId.push(mail_id[func.dbCons.FIELD_PROFILE].email)
                  callbackinner()
                },
                  function (error) {
                    if (error) {
                      return callback(new Error().stack, email)
                    }
                  }
                )
                var send_in_to = emailId[0]
                var send_in_cc = ''
                if (emailId.length > 1) {
                  emailId.shift()
                  async.forEachOf(emailId, function (email, index, callbackinner) {
                    if (email !== undefined) {
                      send_in_cc = email + ',' + send_in_cc
                    }
                    callbackinner()
                  },
                    function (error) {
                      if (error) {
                        return callback(new Error().stack, emailId)
                      }
                    }
                  )
                }
                requestJson = {}
                requestJson['name'] = email[0][func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_GIVEN_NAME]
                requestJson['link'] = body.link
                requestJson['email'] = send_in_to
                requestJson['CC'] = send_in_cc
                requestJson['candidate_details'] = body.candidate_details
                // requestJson['candidate_details']=body.candidate_details
                sendMail(env, urlMap, requestJson, function (error, response) {
                  if (error) {
                    return callback(new Error().stack, func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
                  } else {
                    func.printLog(func.logCons.LOG_LEVEL_INFO, 'mail sent successully')
                    //  callback(null, modifiedCount)
                  }
                })
              }
            })
          }
        })
        callback(null, modifiedCount)
      } else {
        callback(null, modifiedCount)
      }
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateCampusDriveListStatus()', func.logCons.LOG_EXIT)
}

function getTpoDetails(instituteId, urlMap, callback) {
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_INSTITUTE_ID, func.lightBlueCons.OP_EQUAL, instituteId), urlMap, func.dbCons.COLLECTION_TPO_DETAILS, dbOp.getCommonProjection(), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting tpo user details = ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else {
      return callback(null, response)
    }
  })
}

function getTpoEmail(userCode, urlMap, callback) {
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_IN, userCode), urlMap, func.dbCons.COLLECTION_USER_DETAILS, dbOp.getCommonProjection(), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting tpo user details = ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else {
      return callback(null, response)
    }
  })
}

function sendMail(env, urlMap, body, callback) {
  var path = '/auth/candidate-login'
  var url = func.generateUrl(config[func.configCons.FIELD_PROTOCOL], config[func.configCons.FIELD_HOST], config[func.configCons.FIELD_PORT], env, urlMap, path)
  var email = body.email
  var fullName = body
  fullName['url'] = url
  fullName['CC'] = body.CC
  fullName['candidate_details'] = body.candidate_details
  emailVerificationHelpers.sendMailTpo(email, env, urlMap, fullName, configJson[func.configCons.FIELD_CONDUCTING_ENTRANCE_TEST_INTIMATION_FILE], func.msgCons.CAMPUS_INTIMATION_SUB_ENTRANCE_TEST, isResetPwd, function (err, resp) {
    if (err) {
      res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
      return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
    } else {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'mail sent successully')
      return callback(null, func.responseGenerator([], func.msgCons.CODE_UAM_SUCCESS, func.msgCons.MSG_UAM_MEMBER_INSERTED))
    }
  })
}

function updateStatusAndSendMail(campusId, urlMap, status, callback) {
  var json = {}
  json[func.dbCons.FIELD_STATUS] = status
  dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CAMPUS_ID, func.lightBlueCons.OP_EQUAL, campusId), urlMap, 'campus_drive_details', dbOp.getOperationJson(func.lightBlueCons.OP_SET, json), dbOp.getCommonProjection(), function (error, modifiedCount) {
    if (error) return callback(new Error().stack, modifiedCount)
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'modified counts:' + JSON.stringify(modifiedCount))
    if (modifiedCount === 0) {
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.ERROR_CODE_ASH_DATA_INSERT, func.msgCons.ERROR_MSG_ASH_DATA_UPDATE + func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS), func.msgCons.ERROR_CODE_ASH_DATA_INSERT, func.msgCons.ERROR_MSG_ASH_DATA_UPDATE + func.msgCons.SURVEY_DETAILS))
    } else {
      callback(null, modifiedCount)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateCampusDriveListStatus()', func.logCons.LOG_EXIT)
}

/*
 * Method to update gd proposed dates in campus_drive_detils collection
 */
CampusDriveListHelper.prototype.updateGdProposedDates = function (campusDriveId, urlMap, dateArray, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateGdProposedDates()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'campus drive id=' + campusDriveId + ' body=' + dateArray)
  updateProposedDates(campusDriveId, urlMap, dateArray, callback)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateGdProposedDates()', func.logCons.LOG_EXIT)
}

function updateProposedDates(campusDriveId, urlMap, dateArray, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateProposedDates()', func.logCons.LOG_ENTER)
  var json = {}
  json[func.dbCons.FIELD_GD_PROPOSED_DATES] = dateArray
  dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, campusDriveId), urlMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, dbOp.getOperationJson(func.lightBlueCons.OP_SET, json), dbOp.getCommonProjection(), function (error, modifiedCount) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'inside updateProposedDates() error', func.logCons.LOG_EXIT)
      return callback(new Error().stack, error)
    }
    if (modifiedCount === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'inside updateProposedDates() null error', func.logCons.LOG_EXIT)
      return callback(new Error().stack, [])
    } else {
      callback(null, modifiedCount)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateProposedDates()', func.logCons.LOG_EXIT)
}

/*
 * Post API to get Campus Drive Details for GD Proposed Dates
 */
CampusDriveListHelper.prototype.getCampusDriveData = function (urlMap, institueId, designation, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCampusDriveData()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'institue id=' + institueId + ' designation=' + designation)
  getCampusDetails(urlMap, institueId, designation, callback)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCampusDriveData()', func.logCons.LOG_EXIT)
}
/*
 * Post API to get for GD Selected Dates for PI
 */
CampusDriveListHelper.prototype.getGdSelectedDate = function (urlMap, institueId, designation, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getGdSelectedDate()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'institue id=' + institueId + ' designation=' + designation)
  getGdDetails(urlMap, institueId, designation, function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'inside getGdSelectedDate() error', func.logCons.LOG_EXIT)
      return callback(new Error().stack, error)
    } else if (response[func.dbCons.FIELD_GD_DATE] == 0 || response[func.dbCons.FIELD_GD_DATE] == undefined) {
      getCampusDetails(urlMap, institueId, designation, function (error, campusResponse) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'inside getCampusDetails() callback error', func.logCons.LOG_EXIT)
          return callback(new Error().stack, error)
        } else if (!campusResponse || campusResponse.length === 0) {
          return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_PROPER_DATA), HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_PROPER_DATA))
        } else {
          response[func.dbCons.FIELD_GD_DATE] = campusResponse[0]['gd_proposed_dates']
          return callback(null, response)
        }
      })
    } else {
      callback(null, response)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getGdSelectedDate()', func.logCons.LOG_EXIT)
}

function getGdDetails(urlMap, institueId, designation, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getGdDetails()', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_INSTITUTE_ID, func.lightBlueCons.OP_EQUAL, institueId))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_DESIGNATION, func.lightBlueCons.OP_EQUAL, designation))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, modifiedCount) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'inside getGdDetails() error', func.logCons.LOG_EXIT)
      return callback(new Error().stack, error)
    }
    if (modifiedCount === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'inside getGdDetails() null error', func.logCons.LOG_EXIT)
      return callback(new Error().stack, [])
    } else {
      // callback(null, modifiedCount)
      var campusId = modifiedCount[0][func.dbCons.FIELD_ID]
      getCandidateSrcId(urlMap, campusId, callback)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getGdDetails()', func.logCons.LOG_EXIT)
}

function getCandidateSrcId(urlMap, campusId, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateSrcId()', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CAMPUS_DRIVE_ID, func.lightBlueCons.OP_EQUAL, campusId))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, modifiedCount) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'inside getCandidateSrcId() error', func.logCons.LOG_EXIT)
      return callback(new Error().stack, error)
    }
    if (modifiedCount === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'inside getCandidateSrcId() null error', func.logCons.LOG_EXIT)
      return callback(new Error().stack, [])
    } else {
      var candidateSrcId = modifiedCount[0][func.dbCons.FIELD_ID]
      getGdDate(urlMap, candidateSrcId, callback)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateSrcId()', func.logCons.LOG_EXIT)
}

function getGdDate(urlMap, candidateSrcId, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getGdDate()', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_EQUAL, candidateSrcId))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, func.dbCons.COLLECTION_GD_GROUP_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, modifiedCount) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'inside getGdDate() error', func.logCons.LOG_EXIT)
      return callback(new Error().stack, error)
    }
    if (modifiedCount === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'inside getGdDate() null error', func.logCons.LOG_EXIT)
      return callback(new Error().stack, [])
    } else {
      if (modifiedCount.length == 0) {
        var json = {}
        json[func.dbCons.FIELD_GD_DATE] = 0
      } else {
        var gdDate = modifiedCount[0]['gd_date']
        var tmp = []
        tmp.push(gdDate)
        var json = {}
        json[func.dbCons.FIELD_GD_DATE] = tmp
      }
      callback(null, json)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getGdDate()', func.logCons.LOG_EXIT)
}

function getCampusDetails(urlMap, institueId, designation, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCampusDetails()', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_INSTITUTE_ID, func.lightBlueCons.OP_EQUAL, institueId))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_DESIGNATION, func.lightBlueCons.OP_EQUAL, designation))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, modifiedCount) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'inside getCampusDetails() error', func.logCons.LOG_EXIT)
      return callback(new Error().stack, error)
    }
    if (modifiedCount === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'inside getCampusDetails() null error', func.logCons.LOG_EXIT)
      return callback(new Error().stack, [])
    } else {
      callback(null, modifiedCount)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCampusDetails()', func.logCons.LOG_EXIT)
}

exports.CampusDriveListHelper = CampusDriveListHelper
