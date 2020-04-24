var nodemailer = require('nodemailer')
var EmailTemplates = require('swig-email-templates')
var dateFormat = require('dateformat')
var shortid = require('shortid')
var func = require('../utils/functions')
var cloud = func.config.get('front_end')
var dynamicDomain = func.config.get('mail_domain_dynamic')
var configDomain = func.config.get('domain_names')
var configJson = func.config.get('mail_domains')
var configLinkExpiry = func.config.get('link_expiry_time')
var mailTemplate = func.config.get('mail_template')
var smtp = func.config.get('smtp')
var smtpTransport = nodemailer.createTransport(smtp)
var smtpSrkCareer = func.config.get('smtp_srkCareer')
var smtpSrkCareerTransport = nodemailer.createTransport(smtpSrkCareer)
var demoHirest = func.config.get('smtp_demo')
var demoHirestTransport = nodemailer.createTransport(demoHirest)
var fs = require('fs');
var jsonexport = require('jsonexport');
const smtpConnections = {
  'app': smtpSrkCareerTransport,
  'demo': demoHirestTransport,
  'career': smtpSrkCareerTransport,
  undefined: smtpTransport
}

LdapHelpers = require('../helpers/ldap-helper')
  .LdapHelpers
var ldapHelpers = new LdapHelpers()
ShortUrlHelper = require('../helpers/short-url-helpers')
  .ShortUrlHelper
var shortUrlHelper = new ShortUrlHelper()

var userRegisterHelpers
var dbOp
var templates = new EmailTemplates({
  root: mailTemplate[func.configCons.FIELD_ROOT]
})
var smtpTransport = nodemailer.createTransport(smtp)
// var smtpTransport = nodemailer.createTransport('brummagem25@gmail.com:Counterfeif20300@smtp.gmail.com')
// var smtpTransport = nodemailer.createTransport('smtps://brummagem25@gmail.com:Counterfeif20300@smtp.gmail.com')
// //////////constructor
function EmailVerificationHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'obj created of emailVerificationHelpers')
  DbOperation = require('./db-operations')
    .DbOperation
  dbOp = new DbOperation()
  CandidateRegisterHelpers = require('../helpers/candidate-registration-helpers').CandidateRegisterHelpers
  var candidateRegisterHelpers = new CandidateRegisterHelpers()
}

// update user details  after successful email verification
EmailVerificationHelpers.prototype.updateUserDetails = function(userCode, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateUserDetails()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'userCode=' + userCode)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, userCode)
  var profileData = {}
  profileData[func.dbCons.FIELD_PROFILE + '.' + func.dbCons.FIELD_EMAIL_VERIFIED] = true
  profileData[func.dbCons.FIELD_USER_STATUS] = func.dbCons.ENUM_ACTIVE
  dbOp.update(query, urlMap, func.dbCons.COLLECTION_USER_DETAILS,
    dbOp.getOperationJson(func.lightBlueCons.OP_SET, profileData),
    dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true),
    function(error, modifiedCount) {
      if (error) return callback(error)
      if (modifiedCount === 0) { // data hasn't been updated
        return callback(new Error('not updated'))
      } else callback(null, 'user data updated')
    })
  func.printLog(func.LOG_LEVEL_DEBUG, 'updateUserDetails()', func.logCons.LOG_EXIT)
}
// ///////////tpo mail send
EmailVerificationHelpers.prototype.sendMailCandidateRegistration = function(email, env, urlMap, userName, fileName, subInvitation, isResetPwd, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendMailCandidateRegistration().................', func.logCons.LOG_ENTER)
  var orgName = urlMap[func.urlCons.PARAM_ORG_NAME]
  var domainName = urlMap[func.urlCons.PARAM_DOMAIN_NAME]
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'email= ' + email + ' orgName= ' + orgName + ' userName= ' + userName + ' fileName= ' + fileName)
  var rand = shortid.generate()
  generateLink(rand, env, urlMap, configJson[func.configCons.FIELD_VERIFY_ACTIVATION_CODE_PATH], isResetPwd, function(err, shortUrl) {
    var context = generateMailContext(userName, email, domainName, shortUrl)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This context: ' + context)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Template Path: ' + domainName + '/' + fileName)
    var orgName = urlMap[func.urlCons.PARAM_ORG_NAME]
    sendEmailForCandidateRegistration(orgName, domainName + '/' + fileName, subInvitation, context, dynamicDomain[urlMap[func.urlCons.PARAM_DOMAIN_NAME]], function(err, res) {
      if (err) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, err)
        return callback(err)
      }
      return callback(null, 'sent')
    })
  })
  func.printLog(func.LOG_LEVEL_DEBUG, 'sendMailCandidateRegistration()', func.logCons.LOG_EXIT)
}
// ///////////tpo mail send
EmailVerificationHelpers.prototype.sendMailTpo = function(email, env, urlMap, userName, fileName, subInvitation, isResetPwd, callback) {
  var orgName = urlMap[func.urlCons.PARAM_ORG_NAME]
  var domainName = urlMap[func.urlCons.PARAM_DOMAIN_NAME]
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendMailTpo().................', func.logCons.LOG_ENTER)

  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'email= ' + email + ' orgName= ' + orgName + ' userName= ' + userName)
  // func.printLog(func.logCons.LOG_LEVEL_INFO, 'usercode in send mail=' + userCode)

  var rand = shortid.generate()
  generateLink(rand, env, urlMap, configJson[func.configCons.FIELD_VERIFY_ACTIVATION_CODE_PATH], isResetPwd, function(err, shortUrl) {
    var context = generateMailContext(userName, email, domainName, shortUrl)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This context: ' + context)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Template Path: ' + domainName + '/' + configJson[func.configCons.FIELD_CAMPUS_INTIMATION_FILE])

    generateCsvFile(context,userName[func.dbCons.COLLECTION_CANDIDATE_DETAILS],email, env, urlMap, userName, fileName, subInvitation, isResetPwd, callback)
  })
  func.printLog(func.LOG_LEVEL_DEBUG, 'sendMailTpo()', func.logCons.LOG_EXIT)
}

