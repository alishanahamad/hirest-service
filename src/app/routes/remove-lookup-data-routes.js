/**
 * The <code>remove-lookup-data.js </code> to change status of attribute vale from active to inactive
 *
 * @author Leena Patoliya
 */

'use-strict'
const func  = require('../utils/functions')
const RemoveLookupDataHelpers = require('../helpers/remove-lookup-data-helpers.js').RemoveLookupDataHelpers
const removeLookupDataHelpers = new RemoveLookupDataHelpers()
const ROUTE_CONS ='HI_RLD_'

module.exports = function (app) {
  /**
   * @api {get} /hirest/v1/inactive/lookup/data/:id
   * @apiName GET REMOVE LOOK UP DATA FROM LOOKUP_DETAILS
   * @apiVersion 1.0.0
   */
   app.get(func.urlCons.URL_GET_DELETE_LOOKUP_DETAILS,func.validateRole,async function(req, res, next) {
     func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_DELETE_LOOKUP_DETAILS, func.logCons.LOG_ENTER)
     const orgNameMap = func.getUrlMap(req)
     const queryParam = req.query.status
     console.log("sdfg",queryParam)
     console.log(orgNameMap)
     const env = req.query[func.urlCons.PARAM_ENV]
     try{
       func.printLog(func.logCons.LOG_LEVEL_INFO, `remove look up data`)
       const looupUpDataId = req.params[func.dbCons.FIELD_LOOKUP_DETAILS_ID]
       const results = await removeLookupDataHelpers.removeLookupData(looupUpDataId, orgNameMap)
       res.status(func.httpStatusCode.OK).send(func.responseGenerator(results, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
       next()
     }catch (err) {
       res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
       next()
   }
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_DELETE_LOOKUP_DETAILS, func.logCons.LOG_EXIT)
 })
}
