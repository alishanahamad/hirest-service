/**
 * The <code>exam-report-details-routes.js </code> use to retrieve exam report details for all the data or list of hierarcy based on company
 *
 * @author Kavish Kapadia
 */
var func = require('../utils/functions')
var ExamScoreDetailsCalculationHelpers = require('../helpers/exam-score-details-calculation-helpers').ExamScoreDetailsCalculationHelpers
var examScoreDetailsCalculationHelpers = new ExamScoreDetailsCalculationHelpers()
var ROUTE_CONS = 'HS_ESDCR_'

module.exports = function (app) {
  app.post(func.urlCons.URL_GET_LIST_URL_IDS, function (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_GET_LIST_URL_IDS, func.logCons.LOG_ENTER)
    var orgNameMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    var campusDriveId = req.body[func.dbCons.FIELD_CAMPUS_DRIVE_ID]
    examScoreDetailsCalculationHelpers.getCampusStudentDetails(campusDriveId, orgNameMap, env, function (error, response) {
      if (error) {
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        if (response.length === 0 || !response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'could not complete the task: ' + JSON.stringify(response))
          res.status(func.httpStatusCode.OK)
          func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_LIST_URL_IDS, func.logCons.LOG_EXIT)
          return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_SUCCESS_FETCHED_DATA))
        }
        res.status(func.httpStatusCode.OK)
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_LIST_URL_IDS, func.logCons.LOG_EXIT)
        return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_SUCCESS_FETCHED_DATA))
      }
    })
  })
}
