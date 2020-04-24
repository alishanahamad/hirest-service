var func = require('../utils/functions')
var LocationAndGroupDetailsHelpers = require('../helpers/location-and-group-details-helpers').LocationAndGroupDetailsHelpers
var locationAndGroupDetailsHelpers = new LocationAndGroupDetailsHelpers()
var Joi = require('joi')

/**
 * [schemaForGetLocation description]
 * @type {[type]}
 */
var schemaForGetLocation = Joi.object().keys({
  campus_invite_year: Joi.string().required().regex(/^[0-9]{4}$/),
  stage: Joi.number().integer().required(),
  location: Joi.string(),
  university_group_name: Joi.string(),
  designation: Joi.string().required(),
  round_type: Joi.string().required(),
  role_name: Joi.string()
})
module.exports = function (app) {
  app.get(func.urlCons.URL_GET_PARTICULAR_LOCATION_LIST, func.validateRole, function (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_GET_PARTICULAR_LOCATION_LIST, func.logCons.LOG_ENTER)
    var orgNameMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    var userCode = req.headers[func.urlCons.PARAM_USER_CODE]
    var stage = Number(req.params[func.dbCons.COLLECTION_JSON_STAGE])
    locationAndGroupDetailsHelpers.getGroupLocations(stage, userCode, orgNameMap, env, function (error, response) {
      if (error) {
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching all GD locations for userCode = ' + userCode + ' Error = ' + JSON.stringify(response))
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

  app.post(func.urlCons.URL_GET_PARTICULAR_LOCATION_DETAILS, func.validateRole,validateGetRequestBody, function (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_GET_PARTICULAR_LOCATION_DETAILS, func.logCons.LOG_ENTER)
    var orgNameMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    var userCode = Number(req.headers[func.urlCons.PARAM_USER_CODE])
    locationAndGroupDetailsHelpers.getParticularLocationDetail(userCode, req.body, orgNameMap, env, function (error, response) {
      if (error) {
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching details for particular location for userCode = ' + userCode + ' Error = ' + JSON.stringify(response))
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
}

function validateGetRequestBody (req, res, next) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateRequestBody()', func.logCons.LOG_ENTER)
  var requestJson = req.body
  Joi.validate(requestJson, schemaForGetLocation, function (err, value) {
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
