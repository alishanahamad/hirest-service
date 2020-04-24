'use strict'
/**
 * This function is useful for send/resend/approve email
 * @author Alishan Ahamad
 */

var func = require('../utils/functions')
var async = require('async')
var config = func.config.get('front_end')
var DbOperation = require('./db-operations').DbOperation
var dbOp = new DbOperation()
var nunjucks = require('nunjucks')
var pdf = require('html-pdf')
var nodemailer = require('nodemailer')
var dest = func.config.get('report')
var EmailTemplates = require('swig-email-templates')
var templates = new EmailTemplates()
var dynamicDomain = func.config.get('mail_domain_dynamic')

var smtp = func.config.get('smtp')
var smtpTransport = nodemailer.createTransport(smtp)
var smtpSrkCareer = func.config.get('smtp_srkCareer')
var smtpSrkCareerTransport = nodemailer.createTransport(smtpSrkCareer)
var demoHirest = func.config.get('smtp_demo')
var demoHirestTransport = nodemailer.createTransport(demoHirest)

var bcc_email = func.config.get('_in_bcc_email')

const smtpConnections = {
  'app': smtpSrkCareerTransport,
  'demo': smtpSrkCareerTransport,
  'career': smtpSrkCareerTransport,
  undefined: smtpTransport
}

HELPER_CONS = 'HS_OLH_'

var configJson = func.config.get('mail_domains')
var isResetPwd = true

function OfferLetterHelper() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of offer letter helper')
}

/**
 * [description]
 * @param  {[type]} reqBody    [candidate_name, designation, email_id and other candidate details]
 * @param  {[type]} candidate_id [description]
 * @param  {[type]} urlMap [description]
 * @param  {[type]} env        [description]
 * @return {[type]}            [description]
 */

OfferLetterHelper.prototype.sendInstructionMail = function(candidate_id, body, env, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendInstructionMail', func.logCons.LOG_ENTER)
  getCandidateSourceId(candidate_id, urlMap, body, function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'sendInstructionMail = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendInstructionMail()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (response.length === 0 || !response) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendInstructionMail()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendInstructionMail()', func.logCons.LOG_EXIT)
      let instituteIds = func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, response)
      return callback(null, response)
    }
  })
}

/**
 * [getCandidateSourceId description]
 * @param  {[type]} body    [candidate_name, designation, email_id and other candidate details]
 * @param  {[type]} candidate_id  [candidate details]
 * @param  {[type]} urlMap [description]
 * @return {[type]}            [description]
 */

function getCandidateSourceId(candidate_id, urlMap, body, callbackResponse) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceId', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidate_id)
  dbOp.findByQuery(query, urlMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCandidateSourceId dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceId()', func.logCons.LOG_EXIT)
      return callbackResponse(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceId()', func.logCons.LOG_EXIT)
      return callbackResponse(null, false)
    } else {
      let candidateSourceId = func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, response)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceId()', func.logCons.LOG_EXIT)
      getCampusDriveID(candidateSourceId, urlMap, body, function(error, response) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCampusDriveID = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveID()', func.logCons.LOG_EXIT)
          return callbackResponse(new Error().stack, response)
        } else if (response.length === 0 || !response) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveID()', func.logCons.LOG_EXIT)
          return callbackResponse(null, [])
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveID()', func.logCons.LOG_EXIT)
          return callbackResponse(null, response)
        }
      })
    }
  })
}

/**
 * [getCampusDriveID description]
 * @param  {[type]} body    [candidate_name, designation, email_id and other candidate details]
 * @param  {[type]} candidateSourceID  [innstitute details]
 * @param  {[type]} urlMap [description]
 * @return {[type]}            [description]
 */

function getCampusDriveID(candidateSourceID, urlMap, body, callbackResponse) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveID', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidateSourceID)
  dbOp.findByQuery(query, urlMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCampusDriveID dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamDetails()', func.logCons.LOG_EXIT)
      return callbackResponse(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveID()', func.logCons.LOG_EXIT)
      return callbackResponse(null, false)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveID()', func.logCons.LOG_EXIT)
      let campus_drive_id = func.getValuesArrayFromJson(func.dbCons.CAMPUS_SOURCE_DETAILS_CAMPUS_ID, response)
      getInstituteId(campus_drive_id, urlMap, body, function(error, response) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getInstituteId = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteId()', func.logCons.LOG_EXIT)
          return callbackResponse(new Error().stack, response)
        } else if (response.length === 0 || !response) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteId()', func.logCons.LOG_EXIT)
          return callbackResponse(null, [])
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteId()', func.logCons.LOG_EXIT)
          return callbackResponse(null, response)
        }
      })
    }
  })
}

