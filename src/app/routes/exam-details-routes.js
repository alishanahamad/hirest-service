var func = require('../utils/functions');
GetExamDetailsHelper = require('../helpers/exam-details-helpers').GetExamDetailsHelper;
var getExamDetailsHelper = new GetExamDetailsHelper();
var ROUTE_CONS = 'HS_EDR_'

module.exports = function(app) {

  app.get(func.urlCons.URL_GET_EXAM_DETAILS_DATA,func.validateRole, function(req, res) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_EXAM_DETAILS_DATA, func.logCons.LOG_ENTER)
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'request param exam_id = '+ req.params[func.dbCons.FIELD_EXAM_ID])
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, "Getting UI to Get Exam Details data");
    var exam_id = req.params[func.dbCons.FIELD_EXAM_ID];
    const candidateExamId = req.params[func.msCons.FIELD_CANDIDATE_EXAM_DETAILS_ID];
    var token = req.headers[func.urlCons.PARAM_ACCESS_TOKEN];
    var userCode = req.headers[func.urlCons.PARAM_USER_CODE];
    var urlMap = func.getUrlMap(req);
    getExamDetailsHelper.getExamDetailsData(candidateExamId,exam_id,userCode, token, urlMap, function(error, response) {
      if (error) {
        var paramJson = {};
        paramJson.urlMap = urlMap;
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, ' response ' + JSON.stringify(response));
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]));
          return res.send(response);
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR);
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_EXAM_DETAILS_DATA, func.logCons.LOG_EXIT)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER));
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Data retrieved');
        res.status(func.httpStatusCode.OK);
        var resJson = {};
        resJson[func.msgCons.MSG_EXAM_DETAILS] = response;
        resJson[func.msgCons.RESPONSE_STATUS_CODE] = func.msgCons.CODE_ASH_SUCCESS;
        resJson[func.msgCons.RESPONSE_STATUS_MSG] = func.msgCons.MSG_ASH_DATA_INSERTED;
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_EXAM_DETAILS_DATA, func.logCons.LOG_EXIT)
        return res.send(func.responseGenerator(resJson, func.msgCons.CODE_ASH_SUCCESS, func.msgCons.MSG_ASH_DATA_INSERTED));
      }
    });
  });

  app.post(func.urlCons.URL_UPDATE_EXAM_STATUS,func.validateRole, function(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_UPDATE_EXAM_STATUS, func.logCons.LOG_ENTER)
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'request body to update candidate exam status as IN_PROGRESS and get endtime = '+JSON.stringify(req.body))
    var orgNameMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    var examId = req.body[func.dbCons.FIELD_EXAM_ID]
    var userId = req.body[func.dbCons.FIELD_USER_ID]
    var status = req.body[func.dbCons.FIELD_STATUS]
    let candidateExamId = req.body[func.msCons.FIELD_CANDIDATE_EXAM_DETAILS_ID]
    getExamDetailsHelper.updateExamStatus(candidateExamId,examId, userId, status, orgNameMap, env, function(error, response) {
      if (error) {
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        if (response.length === 0 || !response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'could not complete the task: ' + JSON.stringify(response))
          res.status(func.httpStatusCode.OK)
          func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_UPDATE_EXAM_STATUS, func.logCons.LOG_EXIT)
          return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.RESPONSE_UPDATED))
        }
        res.status(func.httpStatusCode.OK)
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_UPDATE_EXAM_STATUS, func.logCons.LOG_EXIT)
        return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.RESPONSE_UPDATED))
      }
    })
  })
}
