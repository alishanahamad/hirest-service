var func = require('../utils/functions')
var GdScoreDetailsHelpers = require('../helpers/gd-score-details-helpers').GdScoreDetailsHelpers
var gdScoreDetailsHelpers = new GdScoreDetailsHelpers()
var ROUTE_CONS = 'HS_GDSDR_'

module.exports = function (app) {
  app.post(func.urlCons.URL_POST_UPDATE_GD_SCORE_DETAILS, func.validateRole, function (req, res, next) {
    var urlMap = func.getUrlMap(req)
    var roundType = getEnumForRoundType(req.params[func.dbCons.FIELD_ROUND_TYPE])
    var env = req.query[func.urlCons.PARAM_ENV]
    var userCode = req.headers[func.urlCons.PARAM_USER_CODE]
    gdScoreDetailsHelpers.updateGDScoreDetails(req.body, roundType, urlMap, function (error, response) {
      if (error) {
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'response while updating candidate gd details ' + JSON.stringify(response))
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

  app.post(func.urlCons.URL_POST_GD_SCORE_DETAILS, func.validateRole, validateBody, function (req, res) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_GD_SCORE_DETAILS, func.logCons.LOG_ENTER)
    var urlMap = func.getUrlMap(req)
    var groupDetailIds = req.body[func.dbCons.GD_GROUP_DETAILS_BODY_FIELD_ID]
    gdScoreDetailsHelpers.getScoreDetails(req.body, urlMap, function (error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while getting gd score details data ' + JSON.stringify(error))
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'response while getting gd score details data ' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        res.status(func.httpStatusCode.OK)
        var resJson = {}
        resJson[func.dbCons.COLLECTION_GD_SCORE_DETAILS] = response
        resJson[func.msgCons.RESPONSE_STATUS_CODE] = func.msgCons.CODE_ASH_SUCCESS
        return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_GET_GD_SCORE_DETAILS))
      }
    })
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_GD_SCORE_DETAILS, func.logCons.LOG_EXIT)
  })

  function validateBody (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateBody()', func.logCons.LOG_ENTER)
    var groupIds = req.body[func.msCons.STAGE_DETAIL_ID]

    if (groupIds === undefined) {
      var json = func.errorsArrayGenrator(generateErrorArrayObject(ROUTE_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_GROUP_DETAILS_NOT_FOUND), func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_GROUP_DETAILS_ID_CANNOT_BE_EMPTY)
      res.status(func.getStatusCode(func.msgCons.CODE_BAD_REQUEST))
      res.send(json)
    } else {
      if (groupIds.length === 0 || groupIds === '' || typeof groupIds !== 'object') {
        // console.log("typeof type is=================",typeof type);
        var json = func.errorsArrayGenrator(generateErrorArrayObject(ROUTE_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_GROUP_DETAILS_INVALID), func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_GROUP_DETAILS_ID_CANNOT_BE_EMPTY)
        res.status(func.getStatusCode(func.msgCons.CODE_BAD_REQUEST))
        res.send(json)
      } else {
        next()
      }
    }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateBody()', func.logCons.LOG_EXIT)
  }

  function getEnumForRoundType (value) {
    switch (value) {
      case func.dbCons.VALUE_ROUND_TYPE_ON_CAMPUS:
        return func.dbCons.ENUM_ROUND_TYPE_ON_CAMPUS
      case func.dbCons.VALUE_ROUND_TYPE_ON_SITE:
        return func.dbCons.ENUM_ROUND_TYPE_ON_SITE
      default:
        return -1
    }
  }
  function generateErrorArrayObject (code, msg) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateErrorArrayObject()', func.logCons.LOG_ENTER)
    var errorArray = []
    errorArray.push(func.errorObjectGenrator(code, msg))
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateErrorArrayObject()', func.logCons.LOG_EXIT)
    return errorArray
  }
}
