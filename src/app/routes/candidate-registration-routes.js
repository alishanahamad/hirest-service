var Client = require('node-rest-client').Client
var func = require('../utils/functions')
var client = new Client()
CandidateRegisterHelpers = require('../helpers/candidate-registration-helpers').CandidateRegisterHelpers
var candidateRegisterHelpers = new CandidateRegisterHelpers()
EmailVerificationHelpers = require('../helpers/email-verification-helpers').EmailVerificationHelpers
var emailVerificationHelpers = new EmailVerificationHelpers()
LDAPHelpers = require('../helpers/ldap-helper').LdapHelpers
var ldaphelpers = new LDAPHelpers()
DbOperation = require('../helpers/db-operations').DbOperation
var dbOp = new DbOperation()
var configJson = func.config.get('mail_domains')
ROUTER_CONS = 'HS_CRR_'
var CryptoHelpers = require('../helpers/crypto-helpers').CryptoHelpers
var cryptoHelpers = new CryptoHelpers()

module.exports = function (app) {
  app.post(func.urlCons.URL_CANDIDATE_REGISTRATION, function (req, resp) {
    var urlMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'org name is=' + urlMap[func.urlCons.PARAM_ORG_NAME])
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_CANDIDATE_REGISTRATION + ' method called.....')
    var body = req.body
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'request body for candidate registration:' + JSON.stringify(body))
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'campus id:' + body[func.dbCons.CANDIDATE_FIELD_CAMPUS_ID])
    var fullName = body[func.dbCons.CANDIDATE_FIELD_FIRST_NAME] + ' ' + body[func.dbCons.CANDIDATE_FIELD_LAST_NAME]
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Body:' + body)
    var email = body.email_address
    var json = {}
    var isResetPwd = req.query[func.urlCons.PARAM_IS_RESET_PWD]
    var missingParam = verifyParam(body)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'missingParam:' + missingParam)
    if (!isResetPwd) isResetPwd = false
    if (missingParam == 'none') {
      var campus_id = body[func.dbCons.CANDIDATE_FIELD_CAMPUS_ID]
      delete body[func.dbCons.CANDIDATE_FIELD_CAMPUS_ID]
      var encryptArray = {}
      var bodyToSave = {}
      var userDetailsJSON = {}
      encryptArray[func.dbCons.CANDIDATE_FIELD_ALT_MOBILE_NO] = body[func.dbCons.CANDIDATE_FIELD_ALT_MOBILE_NO]
      encryptArray[func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS] = email
      encryptArray[func.dbCons.CANDIDATE_FIELD_MOBILE_NO] = body[func.dbCons.CANDIDATE_FIELD_MOBILE_NO] + ''
      userDetailsJSON = getJSONforUserDetails(body, encryptArray)
      bodyToSave.personDetailsBody = body
      bodyToSave.campus_id = campus_id
      bodyToSave.userDetailsBody = userDetailsJSON
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'after encryption response body:' + JSON.stringify(encryptArray))
      candidateRegisterHelpers.candidateRegistration(encryptArray, bodyToSave, urlMap, function (error, userDetailsResponse) {
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'after saveresponse body:' + JSON.stringify(bodyToSave))
        if (error) {
          resp.status(func.httpStatusCode.BAD_REQUEST)
          return resp.send(userDetailsResponse)
          // return resp.send(json = func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
        } else if (userDetailsResponse === true) {
          resp.status(func.httpStatusCode.BAD_REQUEST)
          return resp.send(func.errorsArrayGenrator(func.generateErrorArrayObject(ROUTER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.FIELD_CANDIDATE_ALREADY_EXIST), ROUTER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.FIELD_CANDIDATE_ALREADY_EXIST))
          // return resp.send(generateRegistrationResponse(false, func.msgCons.FIELD_CANDIDATE_ALREADY_EXIST))
        } else {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'userDetailsResponse body:' + JSON.stringify(userDetailsResponse))
          var encryptionDetails = {}
          var key = cryptoHelpers.getKey()
          encryptionDetails[func.dbCons.FIELD_KEY_ID] = key
          var fieldsToEncrypt = []
          fieldsToEncrypt.push(func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS)
          fieldsToEncrypt.push(func.dbCons.CANDIDATE_FIELD_MOBILE_NO)
          encryptionDetails[func.dbCons.FIELD_ENTITY_FIELD_NAME] = fieldsToEncrypt
          encryptionDetails[func.dbCons.FIELD_ENTITY_UNIQUE_ID] = userDetailsResponse[0][func.dbCons.FIELD_USER_CODE]
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'fieldsToEncrypt: ' + fieldsToEncrypt)
          encryptionDetails[func.dbCons.FIELD_ENTITY_FIELD_NAME] = fieldsToEncrypt
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'encryptionDetails: ' + JSON.stringify(encryptionDetails))
          var orgName = urlMap[func.urlCons.PARAM_ORG_NAME] + '_' + urlMap[func.urlCons.PARAM_DOMAIN_NAME]
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'email: ' + email)
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'orgName: ' + orgName)
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'body: ' + body)
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'encryptionDetails body:' + JSON.stringify(encryptionDetails))
          cryptoHelpers.insertAppEncryptionDetails(encryptionDetails, urlMap, function calllbackInsertAppEncryptionDetails (error, data) {
            if (error) {
              resp.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
              return resp.send(json = func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
            }
            ldaphelpers.add(getJsonForLdap(email, orgName, body, userDetailsResponse[0][func.dbCons.FIELD_USER_CODE]), function (err, response) {
              func.printLog(func.logCons.LOG_LEVEL_INFO, 'ldap response=' + JSON.stringify(response))
              if (err) { // error in ldap operation
                func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error during ldap operation')
                resp.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
                return resp.send(generateRegistrationResponse(true, checkLDAPError(err)))
              } else {
                var campusID = userDetailsResponse[func.dbCons.FIELD_PERSON_ID]
                var myJson = {}
                myJson['name'] = fullName
                myJson['campus_id'] = campusID
                func.printLog(func.logCons.LOG_LEVEL_INFO, 'data are stored in ldap')
                emailVerificationHelpers.sendMailCandidateRegistration(email, env, urlMap, myJson, configJson[func.configCons.FIELD_CANDIDATES_INTIMATION_FILE], func.msgCons.CANDIDATE_REGISTRATION_ACKNOWLEDGE, isResetPwd, function (err, res) {
                  if (err) {
                    resp.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
                    return resp.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
                  } else {
                    func.printLog(func.logCons.LOG_LEVEL_INFO, 'mail sent successully')
                    resp.status(func.httpStatusCode.OK)
                    return resp.send(func.responseGenerator([], ROUTER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.CANDIDATE_REGISTRATION_SUCCESS))
                  }
                })
                resp.status(func.httpStatusCode.OK)
                return resp.send(func.responseGenerator([], ROUTER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.CANDIDATE_REGISTRATION_SUCCESS))
              }
            })
          })
        }
      })
    } else { // insufficient param
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'insufficientParamPayload')
      resp.status(func.httpStatusCode.BAD_REQUEST)
      json = func.errorResponseGenrator(func.msgCons.MSG_ERROR_INVALID_REQUEST, func.msgCons.MSG_ERROR_INVALID_PARAM_VALUE + missingParam)
      func.printLog(func.logCons.LOG_LEVEL_INFO, JSON.stringify(json))
      return resp.send(json)
    }
  })
}

