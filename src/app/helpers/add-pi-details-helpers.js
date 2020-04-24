var func = require('../utils/functions')
var async = require('async')
var DbOperation = require('./db-operations').DbOperation
var dbOp = new DbOperation()
var smtp = func.config.get('smtp')
var nodemailer = require('nodemailer')
var smtpTransport = nodemailer.createTransport(smtp)
var EmailTemplates = require('swig-email-templates')
var templates = new EmailTemplates()
var dynamicDomain = func.config.get('mail_domain_dynamic')
var dateFormat = require('dateformat')
var mailConfig = func.config.get('mail_domains')
var uiConfig = func.config.get('front_end')
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
function AddPIDetails () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of add PI details helper')
}

function insertPIDetailsFromDB (urlMap, inputArray, body, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertPIDetailsFromDB()', func.logCons.LOG_ENTER)
  dbOp.insert(urlMap, func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, inputArray, dbOp.getCommonProjection(), function (error, insertCandidateDetails) {

    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'insertEntriesIntoDB : Error while inserting data : ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertEntriesIntoDB()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, insertCandidateDetails)
    } else if (!insertCandidateDetails || insertCandidateDetails.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'insertCandidateDetails() : No data inserted', func.logCons.LOG_EXIT)
      return callback(new Error().stack, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertCandidateDetails()', func.logCons.LOG_EXIT)
      callback(null, insertCandidateDetails)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertPIDetailsFromDB()', func.logCons.LOG_EXIT)
}

function getEnumPIDiscussionLevel (value) {
  switch (value) {
    case func.msCons.FIELD_ACROSS_INSTITUTE_LEVEL:
      return func.dbCons.ENUM_ACROSS_INSTITUTE_LEVEL_DISCUSSION
    case func.msCons.FIELD_INSTITUTE_LEVEL:
      return func.dbCons.ENUM_INSTITUTE_LEVEL_DISCUSSION
    default:
      return -1
  }
}

function getEnumPIAssessmentType (value) {
  switch (value) {
    case func.msCons.FIELD_FIRST_ROUND_FOR_PI:
      return func.dbCons.ENUM_FIRST_ROUND_FOR_PI
    default:
      return -1
  }
}

function getEnumForStatus (value) {
  switch (value) {
    case func.dbCons.VALUE_PI_ASSESSMENT_IN_DRAFT:
      return func.dbCons.ENUM_PI_ASSESSMENT_IN_DRAFT
    case func.dbCons.VALUE_PI_ASSESSMENT_COMPLETED:
      return func.dbCons.ENUM_PI_ASSESSMENT_COMPLETED
    case func.dbCons.VALUE_PI_ASSESSMENT_CREATED:
      return func.dbCons.ENUM_PI_ASSESSMENT_CREATED
    default:
      return -1
  }
}


function createIndividualCandidateJSON (urlMap, body, userCode, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'createIndividualCandidateJSON()', func.logCons.LOG_ENTER)
  var candidateDetailsJSON = body[func.dbCons.COLLECTION_CANDIDATE_DETAILS]
  var piAssesmentsJsons = []
  async.forEachOf(candidateDetailsJSON, function (items, keys, callbackinner) {
    generatePiAssessmentDetailJsons(body, items, userCode, function (error, assesmentDetailsJson) {
      if (error) return callback(new Error().stack, 'Error in generating PI Assessment JSONS')
      var temp = piAssesmentsJsons.concat(assesmentDetailsJson)
      piAssesmentsJsons = temp
      callbackinner()
    })
  }, function (error) {
    if (error) {
      return callback(new Error().stack, 'Error in creating jsons for insertion of PI assesments')
    } else {
      insertPIDetailsFromDB(urlMap, piAssesmentsJsons, body, function (error, insertPIDetailsJSON) {
        if (error) return callback(new Error().stack, insertPIDetailsJSON)
        if (!insertPIDetailsJSON || insertPIDetailsJSON.length === 0) {
          insertPIDetailsJSON = []
          callback(null, insertPIDetailsJSON)
        } else {
          callback(null, insertPIDetailsJSON)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'createIndividualCandidateJSON()', func.logCons.LOG_EXIT)
}

function generatePiAssessmentDetailJsons (body, items, userCode, cb) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generatePiAssessmentDetailJsons()', func.logCons.LOG_ENTER)
  var piAssesmentsJsons = []
  var assessors = body[func.dbCons.FIELD_ACCESSOR_DETAILS]
  async.forEachOf(assessors, function (assessor, index, callback) {
    var piAssessmentJson = {}
    piAssessmentJson[func.dbCons.FIELD_CANDIDATE_SOURCE_ID] = items[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]
    piAssessmentJson[func.dbCons.ASSESSOR_ID] = (!assessor) ? -1 : assessor[func.dbCons.ASSESSOR_ID]
    piAssessmentJson[func.dbCons.FIELD_ACCESSOR_DETAILS] = body[func.dbCons.FIELD_ACCESSOR_DETAILS]
    piAssessmentJson[func.dbCons.FIELD_PI_CANDIDATE_SEQUENCE]=items[func.dbCons.FIELD_PI_CANDIDATE_SEQUENCE]
    piAssessmentJson[func.dbCons.FIELD_ROUND_TYPE] = getEnumForRoundType(body[func.dbCons.FIELD_ROUND_TYPE])
    piAssessmentJson[func.dbCons.FIELD_PI_ASSESSMENT_TYPE] = getEnumPIAssessmentType(body[func.dbCons.FIELD_PI_ASSESSMENT_TYPE])
    piAssessmentJson[func.dbCons.FIELD_PI_INSTITUTE_LEVEL] = getEnumPIDiscussionLevel(body[func.dbCons.FIELD_PI_INSTITUTE_LEVEL])
    piAssessmentJson[func.dbCons.FIELD_UNIVERSITIES] = body[func.dbCons.FIELD_UNIVERSITIES]
    piAssessmentJson[func.dbCons.FIELD_PI_LOCATION] = body[func.dbCons.FIELD_PI_LOCATION]
    piAssessmentJson[func.dbCons.FIELD_PINCODE] = body[func.dbCons.FIELD_PINCODE]

    if (body[func.dbCons.UNIVERSITY_GROUP_NAME] !== undefined) {
      piAssessmentJson[func.dbCons.UNIVERSITY_GROUP_NAME] = body[func.dbCons.UNIVERSITY_GROUP_NAME]
    }
    piAssessmentJson[func.dbCons.FIELD_PI_DATE] = body[func.dbCons.FIELD_PI_DATE]
    piAssessmentJson[func.dbCons.FIELD_CAMPUS_STATUS] = body[func.dbCons.FIELD_CAMPUS_STATUS]
    piAssessmentJson[func.dbCons.FIELD_CANDIDATE_ID] = items[func.dbCons.FIELD_CANDIDATE_ID]
    piAssessmentJson[func.dbCons.FIELD_STATUS] = getEnumForStatus(body[func.dbCons.FIELD_STATUS])
    piAssessmentJson[func.dbCons.COMMON_CREATED_BY] = userCode
    piAssessmentJson[func.dbCons.COMMON_UPDATED_BY] = userCode
    piAssesmentsJsons.push(piAssessmentJson)
    callback()
  }, function (err) {
    if (err) return cb(new Error().stack)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `piAssesmentsJsons= ${JSON.stringify(piAssesmentsJsons)}`)
    cb(null, piAssesmentsJsons)
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generatePiAssessmentDetailJsons()', func.logCons.LOG_EXIT)
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
function createFinalJson (urlMap, candidateSourceIDs, body, userCode, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'createFinalJson()', func.logCons.LOG_ENTER)
  async.forEachOf(candidateSourceIDs, function (item, key, callback) {
    var candidateId = item[func.dbCons.FIELD_ID]
    var candidateSourceID = item[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]
    var candidateDetailsJSON = body[func.dbCons.COLLECTION_CANDIDATE_DETAILS]
    async.forEachOf(candidateDetailsJSON, function (items, keys, callbackinner) {
      if (candidateDetailsJSON[keys][func.dbCons.FIELD_CANDIDATE_ID] === candidateId) {
        items[func.dbCons.FIELD_CANDIDATE_SOURCE_ID] = candidateSourceID
      }
      callbackinner()
    },
        function (error) {
          if (error) {
            return callback(new Error().stack, body)
          } else {
            callback()
          }
        })
  },
    function (error) {
      if (error) {
        return callback(new Error().stack, body)
      } else {
        createIndividualCandidateJSON(urlMap, body, userCode, function (error, inputJSON) {
          if (error) return callback(new Error().stack, inputJSON)
          if (!inputJSON || inputJSON.length === 0) {
            inputJSON = []
            callback(null, inputJSON)
          } else {
            callback(null, inputJSON)
          }
        })
      }
    })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'createFinalJson()', func.logCons.LOG_EXIT)
}

function getCandidateSourceIdFromCandidateDetails (candidateIds, urlMap, body, userCode, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIdFromCandidateDetails()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidateIds), urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, projection, function (error, candidateSourceIDs) {
    if (error) return callback(new Error().stack, candidateSourceIDs)
    if (!candidateSourceIDs || candidateSourceIDs.length === 0) {
      candidateSourceIDs = []
      callback(null, candidateSourceIDs)
    } else {
      createFinalJson(urlMap, candidateSourceIDs, body, userCode, function (error, finalJSON) {
        if (error) return callback(new Error().stack, finalJSON)
        if (!finalJSON || finalJSON.length === 0) {
          finalJSON = []
          callback(null, finalJSON)
        } else {
          callback(null, finalJSON)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIdFromCandidateDetails()', func.logCons.LOG_EXIT)
}

AddPIDetails.prototype.addPIDetailsFromDB = function (body, urlMap, userCode, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addPIDetailsFromDB()', func.logCons.LOG_ENTER)
  var candidateDetailsJSON = body[func.dbCons.COLLECTION_CANDIDATE_DETAILS]
  var candidateIds = func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_ID, candidateDetailsJSON)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addPIDetailsFromDB()', func.logCons.LOG_ENTER)
  getCandidateSourceIdFromCandidateDetails(candidateIds, urlMap, body, userCode, function (error, response) {
    if (error) {
      return callback(new Error().stack, response)
    } else if (response.length === 0) {
      return callback(null, [])
    } else {
      callback(null, response)
      sendMailToAssessors(body, response, urlMap, env, function (error, mailSuccess, mailFail) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `error while sending mail to assesor = ${JSON.stringify(error)}`)
        } else {
          func.printLog(func.logCons.LOG_LEVEL_INFO, `mail send to  = ${JSON.stringify(mailSuccess)}`)
          func.printLog(func.logCons.LOG_LEVEL_INFO, `mail fail to  = ${JSON.stringify(mailFail)}`)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addPIDetailsFromDB()', func.logCons.LOG_EXIT)
}

function sendMailToAssessors (body, response, orgNameMap, env, cbMail) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendMailToAssessors()', func.logCons.LOG_ENTER)
  var assessorDetails = body[func.dbCons.FIELD_ACCESSOR_DETAILS]
  var mailSentJsons = []
  var mailFailJsons = []
  async.forEachOf(assessorDetails, function (assessor, index, callback) {
    getAssessorDetails(assessor[func.dbCons.ASSESSOR_ID], orgNameMap, function (error, userDetails) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `error in geting details for = ${JSON.stringify(assessor[func.dbCons.ASSESSOR_ID])}`)
        mailFailJsons.push(assessor)
      } else {
        var context = generateContexJson(userDetails[func.dbCons.FIELD_USER_DATA][func.dbCons.FIELD_GIVEN_NAME], body[func.dbCons.COLLECTION_DESIGNATION], response, func.generateUrl(uiConfig[func.configCons.FIELD_PROTOCOL], uiConfig[func.configCons.FIELD_HOST], uiConfig[func.configCons.FIELD_PORT], env, orgNameMap, uiConfig[func.configCons.FIELD_ASSESSOR_LOGIN_PATH]))
        generateMail(userDetails[func.dbCons.FIELD_USER_DATA][func.dbCons.FIELD_EMAIL], context, orgNameMap, function (error, mailSent) {
          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, `error in sending mail for = ${JSON.stringify(userDetails[func.dbCons.FIELD_USER_DATA][func.dbCons.FIELD_EMAIL])}`)
            mailFailJsons.push(userDetails)
          } else {
            func.printLog(func.logCons.LOG_LEVEL_INFO, `mail successful for = ${JSON.stringify(userDetails[func.dbCons.FIELD_USER_DATA][func.dbCons.FIELD_EMAIL])}`)
            mailSentJsons.push(userDetails)
          }
          callback()
        })
      }
    })
  }, function (err) {
    if (err) return cbMail(new Error().stack)
    cbMail(null, mailSentJsons, mailFailJsons)
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendMailToAssessors()', func.logCons.LOG_EXIT)
}

function getAssessorDetails (userCode, orgNameMap, cbUser) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessorDetails()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_USER_CODE, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_USER_DATA + ' .' + func.dbCons.FIELD_EMAIL, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_USER_DATA + ' .' + func.dbCons.FIELD_GIVEN_NAME, true, true))
  dbOp.findByKey(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, userCode, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_USER_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), projection, function (error, userDetails) {
    if (error) return cbUser(new Error().stack)
    if (!userDetails || userDetails.length !== 1) return cbUser(new Error('Invalid request').stack)
    cbUser(null, userDetails[0])
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessorDetails()', func.logCons.LOG_EXIT)
}

function generateContexJson (userName, designation, responseForDate, loginLink) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateContexJson()', func.logCons.LOG_ENTER)
  var today = new Date() // Today's Date
  var systemDate = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2)
  var finalDateTime = (!responseForDate[0][func.dbCons.FIELD_PI_DATE]) ? systemDate : responseForDate[0][func.dbCons.FIELD_PI_DATE]
  var json = {}
  json[func.msCons.FIELD_USER_NAME] = userName
  json[func.msCons.DESIGNATION] = designation
  json[func.msCons.FIELD_DATE_AND_TIME] = finalDateTime
  json[func.msCons.FIELD_LOGIN_LINK] = loginLink
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `contex json = ${JSON.stringify(json)}`)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateContexJson()', func.logCons.LOG_EXIT)
  return json
}

function generateMail (recipientEmail, context, orgNameMap, mailSend) {
  var path = getTemplatePath(mailConfig[func.configCons.FIELD_CAMPUS_DRIVE_FOR_SECOND_ROUND], orgNameMap)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'path = ' + JSON.stringify(path))
  var subjectName = dynamicDomain[orgNameMap[func.urlCons.PARAM_DOMAIN_NAME]][func.configCons.FIELD_CAMPUS_SECOND_ROUND_SUB]
  var url = orgNameMap[func.urlCons.PARAM_ORG_NAME]
  sendEMails(url, recipientEmail, context, path, subjectName, orgNameMap, function (error, mailSendSuccess) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mail sending failed for target mail = ' + error)
      return mailSend(new Error().stack)
    }
    mailSend(null, mailSendSuccess)
  })
}

