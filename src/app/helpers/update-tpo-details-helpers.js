'use strict'
/**
 * This function is useful for updating tpo details
 * @author Ekta kakadia
 */
const func = require('../utils/functions')
const DbOperation = require('./db-operations').DbOperation
const dbOp = new DbOperation()
var _ = require('lodash')
const HELPER_CONS = 'HI_UTDH_'
var authConfig = func.config.get('auth')
var Client = require('node-rest-client').Client
var client = new Client()
function UpdateTpoDetailsHelpers() {

  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of updating tpo details')
}
/**
 * [description]
 * @param  {[type]} reqBody    [institute_id,user_id and other tpo details]
 * @param  {[type]} orgNameMap [description]
 * @param  {[type]} env        [description]
 * @return {[type]}            [description]
 */
UpdateTpoDetailsHelpers.prototype.updateTpoDetails = async function (body, instituteId, userId, orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateTpoDetails()', func.logCons.LOG_ENTER)
  try {
    const newEmail = body.email_address;
    const firstName = body.first_name;
    const passWord = body.last_name;
    const userDetails = await getUserEmail(userId, orgNameMap)
    const oldEmail = userDetails[0].profile_data.email;
    if (oldEmail !== newEmail) {
    const addRemoveLdap = await addRemoveLdapUserEntry(env, oldEmail, newEmail, firstName, passWord, orgNameMap)
  }
    const updatedTpoDetail = await updateUserDetails(body, userId, orgNameMap)
    const updatedTpoUserDetails = await updateTpoUserDetails (body, userId, orgNameMap)
    const updateInsituteDetails = await updateInstituteDetails(body, instituteId, orgNameMap)
    const response = await getFinalResponse(updatedTpoDetail, updatedTpoUserDetails, updateInsituteDetails )
    return response
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while upating tpo details. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateTpoDetails()', func.logCons.LOG_EXIT)
    throw err
  }
}
/**
 * [addRemoveLdapUserEntry add and remove email from ldap]
 * @param {[type]} env        [description]
 * @param {[type]} oldEmail   [email address]
 * @param {[type]} newEmail   [updated Email address]
 * @param {[type]} name       [first_name from person_detail collection]
 * @param {[type]} pw         [last_name from person_detail collection]
 * @param {[type]} orgNameMap [description]
 */
async function addRemoveLdapUserEntry(env, oldEmail, newEmail, name, pw, orgNameMap) {
  var addUrl = addLdapUrl(orgNameMap, env)
  var addHeaderArgs = addLdapUserArgJson(env, oldEmail, newEmail, name, pw, orgNameMap)
  const addEmail = await addEmailIdFromLdap(addUrl, addHeaderArgs)
  var removeUrl = removeLdapUrl(orgNameMap, env)
  var removeHeaderArgs = removeLdapUserArgJson(env, oldEmail, newEmail, orgNameMap)
  const removeEmail = await removeEmailIdFromLdap(removeUrl, oldEmail, removeHeaderArgs)
  return removeEmail
}

/**
 * [addRemoveEmailIdFromLdap description]
 * @param {[type]} url  [url of adding email entry from ldap]
 * @param {[type]} args [json for adding entry from the ldap]
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

/**
 * [removeEmailIdFromLdap remove email entry from ldap]
 * @param  {[type]} url      [description]
 * @param  {[type]} oldEmail [already exixts email in ldap]
 * @param  {[type]} args     [description]
 * @return {[type]}          [description]
 */
async function removeEmailIdFromLdap(removeUrl, oldEmail, removeHeaderArgs) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'removeEmailIdFromLdap() ', func.logCons.LOG_ENTER)
    client.post(removeUrl, removeHeaderArgs, async function(data, res, err) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'removeEmailIdFromLdap()recipient details data is ' + data + ' ' + 'res = ' + res)
      if (data == oldEmail + ' ' + 'does not exist in given organization') {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'removeEmailIdFromLdap()', func.logCons.LOG_EXIT)
        return resolve(new Error(`addEmailIdFromLdap() error while remove email`))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'removeEmailIdFromLdap()', func.logCons.LOG_EXIT)
        return resolve(data)
      }
    }).on('error', function(error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'removeEmailIdFromLdap() error while remove email: ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'removeEmailIdFromLdap()', func.logCons.LOG_EXIT)
      return reject(error)
    })
  });
}