function generateCsvFile(context,candidateDetailsJson,email, env, urlMap, userName, fileName, subInvitation, isResetPwd,callbacKSurveydata) {
  var orgName = urlMap[func.urlCons.PARAM_ORG_NAME]
  var domainName = urlMap[func.urlCons.PARAM_DOMAIN_NAME]
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'generateCsvFile()', func.logCons.LOG_ENTER)
  // var fileName = func.dbCons.FILE_ASSESSMENT_REPORT + '.csv';
     var path = fileName
  if (!fs.existsSync(fileName)) {
    fs.mkdirSync(fileName);
  }
  var options = {
    headerPathString: " - "
  };
  jsonexport(candidateDetailsJson, options, function(err, candidateDetailsJson, callback) {
    if (err)
      callback(new Error().stack, func.errorsArrayGenrator(func.errorObjectGenrator(HELPER_CONS + func.msgCons.DATA_IS_NOT_AVAILABLE, func.msgCons.DATA_CAN_NOT_WRITE_FILE), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.DATA_CAN_NOT_WRITE_FILE));
      fs.writeFile(path + fileName, candidateDetailsJson, '', function(err) {
      if (err){
        return callbacKSurveydata(new Error().stack, func.errorsArrayGenrator(func.errorObjectGenrator(HELPER_CONS + func.msgCons.DATA_IS_NOT_AVAILABLE, func.msgCons.DATA_CAN_NOT_WRITE_FILE), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.DATA_CAN_NOT_WRITE_FILE));
      }
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'csv file generated!');
      sendEmailToTpo(candidateDetailsJson,domainName + '/' + fileName, subInvitation, context, dynamicDomain[urlMap[func.urlCons.PARAM_DOMAIN_NAME]], orgName, function(err, res) {
        if (err) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, err)
          return callback(err)
        }
        // func.printLog(func.logCons.LOG_LEVEL_INFO, 'user code=' + userCode + ' mail send successfully orgName=' + orgName)
        return callback(null, 'sent')
      })
      // callbacKSurveydata(null, data);
    });
  });
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'generateCsvFile()', func.logCons.LOG_EXIT)
}
// find user code from activation code detail using activation code
EmailVerificationHelpers.prototype.findUserCode = function(activationCode, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findUserCode()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'activationCode= ' + activationCode)
  dbOp.findByKey(func.dbCons.FIELD_ACTIVATION_CODE,
    func.lightBlueCons.OP_EQUAL,
    activationCode, urlMap,
    func.dbCons.COLLECTION_ACTIVATION_CODE_DETAILS,
    getUserCodeProjection(),
    function(error, response) {
      if (error) return callback(error)
      return callback(null, response)
    })
  func.printLog(func.LOG_LEVEL_DEBUG, 'findUserCode()', func.logCons.LOG_EXIT)
}

EmailVerificationHelpers.prototype.sendMail = function(email, env, urlMap, userCode, userName, isResetPwd, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendMail()', func.logCons.LOG_ENTER)
  var orgName = urlMap[func.urlCons.PARAM_ORG_NAME]
  var domainName = urlMap[func.urlCons.PARAM_DOMAIN_NAME]
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'email= ' + email + ' orgName= ' + orgName + ' userCode= ' + userCode + ' userName= ' + userName)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'usercode in send mail=' + userCode)
  var rand = shortid.generate()
  generateLink(rand, env, urlMap, configJson[func.configCons.FIELD_VERIFY_ACTIVATION_CODE_PATH], isResetPwd, function(err, shortUrl) {
    var context = generateMailContext(userName, email, domainName, shortUrl)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This context: ' + context)
    var orgName = urlMap[func.urlCons.PARAM_ORG_NAME]
    sendEmail(orgName, domainName + '/' + configJson[func.configCons.FIELD_ACTIVE_EMAIL_FILE], func.msgCons.SUB_INVITATION + dynamicDomain[urlMap[func.urlCons.PARAM_DOMAIN_NAME]][func.dbCons.FIELD_NAME], context, dynamicDomain[urlMap[func.urlCons.PARAM_DOMAIN_NAME]][func.dbCons.FIELD_NAME], function(err, res) {
      if (err) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, err)
        return callback(err)
      }
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'user code=' + userCode + ' mail send successfully orgName=' + orgName)
      saveActivationCodeDetail(userCode, urlMap, rand, function(err, data) {
        if (err) { // error in saving data
          func.printLog(func.logCons.LOG_LEVEL_ERROR, err)
          return callback('error in saving data' + err)
        }
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'user code=' + userCode + ' detail are stored successfully orgName=' + orgName)
        return callback(null, 'sent')
      })
    })
  })
  func.printLog(func.LOG_LEVEL_DEBUG, 'sendMail()', func.logCons.LOG_EXIT)
}

