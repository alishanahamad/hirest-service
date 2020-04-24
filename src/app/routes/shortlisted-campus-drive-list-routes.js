var func = require('../utils/functions')
var async = require('async')
var ROUTER_CONS_ = 'HS_SCDLR_'
DbOperation = require('../helpers/db-operations').DbOperation
var dbOp = new DbOperation()
ShortlistedCampusDriveListHelper = require('../helpers/shortlisted-campus-drive-list-helpers.js').ShortlistedCampusDriveListHelper
var shortlistedCampusDriveListHelper = new ShortlistedCampusDriveListHelper()
var Joi = require('joi')

/**
 * [schemaForInsertion description]
 * @type {[type]}
 */
var schemaForUpdation = Joi.object().keys({
  campus_invite_year: Joi.string().required().regex(/^[0-9]{4}$/),
  round_type: Joi.string().required()
})

module.exports = function (app) {
  app.post(func.urlCons.URL_GET_SHORTLISTED_CAMPUS_DRIVES_DETAILS, validateGetRequestBody, function (req, res, next) {
    var urlMap = func.getUrlMap(req)
    var stage_id = req.params[func.dbCons.FIELD_STAGE_ID]
    req.body[func.dbCons.FIELD_ROUND_TYPE] = getEnumForRoundType(req.body[func.dbCons.FIELD_ROUND_TYPE])
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'stage_id:' + stage_id)
    shortlistedCampusDriveListHelper.shortlistedCampusDriveListDetails(req.body, stage_id, urlMap, function (error, response) {
      if (error) {
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator('No Data Found', func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'GD and PI Details Fetched successfully')
        res.status(func.httpStatusCode.OK)
        return res.send(func.responseGenerator(response, ROUTER_CONS_ + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_GD_DETAILS_FETCHED))
      }
    })
  })
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
function validateGetRequestBody (req, res, next) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateRequestBody()', func.logCons.LOG_ENTER)
  var requestJson = req.body
  Joi.validate(requestJson, schemaForUpdation, function (err, value) {
    if (err) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error in validating update data')
      res.status(func.httpStatusCode.BAD_REQUEST)
      res.send(func.errorsArrayGenrator(func.generateErrorArrayObject(ROUTER_CONS + func.msgCons.CODE_BAD_REQUEST, err.details[0].message), ROUTER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_ERROR_JOI_VALIDATION))
    } else {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'validation result: ' + JSON.stringify(value))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateRequestBody()', func.logCons.LOG_EXIT)
      next()
    }
  })
}
