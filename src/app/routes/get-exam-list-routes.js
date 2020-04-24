var func = require('../utils/functions');
GetExamListDetailsHelper = require('../helpers/get-exam-list-helpers').GetExamListDetailsHelper;
var getExamListDetailsHelper = new GetExamListDetailsHelper();
// var candidate_source_id;
// var exam_id;
module.exports = function(app) {

  app.get(func.urlCons.URL_GET_EXAM_LIST_DATA, func.validateRole, function(req, res) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_EXAM_LIST_DATA, func.logCons.LOG_ENTER)
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'request param to get particular candidate exam list is '+ req.params[func.dbCons.FIELD_USER_ID])
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, "Getting UI to Get Exam List data for particular candidate");
    var user_id = req.params[func.dbCons.FIELD_USER_ID];
    // var token = req.headers[func.urlCons.PARAM_ACCESS_TOKEN];
    var urlMap = func.getUrlMap(req);
    getExamListDetailsHelper.getExamListData(user_id, urlMap, function(error, response) {
      if (error) {
        var paramJson = {};
        paramJson.urlMap = urlMap;
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'response' + JSON.stringify(response));
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]));
          return res.send(response);
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR);
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER));
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Data retrieved');
        res.status(func.httpStatusCode.OK);
        var resJson = {};
        resJson[func.msgCons.MSG_EXAM_DETAILS] = response;
        resJson[func.msgCons.RESPONSE_STATUS_CODE] = func.msgCons.CODE_ASH_SUCCESS;
        resJson[func.msgCons.RESPONSE_STATUS_MSG] = func.msgCons.MSG_ASH_DATA_INSERTED;
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_EXAM_LIST_DATA, func.logCons.LOG_EXIT)
        return res.send(func.responseGenerator(resJson, func.msgCons.CODE_ASH_SUCCESS, func.msgCons.MSG_ASH_DATA_INSERTED));
      }
    });

  });
}