// Find eneterd email is already registered or not
EmailVerificationHelpers.prototype.findUniqueUser = function(email, isResource, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findUniqueUser()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'email= ' + email + ' isResource' + isResource)
  if (isResource === undefined || isResource === 'undefined' || isResource === 'false') {
    isResource = false
  }
  if (isResource === 'true') {
    isResource = true
  }
  if (isResource) {
    // call resource collection api
    getUniqueResource(email, urlMap, function(err, res) {
      if (err) {
        return callback(err)
      }
      return callback(null, res)
    })
  } else {
    // call user detail api
    getUniqueUserDetail(email, true, urlMap, function(err, res) {
      if (err) {
        return callback(err)
      }
      return callback(null, res)
    })
  }
  func.printLog(func.LOG_LEVEL_DEBUG, 'findUniqueUser()', func.logCons.LOG_EXIT)
}

function getUniqueResource(email, urlMap, callback) {
  var encryptedEmail = email
  dbOp.findByKey(func.dbCons.FIELD_EMAIL, func.lightBlueCons.OP_EQUAL, encryptedEmail, urlMap, func.dbCons.COLLECTION_RESOURCE, dbOp.getCommonProjection(), function(err, res) {
    if (err) return callback(err)
    return callback(null, res)
  })
}

function getUniqueUserDetail(email, isProjection, urlMap, callback) {
  var encryptedEmail = email
  if (isProjection) {
    dbOp.findByKey(func.dbCons.FIELD_PROFILE + '.' + func.dbCons.FIELD_EMAIL,
      func.lightBlueCons.OP_EQUAL,
      encryptedEmail, urlMap, func.dbCons.COLLECTION_USER_DETAILS, getUniqueUserProjection(),
      function(error, response) {
        if (error) return callback(error)
        return callback(null, response)
      })
  } else {
    dbOp.findByKey(func.dbCons.FIELD_PROFILE + '.' + func.dbCons.FIELD_EMAIL,
      func.lightBlueCons.OP_EQUAL,
      encryptedEmail, urlMap, func.dbCons.COLLECTION_USER_DETAILS,
      dbOp.getCommonProjection(), function(error, response) {
        if (error) return callback(error)
        return callback(null, response)
      })
  }
}
// Get user status of whether email is verified or not
EmailVerificationHelpers.prototype.checkUserEmailStatus = function(email, urlMap, isResource, callback) {
  // TODO change name to checkEmailStatus
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkUserEmailStatus()', func.logCons.LOG_ENTER)
  var orgName = urlMap[func.urlCons.PARAM_ORG_NAME]
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'email= ' + email + ' orgName= ' + orgName)
  var collectionName = isResource ? dbOp.setCollectionJson(func.dbCons.COLLECTION_RESOURCE, func.dbCons.COMMON_VERSION_1_1_0) : func.dbCons.COLLECTION_USER_DETAILS
  var query = isResource ? generateResourceQueryForEmailStatus(email) : generateQueryForEmailStatus(email)
  var projectionJson = isResource ? getResourceIdProjection() : getUserCodeProjection()
  dbOp.findByQuery(query, urlMap, collectionName, projectionJson, function(error, verified) {
    if (error) callback(error)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Verified :' + JSON.stringify(verified))
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Length of the verification:' + verified.length)
    callback(null, verified)
  })
  func.printLog(func.LOG_LEVEL_DEBUG, 'checkUserEmailStatus()', func.logCons.LOG_EXIT)
}

// send email to user for changing password
EmailVerificationHelpers.prototype.forgotPassword = function(email, env, isResource, urlMap, isSocialDisable, surveyMode, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'forgotPassword()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'email= ' + email + ' isResource=' + isResource + 'orgName=' + urlMap[func.urlCons.PARAM_ORG_NAME])
  if (isResource === undefined || isResource === 'undefined' || isResource === 'false') {
    isResource = false
  }
  if (isResource === 'true') {
    isResource = true
  }
  getUniqueUserOrResourceDetail(email, true, isResource, urlMap,
    function(error, response) {
      if (error) return callback(error)
      var userCode = response[func.dbCons.FIELD_USER_CODE]
      if (!userCode) {
        return callback(new Error('please try with apptitudelabs account'))
      }
      if (isResource == false || isResource == 'false') {
        var userName = response[func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_GIVEN_NAME]
      } else if (isResource == true || isResource == 'true') {
        var userName = response[func.dbCons.FIELD_GIVEN_NAME]
      }
      var rand = shortid.generate()
      updateActivationCodeData(rand, urlMap, userCode, isResource, function(err, res) {
        if (err) return callback(err)
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'activation code detail updated for userCode=' + userCode + ' orgName=' + urlMap[func.urlCons.PARAM_ORG_NAME])
        var link = generatePassResetPageLink(isResource, rand, env, urlMap, isSocialDisable, surveyMode)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'reset pwd link = ' + link)
        shortUrlHelper.getShortenUrl(link, env, urlMap, function(err, response) {
          var domainName = urlMap[func.urlCons.PARAM_DOMAIN_NAME]
          var context = generateMailContext(userName, email, domainName, response)
          var resetPasswordFile = configJson[func.configCons.FIELD_FORGOT_PWD_FILE]
          if (domainName === 'serenaway') {
            resetPasswordFile = configJson[func.configCons.FIELD_SERENAWAY_FORGOT_PWD_FILE]
          }
          sendEmail(domainName + '/' + resetPasswordFile, func.msgCons.SUB_RESET_PASS, context, dynamicDomain[urlMap[func.urlCons.PARAM_DOMAIN_NAME]][func.dbCons.FIELD_NAME], function(err, res) {
            if (err) {
              func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error in mail ' + err)
              return callback(err)
            }
            func.printLog(func.logCons.LOG_LEVEL_INFO, 'mail is sent for reset password for code=' + userCode + ' isResource=' + isResource + ' orgName=' + urlMap[func.urlCons.PARAM_ORG_NAME])
            return callback(null, res)
          })
        })
      })
    })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'forgotPassword()', func.logCons.LOG_EXIT)
}

