'use-strict'
/**
 * This is useful for removing data from the look up
 * @author Leena Patoliya
 */
const func = require('../utils/functions')
const DbOperation = require('./db-operations').DbOperation
const dbOp = new DbOperation()
const HELPER_CONS = 'HI_RLD_'
let_ = require('lodash')

function RemoveLookupDataHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created to remove lookup data')
}

/**
 * [description]
 * @param  {[type]} lookupUpDataId [update status in look up data]
 * @param  {[type]} orgNameMap    [description]
 * @return {[type]} GET           [description]
 */
RemoveLookupDataHelpers.prototype.removeLookupData = async function(looupUpDataId, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'removeLookupData()', func.logCons.LOG_ENTER)
  try {
    const lookUpDetails = await updateStatus(looupUpDataId, orgNameMap)
    return lookUpDetails[0]
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `LookUp Id= ${lookUpDetails}`)
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while getting look up status. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `removeLookupData()`, func.logCons.LOG_EXIT)
    throw err
  }
}


async function updateStatus(looupUpDataId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateStatus()', func.logCons.LOG_ENTER)
    let json = {};
    json[func.dbCons.FIELD_STATUS] = 0;
    dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_LOOKUP_DETAILS_ID, func.lightBlueCons.OP_EQUAL, looupUpDataId), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_LOOKUP_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getOperationJson(func.lightBlueCons.OP_SET, json), dbOp.getCommonProjection(), function(error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while updating status = ` + JSON.stringify(error))
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateStatus()', func.logCons.LOG_EXIT)
        return reject(error)
        return reject(new Error(`Error while updated look up data status. ${error}`))
      } else if (!response || response.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'status is not updated successfully')
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateStatus()', func.logCons.LOG_EXIT)
        return reject('status is not updated successfully')
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateStatus()', func.logCons.LOG_EXIT)
        return resolve(response)
      }
    })
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateStatus()', func.logCons.LOG_EXIT)
  })
}
exports.RemoveLookupDataHelpers = RemoveLookupDataHelpers