/**
 * [getInstituteId description]
 * @param  {[type]} body    [candidate_name, designation, email_id and other candidate details]
 * @param  {[type]} campus_drive_id  [campus drive details]
 * @param  {[type]} urlMap [description]
 * @return {[type]}            [description]
 */

function getInstituteId(campus_drive_id, urlMap, body, callbackResponse) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteId', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, campus_drive_id)
  dbOp.findByQuery(query, urlMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getInstituteId dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteId()', func.logCons.LOG_EXIT)
      return callbackResponse(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteId()', func.logCons.LOG_EXIT)
      return callbackResponse(null, false)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteId()', func.logCons.LOG_EXIT)
      let institute_id = func.getValuesArrayFromJson(func.dbCons.FIELD_INSTITUTE_ID, response)

      getTpoUSerID(institute_id, urlMap, body, function(error, response) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getTpoUSerID = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getTpoUSerID()', func.logCons.LOG_EXIT)
          return callbackResponse(new Error().stack, response)
        } else if (response.length === 0 || !response) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getTpoUSerID()', func.logCons.LOG_EXIT)
          return callbackResponse(null, [])
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getTpoUSerID()', func.logCons.LOG_EXIT)
          return callbackResponse(null, response)
        }
      })
    }
  })
}

/**
 * [getTpoUSerID description]
 * @param  {[type]} body    [candidate_name, designation, email_id and other candidate details]
 * @param  {[type]} instituteId  [TPO details]
 * @param  {[type]} urlMap [description]
 * @return {[type]}            [description]
 */

function getTpoUSerID(instituteId, urlMap, body, callbackResponse) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getTpoUSerID', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_INSTITUTE_ID, func.lightBlueCons.OP_IN, instituteId)
  dbOp.findByQuery(query, urlMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_TPO_USER_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getTpoUSerID dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getTpoUSerID()', func.logCons.LOG_EXIT)
      return callbackResponse(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getTpoUSerID()', func.logCons.LOG_EXIT)
      return callbackResponse(null, false)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getTpoUSerID()', func.logCons.LOG_EXIT)
      let userID = func.getValuesArrayFromJson(func.dbCons.FIELD_USER_ID, response)

      getTpoNameAndEmail(userID, urlMap, body, function(error, response) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getTpoNameAndEmail = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getTpoNameAndEmail()', func.logCons.LOG_EXIT)
          return callbackResponse(new Error().stack, response)
        } else if (response.length === 0 || !response) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getTpoNameAndEmail()', func.logCons.LOG_EXIT)
          return callbackResponse(null, [])
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getTpoNameAndEmail()', func.logCons.LOG_EXIT)
          return callbackResponse(null, response)
        }
      })
    }
  })
}

/**
 * [getTpoNameAndEmail description]
 * @param  {[type]} body    [candidate_name, designation, email_id and other candidate details]
 * @param  {[type]} userID  [TPO details]
 * @param  {[type]} urlMap [description]
 * @return {[type]}            [description]
 */

