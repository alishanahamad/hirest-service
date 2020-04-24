var func = require('../utils/functions')

var async = require('async')
var dbOp
var HELPERS_CONST_STATUS = 'HS_IDH_'
EmailVerificationHelpers = require('../helpers/email-verification-helpers').EmailVerificationHelpers
var emailVerificationHelpers = new EmailVerificationHelpers()
var configJson = func.config.get('mail_domains')
var dynamicDomain = func.config.get('mail_domain_dynamic')

// var configJson = func.config.get('mail_domains');
var config = func.config.get('front_end')
var nunjucks = require('nunjucks')
var pdf = require('html-pdf')
var smtp = func.config.get('smtp')
var nodemailer = require('nodemailer')
var dest = func.config.get('report')
var EmailTemplates = require('swig-email-templates')
var templates = new EmailTemplates()
var HELPER_CONS = 'RS_RH_'
var smtpTransport = nodemailer.createTransport(smtp)
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

function InstituteDetailHelpers () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of institute details helper')
  DbOperation = require('./db-operations').DbOperation
  dbOp = new DbOperation()
}

InstituteDetailHelpers.prototype.getInstituteDetails = function (orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getInstituteDetails()', func.logCons.LOG_ENTER)

  getInstituteList(orgNameMap, function (error, InstituteList) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getInstituteList = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteList()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, InstituteList)
    } else {
      if (!InstituteList) {
        return callback(null, func.responseGenerator(resJson, HELPERS_CONST_STATUS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_INSTITUTE_DETAILS_UPDATED))
      }
      var respJSONArray = []
      async.forEachOf(InstituteList, function (item, key, callbackinnerIns) {
        var respJSON = {}
        var field = func.dbCons.FIELD_ID
        getTpoUserList(item[field], orgNameMap, function (error, TpoUserList) {
          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getTpoUserList = ' + error)
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getTpoUserList()', func.logCons.LOG_EXIT)
            callbackinnerIns()
          } else {
            if (!TpoUserList || TpoUserList.length === 0) {
              respJSON[func.msgCons.FIELD_TPO_DETAILS_ARRAY] = TpoUserList
              respJSON[func.msgCons.FIELD_INSTITUTE_DETAILS_ARRAY] = item
              respJSONArray.push(respJSON)
              callbackinnerIns()
            } else {
              async.forEachOf(TpoUserList, function (tpoDetail, key, callbackinnerTpo) {
                var userId = func.dbCons.FIELD_USER_ID
                getUserList(tpoDetail[userId], orgNameMap, function (error, UserList) {
                  if (error) {
                    func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getUserList = ' + error)
                    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserList()', func.logCons.LOG_EXIT)
                    callbackinnerTpo()
                  } else {
                    if (!UserList || UserList.length === 0) {
                      callbackinnerTpo()
                    } else {
                      TpoUserList[key][func.dbCons.FIELD_CONTACT_NO] = UserList[0].profile_data.contact
                      TpoUserList[key][func.dbCons.FIELD_USER_NAME] = UserList[0].profile_data.name
                      TpoUserList[key][func.dbCons.FIELD_USER_EMAIL] = UserList[0].profile_data.email
                      TpoUserList[key][func.dbCons.FIELD_FAMILY_NAME] = UserList[0][func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_FAMILY_NAME]
                      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserList()', func.logCons.LOG_EXIT)
                      callbackinnerTpo()
                    }
                  }
                })
              }, function (error) {
                if (error) {
                  func.printLog(func.logCons.LOG_LEVEL_ERROR, 'generateResponseJson = ' + error)
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateResponseJson()', func.logCons.LOG_EXIT)
                } else {
                  item.landline_number = item.landline_number
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateResponseJson()', func.logCons.LOG_EXIT)
                  respJSON[func.msgCons.FIELD_TPO_DETAILS_ARRAY] = TpoUserList
                  respJSON[func.msgCons.FIELD_INSTITUTE_DETAILS_ARRAY] = item
                  respJSONArray.push(respJSON)
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'TpoUserList()', func.logCons.LOG_EXIT)
                  callbackinnerIns()
                }
              })
            }
          }
        })
      }, function (error) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getInstituteList = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteList()', func.logCons.LOG_EXIT)
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteList()', func.logCons.LOG_EXIT)
          return callback(null, func.responseGenerator(respJSONArray, HELPERS_CONST_STATUS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_INSTITUTE_DETAILS_UPDATED))
        }
      })
    }
  })
}

