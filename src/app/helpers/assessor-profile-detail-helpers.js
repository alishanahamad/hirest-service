var func = require('../utils/functions')
var async = require('async')
var DbOperation = require('./db-operations').DbOperation
var dbOp = new DbOperation()

function AssessorProfileDetailHelpers () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of Assessor Profile detail helpers')
}

AssessorProfileDetailHelpers.prototype.getAssessorDetails = function (userCode, urlMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessorDetails()', func.logCons.LOG_ENTER)
  getAssessorProfileDetails(userCode, urlMap, env, function (error, response) {
    if (error) {
      callback(new Error().stack, response)
    } else {
      callback(null, response)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessorDetails()', func.logCons.LOG_EXIT)
}

function getAssessorProfileDetails (userCode, urlMap, env, cbAssessorProfileDetails) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessorProfileDetails()', func.logCons.LOG_ENTER)
  dbOp.findByKey(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, userCode, urlMap, func.dbCons.COLLECTION_USER_DETAILS,
    dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true),
    function (error, response) {
    if (error) {
      return cbAssessorProfileDetails(error)
    } else if (response.length === 0) {
      return cbAssessorProfileDetails(null, func.responseGenerator(response, HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_NO_USER_FOUND))
    } else {
      getDecryptedUserData(userCode, urlMap, response, function (error, profileData) {
        if (error) {
          return cbAssessorProfileDetails(error)
        } else {
          getAssessorDetailsFromUserCode(userCode, urlMap, profileData, cbAssessorProfileDetails)
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessorProfileDetails()', func.logCons.LOG_EXIT)
}

function getAssessorDetailsFromUserCode (userCode, urlMap, profileData, cbAssessorDetails) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessorDetailsFromUserCode()', func.logCons.LOG_ENTER)
  dbOp.findByKey(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, userCode, urlMap, func.dbCons.COLLECTION_ASSESSOR_DETAILS,
    dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true),
    function (error, response) {
    if (error) {
      return cbAssessorDetails(error)
    } else if (response.length === 0) {
      insertIntoAssessorDetails(userCode, urlMap, profileData, cbAssessorDetails)
    } else {
      console.log('RESPONSE: ', response)
      createFinalResponseJson(userCode, urlMap, profileData, response, cbAssessorDetails)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessorDetailsFromUserCode()', func.logCons.LOG_EXIT)
}

function insertIntoAssessorDetails (userCode, urlMap, profileData, cbAssessorDetails) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertIntoAssessorDetails()', func.logCons.LOG_ENTER)
  const inputArray = []
  inputArray.push(createAssessorDetailsData(userCode))
  dbOp.insert(urlMap, func.dbCons.COLLECTION_ASSESSOR_DETAILS, inputArray, dbOp.getCommonProjection(), function (error, insertAssessorDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'insertEntriesIntoDB : Error while inserting data : ' + error)
      cbAssessorDetails(new Error().stack, insertAssessorDetails)
    } else if (!insertAssessorDetails || insertAssessorDetails.length === 0) {
      cbAssessorDetails(new Error().stack, [])
    } else {
      createFinalResponseJson(userCode, urlMap, profileData, insertAssessorDetails, cbAssessorDetails)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertIntoAssessorDetails()', func.logCons.LOG_EXIT)
}

function createFinalResponseJson (userCode, urlMap, profileData, assessorDetails, cbFinalJson) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'createFinalResponseJson()', func.logCons.LOG_ENTER)
  var finalResponseJson = {}
  finalResponseJson[func.dbCons.FIELD_PROFILE_DATA] = profileData[func.dbCons.FIELD_PROFILE]
  finalResponseJson[func.dbCons.FIELD_USER_CODE] = userCode
  finalResponseJson[func.dbCons.FIELD_DESIGNATION] = assessorDetails[0][func.dbCons.FIELD_DESIGNATION]
  finalResponseJson[func.dbCons.FIELD_DEPARTMENT] = assessorDetails[0][func.dbCons.FIELD_DEPARTMENT]
  finalResponseJson[func.dbCons.FIELD_UNIT] = assessorDetails[0][func.dbCons.FIELD_UNIT]
  finalResponseJson[func.dbCons.FIELD_LOCATION] = assessorDetails[0][func.dbCons.FIELD_LOCATION]
  cbFinalJson(null, func.responseGenerator(finalResponseJson, HELPER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_DATA_FETCH))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'createFinalResponseJson()', func.logCons.LOG_EXIT)
}

function getDecryptedUserData (userCode, urlMap, profileData, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDecryptedData()', func.logCons.LOG_ENTER)
  var projectionObject = dbOp.getProjectionJson(func.dbCons.FIELD_KEY_ID)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'projectionObject:' + projectionObject)
  profileData = profileData[0]
  var queryArray = []
  queryArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ENTITY_UNIQUE_ID, func.lightBlueCons.OP_EQUAL, userCode))
  queryArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ENTITY_NAME, func.lightBlueCons.OP_EQUAL, 'USER_PROFILE'))
  if (profileData[func.dbCons.FIELD_PROFILE]) profileData[func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_GENDER] = convertGenderNumberToString(profileData[func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_GENDER])
  profileData[func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_USER_STATUS] = profileData[func.dbCons.FIELD_USER_STATUS]
  profileData[func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_USER_CODE] = userCode
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, queryArray), urlMap, func.dbCons.COLLECTION_APP_ENCRYPTION_DETAILS, projectionObject,
    function (error, data) {
      console.log('DATA: ', data)
      if (error) return callback(error)
      // FIXME:handle multiple email(email array)
      var key
      if (data.length > 1) return callback(new Error('multiple user found for same userCode'))
      key = new Buffer(data[0][func.dbCons.FIELD_KEY_ID])
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'key:' + JSON.stringify(key))
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'profileData:' + JSON.stringify(profileData[func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_EMAIL]) + 'key:' + key)
      profileData[func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_EMAIL] = profileData[func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_EMAIL]
      profileData[func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_CONTACT] = profileData[func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_CONTACT]
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findUserProfile()', func.logCons.LOG_EXIT)
      console.log('ProfileData: ', profileData)
      callback(null, profileData)
    })
}