function getTpoNameAndEmail(userID, urlMap, body, callbackResponse) {
  var email = []
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getTpoNameAndEmail', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_IN, userID)
  dbOp.findByQuery(query, urlMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_USER_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getTpoNameAndEmail dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getTpoNameAndEmail()', func.logCons.LOG_EXIT)
      return callbackResponse(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getTpoNameAndEmail()', func.logCons.LOG_EXIT)
      return callbackResponse(null, false)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getTpoNameAndEmail()', func.logCons.LOG_EXIT)

      const tpoName = response[0][func.dbCons.FIELD_PROFILE].given_name
      async.forEachOf(response, function(item, index, callbackinner) {
          email.push(item[func.dbCons.FIELD_PROFILE].email)
          callbackinner();
        },
        function(error) {
          if (error) {
            return callback(new Error().stack, tpoData)
          }
        });
      var context = {}
      context['tpoName'] = tpoName
      context['designation'] = body[func.dbCons.FIELD_DESIGNATION]
      context['candidateDetails'] = body.candidateDetails
      context['adminName'] = body[func.dbCons.FIELD_ADMIN_NAME]
      var orgName = urlMap[func.urlCons.PARAM_ORG_NAME]
      if (body[func.dbCons.FIELD_ACTION] === func.dbCons.FIELD_SEND) {
        context[func.dbCons.FIELD_ACTION] = func.dbCons.FIELD_SEND
        generateReportByteStream(function(error, byteStream) {
          if (error) {
            return callbackResponse(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST_FOR_BYTESTREAM, func.msgCons.MSG_ERROR_BYTESTREAM), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_ERROR_BYTESTREAM)) // need to ask about callback arguments
          } else {
            sendEmail(orgName, email, configJson[func.configCons.FIELD_FINAL_SELECETED_CANDIDATE], func.msgCons.INTIMATION_FOR_SELECTED_CANDIDATE_WITH_JOINING_INSTRUCTIONS_SUB, context, byteStream, dynamicDomain[urlMap[func.urlCons.PARAM_DOMAIN_NAME]], function(error, response) {
              if (error) {
                func.printLog(func.logCons.LOG_LEVEL_INFO, 'sendEmail() email error:' + error) // verify the format of error
                return callbackResponse(new Error().stack, response)
              }
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_EXIT)
              callbackResponse(null, response)
            })
          }
        })
      } else if (body[func.dbCons.FIELD_ACTION] === func.dbCons.FIELD_RESEND) {
        let byteStream = ""
        context[func.dbCons.FIELD_ACTION] = func.dbCons.FIELD_RESEND
        sendEmail(orgName, email, configJson[func.configCons.FIELD_RESEND_FINAL_SELECETED_CANDIDATE], func.msgCons.FEEDBACK_PERTAINING_TO_OFFER_LETTER_SUB, context, byteStream, dynamicDomain[urlMap[func.urlCons.PARAM_DOMAIN_NAME]], function(error, response) {
          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_INFO, 'sendEmail() email error:' + error) // verify the format of error
            return callbackResponse(new Error().stack, response)
          }
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_EXIT)
          callbackResponse(null, response)
        })
      } else if (body[func.dbCons.FIELD_ACTION] === func.dbCons.FIELD_APPROVE) {
        let byteStream = ""
        context[func.dbCons.FIELD_ACTION] = func.dbCons.FIELD_APPROVE
        context['tpoName'] = tpoName
        context['expire_date'] = body[func.dbCons.FIELD_EXPIRE_DATE]
        context['candidateDetails'] = body.candidateDetails
        context['adminName'] = body[func.dbCons.FIELD_ADMIN_NAME]
        context['gender'] = body[func.dbCons.FIELD_GENDER]
        context['countNumber'] = body.countNumber
        context['candidate_email'] = body.candidate_email
        sendEmail(orgName, email, configJson[func.configCons.FIELD_APPROVE_LEARNING_INTIMATION], func.msgCons.LEARNING_INTIMATION_SUB, context, byteStream, dynamicDomain[urlMap[func.urlCons.PARAM_DOMAIN_NAME]], function(error, response) {
          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_INFO, 'sendEmail() email error:' + error) // verify the format of error
            return callbackResponse(new Error().stack, response)
          }
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_EXIT)
          callbackResponse(null, response)
        })
      }

    }
  })
}

/**
 * [generateReportByteStream description]
 * @param  {[type]} callbackResponse  [PDF details]
 */

function generateReportByteStream(callbackResponse) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateReportByteStream()', func.logCons.LOG_ENTER)
  nunjucks.configure(configJson[func.configCons.FIELD_JOINING_INSTRUCTION_FOR_TRAINEE])
  nunjucks.render(configJson[func.configCons.FIELD_JOINING_INSTRUCTION_FOR_TRAINEE_FILE], function(error, htmlfile) {
    if (error) {
      return callbackResponse(new Error().stack)
    } else {
      var options = {
        'height': '978px', // allowed units: mm, cm, in, px
        'width': '700px',
        'timeout': 700000
      }
      pdf.create(htmlfile, options)
        .toBuffer(
          function(error, byteStream) {
            if (error) {
              func.printLog(func.logCons.LOG_LEVEL_INFO, 'generateReportByteStream() byteStream create:' + error)
              return callbackResponse(new Error().stack)
            }
            var context = {}
            context['title'] = 'PDF CREATED'
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateReportByteStream()', func.logCons.LOG_EXIT)
            callbackResponse(null, byteStream)
          })
    }
  })
}

