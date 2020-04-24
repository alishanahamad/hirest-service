'use-strict'
/**
 * The <code> update-lookup-details-routes.js</code>
 * @author Leena Patoliya
 */
const func = require('../utils/functions')
const UpdateLookUpDetails = require('../helpers/update-lookup-details-helpers.js').UpdateLookUpDetails
const updateLookUpDetails = new UpdateLookUpDetails()
const ROUTE_CONS = 'HI_ULDR_'

module.exports = function(app) {
  /**
   * @api {post} /hirest/v1/update/lookup/data/:id
   * @apiName Update look up data from LOOKUP_DETAILS
   * @apiVersion 1.0.0
   * @queryParam lookUpId and form data
   */
  app.post(func.urlCons.URL_POST_UPDATE_LOOKUP_DETAILS, async function(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_UPDATE_LOOKUP_DETAILS, func.logCons.LOG_ENTER)
    const orgNameMap = func.getUrlMap(req)
    const lookUpId = req.params.id
    const body = req.body
    const env = req.query[func.urlCons.PARAM_ENV]
    try {
      func.printLog(func.logCons.LOG_LEVEL_INFO, `update lookup details details`)
      const results = await updateLookUpDetails.updateLookUpDetails(env, lookUpId, body, orgNameMap)
      res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
      next()
    } catch (err) {
      res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
      next()
    }
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.logCons.URL_POST_UPDATE_LOOKUP_DETAILS, func.logCons.LOG_EXIT)
  })
}