function generatePassResetPageLink(isResource, rand, env, urlMap, isSocialDisable, surveyMode) {
  var path = cloud[func.configCons.FIELD_PATH][urlMap[func.urlCons.PARAM_DOMAIN_NAME]] + cloud[func.configCons.FIELD_PWD_RESET_PAGE][urlMap[func.urlCons.PARAM_DOMAIN_NAME]] + '?ac=' + rand + '&&is_resource=' + isResource
  if (isResource) {
    path = path + '&&' + func.urlCons.PARAM_IS_SOCIAL_DISABLE + '=' + isSocialDisable + '&&' + func.urlCons.PARAM_SURVEY_MODE + '=' + surveyMode
  }
  var link = func.generateUrl(cloud[func.configCons.FIELD_PROTOCOL], cloud[func.configCons.FIELD_HOST], cloud[func.configCons.FIELD_PORT], env, urlMap, path)
  return link
}
// reset password
EmailVerificationHelpers.prototype.resetPassword = function(json, isResource, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'resetPassword()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'activationCode=' + json.activation_code + ' password= ' + json.password)
  if (isResource === undefined || isResource === 'undefined' || isResource === 'false') {
    isResource = false
  }
  if (isResource === 'true') {
    isResource = true
  }
  this.findUserCode(json.activation_code, urlMap, function(err, res) {
    if (err) {
      return callback(err)
    }
    var userCode = res.user_code
    // var userCode = res[func.dbCons.PARAM_USER_CODE];
    findEmail(userCode, isResource, urlMap, function(err, res) {
      if (err) {
        return callback(err)
      }
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'email : ' + JSON.stringify(res))
      // function for updating data in ldap
      var updateJson = {}
      updateJson.newPassword = json.password
      updateJson.email = res[func.dbCons.FIELD_EMAIL]
      updateJson.o = urlMap[func.urlCons.PARAM_ORG_NAME] + '_' + urlMap[func.urlCons.PARAM_DOMAIN_NAME]
      ldapHelpers.ldapChangePassword(updateJson, function(err, res) {
        if (err) {
          return callback(err)
        }
        return callback(null, res)
      })
    })
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'resetPassword()', func.logCons.LOG_EXIT)
}

function findEmail(userCode, isResource, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findEmail()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'userCode=' + userCode + ' isResource=' + isResource)
  if (isResource) {
    findResourceEmail(userCode, urlMap, function(err, res) {
      if (err) return callback(err)
      return callback(null, res)
    })
  } else {
    findUserEmail(userCode, urlMap, function(err, res) {
      if (err) return callback(err)
      res[func.dbCons.FIELD_EMAIL] = res[func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_EMAIL]
      return callback(null, res)
    })
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findEmail()', func.logCons.LOG_EXIT)
}
// get email id from resource id
function findResourceEmail(userCode, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findEmail()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'userCode=' + userCode)
  dbOp.findByKey(func.dbCons.FIELD_RESOURCE_ID, func.lightBlueCons.OP_EQUAL, userCode, urlMap, func.dbCons.COLLECTION_RESOURCE, dbOp.getProjectionJson(func.dbCons.FIELD_EMAIL), function(err, res) {
    if (err) {
      return callback(err)
    }
    if (res.length === 0) return callback('no data found for given resource id')
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'response for email from database ' + JSON.stringify(res))
    return callback(null, res)
  })
}
// get emailid from usercode
function findUserEmail(userCode, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findUserEmail()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'userCode=' + userCode)
  var projection = dbOp.getProjectionJson(func.dbCons.FIELD_PROFILE + '.' + func.dbCons.FIELD_EMAIL)
  dbOp.findByKey(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, userCode, urlMap, func.dbCons.COLLECTION_USER_DETAILS, projection, function(err, res) {
    if (err) {
      return callback(err)
    }
    if (res.length === 0) return callback('no data found for given user code')
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'response for email from database ' + JSON.stringify(res))
    return callback(null, res)
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findUserEmail()', func.logCons.LOG_EXIT)
}
// resendEmail
EmailVerificationHelpers.prototype.resendEmail = function(email, env, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'resendEmail()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'email= ' + email + 'orgName= ' + urlMap[func.urlCons.PARAM_ORG_NAME])
  findUser(email, urlMap, function(err, res) {
    if (err) {
      return callback(err)
    }
    var userCode = res.user_code
    var userName = res.profile_data.given_name
    var domainName = urlMap[func.urlCons.PARAM_DOMAIN_NAME]
    var rand = shortid.generate()
    generateLink(rand, env, urlMap, configJson[func.configCons.FIELD_VERIFY_ACTIVATION_CODE_PATH], undefined, function(err, shortUrl) {
      var context = generateMailContext(userName, email, domainName, shortUrl)
      sendEmail(domainName + '/' + configJson[func.configCons.FIELD_ACTIVE_EMAIL_FILE], func.msgCons.SUB_INVITATION + dynamicDomain[urlMap[func.urlCons.PARAM_DOMAIN_NAME]][func.dbCons.FIELD_NAME], context, dynamicDomain[urlMap[func.urlCons.PARAM_DOMAIN_NAME]][func.dbCons.FIELD_NAME], function(err, res) {
        if (err) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'error in mail ' + err)
          return callback(err)
        }
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'mail is resent')
        updateActivationCodeDetail(rand, urlMap, userCode, function(err, res) {
          if (err) {
            return callback('error in updating activation code detail')
          }
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'activation code detail updated')
          return callback(null, res)
        })
      })
    })
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'resendEmail()', func.logCons.LOG_EXIT)
}

