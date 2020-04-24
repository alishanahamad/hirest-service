var func = require('../utils/functions')
var dbConfig = func.config.get('database')
GetCandidateDetailsForPI = require('../helpers/pi-candidate-list-helpers').GetCandidateDetailsForPI
var getCandidateDetailsForPI = new GetCandidateDetailsForPI()
const ROUTER_CONS = "HS_PCL_"
module.exports = function(app) {

  app.post(func.urlCons.URL_POST_CANDIDATE_LIST_FOR_PI, func.validateRole, function(req, res) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_CANDIDATE_LIST_FOR_PI, func.logCons.LOG_ENTER)
    var urlMap = func.getUrlMap(req);
    var userCode = req.headers[func.urlCons.PARAM_USER_CODE]
    getCandidateDetailsForPI.getPIDetailsFromDB(userCode, req.body, urlMap, function(error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getPIDetailsFromDB = ' + error);
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPIDetailsFromDB()', func.logCons.LOG_EXIT);
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
