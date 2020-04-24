'use strict'
const func = require('../utils/functions');
const DbOperation = require('./db-operations').DbOperation;
const dbOp = new DbOperation();

function UpdateCampusDriveData() {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'obj created of updating campus drive details')
}

UpdateCampusDriveData.prototype.updateCampusDrive = async function (campusId, body, orgNameMap) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, `updateCampusDrive()`, func.logCons.LOG_ENTER)
    try {
        const response = await updateCampusDriveDetails(campusId, body, orgNameMap)
        return await getUpdateReturnJson(response)
    } catch (err) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while updating campus details.${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, `updateCampusDrive()`, func.logCons.LOG_EXIT)
        let error = func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, err)
        throw error
    }
}
async function updateCampusDriveDetails(campusId, body, orgNameMap) {
    return new Promise((resolve, reject) => {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCampusDriveDetails()', func.logCons.LOG_ENTER)
        dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, campusId),
            orgNameMap,
            dbOp.setCollectionJson(func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
            dbOp.getOperationJson(func.lightBlueCons.OP_SET, body),
            dbOp.getCommonProjection(), (err, updatedDetails) => {
                if (err) {
                    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while update campus drive details. ${err}`)
                    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCampusDriveDetails()', func.logCons.LOG_EXIT)
                    return reject(err)
                } else if (!updatedDetails || updatedDetails.length === 0) {
                    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `campus drive detail not found`)
                    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCampusDriveDetails()', func.logCons.LOG_EXIT)
                    return resolve(updatedDetails)
                }
                return resolve(updatedDetails)
            })
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCampusDriveDetails()', func.logCons.LOG_EXIT)
    })
}
function getUpdateReturnJson(response) {
    let errors = []
    return {
        data: response,
        errors: errors,
        message: (response.length === 0) ? func.msgCons.DATA_NOT_UPDATED : func.msgCons.RESPONSE_UPDATED
    }
}

exports.UpdateCampusDriveData = UpdateCampusDriveData