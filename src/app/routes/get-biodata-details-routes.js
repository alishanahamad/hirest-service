var func = require('../utils/functions')
var dbConfig = func.config.get('database')
GetBioDataDetailsHelpers = require('../helpers/get-biodata-details-helpers').GetBioDataDetailsHelpers
var getBioDataDetailsHelpers = new GetBioDataDetailsHelpers()
var async = require('async')
const ROUTER_CONS = "HS_GBD_"
module.exports = function(app) {

  app.get(func.urlCons.URL_GET_PERSON_DETAILS,async function(req, res, next) {

    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_PERSON_DETAILS, func.logCons.LOG_ENTER)
    // console.log("bodyDta",req.body)
    const orgNameMap = func.getUrlMap(req)
    const env = req.query[func.urlCons.PARAM_ENV]
    var userCode = req.params[func.dbCons.FIELD_USER_CODE]

    try {
      func.printLog(func.logCons.LOG_LEVEL_INFO, `get  biodata details`)
      const results = await getBioDataDetailsHelpers.getbiodataDetails(userCode, orgNameMap, env)

      res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTER_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
      next()
    } catch (err) {
      res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
      next()
    }
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_PERSON_DETAILS, func.logCons.LOG_EXIT)
  })
};