function createAssessorDetailsData (userCode) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'createAssessorDetailsData()', func.logCons.LOG_ENTER)
  const assessorDetailsJson = {}
  assessorDetailsJson[func.dbCons.FIELD_USER_CODE] = userCode
  assessorDetailsJson[func.dbCons.FIELD_DESIGNATION] = ''
  assessorDetailsJson[func.dbCons.FIELD_DEPARTMENT] = ''
  assessorDetailsJson[func.dbCons.FIELD_UNIT] = ''
  assessorDetailsJson[func.dbCons.FIELD_LOCATION] = ''
  assessorDetailsJson[func.dbCons.COMMON_CREATED_BY] = userCode
  assessorDetailsJson[func.dbCons.COMMON_UPDATED_BY] = userCode
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'createAssessorDetailsData()', func.logCons.LOG_EXIT)
  return assessorDetailsJson
}

convertGenderStringToNumber = function (gender) {
  if (!gender) return gender
  gender = gender.toLowerCase()
  if (gender === func.msCons.FIELD_USER_DETAILS_MALE_SINGLE_LETTER || gender === func.msCons.FIELD_USER_DETAILS_MALE) {
    return func.dbCons.ENUM_USER_GENDER_MALE
  } else if (gender === func.msCons.FIELD_USER_DETAILS_FEMALE_SINGLE_LETTER || gender === func.msCons.FIELD_USER_DETAILS_FEMALE) {
    return func.dbCons.ENUM_USER_GENDER_FEMALE
  } else if (gender === func.msCons.FIELD_USER_DETAILS_OTHER_SINGLE_LETTER || gender === func.msCons.FIELD_USER_DETAILS_OTHER) {
    return func.dbCons.ENUM_USER_GENDER_OTHER
  }
}

convertGenderNumberToString = function (gender) {
  if (!gender) return gender
  if (gender === func.dbCons.ENUM_USER_GENDER_MALE) {
    return func.msCons.FIELD_USER_DETAILS_MALE
  } else if (gender === func.dbCons.ENUM_USER_GENDER_FEMALE) {
    return func.msCons.FIELD_USER_DETAILS_FEMALE
  } else if (gender === func.dbCons.ENUM_USER_GENDER_OTHER) {
    return func.msCons.FIELD_USER_DETAILS_OTHER
  }
}

exports.AssessorProfileDetailHelpers = AssessorProfileDetailHelpers
