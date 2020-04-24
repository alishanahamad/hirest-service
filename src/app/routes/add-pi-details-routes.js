var func = require('../utils/functions')
var dbConfig = func.config.get('database')
AddPIDetails = require('../helpers/add-pi-details-helpers').AddPIDetails
var addPIDetails = new AddPIDetails()
var async = require('async')
const ROUTER_CONS = "HS_APD_"
module.exports = function(app) {

  app.post(func.urlCons.URL_POST_INSERT_PI_DETAILS, func.validateRole, function(req, res) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_INSERT_PI_DETAILS, func.logCons.LOG_ENTER)
    var urlMap = func.getUrlMap(req);
    var userCode = req.headers[func.urlCons.PARAM_USER_CODE];
    var env = req.query[func.urlCons.PARAM_ENV];
    addPIDetails.addPIDetailsFromDB(req.body, urlMap, userCode, env, function(error, response) {
      if (error) {
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR);
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER));
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inserted Successfully');
        res.status(func.httpStatusCode.OK);
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_ASSESSMENT_DETAILS, func.logCons.LOG_EXIT);
        return res.send(func.responseGenerator(response, ROUTER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_INSERT));
      }
    });

  });
};
