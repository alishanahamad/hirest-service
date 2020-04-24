var Client = require('node-rest-client')
  .Client;
var client = new Client();
var nodemailer = require('nodemailer');
var EmailTemplates = require('swig-email-templates');
var dateFormat = require('dateformat');
var shortid = require('shortid');
var func = require('../utils/functions');
// var cloud = func.config.get('front_end');
var configDomain = func.config.get('domain_names');
// var configLinkExpiry = func.config.get('link_expiry_time');
// var dynamicDomain = func.config.get('mail_domain_dynamic');
// var configJson = func.config.get('mail_domains');
// var mailTemplate = func.config.get('mail_template');
var smtp = func.config.get('smtp');
// var config = func.config.get('front_end');
var HELPER_CONS = 'AS_ESRH_';

// var templates = new EmailTemplates({
//   root: mailTemplate[func.configCons.FIELD_ROOT]
// });
var smtpTransport = nodemailer.createTransport(smtp);
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
// var smtpTransport = nodemailer.createTransport('brummagem25@gmail.com:Counterfeif20300@smtp.gmail.com');
// var smtpTransport = nodemailer.createTransport('smtps://brummagem25@gmail.com:Counterfeif20300@smtp.gmail.com');

// ShortUrlHelper = require('../helpers/short-url-helpers')
//   .ShortUrlHelper;
// var shortUrlHelper = new ShortUrlHelper();
var resourceProfileHelpers;
EmailVerificationHelpers = require('../helpers/email-verification-helpers').EmailVerificationHelpers;
var emailVerificationHelpers = new EmailVerificationHelpers();

function EmailSenderResourceHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of resource helpers');
  DbOperation = require('./db-operations')
    .DbOperation;
  dbOp = new DbOperation();
  // ResourceProfileHelpers = require('./resource-profile-helpers').ResourceProfileHelpers;
  // resourceProfileHelpers = new ResourceProfileHelpers();
}
/**
 * [description]
 * @param  {[type]}   activationCode [description]
 * @param  {[type]}   urlMap         [description]
 * @param  {[type]}   env            [description]
 * @param  {Function} callback       [description]
 * @return {[type]}                  [description]
 */
EmailSenderResourceHelpers.prototype.verifyResourceActivationCode = function(activationCode, isResetPwd, urlMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'verifyResourceActivationCode()', func.logCons.LOG_ENTER);
  emailVerificationHelpers.findUserCode(activationCode, urlMap, function(error, userResponse) {
    if (error) { // error in finding user code from activation_code_detail
      func.printLog(func.logCons.LOG_LEVEL_ERROR, "Error in finding user code from activation_code_detail: ");
      return callback(new Error().stack, func.errorsArrayGenrator(func.errorObjectGenrator(HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_SERVER_ERROR), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_SERVER_ERROR));
    } else {
      addDataToResource(userResponse, isResetPwd, urlMap, env, function(error, response) {
        //TODO need to delete user if user has missed the expiry date
        if (error) { // error in finding user code from activation_code_detail
          func.printLog(func.logCons.LOG_LEVEL_ERROR, "Error in adding data to resource collections: " + expiry_date - current_date);
          return callback(true, func.errorObjectGenrator('Error', 'Error in adding data to resource collections', 'a18010'));
        } else {
          func.printLog(func.logCons.LOG_LEVEL_INFO, "Resource added successfully");
          return callback(null, response);
        }
      });
    }
  });
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'verifyResourceActivationCode()', func.logCons.LOG_EXIT);
}

/**
 * [description]
 * @param  {[type]}   email      [description]
 * @param  {[type]}   env        [description]
 * @param  {[type]}   urlMap     [description]
 * @param  {[type]}   userCode   [description]
 * @param  {[type]}   firstName   [description]
 * @param  {Boolean}  isResetPwd [description]
 * @param  {Function} callback   [description]
 * @return {[type]}              [description]
 */
