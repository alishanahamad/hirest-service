'use strict'
/**
 * This API is useful to check whether look up data is exist or not
 * @author Leena Patoliya
 */

const func = require('../utils/functions')
const CheckLookupDetailsExistenceHelpers = require('../helpers/check-lookup-details-existence-helpers.js').CheckLookupDetailsExistenceHelpers
const checkLookupDetailsExistenceHelpers = new CheckLookupDetailsExistenceHelpers()
const ROUTE_CONS = 'HI_CLDER_'

module.exports = function (app) {
    app.post(func.urlCons.URL_CHECK_LOOKUP_DETAILS_EXISTENCE, async function (req, res, next) {
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_CHECK_LOOKUP_DETAILS_EXISTENCE, func.logCons.LOG_ENTER)
        const orgNameMap = func.getUrlMap(req)
        const body = req.body
        try {
            func.printLog(func.logCons.LOG_LEVEL_INFO, `check look up details existence`)
            const results = await checkLookupDetailsExistenceHelpers.checkLookupDetailsExistence(body, orgNameMap)
            res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
            next()
        } catch (err) {
            res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
            next()
        }
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.logCons.URL_CHECK_LOOKUP_DETAILS_EXISTENCE, func.logCons.LOG_EXIT)
    })
}