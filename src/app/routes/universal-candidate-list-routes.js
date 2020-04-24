var func = require('../utils/functions')
var dbConfig = func.config.get('database')
UniversalCandidateListHelpers = require('../helpers/universal-candidate-list-helpers').UniversalCandidateListHelpers
var universalCandidateListHelpers = new UniversalCandidateListHelpers()
var async = require('async')
const ROUTER_CONS = "HS_GUCL_"
module.exports = function(app) {

  app.post(func.urlCons.URL_POST_UNIVERSAL_CANDIDATE_LIST, async function (req, res, next) {

    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_UNIVERSAL_CANDIDATE_LIST, func.logCons.LOG_ENTER)
    console.log("bodyDta",req.body)
    const orgNameMap = func.getUrlMap(req)
    const env = req.query[func.urlCons.PARAM_ENV]
    try {
      func.printLog(func.logCons.LOG_LEVEL_INFO, `get universal candidate list`)
      const results = await universalCandidateListHelpers.getUniversalCandidateList(req.body, orgNameMap, env)
          res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTER_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
      next()
    } catch (err) {
      res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
      next()
    }
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_UNIVERSAL_CANDIDATE_LIST, func.logCons.LOG_EXIT)
  })
};