function getJSONforUserDetails (body, encryptArray) {
  var json = {}
  var profiledata = {}
  var agerange = {}
  var identities = []
  var identity = {}
  var name
  json[func.dbCons.FIELD_USER_STATUS] = 1
  profiledata[func.dbCons.FIELD_EMAIL_VERIFIED] = true
  profiledata[func.dbCons.CANDIDATE_FIELD_GENDER] = body[func.dbCons.CANDIDATE_FIELD_GENDER]
  profiledata[func.dbCons.FIELD_TIME_ZONE] = -5.5
  profiledata[func.dbCons.FIELD_GIVEN_NAME] = body[func.dbCons.CANDIDATE_FIELD_FIRST_NAME]
  profiledata[func.dbCons.FIELD_LOCALE] = 'en-US'
  profiledata[func.dbCons.FIELD_PICTURE] = body[func.dbCons.CANDIDATE_FIELD_PROFILE_IMAGE]
  agerange[func.dbCons.FIELD_MIN] = 18
  agerange[func.dbCons.FIELD_MAX] = 35
  profiledata[func.dbCons.FIELD_AGE_RANGE] = agerange
  identity[func.dbCons.FIELD_IS_SOCIAL] = false
  identity[func.dbCons.FIELD_PROVIDER] = 'SRKAY-CG'
  identity[func.dbCons.FIELD_USER_ID] = '1995'
  identity[func.dbCons.FIELD_CONNECTION] = 'SRKAY-CG'
  identities.push(identity)
  profiledata[func.dbCons.FIELD_IDENTITIES] = identities
  name = body[func.dbCons.CANDIDATE_FIELD_FIRST_NAME] + ' ' + body[func.dbCons.CANDIDATE_FIELD_LAST_NAME]
  profiledata[func.dbCons.FIELD_NAME] = name
  profiledata[func.dbCons.FIELD_NICK_NAME] = name
  profiledata[func.dbCons.FIELD_FAMILY_NAME] = body[func.dbCons.CANDIDATE_FIELD_LAST_NAME]
  profiledata[func.dbCons.FIELD_CONTACT] = encryptArray[func.dbCons.CANDIDATE_FIELD_MOBILE_NO]
  profiledata[func.dbCons.FIELD_EMAIL] = encryptArray[func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS]
  json[func.dbCons.FIELD_PROFILE] = profiledata
  return json
}