/**
 * [sendEmail description]
 * @param  {[type]} orgName    [description]
 * @param  {[type]} email  [email]
 * @param  {[type]} urlMap [urlMap]
 * @param  {[type]} context [tpo_name, tpo_email, candidate details]
 * @param  {[type]} byteStream  [byteStream]
 * @param  {[type]} domain [domain]
 * @return {[type]}            [description]
 */

function sendEmail(orgName, email, file, sub, context, byteStream, domain, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_ENTER)
  templates.render(file, context, function(error, html, text, subject) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, file, func.logCons.LOG_ENTER)
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Error in sendEmail', func.logCons.LOG_ENTER)
      return callback(new Error().stack)
    }
    if (func.validateEmail(email[0])) {
      if (smtpConnections[orgName] !== undefined) {
        var mailOptions = generateMailOptions(orgName, context, email, sub, html, text, byteStream, domain, smtpConnections[orgName])
        smtpConnections[orgName].sendMail(mailOptions, function(error, response) {
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
        var mailOptions = generateMailOptions(orgName, context, email, sub, html, text, byteStream, domain, smtpTransport)
        smtpTransport.sendMail(mailOptions, function(error, response) {
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

/**
 * [generateMailOptions description]
 * @param  {[type]} context [tpo_name, tpo_email, candidate details]
 * @param  {[type]} orgName [description]
 * @param  {[type]} to    [TPO id]
 * @param  {[type]} sub  [template subject]
 * @param  {[type]} html [template details]
 * @param  {[type]} text    [description]
 * @param  {[type]} byteStream  [PDF data]
 * @param  {[type]} domain [description]
 * @param  {[type]} smtpObject [smtp ]
 * @return {[type]}            [description]
 */

function generateMailOptions(orgName, context, to, sub, html, text, byteStream, domain, smtpObject) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailOptions()', func.logCons.LOG_ENTER)
  var send_in_to = to[0]
  var send_in_cc = "";
  if (to.length > 1) {
    to.shift()
    async.forEachOf(to, function(email, index, callbackinner) {
        if (email !== undefined)
          send_in_cc = email + "," + send_in_cc;
        callbackinner();
      },
      function(error) {
        if (error) {
          return callback(new Error().stack, to)
        }
      }
    );
  }
  if (send_in_cc !== "" && send_in_cc !== undefined) {
    send_in_cc = domain[func.configCons.FIELD_CC] + "," + send_in_cc;
  } else {
    send_in_cc = domain[func.configCons.FIELD_CC];
  }
  var fromEmail = ''
  if (smtpObject['options']['auth']['user'] !== undefined) {
    fromEmail = smtpObject['options']['auth']['user']
  } else {
    fromEmail = '<career@srkweb.in>'
  }
  var attachments = {}
  if (context.action === func.dbCons.FIELD_SEND) {
    attachments.filename = 'Joining Instructions.pdf'
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
  } else if (context.action === func.dbCons.FIELD_RESEND) {
    var BCC;
    if (orgName === func.dbCons.FIELD_APP) {
      BCC = domain[func.configCons.FIELD_BCC] + ',' + bcc_email.in_bcc
    } else {
      BCC = domain[func.configCons.FIELD_BCC]
    }
    var mailOptions = {
      from: domain[func.dbCons.FIELD_NAME] + ' ' + fromEmail,
      to: send_in_to,
      cc: send_in_cc,
      bcc: BCC,
      subject: sub,
      html: html,
      text: text
    }
  } else if (context.action === func.dbCons.FIELD_APPROVE) {
    var mailOptions = {
      from: domain[func.dbCons.FIELD_NAME] + ' ' + fromEmail,
      to: send_in_to,
      cc: send_in_cc + ',' + context.candidate_email,
      bcc: domain[func.configCons.FIELD_BCC],
      subject: sub,
      html: html,
      text: text
    }
  }

  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailOptions()', func.logCons.LOG_EXIT)
  return mailOptions
}

exports.OfferLetterHelper = OfferLetterHelper
