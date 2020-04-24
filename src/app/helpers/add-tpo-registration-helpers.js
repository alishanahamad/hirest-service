var func = require('../utils/functions');
var dbOp;
var async = require('async');
var dateFormat = require('dateformat');
var HELPER_CONS = 'SS_ATR_';
const CryptoHelpers = require('../helpers/crypto-helpers').CryptoHelpers
var cryptoHelpers = new CryptoHelpers()
var authConfig = func.config.get('auth')
var Client = require('node-rest-client').Client
var client = new Client()

function AddRegisterHelper() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of add tpo register helper');
  DbOperation = require('./db-operations').DbOperation;
  dbOp = new DbOperation();
}
/**
 * [adding tpo registration]
 * @param  {[type]} body       [description]
 * @param  {[type]} orgNameMap [description]
 * @param  {[type]} env        [description]
 * @return {[type]}            [description]
 */
AddRegisterHelper.prototype.AddTPORegister = async function(body, orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'AddTPORegister()', func.logCons.LOG_ENTER)
  try {
    let response;
    const checkEmail = await checkEmailInUserDetails(body.email_address, orgNameMap);
    if (checkEmail.length != 0) {
       response = 'Email Already exists';
      return getReturnJson([], response)
    } else {
      const checkInstituteName = await checkInstituteNameInInstituteDetails(body.name, orgNameMap)
      if (checkInstituteName.length !== 0) {
         response = 'Institute Name Already Exists';
        return getReturnJson([], response)
      } else {
        const email = body.email_address
        const name = body.first_name
        const pwd = body.last_name
        const instituteDetails = await insertInstituteDetails(body, orgNameMap)
        const userDetails = await insertUserDetails(body, orgNameMap)
        const tpoUserDetails = await insertTpoUserDetails(instituteDetails, userDetails, body, orgNameMap)
        const userRoleDetails = await insertUserRoleDetails(tpoUserDetails, body, orgNameMap)
        const addUrl = addLdapUrl(orgNameMap, env)
        const addHeaderArgs = addLdapUserArgJson(env, email, name, pwd, orgNameMap)
        const addEmail = await addEmailIdFromLdap(addUrl, addHeaderArgs)
         response = await getFinalJson(instituteDetails, userDetails, userRoleDetails, tpoUserDetails)
        return getReturnJson(response, func.msgCons.SUCCESS_MSG_INSERT)
      }
    }
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while upating tpo details. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'AddTPORegister()', func.logCons.LOG_EXIT)
    throw err
  }
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'AddTPORegister()', func.logCons.LOG_EXIT);
}
/**
 * [getReturnJson return response format]
 * @param  {[type]} data     [description]
 * @param  {[type]} response [description]
 * @return {[type]}          [description]
 */
function getReturnJson(data, response) {
  let errors = []
  return {
    data: data,
    errors: errors,
    message: response
  }
}
/**
 * [getFinalJson final response json format]
 * @param  {[type]} instituteDetails [description]
 * @param  {[type]} userDetails      [description]
 * @param  {[type]} userRoleDetails  [description]
 * @param  {[type]} tpoUserDetails   [description]
 * @return {[type]}                  [description]
 */
async function getFinalJson(instituteDetails, userDetails, userRoleDetails, tpoUserDetails) {
  let json = {
    "institute_details": instituteDetails,
    "user_details": userDetails,
    "user_role_details": userRoleDetails,
    "tpo_user_details": tpoUserDetails
  }
  return json
}
/**
 * [addEmailIdFromLdap add email to ldap]
 * @param {[type]} addUrl        [description]
 * @param {[type]} addHeaderArgs [description]
 */
async function addEmailIdFromLdap(addUrl, addHeaderArgs) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addEmailIdFromLdap() ', func.logCons.LOG_ENTER)
    client.post(addUrl, addHeaderArgs, async function(data, res, err) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'addEmailIdFromLdap()recipient details data is' + data + 'res = ' + res)
      if (err) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addEmailIdFromLdap()', func.logCons.LOG_EXIT)
        return reject(new Error(`addEmailIdFromLdap() error while add email`))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addEmailIdFromLdap()', func.logCons.LOG_EXIT)
        return resolve(data)
      }
    }).on('error', function(error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'addEmailIdFromLdap() error while add email: ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addEmailIdFromLdap()', func.logCons.LOG_EXIT)
      return reject(error)
    })
  });
}