function getInstituteList (orgNameMap, callback) {
  dbOp.findByQuery(null, orgNameMap, func.dbCons.COLLECTION_INSTITUTE_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true),
  function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting institute details = ' + JSON.stringify(error))
      return callback(new Error().stack, repsonse)
    } else if (response == undefined) {
      callback(new Error().stack, [])
    } else if (response.length === 0) {
      callback(null, [])
    } else {
      callback(null, response)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getInstituteDetails()', func.logCons.LOG_EXIT)
}

function getTpoUserList (id, orgNameMap, callback) {
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_INSTITUTE_ID, func.lightBlueCons.OP_EQUAL, id), orgNameMap, func.dbCons.COLLECTION_TPO_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting tpo details = ' + JSON.stringify(error))
      return callback(new Error().stack, repsonse)
    } else if (response == undefined) {
      callback(new Error().stack, [])
    } else if (response.length === 0) {
      callback(null, [])
    } else {
      callback(null, response)
    }
  })
}

function getUserList (userCode, orgNameMap, callback) {
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_USER_CODE, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PROFILE_DATA, true, true))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, userCode), orgNameMap, func.dbCons.COLLECTION_USER_DETAILS, projection, function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting user details = ' + JSON.stringify(error))
      return callback(new Error().stack, repsonse)
    } else if (response == undefined) {
      callback(new Error().stack, [])
    } else if (response.length === 0) {
      callback(null, [])
    } else {
      callback(null, response)
    }
  })
}

