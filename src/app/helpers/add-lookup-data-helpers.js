const func = require('../utils/functions')
//const async = require('async')
const DbOperation = require('./db-operations').DbOperation
const dbOp = new DbOperation()
const HELPER_CONS = 'HI_ALD_'
var _ = require('lodash')

function AddLookupDataHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created when add lookup data')
}

AddLookupDataHelpers.prototype.addLookupData = async function (body, orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addLookupData()', func.logCons.LOG_ENTER)
  try {
    let lookupJson = {}
    lookupJson[func.dbCons.COMMON_UPDATED_BY] = body[func.dbCons.FIELD_USER_CODE]
    lookupJson[func.dbCons.FIELD_ATTRIBUTE_TYPE] = body[func.dbCons.FIELD_TYPE]
    lookupJson[func.dbCons.FIELD_ATTRIBUTE_VALUE] = body[func.dbCons.FIELD_VALUE]
    lookupJson[func.dbCons.COMMON_CREATED_BY] = body[func.dbCons.FIELD_USER_CODE]
    lookupJson[func.dbCons.FIELD_STATUS] = func.dbCons.FIELD_STATUS_ACTIVE
    lookupJson[func.dbCons.FIELD_ATTRIBUTE_NAME] = body[func.dbCons.FIELD_ATTRIBUTE_NAME]
    let lookupResponse = {}
    lookupResponse = await addlookupDetails(lookupJson, orgNameMap)
    return getReturnJson(lookupResponse)
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while add lookup data. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addLookupData()', func.logCons.LOG_EXIT)
    throw err
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addLookupData()', func.logCons.LOG_EXIT)
}
async function addlookupDetails(lookupDetails, orgNameMap) {
  return new Promise((resolve, reject) => {

    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addlookupDetails()', func.logCons.LOG_ENTER)
    dbOp.insert(orgNameMap, func.dbCons.COLLECTION_LOOKUP_DETAILS, lookupDetails, dbOp.getCommonProjection(), function (err, insertlookupdetails) {

      if (err) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while adding lookup data ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addlookupDetails()', func.logCons.LOG_EXIT)
        return reject(err)
      } else if (!insertlookupdetails || insertlookupdetails.length == 0) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `data not inserted`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addlookupDetails()', func.logCons.LOG_EXIT)
        return reject(insertlookupdetails)
      }

      return resolve(insertlookupdetails)
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addlookupDetails()', func.logCons.LOG_EXIT)
  })
}
function getReturnJson(response) {
  let data = {}
  let errors = []
  return {
    data: (response === undefined) ? data : response,
    errors: errors,
    message: func.msgCons.LOOKUP_DATA_INSERTED_SUCEESFULLY
  }
}

exports.AddLookupDataHelpers = AddLookupDataHelpers
