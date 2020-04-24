'use strict'
/**
 * The <code>switch-candidate-gd-pi-routes.js</code>
 * @author Monika Mehta
 */
const func = require('../utils/functions')
const SwitchCandidateGdPiHelpers = require('../helpers/switch-candidate-gd-pi-helpers.js').SwitchCandidateGdPiHelpers
const switchCandidateGdPiHelpers = new SwitchCandidateGdPiHelpers()
const ROUTE_CONS = 'HI_SCGPR_'

module.exports = function (app) {
  /**
   * @api {post} /hirest/v1/switchCandidate
   * @apiName MOVE CANDIDATE FROM GD_TO_PI OR PI_TO_GD
   * @apiVersion 1.0.0
   */
app.post(func.urlCons.URL_POST_SWITCH_CANDIDATES, func.validateRole, async function (req, res, next) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_SWITCH_CANDIDATES, func.logCons.LOG_ENTER)
  const orgNameMap = func.getUrlMap(req)
  const env = req.query[func.urlCons.PARAM_ENV]
  let userCode = req.headers[func.urlCons.PARAM_USER_CODE]
  try {
    func.printLog(func.logCons.LOG_LEVEL_INFO, ` switch candidate from gd to pi or pi to gd`)
    const results = await switchCandidateGdPiHelpers.switchCandidate(req.body, orgNameMap, userCode, env)
    res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
    next()
  } catch (err) {
    res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
    next()
  }
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_SWITCH_CANDIDATES, func.logCons.LOG_EXIT)
})
}
