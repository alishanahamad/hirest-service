'use strict'

/**
 * The <code>candidate-details-routes.js</code>
 * @author Dipak Savaliya
 */
const func = require('../utils/functions')
const CandidateDetailsHelpers = require('../helpers/candidate-details-helpers.js').CandidateDetailsHelpers
const candidateDetailsHelpers = new CandidateDetailsHelpers()
const ROUTE_CONS = 'HI_CDR_'
// const excelName = 'candiate-detail.xlsx'
const json2xls = require('json2xls')

module.exports = function (app) {
  /**
   * @api {post} /hirest/v1/candidatelist/:gd_group_details/assessor/:assessor_id
   * @apiName GET CANDIDATE DETAILS FOR ASSESSOR
   * @apiGroup CANDIDATE LIST
   * @apiVersion 1.0.0
   */
  app.get(func.urlCons.URL_GET_CANDIDATES_FROM_CAMPUS_ID, func.validateRole, async function (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_CANDIDATE_LIST_OF_ASSESSOR, func.logCons.LOG_ENTER)
    const orgNameMap = func.getUrlMap(req)
    const env = req.query[func.urlCons.PARAM_ENV]
    try {
      let campusId = req.params[func.dbCons.FIELD_CAMPUS_DRIVE_ID]
      func.printLog(func.logCons.LOG_LEVEL_INFO, `i will fetch candidate of campus id = ${campusId}`)
      const results = await candidateDetailsHelpers.getCandidatesFromCampusId(campusId, orgNameMap, env)
      res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_CANDIDATE_LIST_RETRIVED, results.errors))
      // res.status(func.httpStatusCode.OK)
      // res.xls(excelName, results.data)
      next()
    } catch (err) {
      // TODO: Add Generic function for getting Status Code based on err obj
      res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
      next()
    }
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_CANDIDATE_LIST_OF_ASSESSOR, func.logCons.LOG_EXIT)
  })
}
