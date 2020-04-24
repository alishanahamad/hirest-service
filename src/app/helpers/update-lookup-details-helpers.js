'use strict'
/**
 *This API is useful for updating look up details in look up details
 * @author Leena Patoliya
 */

const func = require('../utils/functions')
const DbOperation = require('./db-operations').DbOperation
const dbOp = new DbOperation()
const ROUTE_CONS = 'HI_ULDH_'

function UpdateLookUpDetails() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of updating lookup details')
}

UpdateLookUpDetails.prototype.updateLookUpDetails = async function(env, lookUpId, lookUpJson, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, `UpdateLookUpDetails()`, func.logCons.LOG_ENTER)
  try {
    const response = await updateLookUpData(lookUpId, lookUpJson, orgNameMap)
    return await getUpdateReturnJson(response)
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while updating look up data details.${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `UpdateLookUpDetails()`, func.logCons.LOG_EXIT)
    let error = func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, err)
    throw error
  }
}

/**
 * [updateLookUpData in lookup_details]
 * @param  {[type]} lookUpId    [description]
 * @param  {[type]} updatedJson [update look up details]
 * @param  {[type]} orgNameMap  [description]
 * @return {[type]}             [description]
 */
async function updateLookUpData(lookUpId, updatedJson, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_INFO, `updateLookUpData()`, func.logCons.LOG_ENTER)
    dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, lookUpId),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_LOOKUP_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getOperationJson(func.lightBlueCons.OP_SET, updatedJson),
      dbOp.getCommonProjection(), (err, updatedJSON) => {
        if (err) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while updating lookup details.${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `updateLookUpData()`, func.logCons.LOG_EXIT)
          return reject(err)
        }
        return resolve(updatedJSON)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `updateLookUpData()`, func.logCons.LOG_EXIT)
  })
}

/**
 * [getUpdateReturnJson update return JSON]
 * @param  {[type]} response [description]
 * @return {[type]}          [description]
 */

function getUpdateReturnJson(response) {
  let errors = []
  return {
    data: response,
    errors: errors,
    message: (response.length === 0) ? func.msgCons.DATA_NOT_UPDATED : func.msgCons.RESPONSE_UPDATED
  }
}
exports.UpdateLookUpDetails = UpdateLookUpDetails
