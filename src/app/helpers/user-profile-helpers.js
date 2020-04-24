/**
 * This function is useful for fetching the candidate related information
 * @author Monika Mehta and Anish Kumar
 */

var func = require('../utils/functions')
var DbOperation = require('./db-operations').DbOperation
var dbOp = new DbOperation()

// / /////////constructor//////////////
function UserProfileHelpers () {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'obj created of user profile helpers')
}

/** This method used for update user profile based on usercode
 * @param {Integer} userCode unique user code
 * @param {String} orgName organization name
 * @param {function} callback
 *
 * @return {function} callback
 **/
UserProfileHelpers.prototype.updateUserProfile = function (userCode, urlMap, jsonToUpdate, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateUserProfile()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'userCode=' + userCode + '  ,body=' + JSON.stringify(jsonToUpdate))
  var body = {}
  updateUserDetails(userCode, urlMap, jsonToUpdate, function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error from dbOp while updating user details = ' + JSON.stringify(error) + ' for user_id = ' + userCode)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateUserDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, error)
    } else {
      if (response[func.msgCons.PARAM_ERROR_STATUS] == true) {
        body[func.dbCons.FIELD_PROFILE_DATA] = response
      } else {
        body = response[0]
      }
      updateAssessorDetails(userCode, urlMap, jsonToUpdate, function (error, res) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error from dbOp while updating assessor details = ' + JSON.stringify(error) + ' for user_id = ' + userCode)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateAssessorDetails()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, error)
        } else {
          if (res[func.msgCons.PARAM_ERROR_STATUS] == true && response[func.msgCons.PARAM_ERROR_STATUS] == true) {
            return callback(new Error().stack, body)
          } else {
            body[func.dbCons.FIELD_DESIGNATION] = res[0][func.dbCons.FIELD_DESIGNATION]
            body[func.dbCons.FIELD_DEPARTMENT] = res[0][func.dbCons.FIELD_DEPARTMENT]
            body[func.dbCons.FIELD_LOCATION] = res[0][func.dbCons.FIELD_LOCATION]
            body[func.dbCons.FIELD_UNIT] = res[0][func.dbCons.FIELD_UNIT]

            var data = {}
            data[func.dbCons.FIELD_DATA] = body
            callback(null, data)
          }
        }
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateUserProfile()', func.logCons.LOG_EXIT)
}

function updateUserDetails (userCode, urlMap, jsonToUpdate, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateUserDetails()', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, userCode)
  if (jsonToUpdate[func.dbCons.FIELD_USER_DETAILS][func.dbCons.FIELD_PROFILE_DATA + '.' + func.dbCons.FIELD_GENDER] != undefined) {
    jsonToUpdate[func.dbCons.FIELD_USER_DETAILS][func.dbCons.FIELD_PROFILE_DATA + '.' + func.dbCons.FIELD_GENDER] = convertGenderStringToNumber(jsonToUpdate[func.dbCons.FIELD_USER_DETAILS][func.dbCons.FIELD_PROFILE_DATA + '.' + func.dbCons.FIELD_GENDER])
  }
  if (jsonToUpdate[func.dbCons.FIELD_USER_DETAILS][func.dbCons.FIELD_PROFILE_DATA + '.' + func.dbCons.FIELD_CONTACT] != undefined) {
    jsonToUpdate[func.dbCons.FIELD_USER_DETAILS][func.dbCons.FIELD_PROFILE_DATA + '.' + func.dbCons.FIELD_CONTACT] = jsonToUpdate[func.dbCons.FIELD_USER_DETAILS][func.dbCons.FIELD_PROFILE_DATA + '.' + func.dbCons.FIELD_CONTACT]
  }
  dbOp.update(query, urlMap, func.dbCons.COLLECTION_USER_DETAILS, dbOp.getOperationJson(func.lightBlueCons.OP_SET, jsonToUpdate[func.dbCons.FIELD_USER_DETAILS]), dbOp.getCommonProjection(), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while updating user details = ' + JSON.stringify(error) + ' for user_id = ' + userCode)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'in updateUserDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, error)
    } else if (response.length === 0 || !response) {
      return callback(null, func.errorResponseGenrator(func.msgCons.MSG_INVALID_USER_ID, func.msgCons.MSG_NO_USER_FOUND, func.msgCons.CODE_INVALID_PARAM))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'in updateUserDetails()', func.logCons.LOG_EXIT)
    } else {
      response[0][func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_CONTACT] = response[0][func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_CONTACT]
      response[0][func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_USER_EMAIL] = response[0][func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_USER_EMAIL]
      response[0][func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_GENDER] = convertGenderNumberToString(response[0][func.dbCons.FIELD_PROFILE_DATA][func.dbCons.FIELD_GENDER])
      response[0][func.dbCons.COMMON_UPDATED_BY] = userCode
      response[0][func.dbCons.COMMON_CREATED_BY] = userCode
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'user profile updated of userCode= ' + userCode + ' and response is = ' + JSON.stringify(response))
      callback(null, response)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateUserDetails()', func.logCons.LOG_EXIT)
}

function updateAssessorDetails (userCode, urlMap, jsonToUpdate, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateAssessorDetails()', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, userCode)
  dbOp.update(query, urlMap, func.dbCons.COLLECTION_ASSESSOR_DETAILS, dbOp.getOperationJson(func.lightBlueCons.OP_SET, jsonToUpdate[func.dbCons.FIELD_ACCESSOR_DETAILS]), dbOp.getCommonProjection(), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while updating assessor details = ' + JSON.stringify(error) + ' for user_id = ' + userCode)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'in updateAssessorDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, error)
    } else if (response.length === 0 || !response) {
      return callback(null, func.errorResponseGenrator(func.msgCons.MSG_INVALID_USER_ID, func.msgCons.MSG_NO_USER_FOUND, func.msgCons.CODE_INVALID_PARAM))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'in updateAssessorDetails()', func.logCons.LOG_EXIT)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'assessor details updated of userCode= ' + userCode + ' and response is = ' + JSON.stringify(response))
      response[0][func.dbCons.COMMON_UPDATED_BY] = userCode
      response[0][func.dbCons.COMMON_CREATED_BY] = userCode
      callback(null, response)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateAssessorDetails()', func.logCons.LOG_EXIT)
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

exports.UserProfileHelpers = UserProfileHelpers