function getUniqueUserOrResourceDetail(email, isProjection, isResource, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUniqueUserOrResourceDetail()', func.logCons.LOG_EXIT)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'email= ' + email + 'isProjection' + isProjection + ' isResource=' + isResource + 'orgName= ' + urlMap[func.urlCons.PARAM_ORG_NAME])
  if (isResource) {
    getUniqueResourceDetail(email, urlMap, function(err, res) {
      if (err) return callback(err)
      res[0][func.dbCons.FIELD_USER_CODE] = res[0][func.dbCons.FIELD_RESOURCE_ID]
      return callback(null, res[0])
    })
  } else {
    getUniqueUserDetail(email, isProjection, urlMap, function(err, res) {
      if (err) return callback(err)
      return callback(null, res)
    })
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUniqueUserOrResourceDetail()', func.logCons.LOG_EXIT)
}

function getUniqueResourceDetail(email, urlMap, callback) {
  dbOp.findByKey(func.dbCons.FIELD_EMAIL, func.lightBlueCons.OP_EQUAL, email, urlMap, func.dbCons.COLLECTION_RESOURCE, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, response) {
    if (error) return callback('error in fetching resource detail ' + error)
    response = func.convertIntoArray(response)
    if (response.length === 0) return callback('no data found in resource detail')
    if (response.length === 1) return callback(null, response)
    if (response.length > 1) return callback('multiple entries for ' + email)
  })
}
// get user detail from email id
function findUser(email, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findUser()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'email= ' + email)
  // var query = getQueryJsonArrayForElementValue('profile_data.identities',generateQueryForFindUser(email))
  var query = generateQueryForFindUser(email)
  dbOp.findByQuery(query, urlMap, func.dbCons.COLLECTION_USER_DETAILS,
    dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true),
    function(error, response) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'findUser error:' + JSON.stringify(error))
      if (error) return callback(error)
      var responseArray = func.convertIntoArray(response)
      if (responseArray.length != 1) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'findUser error =no user or multiple user found ' + responseArray.length)
        return callback(new Error('findUser error = no user or multiple user found ' + responseArray.length))
      }
      callback(null, response)
    })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findUser()', func.logCons.LOG_EXIT)
}

function generateQueryForFindUser(email) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateQueryForFindUser()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'email= ' + email)
  var operationArray = []
  operationArray.push(dbOp.getQueryJsonArrayForElementValue(func.dbCons.FIELD_PROFILE + '.' + func.dbCons.FIELD_IDENTITIES, dbOp.getQueryJsonForOp(func.dbCons.FIELD_IS_SOCIAL, func.lightBlueCons.OP_EQUAL, false)))
  operationArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_PROFILE + '.' + func.dbCons.FIELD_EMAIL, func.lightBlueCons.OP_EQUAL, email))
  func.printLog(func.LOG_LEVEL_DEBUG, 'generateQueryForFindUser()', func.logCons.LOG_EXIT)
  return dbOp.getOperationJson(func.lightBlueCons.OP_AND, operationArray)
}

function updateActivationCodeData(rand, urlMap, userCode, isResource, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateActivationCodeData()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'rand=' + rand + 'orgName=' + urlMap[func.urlCons.PARAM_ORG_NAME] + 'userCode=' + userCode + 'isResource=' + isResource)
  if (isResource) {
    updateResourceActivationCodeDetail(rand, urlMap, userCode, function(err, res) {
      if (err) return callback(err)
      return callback(null, res)
    })
  } else {
    updateActivationCodeDetail(rand, urlMap, userCode, function(err, res) {
      if (err) return callback(err)
      callback(null, res)
    })
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateActivationCodeData()', func.logCons.LOG_EXIT)
}

function updateResourceActivationCodeDetail(rand, urlMap, userCode, callback) {
  dbOp.findByQuery(generateQueryForFindResource(rand), urlMap, func.dbCons.COLLECTION_ACTIVATION_CODE_DETAILS, dbOp.getProjectionJson(func.dbCons.FIELD_USER_CODE), function(err, res) {
    if (err) return callback('error in finding data from activation code detail ' + err)
    if (res.length === 0) {
      insertActivationCodeDetail(userCode, rand, urlMap, function(err, res) {
        if (err) return callback(err)
        return callback(null, res)
      })
    } else {
      updateActivationCodeDetail(rand, urlMap, es[func.dbCons.FIELD_USER_CODE], function(err, res) {
        if (err) return callback(err)
        return callback(null, res)
      })
    }
  })
}

