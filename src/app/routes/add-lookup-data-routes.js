'use strict'

const func = require('../utils/functions')
const AddLookupDataHelpers = require('../helpers/add-lookup-data-helpers.js').AddLookupDataHelpers
const addLookupDataHelpers = new AddLookupDataHelpers()
const ROUTE_CONS = 'HI_ALD_'

module.exports = function (app) {
  /**
   * @api {post} /hirest/v1/addLookupData
   * @apiName POST ADD LOOKUP DATA IN LOOKUP_DETAILS
   * @apiVersion 1.0.0
   */
   app.post(func.urlCons.URL_POST_INSERT_LOOKUP_DETAILS,func.validateRole, async function (req, res, next) {
     func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_INSERT_LOOKUP_DETAILS, func.logCons.LOG_ENTER)
     const orgNameMap = func.getUrlMap(req)
     const env = req.query[func.urlCons.PARAM_ENV]
     // const stage = Number(req.params[func.dbCons.COLLECTION_JSON_STAGE])
     try {
       func.printLog(func.logCons.LOG_LEVEL_INFO, `add lookup data where request body is = ${req.body}`)
       const results = await addLookupDataHelpers.addLookupData(req.body,orgNameMap, env)

       res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
       next()
     } catch (err) {
       res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
       next()
     }
     func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_INSERT_LOOKUP_DETAILS, func.logCons.LOG_EXIT)
   })

}