EmailSenderResourceHelpers.prototype.sendMailToResource = function(email, env, urlMap, userCode, firstName, isResetPwd, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendMailToResource()', func.logCons.LOG_ENTER);
  var orgName = urlMap[func.urlCons.PARAM_ORG_NAME];
  var domainName = urlMap[func.urlCons.PARAM_DOMAIN_NAME];
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'email= ' + email + ' orgName= ' + orgName + ' userCode= ' + userCode + ' firstName= ' + firstName);
  func.printLog(func.logCons.LOG_LEVEL_INFO, "Resource id in send mail=" + userCode);
  var rand = shortid.generate();
  generateLink(rand, env, urlMap, configJson[func.configCons.FIELD_VERIFY_ACTIVATION_CODE_RESOURCE_PATH], isResetPwd, function(err, shortUrl) {
    var context = generateMailContext(firstName, email, domainName, shortUrl);
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, "This context: " + context);
    var fileToUse = isResetPwd ? configJson[func.configCons.FIELD_ACTIVE_EMAIL_FILE_ADMIN] : configJson[func.configCons.FIELD_ACTIVE_EMAIL_FILE];
    var orgName = urlMap[func.urlCons.PARAM_ORG_NAME]
    sendEmail(orgName, domainName + '/' + fileToUse, dynamicDomain[urlMap[func.urlCons.PARAM_DOMAIN_NAME]][func.configCons.FIELD_ACCOUNT_ACTIVATION_SUBJECT] + dynamicDomain[urlMap[func.urlCons.PARAM_DOMAIN_NAME]][func.dbCons.FIELD_NAME], context, dynamicDomain[urlMap[func.urlCons.PARAM_DOMAIN_NAME]][func.dbCons.FIELD_NAME], function(err, res) {
      if (err) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, err);
        return callback(new Error().stack, func.errorsArrayGenrator(func.errorObjectGenrator(HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_SERVER_ERROR), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_SERVER_ERROR));
      }
      func.printLog(func.logCons.LOG_LEVEL_INFO, "Resource id=" + userCode + " mail sent successfully orgName=" + orgName);
      saveActivationCodeDetail(userCode, urlMap, rand, function(err, data) {
        if (err) { // error in saving data
          func.printLog(func.logCons.LOG_LEVEL_ERROR, err);
          return callback(new Error().stack, func.errorsArrayGenrator(func.errorObjectGenrator(HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_SERVER_ERROR), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_SERVER_ERROR));
        } else {
          func.printLog(func.logCons.LOG_LEVEL_INFO, "Resource id=" + userCode + " detail are stored successfully orgName=" + orgName);
          return callback(null, func.responseGenerator(data, HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_SUCCESS_FETCHED_DATA));
        }
      });
    });
  });
  func.printLog(func.LOG_LEVEL_DEBUG, 'sendMailToResource()', func.logCons.LOG_EXIT);
};

/**
 * [addDataToResource description]
 * @param {[type]}   userResponse [description]
 * @param {[type]}   urlMap       [description]
 * @param {[type]}   env          [description]
 * @param {Function} callback     [description]
 */
function addDataToResource(userResponse, isResetPwd, urlMap, env, callback) {
  if (userResponse.length !== 0) {
    var expiry_date = new Date(userResponse.activation_code_expiry_time);
    var current_date = new Date();
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, "Time difference : " + expiry_date - current_date);
    if ((expiry_date - current_date) > 0) {
      var json = {};
      json[func.dbCons.FIELD_EMAIL_VERIFIED] = true;
      resourceProfileHelpers.updateResourceProfile(userResponse.user_code, urlMap, json, function(error, response) {
        if (error) { // data aren't updated in resource
          return callback(new Error().stack, func.errorsArrayGenrator(func.errorObjectGenrator(HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_SERVER_ERROR), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_SERVER_ERROR));
        } else {
          func.printLog(func.logCons.LOG_LEVEL_INFO, "Data are updated in resource");
          if (isResetPwd) {
            var path = config[func.configCons.FIELD_PATH][urlMap[func.urlCons.PARAM_DOMAIN_NAME]] + config[func.configCons.FIELD_PWD_RESET_PAGE][urlMap[func.urlCons.PARAM_DOMAIN_NAME]];
            var redirectLogInUrl = func.generateUrl(config[func.configCons.FIELD_PROTOCOL], config[func.configCons.FIELD_HOST], config[func.configCons.FIELD_PORT], env, urlMap, path);
            getEmail(userResponse.user_code, urlMap, function (error, response) {
              if (error) {
                redirectLogInUrl += '?' + func.urlCons.PARAM_EMAIL_ENCRYPTED + '=' + null;
                return callback(null, redirectLogInUrl);
              } else {
                redirectLogInUrl += '?' + func.urlCons.PARAM_EMAIL_ENCRYPTED + '=' + response[func.dbCons.FIELD_EMAIL];
                return callback(null, redirectLogInUrl);
              }
            });
          } else {
            var path = config[func.configCons.FIELD_PATH][urlMap[func.urlCons.PARAM_DOMAIN_NAME]] + config[func.configCons.FIELD_LOGIN_PAGE][urlMap[func.urlCons.PARAM_DOMAIN_NAME]];
            var redirectLogInUrl = func.generateUrl(config[func.configCons.FIELD_PROTOCOL], config[func.configCons.FIELD_HOST], config[func.configCons.FIELD_PORT], env, urlMap, path);
            return callback(null, redirectLogInUrl);
          }
        }
      });
    } else {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, "Activation code has expired");
      callback(new Error().stack, func.errorsArrayGenrator(func.errorObjectGenrator(HELPER_CONS + func.msgCons.CODE_FORBIDDEN, func.msgCons.MSG_ERROR_SERVER_ERROR), HELPER_CONS + func.msgCons.CODE_FORBIDDEN, func.msgCons.MSG_ERROR_SERVER_ERROR));
    }
  }
};

