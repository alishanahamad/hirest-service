var func = require('../utils/functions')
var dbConfig = func.config.get('database')
CandidateJoiningDetailsHelpers = require('../helpers/candidate-joining-details-helpers').CandidateJoiningDetailsHelpers
var candidateJoiningDetailsHelpers = new CandidateJoiningDetailsHelpers()
var async = require('async')
const ROUTER_CONS = "HS_CJD_"
module.exports = function(app) {

  app.get(func.urlCons.URL_GET_CANDIDATE_JOINING_DETAILS,func.validateRole,async function(req, res, next) {

    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_CANDIDATE_JOINING_DETAILS, func.logCons.LOG_ENTER)
    // console.log("bodyDta",req.body)
    const orgNameMap = func.getUrlMap(req)
    const env = req.query[func.urlCons.PARAM_ENV]
    var userCode = req.params[func.dbCons.FIELD_USER_CODE]

    try {
      func.printLog(func.logCons.LOG_LEVEL_INFO, `get  candidate Joining Details`)
      const results = await candidateJoiningDetailsHelpers.getCandidateJoiningDetails(userCode, orgNameMap, env)

      res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTER_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
      next()
    } catch (err) {
      res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
      next()
    }
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_CANDIDATE_JOINING_DETAILS, func.logCons.LOG_EXIT)
  })
};