function getJsonForLdap (email, orgName, body, userCode) {
  var json = {}
  json[func.ldapCons.FIELD_ORG] = orgName
  json[func.ldapCons.FIELD_CN] = email
  json[func.ldapCons.FIELD_SN] = body[func.dbCons.CANDIDATE_FIELD_FIRST_NAME]
  json[func.ldapCons.FIELD_UID] = userCode
  json[func.ldapCons.FIELD_USER_PASSWORD] = body[func.dbCons.CANDIDATE_FIELD_LAST_NAME]
  json[func.ldapCons.FIELD_OBJECTCLASS] = 'inetOrgPerson'
  return json
}

function verifyParam (jsonParam) {
  var missingParam = ''
  if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_FIRST_NAME)) {
    missingParam = func.dbCons.CANDIDATE_FIELD_FIRST_NAME
  } else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_LAST_NAME)) {
    missingParam = func.dbCons.CANDIDATE_FIELD_LAST_NAME
  } else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_DOB)) {
    missingParam = func.dbCons.CANDIDATE_FIELD_DOB
  } else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_GENDER)) {
    missingParam = func.dbCons.CANDIDATE_FIELD_GENDER
  } else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_MARITAL_STATUS)) {
    missingParam = func.dbCons.CANDIDATE_FIELD_MARITAL_STATUS
  } else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_UID_NO)) {
    missingParam = func.dbCons.CANDIDATE_FIELD_UID_NO
  } else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS)) {
    missingParam = func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS
  } else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_MOBILE_NO)) {
    missingParam = func.dbCons.CANDIDATE_FIELD_MOBILE_NO
  } else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_ADDRESS_TYPE)) {
    missingParam = func.dbCons.CANDIDATE_FIELD_ADDRESS_TYPE
//   } else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_ADDRESS)) {
//     missingParam = func.dbCons.CANDIDATE_FIELD_ADDRESS
  } else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_CITY)) {
    missingParam = func.dbCons.CANDIDATE_FIELD_CITY
  } else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_STATE)) {
    missingParam = func.dbCons.CANDIDATE_FIELD_STATE
  } else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_COUNTRY)) {
    missingParam = func.dbCons.CANDIDATE_FIELD_COUNTRY
  } else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_ZIPCODE)) {
    missingParam = func.dbCons.CANDIDATE_FIELD_ZIPCODE
  }
  // else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_QUALIFICATION)) {
  //   missingParam = func.dbCons.CANDIDATE_FIELD_QUALIFICATION
  // } else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_QUALIFICATION_AWARDER)) {
  //   missingParam = func.dbCons.CANDIDATE_FIELD_QUALIFICATION_AWARDER
  // } else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_QUALIFICATION_START_YEAR)) {
  //   missingParam = func.dbCons.CANDIDATE_FIELD_QUALIFICATION_START_YEAR
  // } else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_QUALIFICATION_COMPLETED_AT)) {
  //   missingParam = func.dbCons.CANDIDATE_FIELD_QUALIFICATION_COMPLETED_AT
  // } else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_PASSING_GRADE)) {
  //   missingParam = func.dbCons.CANDIDATE_FIELD_PASSING_GRADE
  // } else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_PASSING_YEAR)) {
  //   missingParam = func.dbCons.CANDIDATE_FIELD_PASSING_YEAR
  // } else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_PASSING_PERCENTAGE)) {
  //   missingParam = func.dbCons.CANDIDATE_FIELD_PASSING_PERCENTAGE
  // }
  else if (!jsonParam.hasOwnProperty(func.dbCons.CANDIDATE_FIELD_CAMPUS_ID)) {
    missingParam = func.dbCons.CANDIDATE_FIELD_CAMPUS_ID
  } else {
    missingParam = 'none'
  }
  return missingParam
}

function checkLDAPError (err) {
  switch (err) {
    case 1:
      func.printLog(func.logCons.LOG_LEVEL_INFO, func.msgCons.MSG_NOT_UNIQUE_USERNAME)
      return func.msgCons.MSG_NOT_UNIQUE_USERNAME
    case 2:
      func.printLog(func.logCons.LOG_LEVEL_INFO, func.msgCons.MSG_ERROR_LDAP)
      return func.msgCons.MSG_ERROR_LDAP
  }
}

function generateRegistrationResponse (status, msg) {
  var json = {}
  json[func.urlCons.PARAM_ERROR_STATUS] = status
  json[func.urlCons.PARAM_DATA] = msg
  return json
}