function insertActivationCodeDetail(userCode, rand, urlMap, callback) {
  var dataToSave = {}
  dataToSave[func.dbCons.FIELD_USER_CODE] = userCode
  dataToSave[func.dbCons.FIELD_ACTIVATION_CODE] = rand
  dataToSave[func.dbCons.FIELD_AC_EXPIRY_TIME] = generateExpiryTime()
  dataToSave[func.dbCons.FIELD_ENTITY_NAME] = 'resources'
  dataToSave[func.dbCons.COMMON_CREATED_BY] = 'URS'
  dataToSave[func.dbCons.COMMON_UPDATED_BY] = 'URS'
  dbOp.insert(urlMap, func.dbCons.COLLECTION_ACTIVATION_CODE_DETAILS, dataToSave, dbOp.getCommonProjection(), function(err, res) {
    if (err) return callback('error in activation code detail insertion ' + err)
    return callback(null, 'activation code detail data inserted')
  })
}

function generateQueryForFindResource(rand) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateQueryForFindResource()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'rand= ' + rand)
  var operationArray = []
  operationArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ACTIVATION_CODE, func.lightBlueCons.OP_EQUAL, rand))
  operationArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ENTITY_NAME, func.lightBlueCons.OP_EQUAL, 'resources'))
  func.printLog(func.LOG_LEVEL_DEBUG, 'generateQueryForFindResource()', func.logCons.LOG_EXIT)
  return dbOp.getOperationJson(func.lightBlueCons.OP_AND, operationArray)
}

// update activation code data in activation code detail
function updateActivationCodeDetail(rand, urlMap, userCode, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateActivationCodeDetail()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'rand=' + rand + 'orgName=' + urlMap[func.urlCons.PARAM_ORG_NAME] + 'userCode=' + userCode)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, userCode)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'query ' + JSON.stringify(query))
  var updateJson = generateDataToUpdate(rand)
  dbOp.update(query, urlMap, func.dbCons.COLLECTION_ACTIVATION_CODE_DETAILS,
    dbOp.getOperationJson(func.lightBlueCons.OP_SET, updateJson),
    dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true),
    function(error, modifiedCount) {
      if (error) return callback('error in updating activation code detail')
      if (modifiedCount === 0) {
        return callback('Not updated')
      } else callback(null, 'updated')
    })
  func.printLog(func.LOG_LEVEL_DEBUG, 'updateActivationCodeDetail()', func.logCons.LOG_EXIT)
}

// store the activation code data in activation code detail
function saveActivationCodeDetail(userCode, urlMap, activationCode, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveActivationCodeDetail()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'userCode=' + JSON.stringify(userCode) + ' activationCode= ' + JSON.stringify(activationCode))
  var dataz = []
  dataz.push(generateDataToSave(userCode, activationCode))
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'data to be insert for activationCode=' + JSON.stringify(dataz))
  dbOp.insert(urlMap, func.dbCons.COLLECTION_ACTIVATION_CODE_DETAILS, dataz, dbOp.getCommonProjection(), function(error, dataforInsert) {
    if (error) return callback(error)
    var orgName = urlMap[func.urlCons.PARAM_ORG_NAME]
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'activationCode inserted for userCode=' + userCode + ' orgName=' + orgName + ' number of data=' + JSON.stringify(dataforInsert))
    return callback(null, dataforInsert)
  })
  func.printLog(func.LOG_LEVEL_DEBUG, 'saveActivationCodeDetail()', func.logCons.LOG_EXIT)
}

function generateQueryForEmailStatus(email) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateQueryForEmailStatus()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'email= ' + email)
  var operationArray = []
  operationArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_PROFILE + '.' + func.dbCons.FIELD_EMAIL_VERIFIED, func.lightBlueCons.OP_EQUAL, true))
  operationArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_PROFILE + '.' + func.dbCons.FIELD_EMAIL, func.lightBlueCons.OP_EQUAL, email))
  func.printLog(func.LOG_LEVEL_DEBUG, 'generateQueryForEmailStatus()', func.logCons.LOG_EXIT)
  return dbOp.getOperationJson(func.lightBlueCons.OP_AND, operationArray)
}

function generateResourceQueryForEmailStatus(email) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateResourceQueryForEmailStatus()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'email= ' + email)
  var operationArray = []
  operationArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_EMAIL_VERIFIED, func.lightBlueCons.OP_EQUAL, true))
  operationArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_EMAIL, func.lightBlueCons.OP_EQUAL, email))
  func.printLog(func.LOG_LEVEL_DEBUG, 'generateResourceQueryForEmailStatus()', func.logCons.LOG_EXIT)
  return dbOp.getOperationJson(func.lightBlueCons.OP_AND, operationArray)
}

function generateDataToSave(userCode, activationCode) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateDataToSave()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'userCode=' + userCode + ' activationCode=' + activationCode)
  var dataToSave = {}
  dataToSave[func.dbCons.FIELD_USER_CODE] = userCode
  dataToSave[func.dbCons.FIELD_ACTIVATION_CODE] = activationCode
  dataToSave[func.dbCons.FIELD_AC_EXPIRY_TIME] = generateExpiryTime()
  dataToSave[func.dbCons.FIELD_ENTITY_NAME] = 'user_details'
  dataToSave[func.dbCons.COMMON_CREATED_BY] = 'URS'
  dataToSave[func.dbCons.COMMON_UPDATED_BY] = 'URS'
  func.printLog(func.LOG_LEVEL_DEBUG, 'generateDataToSave()', func.logCons.LOG_EXIT)
  return dataToSave
}