/**
 * [removeLdapUrl url for remove ldap entry]
 * @param  {[type]} orgNameMap [description]
 * @param  {[type]} env        [description]
 * @return {[type]}            [description]
 */
function removeLdapUrl(orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'removeLdapUrl()', func.logCons.LOG_ENTER)
  var path = authConfig[func.configCons.FIELD_REMOVE_LDAP_USER]
  var interMediatoryurl = func.generateUrl(authConfig[func.configCons.FIELD_PROTOCOL], authConfig[func.configCons.FIELD_HOST], authConfig[func.configCons.FIELD_PORT], env, orgNameMap, path)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'removeLdapUrl()', func.logCons.LOG_EXIT)
  return interMediatoryurl
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

function removeLdapUserArgJson(env, oldEmail, newEmail, orgWiseMap) {
  let envVar = env !== '-1' ?
    env + '-' :
    ''
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'removeLdapUserArgJson()', func.logCons.LOG_ENTER)
  var argJson = {}
  argJson[func.configCons.FIELD_DATA] = getRemoveBodyJson(oldEmail, newEmail, orgWiseMap)
  argJson[func.configCons.FIELD_HEADERS] = {}
  argJson[func.configCons.FIELD_HEADERS][func.configCons.FIELD_CONTENT_TYPE] = authConfig[func.configCons.FIELD_CONTENT_TYPE]
  argJson[func.configCons.FIELD_HEADERS][func.configCons.FIELD_ORGNAME] = envVar + orgWiseMap[func.urlCons.PARAM_ORG_NAME]
  argJson[func.configCons.FIELD_HEADERS][func.urlCons.PARAM_DOMAIN_NAME] = orgWiseMap[func.urlCons.PARAM_DOMAIN_NAME]
  console.log("1111111111111",argJson);
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'removeLdapUserArgJson() argJson:' + JSON.stringify(argJson))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'removeLdapUserArgJson()', func.logCons.LOG_EXIT)
  return argJson
}

function addLdapUserArgJson(env, oldEmail, newEmail, name, pw, orgWiseMap) {
  let envVar = env !== '-1' ?
    env + '-' :
    ''
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addLdapUserArgJson()', func.logCons.LOG_ENTER)
  var argJson = {}
  argJson[func.configCons.FIELD_DATA] = getAddBodyJson(oldEmail, newEmail, name, pw, orgWiseMap)
  argJson[func.configCons.FIELD_HEADERS] = {}
  argJson[func.configCons.FIELD_HEADERS][func.configCons.FIELD_CONTENT_TYPE] = authConfig[func.configCons.FIELD_CONTENT_TYPE]
  argJson[func.configCons.FIELD_HEADERS][func.configCons.FIELD_ORGNAME] = envVar + orgWiseMap[func.urlCons.PARAM_ORG_NAME]
  argJson[func.configCons.FIELD_HEADERS][func.urlCons.PARAM_DOMAIN_NAME] = orgWiseMap[func.urlCons.PARAM_DOMAIN_NAME]
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addLdapUserArgJson() argJson:' + JSON.stringify(argJson))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addLdapUserArgJson()', func.logCons.LOG_EXIT)
  return argJson
}

function getRemoveBodyJson(oldEmail, newEmail, orgWiseMap) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getRemoveBodyJson()', func.logCons.LOG_ENTER)
  var bodyJson = {}
  bodyJson[func.configCons.FIELD_ORGANIZATION] = orgWiseMap[func.urlCons.PARAM_ORG_NAME]
  bodyJson[func.dbCons.FIELD_EMAIL] = oldEmail
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getRemoveBodyJson()', func.logCons.LOG_EXIT)
  return bodyJson
}

