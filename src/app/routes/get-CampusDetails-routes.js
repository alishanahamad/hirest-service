var func = require('../utils/functions')
var dbConfig = func.config.get('database')
GetCampusDetails = require('../helpers/get-CampusDetails-helpers').GetCampusDetails
var getCampusDetails = new GetCampusDetails()
const ROUTER_CONS = "HS_GCD_"
module.exports = function(app) {

  app.post(func.urlCons.URL_POST_GET_CAMPUS_DETAILS, func.validateRole, function(req, res) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_GET_CAMPUS_DETAILS, func.logCons.LOG_ENTER)
    var urlMap = func.getUrlMap(req);
    var userCode = req.headers[func.urlCons.PARAM_USER_CODE]
    getCampusDetails.getCampusListFromYr(req.body, urlMap,userCode, function(error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCampusListFromYr = ' + error);
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusListFromYr()', func.logCons.LOG_EXIT);
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR);
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER));
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'data fetch Successfully');
        res.status(func.httpStatusCode.OK);
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_ASSESSMENT_DETAILS, func.logCons.LOG_EXIT);
        return res.send(func.responseGenerator(response, ROUTER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_SUCCESS_FETCHED_DATA));
      }
    });

  });
};