function generateDataToUpdate(activationCode) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateDataToUpdate()', func.logCons.LOG_ENTER)
  var dataToSave = {}
  dataToSave[func.dbCons.FIELD_ACTIVATION_CODE] = activationCode
  dataToSave[func.dbCons.FIELD_AC_EXPIRY_TIME] = generateExpiryTime()
  func.printLog(func.LOG_LEVEL_DEBUG, 'generateDataToUpdate()', func.logCons.LOG_EXIT)
  return dataToSave
}

function getUserCodeProjection() {
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_USER_CODE))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_AC_EXPIRY_TIME))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PROFILE + '.' + func.dbCons.FIELD_EMAIL_VERIFIED))
  return projection
}

function getResourceIdProjection() {
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_RESOURCE_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_EMAIL_VERIFIED))
  return projection
}

function getUniqueUserProjection() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUniqueUserProjection()', func.logCons.LOG_ENTER)
  var commonProjection = []

  var project = []
  project.push(dbOp.getProjectionJson('isSocial', true))
  project.push(dbOp.getProjectionJson('provider', true))

  var removeWeightage = {}
  removeWeightage[func.lightBlueCons.FIELD_PROJECT] = project
  removeWeightage[func.lightBlueCons.FIELD_FIELD] = 'profile_data.identities'
  removeWeightage[func.lightBlueCons.FIELD_INCLUDE] = true
  removeWeightage[func.lightBlueCons.FIELD_RANGE] = [0, 99]

  commonProjection.push(removeWeightage)
  commonProjection.push(dbOp.getProjectionJson(func.dbCons.FIELD_USER_CODE))
  commonProjection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PROFILE + '.' + func.dbCons.FIELD_GIVEN_NAME))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUniqueUserProjection()', func.logCons.LOG_EXIT)
  return commonProjection
}

/**
 * [generateExpiryTime description]
 * @return {[type]} [description]
 */