function getAddBodyJson(oldEmail, newEmail, name, pw, orgWiseMap) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAddBodyJson()', func.logCons.LOG_ENTER)
  var bodyJson = {}
  bodyJson[func.configCons.FIELD_ORGANIZATION] = orgWiseMap[func.urlCons.PARAM_ORG_NAME]
  bodyJson[func.dbCons.FIELD_CONSULTANCY_USER_EMAIL] = newEmail
  bodyJson[func.configCons.FIELD_FIRST_NAME] = name
  bodyJson[func.configCons.FIELD_PASSWORD] = pw
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAddBodyJson()', func.logCons.LOG_EXIT)
  return bodyJson
}

async function getUserEmail(userId, orgNameMap){
    return new Promise((resolve, reject) => {
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, userId), orgNameMap, func.dbCons.FIELD_USER_DETAILS,
  dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true),
  function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while finding user details. ${error}`)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserEmail()', func.logCons.LOG_EXIT)
      return reject(error)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, `user detail not found`)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserEmail()', func.logCons.LOG_EXIT)
      return resolve(response)
    }
    return resolve(response)
  })
})
}
async function getFinalResponse(updatedTpoDetail, updatedTpoUserDetails, updateInsituteDetails){
  let json ={
    'tpo_details':updatedTpoDetail,
    'tpo_user_details':updatedTpoUserDetails,
    'institute_details':updateInsituteDetails
  }
  return json
}
async function updateInstituteDetails(tpoDetails, instituteId, orgNameMap){
  return new Promise((resolve, reject) => {
    let updateJson = getInstituteUpdateJson(tpoDetails);
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateInstituteDetails()', func.logCons.LOG_ENTER)
    dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ENTITY_DETAILS_ID, func.lightBlueCons.OP_EQUAL, instituteId),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.FIELD_INSTITUTE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getOperationJson(func.lightBlueCons.OP_SET, updateJson),
      dbOp.getCommonProjection(), (err, updatedTpoDetail) => {
        if (err) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while updating institute details. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateInstituteDetails()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!updatedTpoDetail || updatedTpoDetail.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `institute detail not found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateInstituteDetails()', func.logCons.LOG_EXIT)
          return resolve(updatedTpoDetail)
        }
        return resolve(updatedTpoDetail)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateInstituteDetails()', func.logCons.LOG_EXIT)
  })
}

/**
 * [updateUserDetails description]
 * @param  {[type]} tpoDetail  [tpo details]
 * @param  {[type]} orgNameMap [description]
 * @return {[type]}            [description]
 */