function updateUserStatus (urlMap, env, id, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateUserStatus()', func.logCons.LOG_ENTER)
  var userJSON = {}
  userJSON[func.dbCons.FIELD_PROFILE_DATA + '.' + func.dbCons.FIELD_EMAIL_VERIFIED] = true
  userJSON[func.dbCons.FIELD_USER_STATUS] = func.dbCons.ENUM_ACTIVE
  dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, id), urlMap, func.dbCons.COLLECTION_USER_DETAILS, dbOp.getOperationJson(func.lightBlueCons.OP_SET, userJSON), dbOp.getCommonProjection(), function (error, updatedUserDetail) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while updating campus drive details = ' + JSON.stringify(error))
      return callback(new Error().stack, updatedUserDetail)
    } else if (updatedUserDetail === 0) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, func.msgCons.ERROR_MSG_NO_CAMPUS_DRIVE_DETAILS_UPDATED)
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPERS_CONST_STATUS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_NO_CAMPUS_DRIVE_DETAILS_UPDATED), HELPERS_CONST_STATUS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_NO_CAMPUS_DRIVE_DETAILS_UPDATED))
    } else {
      var isResetPwd = true
      var path = '/auth/tpo-login'
      var url = func.generateUrl(config[func.configCons.FIELD_PROTOCOL], config[func.configCons.FIELD_HOST], config[func.configCons.FIELD_PORT], env, urlMap, path)
      var myJson = {}
      myJson[func.dbCons.FIELD_INSTITUTE_DETAILS_NAME] = updatedUserDetail[0][func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_NAME]
      myJson[func.dbCons.FIELD_PASSWORD] = updatedUserDetail[0][func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_FAMILY_NAME]
      url = url.replace(':' + config[func.configCons.FIELD_PORT],"")
      myJson[func.dbCons.FIELD_URL] = url
      var email = updatedUserDetail[0][func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_EMAIL]
      myJson[func.dbCons.FIELD_EMAILID] = email
      emailVerificationHelpers.sendMailTpo(email, env, urlMap, myJson, configJson[func.configCons.FIELD_TPO_LOGIN_FILE], func.msgCons.LOGIN_CREDENTIALS, isResetPwd, function (err, resp) {
        if (err) {
          res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
          return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
        } else {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'mail sent successully')
          callback(null, updatedUserDetail)
          //   res.status(func.httpStatusCode.OK);
          //   return res.send(func.responseGenerator([], func.msgCons.CODE_UAM_SUCCESS, func.msgCons.MSG_UAM_MEMBER_INSERTED));
          // }
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateUserStatus()', func.logCons.LOG_EXIT)
}

function findUserStatus (urlMap, env, updatedCampusDriveDetail, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'findUserStatus()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_INSTITUTE_ID, func.lightBlueCons.OP_EQUAL, updatedCampusDriveDetail), urlMap, func.dbCons.COLLECTION_TPO_DETAILS,   dbOp.getCommonProjection(), function (error, fetchUserID) {
    if (error) return callback(new Error().stack, fetchUserID)
    if (!fetchUserID || fetchUserID.length === 0) {
      callback(null, fetchUserID)
    } else {
      updateUserStatus(urlMap, env, fetchUserID[0][func.dbCons.FIELD_USER_ID], function (error, updateJSON) {
        if (error) {
          return callback(new Error().stack, updateJSON)
        } else {
          callback(null, updateJSON)
        }
      })
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'findUserStatus()', func.logCons.LOG_EXIT)
    }
  })
}
InstituteDetailHelpers.prototype.updateInstituteDetails = function (instituteId, urlMap, env, body, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateInstituteDetails()', func.logCons.LOG_ENTER)
  dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, instituteId), urlMap, func.dbCons.COLLECTION_INSTITUTE_DETAILS, dbOp.getOperationJson(func.lightBlueCons.OP_SET, body), dbOp.getCommonProjection(), function (error, updatedInstituteDetail) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'updatedInstituteDetail:' + JSON.stringify(updatedInstituteDetail))
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while updating institute details = ' + JSON.stringify(error))
      return callback(new Error().stack)
    } else if (updatedInstituteDetail === 0) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, func.msgCons.ERROR_MSG_NO_INSTITUTE_DETAILS_UPDATED)
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPERS_CONST_STATUS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_NO_INSTITUTE_DETAILS_UPDATED), HELPERS_CONST_STATUS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_NO_INSTITUTE_DETAILS_UPDATED))
    } else {
      if (body[func.dbCons.FIELD_STATUS] !== 4) {
        var resJson = {}
        resJson[func.msgCons.RESPONSE_UPDATED] = updatedInstituteDetail
        callback(null, func.responseGenerator(resJson, HELPERS_CONST_STATUS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_INSTITUTE_DETAILS_UPDATED))
      } else {
        findUserStatus(urlMap, env, instituteId, function (error, updateJSON) {
          if (error) {
            return callback(new Error().stack, updateJSON)
          } else {
            var resJson = {}
            resJson[func.msgCons.RESPONSE_UPDATED] = updatedInstituteDetail
            callback(null, func.responseGenerator(resJson, HELPERS_CONST_STATUS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_INSTITUTE_DETAILS_UPDATED))
          }
        })
      }
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateInstituteDetails()', func.logCons.LOG_EXIT)
}

