'use strict'
/**
 * The <code>switch-candidate-gd-pi-routes.js</code>
 * @author Monika Mehta
 */
const func = require('../utils/functions')
const FinalizeCandidateDetailsHelpers = require('../helpers/finalize-candidate-details-helpers.js').FinalizeCandidateDetailsHelpers
const finalizeCandidateDetailsHelpers = new FinalizeCandidateDetailsHelpers()
const ROUTE_CONS = 'HI_SCGPR_'

module.exports = function (app) {
  /**
   * @api {post} /hirest/v1/getFinalizeCandidate
   * @apiName GET FINAL CANDIATE WHICH ARE SELECT BY ADMIN ON SITE
   * @apiVersion 1.0.0
   */
app.post(func.urlCons.URL_GET_FINALIZED_CANDIDATE_DETAILS, func.validateRole, async function (req, res, next) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_FINALIZED_CANDIDATE_DETAILS, func.logCons.LOG_ENTER)
  const orgNameMap = func.getUrlMap(req)
  const env = req.query[func.urlCons.PARAM_ENV]
  let userCode = req.headers[func.urlCons.PARAM_USER_CODE]
  try {
    func.printLog(func.logCons.LOG_LEVEL_INFO, `get finalized candidate list`)
    const results = await finalizeCandidateDetailsHelpers.getFinalizedCandidate(req.body, orgNameMap, userCode, env)
    res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
    next()
  } catch (err) {
    res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
    next()
  }
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_FINALIZED_CANDIDATE_DETAILS, func.logCons.LOG_EXIT)
})
}