function generateExpiryTime() {
  var datetime = new Date()
  var domain = configDomain[func.configCons.FIELD_DEFAULT_DOMAIN_NAME]
  var totalTime = 24
  if (configLinkExpiry[domain].unit == 'days') {
    totalTime = configLinkExpiry[domain].value * 24
  }
  if (configLinkExpiry[domain].unit == 'hours') {
    totalTime = configLinkExpiry[domain].value
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Total Expiry Time in hours: ' + totalTime)
  datetime.setHours(datetime.getHours() + totalTime)
  var date = dateFormat(datetime, "yyyy-mm-dd'T'HH:MM:ss.lo")
  return date
}

function generateLink(rand, env, urlMap, path, isResetPwd, callback) {
  var orgName = urlMap[func.urlCons.PARAM_ORG_NAME]
  var org = env === '-1' ? orgName : (env + '-' + orgName)
  var urlQueryParam = func.urlCons.PARAM_ON + '=' + func.encodeUsingBase64(urlMap[func.urlCons.PARAM_ORG_NAME]) + '&' + func.urlCons.PARAM_DN + '=' + func.encodeUsingBase64(urlMap[func.urlCons.PARAM_DOMAIN_NAME]) + '&' + func.urlCons.PARAM_ENC + '=' + true
  if (isResetPwd) {
    path = path + '/' + rand + '/' + org + '?' + func.urlCons.PARAM_IS_RESET_PWD + '=' + isResetPwd + '&' + urlQueryParam
  } else {
    path = path + '/' + rand + '/' + org + '?' + urlQueryParam
  }
  var link = func.generateUrl(configJson[func.configCons.FIELD_PROTOCOL], configJson[func.configCons.FIELD_HOST], configJson[func.configCons.FIELD_PORT], env, urlMap, path)
  shortUrlHelper.getShortenUrl(link, env, urlMap, function(err, res) {
    return callback(null, res)
  })
}

function generateMailOptions(to, domain, sub, html, text, smtpObject) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailOptions()', func.logCons.LOG_ENTER)
  if (smtpObject['options']['auth']['user'] !== undefined) {
    fromEmail = smtpObject['options']['auth']['user']
  } else {
    fromEmail = '<no-reply@srkay.com>'
  }

  var mailOptions = {
    from: domain + ' ' + fromEmail,
    to: to,
    subject: sub,
    html: html,
    text: text
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailOptions()', func.logCons.LOG_EXIT)
  return mailOptions
}

function generateMailOptionsForTpo(candidateDetailsJson,to, cc, domain, sub, html, text, smtpObject) {
  // var path = './app/views/templates/hirest/' + 'Assessment_Report.csv'
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailOptionsForTpo()', func.logCons.LOG_ENTER)
  if (cc !== undefined && cc !== "") {
    cc = domain[func.configCons.FIELD_CC] + ',' + cc
  } else {
    cc = domain[func.configCons.FIELD_CC]
  }

  var fromEmail = ''
  if (smtpObject['options']['auth']['user'] !== undefined) {
    fromEmail = smtpObject['options']['auth']['user']
  } else {
    fromEmail = '<no-reply@srkay.com>'
  }
  var attachments = {}
  attachments.filename = 'Candidate_Details.csv'
  attachments.contentType = 'text/csv'
  attachments.content = candidateDetailsJson
  // attachments.path = path
  attachments.cid = to
  var mailOptions = {
    from: domain[func.dbCons.FIELD_NAME] + ' ' + fromEmail,
    to: to,
    cc: cc,
    bcc: domain[func.configCons.FIELD_BCC],
    subject: sub,
    html: html,
    attachments: attachments,
    text: text
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailOptionsForTpo()', func.logCons.LOG_EXIT)
  return mailOptions
}

function generateMailOptionsForCandidate(to, domain, sub, html, text, smtpObject) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailOptionsForCandidate()', func.logCons.LOG_ENTER)
  var fromEmail = ''
  if (smtpObject['options']['auth']['user'] !== undefined) {
    fromEmail = smtpObject['options']['auth']['user']
  } else {
    fromEmail = '<no-reply@srkay.com>'
  }
  var mailOptions = {
    from: func.dbCons.FIELD_FROM_NO_REPLY_SRKAY,
    to: to,
    subject: sub,
    html: html,
    text: text
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailOptionsForCandidate()', func.logCons.LOG_EXIT)
  return mailOptions
}

function generateMailContext(userName, email, domainName, link) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailContext()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'userName##########' + JSON.stringify(userName), func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'userName=' + JSON.stringify(userName) + ' email=' + email + ' link=' + link)
  var context = {}
  context.domainName = dynamicDomain[domainName][func.dbCons.FIELD_NAME]
  context.userName = userName
  context.email = email
  context.link = link
  context.fullName = userName.name
  context.url = userName.url
  context.CC = userName.CC
  context.date = userName.date
  context.venue = userName.venue
  context.accommodation = userName.accommodation
  context.pickup_drop = userName.pickup_drop
  context.id = userName.campus_id
  context.password = userName.password
  context.emailId = userName.emailId
  context.designation = userName.designation
  context.tpoName = userName.tpoName
  context.candidateDetails = userName.candidate_details
  if (userName.hasOwnProperty('user_details')) {
    context.course = userName['user_details']['course'] + '-' + userName['user_details']['stream']
    context.username = userName['user_details']['name']
    context.emailTemplates = userName['email_address']
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailContext()', func.logCons.LOG_EXIT)
  return context
}

function sendEmail(orgName, file, sub, context, domain, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_ENTER)
  templates.render(file, context, function(err, html, text, subject) {

    if (smtpConnections[orgName] !== undefined) {
      var mailOptions = generateMailOptions(context.email, domain, sub, html, text, smtpConnections[orgName])
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'Mail configuration for ' + orgName + ' used')
      smtpConnections[orgName].sendMail(mailOptions, function(error, response) {
        if (error) {
          return callback('Error in sending Mail: ' + error)
        }
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Response ' + response)
        smtpConnections[orgName].close()
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_ENTER)
        return callback(null, 'Mail Sent')
      })
    } else {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'Default mail configuration used')
      var mailOptions = generateMailOptions(context.email, domain, sub, html, text, smtpTransport)
      smtpTransport.sendMail(mailOptions, function(error, response) {
        if (error) {
          return callback('Error in sending Mail: ' + error)
        }
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Response ' + response)
        smtpTransport.close()
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_ENTER)
        return callback(null, 'Mail Sent')
      })
    }
  })
}

function sendEmailForCandidateRegistration(orgName, file, sub, context, domain, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmailForCandidateRegistration()', func.logCons.LOG_ENTER)
  templates.render(file, context, function(err, html, text, subject) {

    if (smtpConnections[orgName] !== undefined) {
      var mailOptions = generateMailOptionsForCandidate(context.email, domain, sub, html, text, smtpConnections[orgName])
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'Mail configuration for ' + orgName + ' used')
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
      var mailOptions = generateMailOptionsForCandidate(context.email, domain, sub, html, text, smtpTransport)
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


  })
}

function sendEmailToTpo(candidateDetailsJson,file, sub, context, domain, orgName, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmailToTpo()', func.logCons.LOG_ENTER)
  templates.render(file, context, function(err, html, text, subject) {
    var CC = ""
    if (context.CC !== undefined && context.CC !== null) {
      CC = context.CC
    }

    if (smtpConnections[orgName] !== undefined) {
      var mailOptions = generateMailOptionsForTpo(candidateDetailsJson,context.email, CC, domain, sub, html, text, smtpConnections[orgName])
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'Mail configuration for ' + orgName + ' used')
      smtpConnections[orgName].sendMail(mailOptions, function(error, response) {
        if (error) {
          return callback('Error in sending Mail: ' + error)
        }
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Response ' + response)
        smtpConnections[orgName].close()
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_ENTER)
        return callback(null, 'Mail Sent')
      })
    } else {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'Default mail configuration used')
      var mailOptions = generateMailOptionsForTpo(candidateDetailsJson,context.email, CC, domain, sub, html, text, smtpTransport)
      smtpTransport.sendMail(mailOptions, function(error, response) {
        if (error) {
          return callback('Error in sending Mail: ' + error)
        }
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Response ' + response)
        smtpTransport.close()
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_ENTER)
        return callback(null, 'Mail Sent')
      })
    }
  })
}

exports.EmailVerificationHelpers = EmailVerificationHelpers
