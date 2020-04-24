var func = require('../utils/functions')
var GetCampusDriveListHelper = require('../helpers/campus-drive-list-helper').CampusDriveListHelper
var getCampusDriveListHelper = new GetCampusDriveListHelper()
var ROUTE_CONS = 'HS_CDLR'

module.exports = function (app) {
  app.get(func.urlCons.GET_CAMPUS_DRIVE_LIST, func.validateRole, function (req, res) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Getting UI to Get Campus drive List')
    var urlMap = func.getUrlMap(req)
    getCampusDriveListHelper.getCampusData(urlMap, function (error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while getting campus drive list ' + JSON.stringify(error))
        var paramJson = {}
        paramJson.urlMap = urlMap
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'response while getting campus drive list' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Data retrieved Here')
        res.status(func.httpStatusCode.OK)
        var resJson = {}
        resJson[func.msgCons.RESPONSE_CREATED] = response
        resJson[func.msgCons.RESPONSE_STATUS_CODE] = func.msgCons.CODE_ASH_SUCCESS
        resJson[func.msgCons.RESPONSE_STATUS_MSG] = func.msgCons.MSG_ASH_DATA_INSERTED
        return res.send(func.responseGenerator(resJson, func.msgCons.CODE_ASH_SUCCESS, func.msgCons.MSG_ASH_DATA_INSERTED))
      }
    })
  })

  /*
   *  Update API Capus Drive Status
   */

  app.post(func.urlCons.UPDATE_CAMPUS_DRIVE_LIST_STATUS, func.validateRole, function (req, res, next) {
    var campusId = req.params[func.dbCons.FIELD_CAMPUS_ID]
    var urlMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    getCampusDriveListHelper.updateCampusDriveListStatus(campusId, urlMap, req.body, env, function (error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while updating campus drive status ' + JSON.stringify(error))
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'response while updating campus drive status ' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        res.status(func.httpStatusCode.OK)
        var resJson = {}
        resJson[func.msgCons.RESPONSE_UPDATED] = response
        resJson[func.msgCons.RESPONSE_STATUS_CODE] = func.msgCons.CODE_ASH_SUCCESS
        resJson[func.msgCons.RESPONSE_STATUS_MSG] = func.msgCons.MSG_ASH_DATA_UPDATED + func.msgCons.SURVEY_DETAILS
        return res.send(func.responseGenerator(resJson, func.msgCons.CODE_ASH_SUCCESS, func.msgCons.MSG_ASH_DATA_UPDATED + func.msgCons.SURVEY_DETAILS))
      }
    })
  })

  /*
   *  Update API for CANDIDATE_SIGNUP_URL in Capus Drive Status
   */

  app.post(func.urlCons.URL_UPDATE_SINGUP_CANDIDATE_URL, function (req, res, next) {
    var institueId = req.body[func.dbCons.CAMPUS_DRIVE_DETAILS_INSTITUTE_ID]
    var urlMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    var id = req.body[func.dbCons.FIELD_ID]
    getCampusDriveListHelper.updateSignupCandidateUrl(institueId, urlMap, id, env, function (error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while updating campus drive status ' + JSON.stringify(error))
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'response while updating campus drive status ' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        res.status(func.httpStatusCode.OK)
        var resJson = {}
        resJson[func.msgCons.RESPONSE_UPDATED] = response
        resJson[func.msgCons.RESPONSE_STATUS_CODE] = func.msgCons.CODE_ASH_SUCCESS
        resJson[func.msgCons.RESPONSE_STATUS_MSG] = func.msgCons.MSG_ASH_DATA_UPDATED + func.msgCons.SURVEY_DETAILS
        return res.send(func.responseGenerator(resJson, func.msgCons.CODE_ASH_SUCCESS, func.msgCons.MSG_ASH_DATA_UPDATED + func.msgCons.SURVEY_DETAILS))
      }
    })
  })

  app.post(func.urlCons.URL_POST_CHANGE_EXAM_STATUS, func.validateRole, function (req, res, next) {
    var orgNameMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    var campusDriveId = req.params[func.dbCons.FIELD_CAMPUS_DRIVE_ID]
    var examStatus = req.body[func.dbCons.CANDIDATE_EXAM_DETAILS_STATUS]
    getCampusDriveListHelper.changeCandidateExamStatus(campusDriveId, examStatus, orgNameMap, function (error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while updating candidate exam detail status ' + JSON.stringify(error))
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'response while updating candidate exam detail status ' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'result of update exam status ' + JSON.stringify(response))
        res.status(func.httpStatusCode.OK)
        res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_UPDATE_DATA))
      }
    })
  })

  /*
  *  Update API to insert new entity 'gd_proposed_dates' in campus_drive_details
  */

  app.post(func.urlCons.URL_UPDATE_GD_PROPOSED_DATE, func.validateRole, validateProposedDateBody, function (req, res) {
    var dateArray = req.body[func.dbCons.FIELD_GD_PROPOSED_DATES]
    var urlMap = func.getUrlMap(req)
    var campusDriveId = req.params[func.dbCons.FIELD_CAMPUS_DRIVE_ID]
    getCampusDriveListHelper.updateGdProposedDates(campusDriveId, urlMap, dateArray, function (error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while updating gd proposed dates ' + JSON.stringify(error))
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'response while updating gd proposed dates ' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        res.status(func.httpStatusCode.OK)
        return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_UPDATE_GD_PROPOSED_DATES))
      }
    })
  })

  function validateProposedDateBody (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateProposedDateBody()', func.logCons.LOG_ENTER)
    var dateArray = req.body[func.dbCons.FIELD_GD_PROPOSED_DATES]
    if (dateArray == undefined) {
      var json = func.errorsArrayGenrator(generateErrorArrayObject(ROUTE_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_PROPOSED_DATES_NOT_VALID), func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_PROPOSED_DATES_EMPTY)
      res.status(func.getStatusCode(func.msgCons.CODE_BAD_REQUEST))
      res.send(json)
    } else {
      if (dateArray.length === 0) {
        var json = func.errorsArrayGenrator(generateErrorArrayObject(ROUTE_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_PROPOSED_DATES_NOT_VALID), func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_PROPOSED_DATES_EMPTY)
        res.status(func.getStatusCode(func.msgCons.CODE_BAD_REQUEST))
        res.send(json)
      } else {
        next()
      }
    }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateProposedDateBody()', func.logCons.LOG_EXIT)
  }

  function generateErrorArrayObject (code, msg) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateErrorArrayObject()', func.logCons.LOG_ENTER)
    var errorArray = []
    errorArray.push(func.errorObjectGenrator(code, msg))
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateErrorArrayObject()', func.logCons.LOG_EXIT)
    return errorArray
  }

  app.post(func.urlCons.URL_POST_GET_CAMPUS_DRIVE_DETAILS, func.validateRole, validateGetBody, function (req, res) {
    var instituteId = req.body[func.dbCons.FIELD_INSTITUTE_ID]
    var designation = req.body[func.dbCons.FIELD_DESIGNATION]
    var urlMap = func.getUrlMap(req)
    getCampusDriveListHelper.getCampusDriveData(urlMap, instituteId, designation, function (error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while getting campus drive details ' + JSON.stringify(error))
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'response while getting campus drive details ' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        res.status(func.httpStatusCode.OK)
        return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_GET_CAMPUS_DRIVE_DETAILS))
      }
    })
  })
  app.post(func.urlCons.URL_GET_SELECTED_GD_DATE_FOR_PI, func.validateRole, validateGetBody, function (req, res) {
    var instituteId = req.body[func.dbCons.FIELD_INSTITUTE_ID]
    var designation = req.body[func.dbCons.FIELD_DESIGNATION]
    var urlMap = func.getUrlMap(req)
    getCampusDriveListHelper.getGdSelectedDate(urlMap, instituteId, designation, function (error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while getting selected gd date' + JSON.stringify(error))
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'response while getting selected gd date' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        res.status(func.httpStatusCode.OK)
        return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_GET_GD_DATES_FOR_PI))
      }
    })
  })

  function validateGetBody (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateGetBody()', func.logCons.LOG_ENTER)
    var instituteId = req.body[func.dbCons.FIELD_INSTITUTE_ID]
    var designation = req.body[func.dbCons.FIELD_DESIGNATION]
    if (instituteId == undefined || designation == undefined) {
      var json = func.errorsArrayGenrator(generateErrorArrayObject(ROUTE_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_INSTITITE_ID_DESIGNATION_DATA_NOT_VALID), func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_INSTITITE_ID_DESIGNATION_DATA_CANNOT_BE_EMPTY)
      res.status(func.getStatusCode(func.msgCons.CODE_BAD_REQUEST))
      res.send(json)
    } else {
      if (instituteId.length === 0 || designation.length === 0) {
        var json = func.errorsArrayGenrator(generateErrorArrayObject(ROUTE_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_INSTITITE_ID_DESIGNATION_DATA_NOT_VALID), func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_INSTITITE_ID_DESIGNATION_DATA_CANNOT_BE_EMPTY)
        res.status(func.getStatusCode(func.msgCons.CODE_BAD_REQUEST))
        res.send(json)
      } else {
        next()
      }
    }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateGetBody()', func.logCons.LOG_EXIT)
  }

}
