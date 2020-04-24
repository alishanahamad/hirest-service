var func = require('../utils/functions')
var async = require('async')
var CampusCandidateHelpers = require('../helpers/campus-candidate-helpers').CampusCandidateHelpers
var campusCandidateHelpers = new CampusCandidateHelpers()

module.exports = function(app) {
  app.get(func.urlCons.URL_GET_CAMPUS_CANDIDATE_DETAILS,func.validateRole, function(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'get campus candidate details ', func.logCons.LOG_ENTER)
    var campusDriveId = req.params[func.dbCons.FIELD_CAMPUS_DRIVE_ID];
    var urlMap = func.getUrlMap(req)
    campusCandidateHelpers.campusCandidateDetails(campusDriveId, urlMap, function(error, response) {
      if (error) {
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'response while getting campus candidate details' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'User details retrieved sucessfully')
        res.status(func.httpStatusCode.OK)
        res.send(response)
      }
    })
  })
}
