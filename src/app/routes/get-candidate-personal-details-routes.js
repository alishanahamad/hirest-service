'use strict'
/**
 * The <code>get-candidate-personal-details-routes.js</code>
 * @author Leena Patoliya
 */
const func = require('../utils/functions')
const GetCandidatePersonalDetailsHelpers = require('../helpers/get-candidate-personal-detail-helpers.js').GetCandidatePersonalDetailsHelpers
const getCandidatePersonalDetailsHelpers = new GetCandidatePersonalDetailsHelpers()
const ROUTE_CONS = 'HI_GCPD_'

module.exports = function(app) {
  /**
   * @api {get} /hirest/v1/person/detail/:candidate_id
   * @apiName GET CANDIATE PERSONAL DETAILS
   * @apiVersion 1.0.0
   */
  app.get(func.urlCons.URL_GET_PERSON_DETAIL_FROM_CANDIDATE_ID, func.validateRole, async function(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_PERSON_DETAIL_FROM_CANDIDATE_ID, func.logCons.LOG_ENTER)
    const orgNameMap = func.getUrlMap(req)
    const env = req.query[func.urlCons.PARAM_ENV]
    try {
      func.printLog(func.logCons.LOG_LEVEL_INFO, `get candidate personal details`)
      const candidateId = req.params[func.dbCons.FIELD_CANDIDATE_ID]
      const results = await getCandidatePersonalDetailsHelpers.getCandidatePersonalDetails(candidateId, orgNameMap)
      res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
      next()
    } catch (err) {
      res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
      next()
    }
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_PERSON_DETAIL_FROM_CANDIDATE_ID, func.logCons.LOG_EXIT)
  })
}
