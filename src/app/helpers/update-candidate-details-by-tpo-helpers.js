var func = require('../utils/functions');
var dbOp;
var HELPERS_CONST_STATUS = 'HS_UCDBTH_';
EmailVerificationHelpers = require('../helpers/email-verification-helpers').EmailVerificationHelpers
var emailVerificationHelpers = new EmailVerificationHelpers()
const async = require('async')
var mailConfig = func.config.get('mail_domains')
var dynamicDomain = func.config.get('mail_domain_dynamic')
var EmailTemplates = require('swig-email-templates')
var templates = new EmailTemplates()
var nodemailer = require('nodemailer')
var smtp = func.config.get('smtp')
var uiConfig = func.config.get('front_end')
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

function UpdateCandidateDetailsByTpoHelper() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of reason for candidate unavailibility helper');
  DbOperation = require('./db-operations').DbOperation;
  dbOp = new DbOperation();
}

UpdateCandidateDetailsByTpoHelper.prototype.updateCandidateReason = function(personId, urlMap, reason, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateCandidateReason()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'personId=' + " " + personId + ", urlMap=" + " " + JSON.stringify(urlMap) + ", reason=" + " " + reason);
  var jsonToUpdate = {}
  jsonToUpdate[func.dbCons.FIELD_REASON] = reason
  dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_PERSON_ID, func.lightBlueCons.OP_EQUAL, personId), urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, dbOp.getOperationJson(func.lightBlueCons.OP_SET, jsonToUpdate), dbOp.getCommonProjection(), function(error, updatedCandidateDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while updating candidate details = ' + JSON.stringify(error))
      return callback(new Error().stack)
    } else if (updatedCandidateDetails && updatedCandidateDetails.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, func.msgCons.ERROR_MSG_NO_CANDIDATE_DETAILS_UPDATED)
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPERS_CONST_STATUS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_CANDIDATE_DETAILS_NOT_FOUND), HELPERS_CONST_STATUS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_NO_CANDIDATE_DETAILS_UPDATED))
    } else {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'updatedCandidateDetails:' + JSON.stringify(updatedCandidateDetails))
      callback(null, updatedCandidateDetails)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateCandidateReason()', func.logCons.LOG_EXIT)
}