function getTemplatePath (fileName, orgNameMap) {
  return mailConfig[func.configCons.FIELD_PATH] + orgNameMap[func.urlCons.PARAM_DOMAIN_NAME] + '/' + fileName
}

function sendEMails (org, email, context, path, subjectName, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEMails()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Context :' + JSON.stringify(context))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'path :' + path)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'email :' + email)
  var domain = dynamicDomain[orgNameMap[func.urlCons.PARAM_DOMAIN_NAME]]
  templates.render(path, context, function (err, html, text, subject) {
    if (err) return callback(new Error().stack)
    if (smtpConnections[org] !== undefined) {
    smtpTransport.sendMail(generateMailOptionsForCampusRound(email, domain, subjectName, html, text, smtpConnections[org]), function (error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error in mail ...' + error)
        return callback(new Error().stack, `Error in sending Mail = ${err}`)
      }
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEMails()', func.logCons.LOG_EXIT)
      callback(null, 'Mail Sent Successfully')
    })
  } else{
    smtpTransport.sendMail(generateMailOptionsForCampusRound(email, domain, subjectName, html, text, smtpTransport), function (error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error in mail ...' + error)
        return callback(new Error().stack, `Error in sending Mail = ${err}`)
      }
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEMails()', func.logCons.LOG_EXIT)
      callback(null, 'Mail Sent Successfully')
    })
  }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEMails()', func.logCons.LOG_EXIT)
}

function generateMailOptionsForCampusRound (to, domain, sub, html, text, smtpObject) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailOptionsForCandidate()', func.logCons.LOG_ENTER)
    var fromEmail = ''
  if (smtpObject['options']['auth']['user'] !== undefined) {
    fromEmail = smtpObject['options']['auth']['user']
  } else {
    fromEmail = '<no-reply@srkay.com>'
  }
  var mailOptions = {
    from: domain[func.dbCons.FIELD_NAME] + ' ' + fromEmail,
    to: to,
    cc: domain[func.configCons.FIELD_CC],
    bcc: domain[func.configCons.FIELD_BCC],
    subject: sub,
    html: html,
    text: text
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailOptionsForCandidate()', func.logCons.LOG_EXIT)
  return mailOptions
}

exports.AddPIDetails = AddPIDetails
