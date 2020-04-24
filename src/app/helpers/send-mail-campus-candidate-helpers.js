var func = require('../utils/functions')
var async = require('async')
var dbOp
var HELPERS_CONST_STATUS = 'HS_SMC_'
EmailVerificationHelpers = require('../helpers/email-verification-helpers').EmailVerificationHelpers
var emailVerificationHelpers = new EmailVerificationHelpers()
var configJson = func.config.get('mail_domains')

function SendMailCampusCandidatehelpers () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of user details helper')
  DbOperation = require('./db-operations').DbOperation
  dbOp = new DbOperation()
}
SendMailCampusCandidatehelpers.prototype.campusCandidateDetails = function (body, orgNameMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'campusCandidateDetails()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.CAMPUS_SOURCE_DETAILS_CAMPUS_ID, func.lightBlueCons.OP_EQUAL, body[func.dbCons.FIELD_ID]), orgNameMap, func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true), function (error, candidateSourceResponse) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while geting campus source details = ' + JSON.stringify(error))
      return callback(new Error().stack)
    } else if (candidateSourceResponse.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, func.msgCons.ERROR_MSG_NO_CANDIDATE_SOURCE_DETAILS_NOT_RETRIEVED)
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPERS_CONST_STATUS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_NO_CANDIDATE_SOURCE_DETAILS_NOT_RETRIEVED), HELPERS_CONST_STATUS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.SUCCESS_MSG_USER_DETAILS_NOT_FOUND))
    } else {
      dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_EQUAL, candidateSourceResponse[0]['id']), orgNameMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, dbOp.getProjectionJson(func.dbCons.COLLECTION_JSON_USER_ID, true, true), function (error, candidateDetailResponse) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while geting campus source details = ' + JSON.stringify(error))
          return callback(new Error().stack)
        } else if (candidateDetailResponse.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, func.msgCons.ERROR_MSG_NO_CANDIDATE_SOURCE_DETAILS_NOT_RETRIEVED)
          return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPERS_CONST_STATUS + func.msgCons.CODE_SERVER_OK, func.msgCons.ERROR_MSG_NO_CANDIDATE_SOURCE_DETAILS_NOT_RETRIEVED), HELPERS_CONST_STATUS + func.msgCons.CODE_SERVER_OK, func.msgCons.ERROR_MSG_NO_CANDIDATE_SOURCE_DETAILS_NOT_RETRIEVED))
        } else {
          var finalJson = {}
          var respJSONArray = []
          var personDetailsJson = {}
          personDetailsJson['name'] = body[func.dbCons.FIELD_NAME]
          personDetailsJson['course'] = body[func.dbCons.FIELD_COURSE]
          personDetailsJson['stream'] = body[func.dbCons.FIELD_STREAM]
          finalJson.user_details = personDetailsJson
          // respJSONArray.push(personDetailsJson);
          async.forEachOf(candidateDetailResponse, function (item, key, callbackinnerIns) {
            var responseJson = {}
            dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, item[func.dbCons.FIELD_USER_ID]), orgNameMap, func.dbCons.COLLECTION_USER_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, userDetailResponse) {
              if (error) {
                callbackinnerIns()
              } else if (userDetailResponse.length == 0) {
                callbackinnerIns()
              } else {
                userDetailResponse[0][func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_CONTACT] = userDetailResponse[0][func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_CONTACT]

                userDetailResponse[0][func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_USER_EMAIL] = userDetailResponse[0][func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_USER_EMAIL]
                respJSONArray.push(userDetailResponse[0][func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_USER_EMAIL])
                callbackinnerIns()
              }
            })
          }, function (error) {
            if (error) {
              func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error in async loop' + error)
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'error in async loop ', func.logCons.LOG_EXIT)
              return callback(new Error().stack)
            } else {
              finalJson.email_address = respJSONArray
              var isResetPwd = true
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'campus candidate detail ', func.logCons.LOG_EXIT)
              var campusDriveId = body[func.dbCons.FIELD_ID]
              getInstituteID(campusDriveId, orgNameMap, function (error, responseDriveID) {
                if (error) {
                  func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getUserList = ' + error)
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserList()', func.logCons.LOG_EXIT)
                  callback(error)
                } else {
                  var instituteId = responseDriveID[0].institute_id
                  getTpoUserCode(instituteId, orgNameMap, function (error, responseUserCode) {
                    if (error) {
                      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getUserList = ' + error)
                      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserList()', func.logCons.LOG_EXIT)
                      callback(error)
                    } else {
                      var user_code = []
                      async.forEachOf(responseUserCode, function (userCode, index, callbackinner) {
                        user_code.push(userCode.user_id)
                        callbackinner()
                      },
                        function (error) {
                          if (error) {
                            return callback(new Error().stack, responseUserCode)
                          }
                        })

                      getTpoEmail(user_code, orgNameMap, function (error, responseTpoEmail) {
                        if (error) {
                          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getUserList = ' + error)
                          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserList()', func.logCons.LOG_EXIT)
                          callback(error)
                        } else {
                          var emailId = []
                          async.forEachOf(responseTpoEmail, function (mail_id, index, callbackinner) {
                            emailId.push(mail_id[func.dbCons.FIELD_PROFILE].email)
                            callbackinner()
                          },
                            function (error) {
                              if (error) {
                                return callback(new Error().stack, responseTpoEmail)
                              }
                            })
                        }

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

                        finalJson['CC'] = send_in_cc

                        emailVerificationHelpers.sendMailTpo(send_in_to, env, orgNameMap, finalJson, configJson[func.configCons.FIELD_REGISTER_STUDENT_LIST], func.msgCons.TITLE_MSG_FOR_ENTRANCE_TEST, isResetPwd, function (err, resp) {
                          if (err) {
                            res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
                            return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
                          } else {
                            func.printLog(func.logCons.LOG_LEVEL_INFO, 'mail sent successully')
                            return callback(null, func.responseGenerator(finalJson, HELPERS_CONST_STATUS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MAIL_SEND_TO_TPO_SUCCESFULLY))
                          }
                        })
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

  func.printLog(func.logCons.LOG_LEVEL_INFO, 'campusCandidateDetails()', func.logCons.LOG_EXIT)
}

function getInstituteID (campusDriveId, urlMap, callback) {
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, campusDriveId), urlMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting campus drive details = ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else {
      return callback(null, response)
    }
  })
}

function getTpoUserCode (instituteId, urlMap, callback) {
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_INSTITUTE_ID, func.lightBlueCons.OP_EQUAL, instituteId), urlMap, func.dbCons.COLLECTION_TPO_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting tpo user details = ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else {
      return callback(null, response)
    }
  })
}

function getTpoEmail (userCode, urlMap, callback) {
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_IN, userCode), urlMap, func.dbCons.COLLECTION_USER_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting tpo user details = ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else {
      return callback(null, response)
    }
  })
}

exports.SendMailCampusCandidatehelpers = SendMailCampusCandidatehelpers
