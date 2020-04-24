'use strict'

/**
 * The <code>survey-campaign-routes.js</code>
 * @author Dipak Savaliya ,Monika Mehta
 */
var func = require('../utils/functions')
var GDCandidateList = require('../helpers/gd-candidate-list-helpers.js').GDCandidateList
var gDCandidateList = new GDCandidateList()
var ROUTE_CONS = 'HI_GCL_'

module.exports = function (app) {
  /**
   * @api {post} /hirest/v1/candidatelist/:gd_group_details/assessor/:assessor_id
   * @apiName GET CANDIDATE DETAILS FOR ASSESSOR
   * @apiGroup CANDIDATE LIST
   * @apiVersion 1.0.0
   */
  app.get(func.urlCons.URL_GET_CANDIDATE_LIST_OF_ASSESSOR, func.validateRole, async function (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_CANDIDATE_LIST_OF_ASSESSOR, func.logCons.LOG_ENTER)
    const orgNameMap = func.getUrlMap(req)
    const env = req.query[func.urlCons.PARAM_ENV]
    try {
      let grpDetailsId = req.params[func.dbCons.GD_GROUP_DETAILS_ID]
      let assessorId = req.params[func.dbCons.ASSESSOR_ID]
      let roundType = req.query[func.dbCons.FIELD_ROUND_TYPE]
      const userCode = req.headers[func.urlCons.PARAM_USER_CODE]
      const results = await gDCandidateList.gdCandidateListForAssessor(userCode, roundType, grpDetailsId, assessorId, orgNameMap, env)
      res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_CANDIDATE_LIST_RETRIVED, results.errors))
      next()
    } catch (err) {
      // TODO: Add Generic function for getting Status Code based on err obj
      res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
      next()
    }
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_CANDIDATE_LIST_OF_ASSESSOR, func.logCons.LOG_EXIT)
  })
}
