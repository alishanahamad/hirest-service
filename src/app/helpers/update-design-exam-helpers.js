'use strict'
/**
 *This API is useful for updating exam details in exam details
 * @author Leena Patoliya
 */
const func = require('../utils/functions');
const DbOperation = require('./db-operations').DbOperation;
const dbOp = new DbOperation();
const ROUTE_CONS = 'HI_UEDH_';

function UpdateExamDetails() {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of updating exam details')
}
UpdateExamDetails.prototype.updateExamDetails = async function (examId, orgNameMap) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, `updateExamDetails()`, func.logCons.LOG_ENTER)
    try {
        const response = await updateExamDetailsData(examId, orgNameMap)
        return await getUpdateReturnJson(response)
    } catch (err) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while updating exam data details.${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, `updateExamDetails()`, func.logCons.LOG_EXIT)
        let error = func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, err)
        throw error
    }
}

async function updateExamDetailsData(exam_id, orgNameMap) {
    return new Promise((resolve, reject) => {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateExamDetailsData()', func.logCons.LOG_ENTER)
        const updatedJson = getUpdateJson();
        dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, exam_id),
            orgNameMap,
            dbOp.setCollectionJson(func.dbCons.COLLECTION_EXAM_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
            dbOp.getOperationJson(func.lightBlueCons.OP_SET, updatedJson),
            dbOp.getCommonProjection(), (err, updatedDetails) => {
                if (err) {
                    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while update exam details. ${err}`)
                    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateExamDetailsData()', func.logCons.LOG_EXIT)
                    return reject(err)
                } else if (!updatedDetails || updatedDetails.length === 0) {
                    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `exam detail not found`)
                    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateExamDetailsData()', func.logCons.LOG_EXIT)
                    return resolve(updatedDetails)
                }
                return resolve(updatedDetails)
            })
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateExamDetailsData()', func.logCons.LOG_EXIT)
    })
}

function getUpdateJson() {
    let returnJson = {}
    returnJson[func.dbCons.COMMON_IS_DELETED] = 'true'
    return returnJson
}

function getUpdateReturnJson(response) {
    let errors = []
    return {
        data: response,
        errors: errors,
        message: (response.length === 0) ? func.msgCons.DATA_NOT_UPDATED : func.msgCons.RESPONSE_UPDATED
    }
}
exports.UpdateExamDetails = UpdateExamDetails