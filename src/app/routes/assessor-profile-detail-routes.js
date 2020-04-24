var func = require('../utils/functions')
var dbConfig = func.config.get('database')
AssessorProfileDetailHelpers = require('../helpers/assessor-profile-detail-helpers').AssessorProfileDetailHelpers
var assessorProfileDetailHelpers = new AssessorProfileDetailHelpers()
var async = require('async')
const ROUTER_CONS = 'HS_APDR_'
module.exports = function (app) {
  app.get(func.urlCons.URL_GET_ASSESSOR_DETAILS, func.validateRole, function (req, res) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_ASSESSOR_DETAILS, func.logCons.LOG_ENTER)
    var urlMap = func.getUrlMap(req)
    var userCode = req.params[func.dbCons.FIELD_USER_CODE]
    var env = req.query[func.urlCons.PARAM_ENV]
    assessorProfileDetailHelpers.getAssessorDetails(userCode, urlMap, env, function (error, response) {
      if (error) {
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Data Retreived Successfully')
        res.status(func.httpStatusCode.OK)
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_ASSESSOR_DETAILS, func.logCons.LOG_EXIT)
        return res.send(func.responseGenerator(response, ROUTER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_SUCCESS_FETCHED_DATA))
      }
    })
  })
}
