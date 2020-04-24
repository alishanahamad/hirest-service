var func = require('../utils/functions')
var async = require('async')
var InstituteDetailHelpers = require('../helpers/institute-details-helpers').InstituteDetailHelpers
var instituteDetailHelpers = new InstituteDetailHelpers()
var ROUTER_CONST_STATUS = 'SH_IDH_'
module.exports = function(app) {
  app.get(func.urlCons.URL_GET_INSTITUTE_DETAILS, func.validateRole, function(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_INSTITUTE_DETAILS, func.logCons.LOG_ENTER)
    var urlMap = func.getUrlMap(req)
    // institute_details COLLECTION
    instituteDetailHelpers.getInstituteDetails(urlMap, function(error, response) {
      if (error) {
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'response while getting institute details ' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'Institute details retrieved sucessfully')
        res.status(func.httpStatusCode.OK)
        res.send(response)
      }
    })

    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_INSTITUTE_DETAILS, func.logCons.LOG_EXIT)
  })

  app.post(func.urlCons.URL_POST_UPDATE_INSTITUTE_DETAILS, func.validateRole, function(req, res, next) {
    var instituteId = req.params[func.dbCons.FIELD_INSTITUTE_ID]
    var urlMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV];
    instituteDetailHelpers.updateInstituteDetails(instituteId, urlMap, env, req.body, function(error, response) {
      if (error) {
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'response while updating institute details ' + JSON.stringify(response))
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

  app.post(func.urlCons.URL_POST_UPDATE_CAMPUS_DRIVE_DETAILS, func.validateRole, function(req, res, next) {
    var campusDriveId = req.params[func.dbCons.FIELD_CAMPUS_DRIVE_ID]
    var urlMap = func.getUrlMap(req)
    instituteDetailHelpers.updateCampusDriveDetails(campusDriveId, urlMap, req.body, function(error, response) {
      if (error) {
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'response while updating campus drive details ' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(ROUTER_CONST_STATUS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        res.status(func.httpStatusCode.OK)
        return res.send(response)
      }
    })
  })
}