/**
 * [generateLink description]
 * @param  {[type]}   rand       [description]
 * @param  {[type]}   env        [description]
 * @param  {[type]}   urlMap     [description]
 * @param  {[type]}   path       [description]
 * @param  {Boolean}  isResetPwd [description]
 * @param  {Function} callback   [description]
 * @return {[type]}              [description]
 */
function generateLink(rand, env, urlMap, path, isResetPwd, callback) {
  var orgName = urlMap[func.urlCons.PARAM_ORG_NAME];
  var urlQueryParam = func.urlCons.PARAM_ON + '=' + func.encodeUsingBase64(urlMap[func.urlCons.PARAM_ORG_NAME]) + '&' + func.urlCons.PARAM_DN + '=' + func.encodeUsingBase64(urlMap[func.urlCons.PARAM_DOMAIN_NAME]) + '&' + func.urlCons.PARAM_ENC + '=' + true;
  var link = func.generateUrl(configJson[func.configCons.FIELD_PROTOCOL], configJson[func.configCons.FIELD_HOST], configJson[func.configCons.FIELD_PORT], env, urlMap, path);
  var finalLink = link + rand + '/' + env + '_' + orgName;
  if (isResetPwd)
    finalLink = finalLink + '?' + func.urlCons.PARAM_IS_RESET_PWD + '=' + isResetPwd;
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'activation link for resource =' + JSON.stringify(finalLink));
  shortUrlHelper.getShortenUrl(finalLink, env, urlMap, function(err, res) {
    if (err) {
      return callback(new Error().stack, func.errorsArrayGenrator(func.errorObjectGenrator(HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_SERVER_ERROR), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_SERVER_ERROR));
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Shorten url helper =' + JSON.stringify(res));
      return callback(null, res);
    }
  });
}

/**
 * [generateMailContext description]
 * @param  {[type]} firstName   [description]
 * @param  {[type]} email      [description]
 * @param  {[type]} domainName [description]
 * @param  {[type]} link       [description]
 * @return {[type]}            [description]
 */
function generateMailContext(firstName, email, domainName, link) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailContext()', func.logCons.LOG_ENTER);
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'firstName=' + firstName + " email=" + email + " link=" + link);
  var context = {};
  context.domainName = dynamicDomain[domainName][func.dbCons.FIELD_NAME];
  context.firstName = firstName;
  context.email = email
  context.link = link;
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailContext()', func.logCons.LOG_EXIT);
  return context;
}

/**
 * [sendEmail description]
 * @param  {[type]}   file     [description]
 * @param  {[type]}   sub      [description]
 * @param  {[type]}   context  [description]
 * @param  {[type]}   domain   [description]
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
function sendEmail (orgName, file, sub, context, domain, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_ENTER);
  templates.render(file, context, function(err, html, text, subject) {
    if (smtpConnections[orgName] !== undefined) {
      var mailOptions = generateMailOptions(context.email, domain, sub, html, text,smtpConnections[orgName]);
      smtpTransport.sendMail(mailOptions, function(error, response) {
        if (error) {
          return callback(new Error().stack, func.errorsArrayGenrator(func.errorObjectGenrator(HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_SERVER_ERROR), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_SERVER_ERROR));
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, "Response " + response);
          smtpTransport.close();
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_ENTER);
          return callback(null, func.responseGenerator(response, HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_SUCCESS_FETCHED_DATA));
        }
      });
    }
    else{
      var mailOptions = generateMailOptions(context.email, domain, sub, html, text,smtpTransport);
      smtpTransport.sendMail(mailOptions, function(error, response) {
        if (error) {
          return callback(new Error().stack, func.errorsArrayGenrator(func.errorObjectGenrator(HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_SERVER_ERROR), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_SERVER_ERROR));
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, "Response " + response);
          smtpTransport.close();
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_ENTER);
          return callback(null, func.responseGenerator(response, HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_SUCCESS_FETCHED_DATA));
        }
      });
    }

  });
}

/**
 * [saveActivationCodeDetail description]
 * @param  {[type]}   userCode       [description]
 * @param  {[type]}   urlMap         [description]
 * @param  {[type]}   activationCode [description]
 * @param  {Function} callback       [description]
 * @return {[type]}                  [description]
 */