async function updateUserDetails (tpoDetail, userId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateUserDetails()', func.logCons.LOG_ENTER)
    const updateJson = getUpdateJson(tpoDetail)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_USER_CODE, true, true))
    dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL,userId),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_USER_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getOperationJson(func.lightBlueCons.OP_SET, updateJson),
      dbOp.getCommonProjection(), (err, response) => {
        if (err) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while updating user details. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateUserDetails()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!response || response.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `user detail not found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateUserDetails()', func.logCons.LOG_EXIT)
          return resolve(response)
        }
        return resolve(response)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateUserDetails()', func.logCons.LOG_EXIT)
  })
}

/**
 * [updateTpoUserDetails description]
 * @param  {[type]} tpoDetail  [tpo details]
 * @param  {[type]} orgNameMap [description]
 * @return {[type]}            [description]
 */
async function updateTpoUserDetails (tpoDetail, userId,orgNameMap) {
  return new Promise((resolve, reject) => {
    let tpoUpdatedJson = {}
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateTpoUserDetails()', func.logCons.LOG_ENTER)
     tpoUpdatedJson[func.dbCons.FIELD_UNIVERSITYS_NAME] = tpoDetail[func.dbCons.FIELD_UNIVERSITYS_NAME]
     tpoUpdatedJson[func.dbCons.FIELD_STREAMS] = tpoDetail[func.dbCons.FIELD_COURSES]
     tpoUpdatedJson[func.dbCons.FIELD_COURSES] = tpoDetail[func.dbCons.FIELD_COURSES]
     if(tpoDetail[func.dbCons.FIELD_GENDER] === 'Male'){
       tpoUpdatedJson[func.dbCons.FIELD_GENDER] = 0
     }else{
       tpoUpdatedJson[func.dbCons.FIELD_GENDER] = 1
     }
     dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.COLLECTION_JSON_USER_ID, func.lightBlueCons.OP_EQUAL, userId),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_TPO_USER_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getOperationJson(func.lightBlueCons.OP_SET, tpoUpdatedJson),
      dbOp.getCommonProjection(), (err, response) => {
        if (err) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while updating tpo details in tpo user collection. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateTpoUserDetails()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!response || response.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `tpo detail not found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateTpoUserDetails()', func.logCons.LOG_EXIT)
          return resolve(response)
        }
        return resolve(response)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateTpoUserDetails()', func.logCons.LOG_EXIT)
  })
}
function getInstituteUpdateJson(body){
  let json = {}
  json[func.dbCons.CANDIDATE_FIELD_ADDRESS] = body[func.dbCons.CANDIDATE_FIELD_ADDRESS]
  json[func.dbCons.FIELD_LANDLINE_NUMBER] = body[func.dbCons.FIELD_LANDLINE_NUMBER]
  json[func.dbCons.FIELD_CITY] =  body[func.dbCons.FIELD_CITY]
  json[func.dbCons.FIELD_ABBREVIATION] = body[func.dbCons.FIELD_ABBREVIATION]
  json[func.dbCons.CANDIDATE_FIELD_ZIPCODE] = body[func.dbCons.CANDIDATE_FIELD_ZIPCODE]
  json[func.dbCons.FIELD_WEBSITE_URL] = body[func.dbCons.FIELD_WEBSITE_URL]
  json[func.dbCons.FIELD_INSTITUTE_DETAILS_NAME] = body[func.dbCons.FIELD_INSTITUTE_DETAILS_NAME]
  json[func.dbCons.CANDIDATE_FIELD_STATE] = body[func.dbCons.CANDIDATE_FIELD_STATE]
  json[func.dbCons.FIELD_TPO_USERS] = body[func.dbCons.FIELD_TPO_USERS]
  return json
}
/**
 * [getUpdateJson description]
 * @param  {[type]} tpoDetail [profile data that need to be updated]
 * @return {[type]}           [description]
 */
function getUpdateJson (tpoDetail) {
  let tpoUpdateJson = {}
  tpoUpdateJson[func.dbCons.FIELD_PROFILE + '.' + func.dbCons.FIELD_NAME] = tpoDetail[func.dbCons.FILED_FIRST_NAME]
  tpoUpdateJson[func.dbCons.FIELD_PROFILE + '.' + func.dbCons.FIELD_FAMILY_NAME] = tpoDetail[func.dbCons.CANDIDATE_FIELD_LAST_NAME]
  tpoUpdateJson[func.dbCons.FIELD_PROFILE + '.' + func.dbCons.FIELD_EMAIL] = tpoDetail[func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS]
  tpoUpdateJson[func.dbCons.FIELD_PROFILE + '.' + func.dbCons.FIELD_GIVEN_NAME] = tpoDetail[func.dbCons.FILED_FIRST_NAME]
  if(tpoDetail.gender === 'Male'){
    tpoUpdateJson[func.dbCons.FIELD_PROFILE + '.' +func.dbCons.FIELD_GENDER] = 0
  }else{
    tpoUpdateJson[func.dbCons.FIELD_PROFILE + '.' +func.dbCons.FIELD_GENDER] = 1
  }

  console.log("==============",tpoUpdateJson);
  return tpoUpdateJson
}

/**
 * [getReturnJson description]
 * @param  {[type]} tpoDetail [updated tpo details]
 * @return {[type]}           [description]
 */
function getReturnJson (tpoDetail) {
  let errors = []
  return {
    data: tpoDetail,
    errors: errors,
    message: (tpoDetail.length === 0) ? func.msgCons.ERROR_MSG_UPDATE_DATA : func.msgCons.SUCCESS_MSG_UPDATE_DATA
  }
}

exports.UpdateTpoDetailsHelpers = UpdateTpoDetailsHelpers
