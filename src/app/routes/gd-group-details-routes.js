var func = require('../utils/functions')
var GdGroupDetailsHelpers = require('../helpers/gd-group-details-helpers').GdGroupDetailsHelpers
var gdGroupDetailsHelpers = new GdGroupDetailsHelpers()
var ROUTER_CONS = 'HS_GGDR_'
var Joi = require('joi')

/**
 * [schemaForInsertion description]
 * @type {[type]}
 */
var schemaForInsertion = Joi.object().keys({
  designation: Joi.string().required(),
  round_type: Joi.string().required(),
  gd_location: Joi.string().required(),
  gd_date: Joi.string(),
  university_group_name: Joi.string(),
  pincode:Joi.number().integer(),
  accommodation: Joi.string(),
  food_habits:Joi.array(),
  pickup_drop: Joi.string(),
  campus_invite_year:Joi.string(),
  gd_discussion_level: Joi.string().required(),
  institute_array: Joi.array().items(Joi.string()).min(1).required(),
  assessor_details: Joi.array().items(
    Joi.object().keys({
      assessor_id: Joi.number().integer().required(),
      is_chief_assessor: Joi.number().integer().required().max(1)
    })
  ).min(1).required(),
  candidate_details: Joi.array().items(
    Joi.object().keys({
      candidate_id: Joi.number().integer().required(),
      institute_name: Joi.string().required(),
      gd_topics: Joi.array(),
      gd_group_display_name: Joi.string().required(),
      gd_candidate_sequence: Joi.number().integer().required(),
      aggregate_score: Joi.any()
    })
  ).min(1).required()
})

/**
 * [schemaForUpdation description]
 * @type {[type]}
 */
var schemaForUpdation = Joi.object().keys({
  candidate_details: Joi.array().items(
    Joi.object().keys({
      id: Joi.number().integer().required(),
      institute_name: Joi.string().required(),
      updated_gd_group_display_name: Joi.string().required(),
      updated_gd_group_details_id: Joi.number().integer().required(),
      gd_candidate_sequence: Joi.number().integer().required(),
      status: Joi.string().required(),
      gd_topics: Joi.array()
    })
  ).min(1).required()
})

module.exports = function(app) {
  app.post(func.urlCons.URL_POST_INSERT_GD_GROUP_DETAILS, validateRequestBody, function(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_POST_INSERT_GD_GROUP_DETAILS, func.logCons.LOG_ENTER)
    var body = req.body
    var urlMap = func.getUrlMap(req)
    var userCode = req.headers[func.urlCons.PARAM_USER_CODE]
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'Request Body: ' + JSON.stringify(body))
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'User Code: ' + userCode)
    gdGroupDetailsHelpers.addGdGroupDetails(userCode, body, urlMap, function(error, response) {
      if (error) {
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'response while inserting GD Group details ' + JSON.stringify(response))
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
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_POST_INSERT_GD_GROUP_DETAILS, func.logCons.LOG_EXIT)
  })

  app.post(func.urlCons.URL_POST_UPDATE_GD_GROUP_DETAILS, func.validateRole, validateUpdateRequestBody, function(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_POST_UPDATE_GD_GROUP_DETAILS, func.logCons.LOG_ENTER)
    var body = req.body

    func.printLog(func.logCons.LOG_LEVEL_INFO, 'Request Body: ' + JSON.stringify(body))
    var urlMap = func.getUrlMap(req)
    gdGroupDetailsHelpers.updateGdGroupDetails(body, urlMap, function(error, response) {
      if (error) {
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'response while updating GD Group details ' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.BAD_REQUEST)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        res.status(func.httpStatusCode.OK)
        return res.send(response)
      }
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_POST_UPDATE_GD_GROUP_DETAILS, func.logCons.LOG_EXIT)
  })

  app.post(func.urlCons.URL_GET_INSTITUTE_LIST_FROM_DESIGNATION_WITHOUT_GD, func.validateRole, function(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_GET_INSTITUTE_LIST_FROM_DESIGNATION_WITHOUT_GD, func.logCons.LOG_ENTER)
    var orgNameMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    gdGroupDetailsHelpers.getInstituteListFromDesignationWithoutGd(req.body, orgNameMap, env, function(error, response) {
      if (error) {
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'response while fetching institute details ' + JSON.stringify(response))
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

  app.post(func.urlCons.URL_POST_SEND_GD_REPORT_MAIL, func.validateRole, function(req, res, next) {
    var urlMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    gdGroupDetailsHelpers.SendMailAssessorhelpers(urlMap, req.body, env, function(error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while Sending Assessor report ' + JSON.stringify(error))
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'response while Sending assessor report ' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        res.status(func.httpStatusCode.OK)
        var resJson = {}
        resJson[func.msgCons.RESPONSE_EMAIL_SENT] = response
        return res.send(func.responseGenerator(resJson, ROUTER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.RESPONSE_EMAIL_SENT))
      }
    })
  })
  app.post(func.urlCons.URL_POST_ADD_GD_CANDIDATE, func.validateRole, function(req, res, next) {
    var urlMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    var userCode = req.headers[func.urlCons.PARAM_USER_CODE]
    gdGroupDetailsHelpers.addGdCandidates(userCode, urlMap, req.body, env, function(error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while Sending Assessor report ' + JSON.stringify(error))
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'response while Sending assessor report ' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        res.status(func.httpStatusCode.OK)
        var resJson = {}
        resJson[func.msgCons.RESPONSE_EMAIL_SENT] = response
        return res.send(func.responseGenerator(resJson, ROUTER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.RESPONSE_EMAIL_SENT))
      }
    })
  })

  app.post(func.urlCons.URL_POST_GET_CUSTOM_GD_PI_INSTITUTE_LIST, func.validateRole, function(req, res, next) {
    var urlMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    var userCode = req.headers[func.urlCons.PARAM_USER_CODE]
    gdGroupDetailsHelpers.getCustomGDPIInstituteList(req.body, urlMap, env, function(error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while Sending Assessor report ' + JSON.stringify(error))
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'response while Sending assessor report ' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        res.status(func.httpStatusCode.OK)
        var resJson = {}
        resJson[func.msgCons.RESPONSE_EMAIL_SENT] = response
        return res.send(func.responseGenerator(resJson, ROUTER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.RESPONSE_EMAIL_SENT))
      }
    })
  })

  function validateRequestBody(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateRequestBody()', func.logCons.LOG_ENTER)
    var requestJson = req.body
    Joi.validate(requestJson, schemaForInsertion, function(err, value) {
      if (err) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error in validating insert data')
        res.status(func.httpStatusCode.BAD_REQUEST)
        res.send(func.errorsArrayGenrator(func.generateErrorArrayObject(ROUTER_CONS + func.msgCons.CODE_BAD_REQUEST, err.details[0].message), ROUTER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_ERROR_JOI_VALIDATION))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'validation result: ' + JSON.stringify(value))
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateRequestBody()', func.logCons.LOG_EXIT)
        next()
      }
    })
  }

  function validateUpdateRequestBody(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateRequestBody()', func.logCons.LOG_ENTER)
    var requestJson = req.body
    Joi.validate(requestJson, schemaForUpdation, function(err, value) {
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
}