InstituteDetailHelpers.prototype.updateCampusDriveDetails = function (campusDriveId, urlMap, body, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateInstituteDetails()', func.logCons.LOG_ENTER)
  dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, campusDriveId), urlMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, dbOp.getOperationJson(func.lightBlueCons.OP_SET, body), dbOp.getCommonProjection(), function (error, updatedCampusDriveDetail) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'updatedCampusDriveDetail:' + JSON.stringify(updatedCampusDriveDetail))
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while updating campus drive details = ' + JSON.stringify(error))
      return callback(new Error().stack, updatedCampusDriveDetail)
    } else if (updatedCampusDriveDetail === 0) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, func.msgCons.ERROR_MSG_NO_CAMPUS_DRIVE_DETAILS_UPDATED)
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPERS_CONST_STATUS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_NO_CAMPUS_DRIVE_DETAILS_UPDATED), HELPERS_CONST_STATUS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_NO_CAMPUS_DRIVE_DETAILS_UPDATED))
    } else {
      var resJson = {}
      resJson[func.msgCons.RESPONSE_UPDATED] = updatedCampusDriveDetail
      var campusDriveId = resJson['Data updated'][0].id
      var instituteId = resJson['Data updated'][0].institute_id
      getSignUrl(campusDriveId, urlMap, function (error, url) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getUserList = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserList()', func.logCons.LOG_EXIT)
          callback(error)
        } else {
          generateReportByteStream(url[0], function (error, byteStream) {
            if (error) {
              return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST_FOR_BYTESTREAM, func.msgCons.MSG_ERROR_BYTESTREAM), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_ERROR_BYTESTREAM)) // need to ask about callback arguments
            } else {
              getTpoDetails(instituteId, urlMap, function (error, tpoData) {
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
                      let candidate_signup_url = resJson['Data updated'][0].candidate_signup_url
                      candidate_signup_url = candidate_signup_url.replace(":443","")
                      tpoData[0][func.dbCons.CAMPUS_DRIVE_DETAILS_SIGNUP_URL] = candidate_signup_url
                      tpoData[0][func.dbCons.FIELD_DESIGNATION] = url[0]['designation']
                      tpoData[0][func.dbCons.CANDIDATE_FIELD_QUALIFICATION] = url[0]['qualification']
                      var data
                      data = tpoData[0]
                      data[func.dbCons.FIELD_NAME] = email[0][func.dbCons.FIELD_PROFILE].nickname + ' ' + email[0][func.dbCons.FIELD_PROFILE].family_name
                      var orgName = urlMap[func.urlCons.PARAM_ORG_NAME]
                      sendEmail(orgName, emailId, configJson[func.configCons.FIELD_CAMPUS_PLACEMENT_OFFER], func.msgCons.PLACEMENT_OFFER_MAIL_SUB, tpoData[0], byteStream, dynamicDomain[urlMap[func.urlCons.PARAM_DOMAIN_NAME]], function (error, response) {
                        if (error) {
                          func.printLog(func.logCons.LOG_LEVEL_INFO, 'getQuizReport() email error:' + error) // verify the format of error
                          return callback(new Error().stack, response)
                        }
                        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getQuizReport()', func.logCons.LOG_EXIT)
                        callback(null, response)
                      })
                    }
                  })
                }
              })
            }
          })
        }
      })
      // callback(null, func.responseGenerator(resJson, HELPERS_CONST_STATUS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_CAMPUS_DRIVE_DETAILS_UPDATED))
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateCampusDriveDetails()', func.logCons.LOG_EXIT)
}

function getTpoEmail (userCode, urlMap, callback) {
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_IN, userCode), urlMap, func.dbCons.COLLECTION_USER_DETAILS,
   dbOp.getCommonProjection(),function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting tpo user details = ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else {
      return callback(null, response)
    }
  })
}

function getTpoDetails (instituteId, urlMap, callback) {
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_INSTITUTE_ID, func.lightBlueCons.OP_EQUAL, instituteId), urlMap, func.dbCons.COLLECTION_TPO_DETAILS,
     dbOp.getCommonProjection(),function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting tpo user details = ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else {
      return callback(null, response)
    }
  })
}

function getSignUrl (campusDriveId, urlMap, callback) {
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, campusDriveId), urlMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS,
     dbOp.getCommonProjection(), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting campus drive details = ' + JSON.stringify(error))
      return callback(new Error().stack, response)
    } else {
      return callback(null, response)
    }
  })
}

function generateReportByteStream (reportJSON, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateReportByteStream()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'reportJSON:' + JSON.stringify(reportJSON))
  nunjucks.configure(configJson[func.configCons.FIELD_CAMPUS_DRIVE_DETAILS])
  nunjucks.render(configJson[func.configCons.FIELD_CAMPUS_DRIVE_DETAILS_FILE], reportJSON, function (error, htmlfile) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'reportJSON in nunjucks:' + JSON.stringify(reportJSON))
    if (error) {
      return callback(new Error().stack)
    } else {
      var options = {
        'height': '842px', // allowed units: mm, cm, in, px
        'width': '700px',
        'timeout': 700000
      }
      pdf.create(htmlfile, options)
        .toBuffer(
          function (error, byteStream) {
            if (error) {
              func.printLog(func.logCons.LOG_LEVEL_INFO, 'generateReportByteStream() byteStream create:' + error)
              return callback(new Error().stack)
            }
            var context = {}
            context['title'] = 'PDF CREATED'
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateReportByteStream()', func.logCons.LOG_EXIT)
            callback(null, byteStream)
          })
    }
  })
}

