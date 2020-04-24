/**
 * The <code>exam-report-details-routes.js </code> use to retrieve exam report details for all the data or list of hierarcy based on company
 *
 * @author Kavish Kapadia
 */
var func = require('../utils/functions')
var ExamReportDetailsHelpers = require('../helpers/exam-report-details-helpers').ExamReportDetailsHelpers
var examReportDetailsHelpers = new ExamReportDetailsHelpers()
var ROUTE_CONS = 'HS_ERDR_'

module.exports = function(app) {
  app.get(func.urlCons.URL_GET_EXAM_REPORT_DETAILS, func.validateRole, function(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_GET_EXAM_REPORT_DETAILS, func.logCons.LOG_ENTER)
    var orgNameMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    examReportDetailsHelpers.getExamReportDetails(orgNameMap, env, function(error, response) {
      if (error) {
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        if (response.length === 0 || !response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'could not complete the task: ' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_EXAM_REPORT_DETAILS, func.logCons.LOG_EXIT)
          return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_SUCCESS_FETCHED_DATA))
        }
        res.status(func.httpStatusCode.OK)
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_EXAM_REPORT_DETAILS, func.logCons.LOG_EXIT)
        return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_SUCCESS_FETCHED_DATA))
      }
    })
  })

  app.post(func.urlCons.URL_POST_EXAM_REPORT_DETAILS, func.validateRole, function(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_POST_EXAM_REPORT_DETAILS, func.logCons.LOG_ENTER)
    var orgNameMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    var email = req.body[func.dbCons.FIELD_EMAIL_ADDRESS]
    examReportDetailsHelpers.postExamReportDetails(email, orgNameMap, env, function(error, response) {
      if (error) {
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        if (response.length === 0 || !response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'response while adding details to exam report collection: ' + JSON.stringify(response))
          res.status(func.msgCons.CODE_NOT_FOUND)
          func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_EXAM_REPORT_DETAILS, func.logCons.LOG_EXIT)
          return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_ERROR_NO_DATA))
        } else if (response[0] === func.msgCons.MSG_MORE_THAN_ONE_EXAM_REPORT_DATA_FOUND) {
          res.status(func.httpStatusCode.OK)
          func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_EXAM_REPORT_DETAILS, func.logCons.LOG_EXIT)
          return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_MORE_THAN_ONE_EXAM_REPORT_DATA_FOUND))
        } else {
          res.status(func.httpStatusCode.OK)
          func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_EXAM_REPORT_DETAILS, func.logCons.LOG_EXIT)
          return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_FETCH_DATA))
        }
      }
    })
  })

  app.post(func.urlCons.URL_POST_SEND_EXAM_REPORT, func.validateRole, function(req, res, next) {
    var urlMap = func.getUrlMap(req)
    examReportDetailsHelpers.sendExamReportDetail(urlMap, req.body, function(error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while Sending exam report ' + JSON.stringify(error))
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'response while Sending exam report ' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        res.status(func.httpStatusCode.OK)
        var resJson = {}
        resJson[func.msgCons.RESPONSE_EMAIL_SENT] = response
        //resJson[func.msgCons.RESPONSE_STATUS_MSG] = func.msgCons.RESPONSE_EMAIL_SENT
        return res.send(func.responseGenerator(resJson, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.RESPONSE_EMAIL_SENT))
      }
    })
  })
}
