var func = require('../utils/functions')
var dbConfig = func.config.get('database')
GetAssessmentDetailsHelpers = require('../helpers/assessment-details-helpers').GetAssessmentDetailsHelpers
var getAssessmentDetailsHelper = new GetAssessmentDetailsHelpers()
var async = require('async')
const ROUTER_CONS = "HS_ADR_"
module.exports = function(app) {

  app.get(func.urlCons.URL_GET_ASSESSMENT_DETAILS, func.validateRole, function(req, res) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_ASSESSMENT_DETAILS, func.logCons.LOG_ENTER)
    var urlMap = func.getUrlMap(req);
    var category = req.params[func.dbCons.FIELD_ASSESSMENT_CATEGORY]
    getAssessmentDetailsHelper.getAssessmentDetails(category, urlMap, function(error, response) {
      if (error) {
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR);
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER));
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Data retrieved');
        res.status(func.httpStatusCode.OK);
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_ASSESSMENT_DETAILS, func.logCons.LOG_EXIT)
        return res.send(func.responseGenerator(response, ROUTER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_SUCCESS_FETCHED_DATA));
      }
    });

  });
}