function addLdapUserArgJson(env, email, name, pw, orgWiseMap) {
  let envVar = env !== '-1' ?
    env + '-' :
    ''
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addLdapUserArgJson()', func.logCons.LOG_ENTER)
  var argJson = {}
  argJson[func.configCons.FIELD_DATA] = getAddBodyJson(email, name, pw, orgWiseMap)
  argJson[func.configCons.FIELD_HEADERS] = {}
  argJson[func.configCons.FIELD_HEADERS][func.configCons.FIELD_CONTENT_TYPE] = authConfig[func.configCons.FIELD_CONTENT_TYPE]
  argJson[func.configCons.FIELD_HEADERS][func.configCons.FIELD_ORGNAME] = envVar + orgWiseMap[func.urlCons.PARAM_ORG_NAME]
  argJson[func.configCons.FIELD_HEADERS][func.urlCons.PARAM_DOMAIN_NAME] = orgWiseMap[func.urlCons.PARAM_DOMAIN_NAME]
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addLdapUserArgJson() argJson:' + JSON.stringify(argJson))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addLdapUserArgJson()', func.logCons.LOG_EXIT)
  return argJson
}

function getAddBodyJson(email, name, pw, orgWiseMap) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAddBodyJson()', func.logCons.LOG_ENTER)
  var bodyJson = {}
  bodyJson[func.configCons.FIELD_ORGANIZATION] = orgWiseMap[func.urlCons.PARAM_ORG_NAME]
  bodyJson[func.dbCons.FIELD_CONSULTANCY_USER_EMAIL] = email
  bodyJson[func.configCons.FIELD_FIRST_NAME] = name
  bodyJson[func.configCons.FIELD_PASSWORD] = pw
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAddBodyJson()', func.logCons.LOG_EXIT)
  return bodyJson
}
/**
 * [addLdapUrl url for adding data in ldap]
 * @param {[type]} orgNameMap [description]
 * @param {[type]} env        [description]
 */
function addLdapUrl(orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addLdapUrl()', func.logCons.LOG_ENTER)
  var path = authConfig[func.configCons.FIELD_ADD_LDAP_USER]
  var interMediatoryurl = func.generateUrl(authConfig[func.configCons.FIELD_PROTOCOL], authConfig[func.configCons.FIELD_HOST], authConfig[func.configCons.FIELD_PORT], env, orgNameMap, path)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addLdapUrl()', func.logCons.LOG_EXIT)
  return interMediatoryurl
}
/**
 * [checkInstituteNameInInstituteDetails check if institute name already exists]
 * @param  {[type]} instituteName [description]
 * @param  {[type]} orgNameMap    [description]
 * @return {[type]}               [description]
 */
async function checkInstituteNameInInstituteDetails(instituteName, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkInstituteNameInInstituteDetails()', func.logCons.LOG_ENTER)
  return new Promise((resolve, reject) => {
    dbOp.findByKey('name', func.lightBlueCons.OP_EQUAL, instituteName, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_INSTITUTE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getCommonProjection(),
      function(error, response) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while finding institute details. ${error}`)
          return reject(error)
        } else if (!response || response.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `tpo detail not found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkInstituteNameInInstituteDetails()', func.logCons.LOG_EXIT)
          return resolve(response)
        }
        return resolve(response)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkInstituteNameInInstituteDetails()', func.logCons.LOG_EXIT)
  })
}
/**
 * check email in user details
 * @param  {[type]} email  [description]
 * @param  {[type]} urlMap [description]
 * @return {[type]}        [description]
 */
