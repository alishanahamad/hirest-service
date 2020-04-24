/**
 * The <code>candidate-exam-routes.js</code>
 *
 * @author Payal Asodariya, Monika Mehta
 */

var func = require('../utils/functions')
var CandidateExamHelpers = require('../helpers/candidate-exam-helpers').CandidateExamHelpers
var candidateExamHelpers = new CandidateExamHelpers()
var ROUTES_CONS = 'SH_CER_'

module.exports = function (app) {
  app.post(func.urlCons.URL_POST_CANDIDATE_EXAM_DETAILS,func.validateRole, function (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_CANDIDATE_EXAM_DETAILS, func.logCons.LOG_ENTER)
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'request body to get candidate exam details is = '+JSON.stringify(req.body))
    var urlMap = func.getUrlMap(req)
    var body = req.body
    candidateExamHelpers.getCandidateExamDetails(body, urlMap, function (error, response) {
      if (error) {
        if (response) {
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_CANDIDATE_EXAM_DETAILS, func.logCons.LOG_EXIT)
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_CANDIDATE_EXAM_DETAILS, func.logCons.LOG_EXIT)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        res.status(func.httpStatusCode.OK)
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_CANDIDATE_EXAM_DETAILS, func.logCons.LOG_EXIT)
        return res.send(func.responseGenerator(response, ROUTES_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_GET_EXAM_DETAIL))
      }
    })
  })

  app.post(func.urlCons.URL_UPDATE_CANDIDATE_EXAM_STATUS,func.validateRole, function (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_UPDATE_CANDIDATE_EXAM_STATUS, func.logCons.LOG_ENTER)
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'request body to update candidate exam status is = '+JSON.stringify(req.body))
    var urlMap = func.getUrlMap(req)
    var body = req.body
    candidateExamHelpers.updateCandidateExamDetails(body, urlMap, function (error, response) {
      if (error) {
        if (response) {
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_CANDIDATE_EXAM_DETAILS, func.logCons.LOG_EXIT)
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_CANDIDATE_EXAM_DETAILS, func.logCons.LOG_EXIT)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        res.status(func.httpStatusCode.OK)
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_UPDATE_CANDIDATE_EXAM_STATUS, func.logCons.LOG_EXIT)
        return res.send(func.responseGenerator(response, ROUTES_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_UPDATE_DATA))
      }
    })
  })
}