async function getInstituteNameUsingInstituteId(instituteId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteNameUsingInstituteId()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_NAME, true, true))
    dbOp.findByKey(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, instituteId, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_INSTITUTE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), projection, function(err, instituteDetails) {
      if (err) {
        // Lightblue Error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching candidate details. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsFromId()', func.logCons.LOG_EXIT)
        return reject(err)
      } else if (!instituteDetails || instituteDetails.length !== 1) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Institute not found`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteDetailsFromId()', func.logCons.LOG_EXIT)
        return reject(new Error(`invalid instituteId id ${instituteId}`))
      }
      return resolve(instituteDetails)
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteNameUsingInstituteId()', func.logCons.LOG_EXIT)
  })
}



UpdateCandidateDetailsByTpoHelper.prototype.sendMailToAdminForHireCandidate = async function(tpoUserCode, reqBody, orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'sendMailToAdminForHireCandidate()', func.logCons.LOG_ENTER)
  try {
    let errors = []
    const instituteId = reqBody[func.dbCons.FIELD_INSTITUTE_ID]
    let instituteNameArr = await getInstituteNameUsingInstituteId(instituteId, orgNameMap)
    const instituteName = func.getValuesArrayFromJson(func.dbCons.FIELD_NAME, instituteNameArr)
    let roleIdenfierArr = await getRoleIdentifierForAdmin(orgNameMap)
    const adminRoleIdentifier = func.getValuesArrayFromJson(func.dbCons.FIELD_ROLE_IDENTIFIER, roleIdenfierArr)
    let entityDetailsArr = await getUserCodeArrayFromRoleIdentifier(adminRoleIdentifier, orgNameMap)
    let userCodeIdArr = func.getValuesArrayFromJson(func.dbCons.FIELD_ENTITY_DETAILS, entityDetailsArr)
    const userCodeArr = func.getValuesArrayFromJson(func.dbCons.FIELD_ID, userCodeIdArr)
    let adminDetails = await getAdminProfileDataFromUserCode(userCodeArr, orgNameMap)
    const adminDetailsArr = func.getValuesArrayFromJson(func.dbCons.FIELD_PROFILE_DATA, adminDetails)
    let tpoDetailsArr = await getAdminProfileDataFromUserCode(func.convertIntoArray(tpoUserCode), orgNameMap)
    const tpoDetails = func.getValuesArrayFromJson(func.dbCons.FIELD_PROFILE_DATA, tpoDetailsArr)
    let sendMailDetails = await sendMailToAdmin(env, orgNameMap, reqBody, adminDetailsArr, tpoDetails, instituteName)
    return sendMailDetails
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while sending mail to Admin. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendMailToAdminForHireCandidate()', func.logCons.LOG_EXIT)
    throw err
  }
}

function generateContexJson(tpoName, perAdmin, instituteName, reqBody, loginLink) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateContexJson()', func.logCons.LOG_ENTER)
  var json = {}
  json[func.dbCons.FIELD_USER_NAME] = tpoName
  json[func.dbCons.FIELD_INSTITUTE_NAME] = instituteName[0]
  json[func.dbCons.FIELD_DESIGNATION] = reqBody[func.dbCons.FIELD_DESIGNATION]
  json[func.dbCons.FIELD_ADMIN] = perAdmin[func.dbCons.FIELD_GIVEN_NAME]
  json[func.dbCons.FIELD_ACCEPTED] = reqBody[func.dbCons.FIELD_ACCEPTED]
  json[func.dbCons.FIELD_REJECTED] = reqBody[func.dbCons.FIELD_REJECTED]
  json[func.msCons.FIELD_LOGIN_LINK] = loginLink
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `contex json = ${JSON.stringify(json)}`)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateContexJson()', func.logCons.LOG_EXIT)
  return json
}

async function geneateMailsForAdmin(admin, context, orgNameMap) {
  return new Promise(function(resolve, reject) {
    let mails = {}
    //admin[func.dbCons.FIELD_EMAIL]
    generateMail(admin[func.dbCons.FIELD_EMAIL], context, orgNameMap, (error, mailSent) => {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `error in sending mail for = ${JSON.stringify(admin[func.dbCons.FIELD_EMAIL])}`)
        mails.fail = admin[func.dbCons.FIELD_EMAIL]
        resolve(mails)
      } else {
        func.printLog(func.logCons.LOG_LEVEL_INFO, `mail successful for = ${JSON.stringify(admin[func.dbCons.FIELD_EMAIL])}`)
        mails.success = admin[func.dbCons.FIELD_EMAIL]
        resolve(mails)
      }
    })
  })
}

async function sendMailToAdmin(env, orgNameMap, reqBody, admins, tpoDetails, instituteName) {
  let mailSentJsons = []
  let mailFailJsons = []
  for (let admin of admins) {
    let context = await generateContexJson(tpoDetails[0][func.dbCons.FIELD_GIVEN_NAME], admin, instituteName, reqBody, func.generateUrl(uiConfig[func.configCons.FIELD_PROTOCOL], uiConfig[func.configCons.FIELD_HOST], uiConfig[func.configCons.FIELD_PORT], env, orgNameMap, uiConfig[func.configCons.FIELD_ADMIN_LOGIN_PATH]))
    const [mails] = await Promise.all([geneateMailsForAdmin(admin, context, orgNameMap)])
    if (mails.success) mailSentJsons.push(mails.success)
    if (mails.fail) mailFailJsons.push(mails.fail)
  }
  let mailsJson = {}
  mailsJson.failed = mailFailJsons
  mailsJson.success = mailSentJsons
  return mailsJson
}

function sendEMails(org, email, context, path, subjectName, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEMails()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Context :' + JSON.stringify(context))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'path :' + path)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'email :' + email)
  var domain = dynamicDomain[orgNameMap[func.urlCons.PARAM_DOMAIN_NAME]]
  templates.render(path, context, function(err, html, text, subject) {
    if (err) return callback(new Error().stack)
    if (smtpConnections[org] !== undefined) {
      smtpTransport.sendMail(generateMailOptionsForAdmin(email, domain, subjectName, html, text, smtpConnections[org]), function(error, response) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error in mail ...' + error)
          return callback(new Error().stack, `Error in sending Mail = ${err}`)
        }
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEMails()', func.logCons.LOG_EXIT)
        callback(null, 'Mail Sent Successfully')
      })
    } else {
      smtpTransport.sendMail(generateMailOptionsForAdmin(email, domain, subjectName, html, text, smtpTransport), function(error, response) {
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

function getTemplatePath(fileName, orgNameMap) {
  return mailConfig[func.configCons.FIELD_PATH] + orgNameMap[func.urlCons.PARAM_DOMAIN_NAME] + '/' + fileName
}

function generateMailOptionsForAdmin(to, domain, sub, html, text, smtpObject) {
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

function generateMail(recipientEmail, context, orgNameMap, mailSend) {
  var path = getTemplatePath(mailConfig[func.configCons.FIELD_INTIMATION_TO_VERIFY_OFFER_LETTER], orgNameMap)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'path = ' + JSON.stringify(path))
  var subjectName = func.msgCons.FIELD_INTIMATION_TO_VERIFY_OFFER_LETTER_SUB
  var url = orgNameMap[func.urlCons.PARAM_ORG_NAME]
  sendEMails(url, recipientEmail, context, path, subjectName, orgNameMap, function(error, mailSendSuccess) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mail sending failed for target mail = ' + error)
      return mailSend(new Error().stack)
    }
    mailSend(null, mailSendSuccess)
  })
}

function queryForGetAdminProfileData(userCodeArr) {
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_IN, userCodeArr))
  return query
}

async function getAdminProfileDataFromUserCode(userCodeArr, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserCodeArrayFromRoleIdentifier()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PROFILE_DATA, true, true))
    dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, queryForGetAdminProfileData(userCodeArr)), orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_USER_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      projection,
      function(err, adminDataArray) {
        if (err) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching admin data from user details. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'get admin data for account admin()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!adminDataArray || adminDataArray.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `no admin data found in user details`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAdminProfileDataFromUserCode()', func.logCons.LOG_EXIT)
          return resolve(adminDataArray)
        }
        return resolve(adminDataArray)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAdminProfileDataFromUserCode()', func.logCons.LOG_EXIT)
  })
}


function getQueryForAdminRoleIdentifier() {
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROLE_NAME, func.lightBlueCons.OP_EQUAL, func.dbCons.VALUE_ACCOUNT_ADMIN))
  return query
}

async function getRoleIdentifierForAdmin(orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getRoleIdentifierForAdmin()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ROLE_IDENTIFIER, true, true))
    dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, getQueryForAdminRoleIdentifier()), orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_ROLE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      projection,
      function(err, roleIdArray) {
        if (err) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching role id from  role details. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'get role id for account admin()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!roleIdArray || roleIdArray.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `no role identifier found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getRoleIdentifierForAdmin()', func.logCons.LOG_EXIT)
          return resolve(roleIdArray)
        }
        return resolve(roleIdArray)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getRoleIdentifierForAdmin()', func.logCons.LOG_EXIT)
  })
}

function getQueryForUserCodeArray(adminRoleIdentifierArr) {
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROLE_NAME, func.lightBlueCons.OP_IN, adminRoleIdentifierArr))
  return query
}

async function getUserCodeArrayFromRoleIdentifier(adminRoleIdentifierArr, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserCodeArrayFromRoleIdentifier()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ENTITY_DETAILS, true, true))
    dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, getQueryForUserCodeArray(adminRoleIdentifierArr)), orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_USER_ROLE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      projection,
      function(err, userCodeArray) {
        if (err) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching userCode from user role details. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'get userCode  for account admin()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!userCodeArray || userCodeArray.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `no role userCode found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserCodeArrayFromRoleIdentifier()', func.logCons.LOG_EXIT)
          return resolve(userCodeArray)
        }
        return resolve(userCodeArray)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserCodeArrayFromRoleIdentifier()', func.logCons.LOG_EXIT)
  })
}


exports.UpdateCandidateDetailsByTpoHelper = UpdateCandidateDetailsByTpoHelper
