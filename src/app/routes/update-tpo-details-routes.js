'use strict'
/**
 * The <code>group-assigned-name-routes.js</code>
 * @author  ekta kakdia
 */
const func = require('../utils/functions')
const UpdateTpoDetailsHelpers = require('../helpers/update-tpo-details-helpers.js').UpdateTpoDetailsHelpers
const updateTpoDetailsHelpers = new UpdateTpoDetailsHelpers()
const ROUTE_CONS = 'HI_UTDR_'

module.exports = function (app) {
  /**
   * @api {post} /hirest/v1/update/tpo/details/:institute_id
   * @apiName UPDATE TPO DETAILS
   * @apiVersion 1.0.0
   */
app.post(func.urlCons.URL_UPDATE_TPO_DETAILS, func.validateRole, async function (req, res, next) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_UPDATE_TPO_DETAILS, func.logCons.LOG_ENTER)
  const orgNameMap = func.getUrlMap(req)
  const instituteId = req.params.institute_id
  const userId = req.params.user_id
  const env = req.query[func.urlCons.PARAM_ENV]
  try {
    func.printLog(func.logCons.LOG_LEVEL_INFO, ` update tpo user details`)
    const results = await updateTpoDetailsHelpers.updateTpoDetails(req.body, instituteId, userId, orgNameMap, env)
    res.status(func.httpStatusCode.OK).send(func.responseGenerator(results, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
    next()
  } catch (err) {
    res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
    next()
  }
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_UPDATE_TPO_DETAILS, func.logCons.LOG_EXIT)
})
}
