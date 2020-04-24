'use strict'
/**
 * This API is useful to check whether look up data exist or not
 * @author Leena Patoliya
 */

const func = require('../utils/functions')
const DbOperation = require('./db-operations').DbOperation
const dbOp = new DbOperation()
const HELPERS_CONS = 'HI_CLDEH_'

function CheckLookupDetailsExistenceHelpers() {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'obj created of check look up details existence')
}

CheckLookupDetailsExistenceHelpers.prototype.checkLookupDetailsExistence = async function (body, orgNameMap) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, `checkLookupDetailsExistence()`, func.logCons.LOG_ENTER)
    try {
        const lookUpDetailsResponse = await checkLookupDetailExistenceInLookupCollection(body, orgNameMap)
        return getReturnJson(lookUpDetailsResponse)
    } catch (err) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while check lookup details existence status.${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, `checkLookupDetailsExistence()`, func.logCons.LOG_EXIT)
        let error = func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, err)
        throw error
    }
}

async function checkLookupDetailExistenceInLookupCollection(body, orgNameMap) {
    const lookUpValue = body.value
    const lookUpType = body.type
    if (body.type === 'Joining_Location' || body.type === 'Company_Master' || body.type === 'Head_Details' || body.type === 'Assessment_Details') {
        var query = []
        query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ATTRIBUTE_TYPE, func.lightBlueCons.OP_EQUAL, lookUpType))
        query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ATTRIBUTE_NAME, func.lightBlueCons.OP_EQUAL, lookUpValue))
        query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_EQUAL, 1))
    } else {
        var query = []
        query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ATTRIBUTE_TYPE, func.lightBlueCons.OP_EQUAL, lookUpType))
        query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ATTRIBUTE_VALUE, func.lightBlueCons.OP_EQUAL, lookUpValue))
        query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_EQUAL, 1))
    }
    return new Promise((resolve, reject) => {
        func.printLog(func.logCons.LOG_LEVEL_INFO, `checkLookupDetailExistenceInLookupCollection()`, func.logCons.LOG_ENTER)
        dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_LOOKUP_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function (error, response) {
            if (error) {
                return (reject)
            } else if (!response || response.length === 0) {
                func.printLog(func.logCons.LOG_LEVEL_ERROR, `no lookup details found`)
                func.printLog(func.logCons.LOG_LEVEL_DEBUG, `checkLookupDetailExistenceInLookupCollection()`, func.logCons.LOG_EXIT)
                return resolve(response)
            } else {
                return resolve(response)
            }
        })
    })
}

/**
 * [getUpdateReturnJson update return JSON]
 * @param  {[type]} response [description]
 * @return {[type]}          [description]
 */

function getReturnJson(response) {
    let errors = []
    return {
        data: response,
        errors: errors,
        message: (response === undefined || response.length === 0) ? 'No lookup details found' : 'Already Data Exist'
    }
}

exports.CheckLookupDetailsExistenceHelpers = CheckLookupDetailsExistenceHelpers