function sendEmail (orgName, email, file, sub, context, byteStream, domain, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail() in quiz-helpers', func.logCons.LOG_ENTER)
  templates.render(file, context, function (error, html, text, subject) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, file, func.logCons.LOG_ENTER)
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Error in quiz-helpers', func.logCons.LOG_ENTER)
      return callback(new Error().stack)
    }
    if (func.validateEmail(email[0])) {
      // transporter.sendMail(mailOptions, function(error, response) {
      //   if (error) {
      //     return callback(new Error().stack, response)
      //   }
      //
      //
      //   func.printLog(func.logCons.LOG_LEVEL_INFO, 'sendEmail() email sent & response is:' + JSON.stringify(response))
      //   func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_EXIT)
      //   // return callback(null, 'Mail Sent');
      //   return callback(null, response)
      // })
      if (smtpConnections[orgName] !== undefined) {
        var mailOptions = generateMailOptions(email, sub, html, text, byteStream, domain, smtpConnections[orgName])
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'Mail configuration for ' + orgName + ' used')
        smtpConnections[orgName].sendMail(mailOptions, function (error, response) {
          if (error) {
            return callback('Error in sending Mail: ' + error)
          }
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Response ' + response)
          smtpConnections[orgName].close()
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_ENTER)
          return callback(null, response)
        })
      } else {
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'Default mail configuration used')
        var mailOptions = generateMailOptions(email, sub, html, text, byteStream, domain, smtpTransport)
        smtpTransport.sendMail(mailOptions, function (error, response) {
          if (error) {
            return callback('Error in sending Mail: ' + error)
          }
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Response ' + response)
          smtpTransport.close()
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_ENTER)
          return callback(null, response)
        })
      }
    } else {
      func.printLog(func.logCons.LOG_LEVEL_INFO, "No need to send mail - user haven't provide email")
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_EXIT)
      return callback(true, 'Mail Not Sent')
    }
  })
}

function generateMailOptions (to, sub, html, text, byteStream, domain, smtpObject) {
  var send_in_to = to[0]
  var send_in_cc = ''
  if (to.length > 1) {
    to.shift()
    async.forEachOf(to, function (email, index, callbackinner) {
      if (email !== undefined) {
        send_in_cc = email + ',' + send_in_cc
      }
      callbackinner()
    },
      function (error) {
        if (error) {
          return callback(new Error().stack, to)
        }
      }
    )
  }

  if (send_in_cc !== '' && send_in_cc !== undefined) {
    send_in_cc = domain[func.configCons.FIELD_CC] + ',' + send_in_cc
  } else {
    send_in_cc = domain[func.configCons.FIELD_CC]
  }
  var fromEmail = ''
  if (smtpObject['options']['auth']['user'] !== undefined) {
    fromEmail = smtpObject['options']['auth']['user']
  } else {
    fromEmail = '<no-reply@srkay.com>'
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailOptions()', func.logCons.LOG_ENTER)
  var attachments = {}
  attachments.filename = 'Placement Offer.pdf'
  attachments.content = new Buffer(byteStream, 'application/pdf')
  attachments.cid = send_in_to
  var mailOptions = {
    from: domain[func.dbCons.FIELD_NAME] + ' ' + fromEmail,
    to: send_in_to,
    cc: send_in_cc,
    bcc: domain[func.configCons.FIELD_BCC],
    subject: sub,
    html: html,
    attachments: attachments,
    text: text
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailOptions()', func.logCons.LOG_EXIT)
  return mailOptions
}

exports.InstituteDetailHelpers = InstituteDetailHelpers
