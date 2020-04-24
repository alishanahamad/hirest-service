var func = require('../utils/functions')
var async = require('async')
var CreateExamHelpers = require('../helpers/design-exam-helper').CreateExamHelpers
var createExamHelpers = new CreateExamHelpers()
var ROUTER_CONST_STATUS = 'SH_CEH_'
module.exports = function (app) {
  app.post(func.urlCons.URL_POST_INSERT_EXAM_TEMPLATE, func.validateRole, function (req, res, next) {
    var urlMap = func.getUrlMap(req)
    createExamHelpers.insertExam(urlMap, req.body, function (error, response) {
      if (error) {
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'response while inserting exam details ' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        res.status(func.httpStatusCode.OK)
        return res.send(response)
      }
    })
  })

  app.get(func.urlCons.URL_GET_EXAM_TEMPLATE_LIST, func.validateRole, function (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_EXAM_TEMPLATE_LIST, func.logCons.LOG_ENTER)
    var urlMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    var desginationArray = []
    desginationArray.push(req.query[func.dbCons.FIELD_EXAM_TARGET])
    createExamHelpers.getExamTemplateListByChild(env, urlMap, desginationArray, function (error, response) {
      if (error) {
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'response while getting exam template details ' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'exam template details retrieved sucessfully')
        res.status(func.httpStatusCode.OK)
        res.send(response)
      }
    })
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_EXAM_TEMPLATE_LIST, func.logCons.LOG_EXIT)
  })
}