function saveActivationCodeDetail(userCode, urlMap, activationCode, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveActivationCodeDetail()', func.logCons.LOG_ENTER);
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'userCode=' + JSON.stringify(userCode) + ' activationCode= ' + JSON.stringify(activationCode));
  var dataz = [];
  dataz.push(generateDataToSave(userCode, activationCode));
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'data to be insert for activationCode=' + JSON.stringify(dataz));
  dbOp.insert(urlMap, func.dbCons.COLLECTION_ACTIVATION_CODE_DETAILS, dataz, function(error, dataforInsert) {
    if (error) return callback(new Error().stack, func.errorsArrayGenrator(func.errorObjectGenrator(HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_SERVER_ERROR), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_SERVER_ERROR));
    else {
      var orgName = urlMap[func.urlCons.PARAM_ORG_NAME];
      func.printLog(func.logCons.LOG_LEVEL_INFO, "activationCode inserted for userCode=" + userCode + " orgName=" + orgName + " number of data=" + JSON.stringify(dataforInsert));
      return callback(null, dataforInsert);
    }
  });
  func.printLog(func.LOG_LEVEL_DEBUG, 'saveActivationCodeDetail()', func.logCons.LOG_EXIT);
}

/**
 * [generateMailOptions description]
 * @param  {[type]} to     [description]
 * @param  {[type]} domain [description]
 * @param  {[type]} sub    [description]
 * @param  {[type]} html   [description]
 * @param  {[type]} text   [description]
 * @return {[type]}        [description]
 */
function generateMailOptions(to, domain, sub, html, text) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailOptions()', func.logCons.LOG_ENTER);
    var fromEmail = ''
  if (smtpObject['options']['auth']['user'] !== undefined) {
    fromEmail = smtpObject['options']['auth']['user']
  } else {
    fromEmail = '<no-reply@srkay.com>'
  }
  var mailOptions = {
    from: domain[func.dbCons.FIELD_NAME] + ' ' + fromEmail,
    to: to,
    subject: sub,
    html: html,
    text: text
  };
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailOptions()', func.logCons.LOG_EXIT);
  return mailOptions;
}

/**
 * [generateDataToSave description]
 * @param  {[type]} userCode       [description]
 * @param  {[type]} activationCode [description]
 * @return {[type]}                [description]
 */
function generateDataToSave(userCode, activationCode) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateDataToSave()', func.logCons.LOG_ENTER);
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'userCode=' + userCode + " activationCode=" + activationCode);
  var dataToSave = {};
  dataToSave[func.dbCons.FIELD_USER_CODE] = userCode;
  dataToSave[func.dbCons.FIELD_ACTIVATION_CODE] = activationCode;
  dataToSave[func.dbCons.FIELD_AC_EXPIRY_TIME] = generateExpiryTime();
  dataToSave[func.dbCons.FIELD_ENTITY_NAME] = 'resource';
  dataToSave[func.dbCons.COMMON_CREATED_BY] = 'URS';
  dataToSave[func.dbCons.COMMON_UPDATED_BY] = 'URS';
  func.printLog(func.LOG_LEVEL_DEBUG, 'generateDataToSave()', func.logCons.LOG_EXIT);
  return dataToSave;
}

/**
 * [generateExpiryTime description]
 * @return {[type]} [description]
 */
function generateExpiryTime() {
  var datetime = new Date();
  var domain = configDomain[func.configCons.FIELD_DEFAULT_DOMAIN_NAME];
  var totalTime = 24;
  if (configLinkExpiry[domain].unit == 'days') {
    totalTime = configLinkExpiry[domain].value * 24;
  }
  if (configLinkExpiry[domain].unit == 'hours') {
    totalTime = configLinkExpiry[domain].value;
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Total Expiry Time in hours: ' + totalTime);
  datetime.setHours(datetime.getHours() + totalTime);
  var date = dateFormat(datetime, "yyyy-mm-dd'T'HH:MM:ss.lo");
  return date;
}

function getEmail(userCode, urlMap, callbackForEmail) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getEmail()', func.logCons.LOG_ENTER);
  dbOp.findByKey(func.dbCons.FIELD_RESOURCE_ID, func.lightBlueCons.OP_EQUAL, userCode, urlMap, func.dbCons.COLLECTION_RESOURCE,
    dbOp.getProjectionJson(func.dbCons.FIELD_EMAIL, true, true),
    function (error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error in retrieving email');
        return callbackForEmail(new Error().stack, response);
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Email Retrieved successfully' + response);
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getEmail()', func.logCons.LOG_EXIT);
        callbackForEmail(null, response);
      }
    });
}

exports.EmailSenderResourceHelpers = EmailSenderResourceHelpers;