async function checkEmailInUserDetails(email, urlMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkEmailInUserDetails()', func.logCons.LOG_ENTER)
    dbOp.findByKey('profile_data.email', func.lightBlueCons.OP_EQUAL, email, urlMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_USER_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getCommonProjection(),
      function(error, response) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while updating tpo details. ${error}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkEmailInUserDetails()', func.logCons.LOG_EXIT)
          return reject(error)
        } else if (!response || response.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `tpo detail not found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkEmailInUserDetails()', func.logCons.LOG_EXIT)
          return resolve(response)
        }
        return resolve(response)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkEmailInUserDetails()', func.logCons.LOG_EXIT)
  })
}
/**
 * [insertUserRoleDetails description]
 * @param  {[type]} tpoUserDetails [description]
 * @param  {[type]} body           [description]
 * @param  {[type]} orgNameMap     [description]
 * @return {[type]}                [description]
 */
function insertUserRoleDetails(tpoUserDetails, body, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'insertUserRoleDetails()', func.logCons.LOG_ENTER);
    dbOp.insert(orgNameMap, func.dbCons.COLLECTION_USER_ROLE_DETAILS, getUserRoleDetailsJson(tpoUserDetails, body), dbOp.getCommonProjection(), function(error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while inserting user Role details. ${error}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertUserRoleDetails()', func.logCons.LOG_EXIT)
        return reject(error)
      } else if (!response || response.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertUserRoleDetails()', func.logCons.LOG_EXIT)
        return resolve(response)
      }
      return resolve(response)
    })
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'insertUserRoleDetails()', func.logCons.LOG_EXIT);
}
/**
 * [insertInstituteDetails description]
 * @param  {[type]} body       [description]
 * @param  {[type]} orgNameMap [description]
 * @return {[type]}            [description]
 */
function insertInstituteDetails(body, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'insertInstituteDetails()', func.logCons.LOG_ENTER);
  return new Promise((resolve, reject) => {
    dbOp.insert(orgNameMap, func.dbCons.COLLECTION_INSTITUTE_DETAILS, getInstituteDetailsJson(body), dbOp.getCommonProjection(), function(error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while lightblue call = ' + JSON.stringify(error));
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertInstituteDetails()', func.logCons.LOG_EXIT)
        return reject(error)
      } else if (!response || response.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertInstituteDetails()', func.logCons.LOG_EXIT)
        return resolve(response)
      }
      return resolve(response)
    });
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'insertInstituteDetails()', func.logCons.LOG_EXIT);
}
/**
 * [getUserDetailsJson description]
 * @param  {[type]} body [description]
 * @return {[type]}      [description]
 */
function getUserDetailsJson(body) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getUserDetailsJson()', func.logCons.LOG_ENTER);
  var userDetailsData = {};
  var userData = {};
  var identities = [];
  var identitiesObj = {};
  userDetailsData[func.dbCons.FIELD_USER_STATUS] = 0;
  userDetailsData[func.dbCons.COMMON_CREATED_BY] = body[func.dbCons.COMMON_CREATED_BY];
  userDetailsData[func.dbCons.COMMON_UPDATED_BY] = body[func.dbCons.COMMON_UPDATED_BY];
  identitiesObj[func.dbCons.FIELD_CONNECTION] = "SRKAY-CG";
  identitiesObj[func.dbCons.FIELD_IS_SOCIAL] = false;
  identitiesObj[func.dbCons.FIELD_PROVIDER] = "SRKAY-CG";
  identitiesObj[func.dbCons.FIELD_USER_ID] = 1;
  identities.push(identitiesObj);
  userData[func.dbCons.FIELD_LOCALE] = 'en';
  userData[func.dbCons.FIELD_EMAIL_VERIFIED] = false;
  if ((body.institute_registered !== undefined) && (body.institute_registered === true)) {
    userData[func.dbCons.FIELD_EMAIL_VERIFIED] = true
  }
  userData[func.dbCons.FIELD_GIVEN_NAME] = body[func.dbCons.FILED_FIRST_NAME];
  userData[func.dbCons.FIELD_EMAIL] = body[func.dbCons.FILED_EMAIL_ADDRESS];
  userData[func.dbCons.FIELD_NICK_NAME] = body[func.dbCons.FILED_FIRST_NAME];
  userData[func.dbCons.FIELD_FAMILY_NAME] = body[func.dbCons.FILED_LAST_NAME];
  userData[func.dbCons.FIELD_CONTACT] = body[func.dbCons.FILED_CONTACT_NUMBER];
  userData[func.dbCons.FIELD_NAME] = body[func.dbCons.FILED_FIRST_NAME];
  userData[func.dbCons.FIELD_IDENTITIES] = identities;
  userDetailsData[func.dbCons.FIELD_PROFILE] = userData;
  userData[func.dbCons.FIELD_NICK_NAME] = body[func.dbCons.FILED_FIRST_NAME];
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getUserDetailsJson()', func.logCons.LOG_EXIT);
  return userDetailsData;
}
/**
 * [getTpoUserDetailsJson description]
 * @param  {[type]} instituteDetails [description]
 * @param  {[type]} userDetails      [description]
 * @param  {[type]} body             [description]
 * @return {[type]}                  [description]
 */
function getTpoUserDetailsJson(instituteDetails, userDetails, body) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getTpoUserDetailsJson()', func.logCons.LOG_ENTER);
  var registerJSON = {};
  registerJSON[func.dbCons.FIELD_USER_ID] = userDetails[0][func.dbCons.FIELD_USER_CODE];
  registerJSON[func.dbCons.FIELD_INSTITUTE_ID] = instituteDetails[0][func.dbCons.FILED_ID];
  registerJSON[func.dbCons.FIELD_COURSES] = body[func.dbCons.FIELD_COURSES];
  registerJSON[func.dbCons.FIELD_STREAMS] = body[func.dbCons.FIELD_STREAMS];
  registerJSON[func.dbCons.FIELD_STATUS] = body[func.dbCons.FIELD_STATUS];
  registerJSON[func.dbCons.FIELD_UNIVERSITYS_NAME] = body[func.dbCons.FIELD_UNIVERSITYS_NAME]
  registerJSON[func.dbCons.COMMON_CREATED_BY] = body[func.dbCons.COMMON_CREATED_BY];
  registerJSON[func.dbCons.COMMON_UPDATED_BY] = body[func.dbCons.COMMON_UPDATED_BY];
  if (body[func.dbCons.FIELD_FEMALE] === 'Female') {
    registerJSON[func.dbCons.FIELD_GENDER] = 1
  } else {
    registerJSON[func.dbCons.FIELD_GENDER] = 0
  }
  return registerJSON;
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getTpoUserDetailsJson()', func.logCons.LOG_EXIT);
}
/**
 * [getUserRoleDetailsJson description]
 * @param  {[type]} tpoUserDetails [description]
 * @param  {[type]} body           [description]
 * @return {[type]}                [description]
 */
function getUserRoleDetailsJson(tpoUserDetails, body) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getUserRoleDetailsJson()', func.logCons.LOG_ENTER);
  var registerJSON = {};
  var innerJSON = {};
  innerJSON[func.dbCons.FILED_ID] = tpoUserDetails[0][func.dbCons.FIELD_USER_ID];
  innerJSON[func.dbCons.FIELD_TYPE] = "USER";
  registerJSON[func.dbCons.FIELD_ENTITY_DETAILS] = innerJSON;
  registerJSON[func.dbCons.FIELD_ROLE_NAME] = 2;
  registerJSON[func.dbCons.FIELD_EFFECTIVE_DATE_FROM] = dateFormat(new Date(), "yyyy-mm-dd'T'HH:MM:ss.lo");;
  registerJSON[func.dbCons.FIELD_EFFECTIVE_DATE_TO] = '9999-12-12T00:00:00.000+0530';
  registerJSON[func.dbCons.COMMON_CREATED_BY] = body[func.dbCons.COMMON_CREATED_BY];
  registerJSON[func.dbCons.COMMON_UPDATED_BY] = body[func.dbCons.COMMON_UPDATED_BY];
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getUserRoleDetailsJson()', func.logCons.LOG_EXIT);
  return registerJSON;
}
/**
 * [insertTpoUserDetails description]
 * @param  {[type]} instituteDetails [description]
 * @param  {[type]} userDetails      [description]
 * @param  {[type]} body             [description]
 * @param  {[type]} orgNameMap       [description]
 * @return {[type]}                  [description]
 */
function insertTpoUserDetails(instituteDetails, userDetails, body, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'insertTpoUserDetails()', func.logCons.LOG_ENTER);
    dbOp.insert(orgNameMap, func.dbCons.COLLECTION_TPO_USER_DETAILS, getTpoUserDetailsJson(instituteDetails, userDetails, body), dbOp.getCommonProjection(), function(error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while lightblue call = ' + JSON.stringify(error));
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertTpoUserDetails()', func.logCons.LOG_EXIT)
        return reject(error)
      } else if (!response || response.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertTpoUserDetails()', func.logCons.LOG_EXIT)
        return resolve(response)
      }
      return resolve(response)
    });
  });
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'insertTpoUserDetails()', func.logCons.LOG_EXIT);
}
/**
 * [insertUserDetails description]
 * @param  {[type]} body       [description]
 * @param  {[type]} orgNameMap [description]
 * @return {[type]}            [description]
 */
function insertUserDetails(body, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'insertUserDetails()', func.logCons.LOG_ENTER);
  return new Promise((resolve, reject) => {
    dbOp.insert(orgNameMap, func.dbCons.FIELD_USER_DETAILS, getUserDetailsJson(body), dbOp.getCommonProjection(), function(error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while lightblue call = ' + JSON.stringify(error));
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertUserDetails()', func.logCons.LOG_EXIT)
        return reject(reject)
      } else if (!response || response.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertUserDetails()', func.logCons.LOG_EXIT)
        return resolve(response)
      }
      return resolve(response)
    });
  });
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'insertUserDetails()', func.logCons.LOG_EXIT);
}
/**
 * [getInstituteDetailsJson description]
 * @param  {[type]} body [description]
 * @return {[type]}      [description]
 */
function getInstituteDetailsJson(body) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getInstituteDetailsJson()', func.logCons.LOG_ENTER)
  var registerJSON = {}
  registerJSON[func.dbCons.FIELD_NAME] = body[func.dbCons.FIELD_NAME]
  registerJSON[func.dbCons.FIELD_WEBSITE_URL] = body[func.dbCons.FIELD_WEBSITE_URL]
  registerJSON[func.dbCons.FIELD_STATE] = body[func.dbCons.FIELD_STATE]
  registerJSON[func.dbCons.FIELD_CITY] = body[func.dbCons.FIELD_CITY]
  registerJSON[func.dbCons.FIELD_ADDRESS] = body[func.dbCons.FIELD_ADDRESS]
  registerJSON[func.dbCons.FIELD_STATUS] = body[func.dbCons.FIELD_STATUS]
  registerJSON[func.dbCons.FIELD_LANDLINE_NUMBER] = body[func.dbCons.FIELD_LANDLINE_NUMBER]
  registerJSON[func.dbCons.COMMON_CREATED_BY] = body[func.dbCons.COMMON_CREATED_BY]
  registerJSON[func.dbCons.COMMON_UPDATED_BY] = body[func.dbCons.COMMON_UPDATED_BY]
  registerJSON[func.dbCons.FIELD_ZIPCODE] = body[func.dbCons.FIELD_ZIPCODE]
  registerJSON[func.dbCons.FIELD_TPO_USERS] = body[func.dbCons.FIELD_TPO_USERS]
  registerJSON[func.dbCons.FIELD_ABBREVIATION] = body[func.dbCons.FIELD_ABBREVIATION]
  registerJSON[func.dbCons.FIELD_TPO_USERS] = body[func.dbCons.FIELD_TPO_USERS]
  registerJSON[func.dbCons.FIELD_ABBREVIATION] = body[func.dbCons.FIELD_ABBREVIATION]
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getInstituteDetailsJson()', func.logCons.LOG_EXIT)
  return registerJSON
}

exports.AddRegisterHelper = AddRegisterHelper;
