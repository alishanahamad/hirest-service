'use strict'

/**
 * The <code>exam-score-routes.js</code>
 *
 * @author Vacha Dakwala, Ashita Shah, Shweta Metaliya
 */
var func = require('../utils/functions')
var ExamScoreHelpers = require('../helpers/exam-score-helpers').ExamScoreHelpers
var examScoreHelpers = new ExamScoreHelpers()
var ROUTE_CONS = 'HS_ESR_'

module.exports = function (app) {
  app.post(func.urlCons.URL_POST_RECIPIENT_SURVEY_URL,func.validateRole, function (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_POST_RECIPIENT_SURVEY_URL, func.logCons.LOG_ENTER)
    var orgNameMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    examScoreHelpers.getSurveyRecipientUrl(req.body, orgNameMap, env, function (error, response) {
      if (error) {
        if (response) {
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(ROUTE_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'result of add recipient ' + JSON.stringify(response))
        res.status(func.httpStatusCode.OK)
        res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_INSERT))
      }
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_POST_RECIPIENT_SURVEY_URL, func.logCons.LOG_EXIT)
  })

  app.post(func.urlCons.URL_GET_SCORE_STATISTICS, func.validateRole,function (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_GET_SCORE_STATISTICS, func.logCons.LOG_ENTER)
    var orgNameMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    examScoreHelpers.getExamScore(req.body, orgNameMap, env, function (error, response) {
      if (error) {
        if (response) {
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(ROUTE_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'result of add recipient ' + JSON.stringify(response))
        res.status(func.httpStatusCode.OK)
        res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_DATA_FETCH))
      }
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_GET_SCORE_STATISTICS, func.logCons.LOG_EXIT)
  })

  app.post(func.urlCons.URL_POST_UPDATE_EXAM_STATUS, func.validateRole,function (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_POST_UPDATE_EXAM_STATUS, func.logCons.LOG_ENTER)
    var orgNameMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    var campusDriveId = req.params[func.dbCons.FIELD_CAMPUS_DRIVE_ID]
    var examStatus = req.body[func.dbCons.CANDIDATE_EXAM_DETAILS_STATUS]
    examScoreHelpers.updateCandidateExamStatus(campusDriveId, examStatus, orgNameMap, env, function (error, response) {
      if (error) {
        if (response) {
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(ROUTE_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'result of update exam status ' + JSON.stringify(response))
        res.status(func.httpStatusCode.OK)
        res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_UPDATE_DATA))
      }
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_POST_UPDATE_EXAM_STATUS, func.logCons.LOG_EXIT)
  })
}
