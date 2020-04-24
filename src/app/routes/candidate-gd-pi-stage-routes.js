'use strict'

const func = require('../utils/functions')
const CandidateGdPiStageHelpers = require('../helpers/candidate-gd-pi-stage-helpers.js').CandidateGdPiStageHelpers
const candidateGdPiStageHelpers = new CandidateGdPiStageHelpers()
const ROUTE_CONS = 'HI_CGPS_'

module.exports = function (app) {
  /**
   * @api {post} /hirest/v1/candidateGdPiStageUpdate
   * @apiName POST UPDATE CANDIDATE STAGE IN CANDIDATE_DETAILS AND UPDATE STATUS IN GD_GROUP_DETAILS AND PI_ASSESSMENT_DETAILS
   * @apiVersion 1.0.0
   */
   app.post(func.urlCons.URL_UPDATE_CANDIDATE_STAGE_GD_PI_STATUS, func.validateRole, async function (req, res, next) {
     func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_UPDATE_CANDIDATE_STAGE_GD_PI_STATUS, func.logCons.LOG_ENTER)
     const orgNameMap = func.getUrlMap(req)
     const env = req.query[func.urlCons.PARAM_ENV]
     const stage = Number(req.params[func.dbCons.COLLECTION_JSON_STAGE])
     try {
       func.printLog(func.logCons.LOG_LEVEL_INFO, `update candidate status where request body is = ${req.body}`)
       const results = await candidateGdPiStageHelpers.updateCandidateStageGdPiStatus(req.body, stage, orgNameMap, env)
    
       res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
       next()
     } catch (err) {
       res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
       next()
     }
     func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_UPDATE_CANDIDATE_STAGE_GD_PI_STATUS, func.logCons.LOG_EXIT)
   })

}
