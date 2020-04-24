const func = require('../utils/functions')
const async = require('async')
const DbOperation = require('./db-operations').DbOperation
const dbOp = new DbOperation()
const HELPER_CONS = 'HS_GBD_'
var _ = require('lodash')

function GetBioDataDetailsHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created to get biodata details')
}

GetBioDataDetailsHelpers.prototype.getbiodataDetails = async function(user_code, orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getbiodataDetails()', func.logCons.LOG_ENTER)
  try {
    let data = {}
    let errors = []
    let originalKeys = []
    let replaceKeys = []
    let personId = await getPersonIdFromCandidateDetails(user_code, orgNameMap)
    let personDetails = await getPersonDetailsFromPersonId(personId, orgNameMap)
    originalKeys.push(func.dbCons.FIELD_ID)
    replaceKeys.push(func.dbCons.FIELD_PERSON_ID)
    let finalJSON = await getRenamedKeysinJSON(personDetails, originalKeys, replaceKeys)
    let finalDecryptedJSON = decryptDetails(finalJSON)
    data[func.dbCons.BIODATA_DETAILS] = finalDecryptedJSON

    return {
      data: data,
      errors: errors
    }
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while getting Biodata Detail. ${err}`)
    // let error = func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, err)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getbiodataDetails()', func.logCons.LOG_EXIT)
    throw err
  }
}

function decryptDetails(bodyJSON) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'decryptDetails()', func.logCons.LOG_ENTER)
  body=bodyJSON[0]
  body[func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS] = body[func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS]
  body[func.dbCons.CANDIDATE_FIELD_MOBILE_NO] = body[func.dbCons.CANDIDATE_FIELD_MOBILE_NO]
  body[func.dbCons.CANDIDATE_FIELD_ALT_MOBILE_NO] = body[func.dbCons.CANDIDATE_FIELD_ALT_MOBILE_NO]
  return bodyJSON
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'decryptDetails()', func.logCons.LOG_EXIT)
}


/* replacekey of final json */
async function getRenamedKeysinJSON(finalJSON, originalKeys, replaceKeys) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getRenamedKeysinJSON()', func.logCons.LOG_ENTER)
    for (var i = 0; i < originalKeys.length; i++) {
      for (let obj of finalJSON) {
        var key = originalKeys[i]

        var replacekey = replaceKeys[i]

        obj[replacekey] = obj[key]
        delete obj[key]
      }
    }

    return resolve(finalJSON)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getRenamedKeysinJSON()', func.logCons.LOG_EXIT)
  })
}

/* get person id from candidate details based on candidate id */

async function getPersonIdFromCandidateDetails(user_code, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonIdFromCandidateDetails()', func.logCons.LOG_ENTER)
    let projection = []

    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PERSON_ID, true, true))

    dbOp.findByKey(func.dbCons.FIELD_USER_ID, func.lightBlueCons.OP_EQUAL, user_code, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), projection, function(err, personId) {
      if (err) {
        // Lightblue Error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching person id(personId). ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonIdFromCandidateDetails()', func.logCons.LOG_EXIT)
        return reject(err)
      } else if (!personId || personId.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `person id not found`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonIdFromCandidateDetails()', func.logCons.LOG_EXIT)
        return reject(func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.PERSON_ID_NOT_FOUND, err))
      }

      return resolve(personId)
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonIdFromCandidateDetails()', func.logCons.LOG_EXIT)
  })
}

/*get person details based on person id from person details collection */
async function getPersonDetailsFromPersonId(personIdDetails, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromPersonId()', func.logCons.LOG_ENTER)

    var personIds = func.getValuesArrayFromJson(func.dbCons.FIELD_PERSON_ID, personIdDetails)

    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, personIds), orgNameMap, func.dbCons.COLLECTION_PERSON_DETAILS, dbOp.getCommonProjection(), function(err, personDetails) {

      if (err) {
        // Lightblue Error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching person Details. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromPersonId()', func.logCons.LOG_EXIT)
        return reject(err)
      } else if (!personDetails || personDetails.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `no person details found`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromPersonId()', func.logCons.LOG_EXIT)
      //  return reject(new Error(`invalid person name ${personDetails}`))
        return reject(func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.PERSON_DETAILS_NOT_FOUND, err))

      }
      return resolve(personDetails)


    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromPersonId()', func.logCons.LOG_EXIT)
  })
}
exports.GetBioDataDetailsHelpers = GetBioDataDetailsHelpers
