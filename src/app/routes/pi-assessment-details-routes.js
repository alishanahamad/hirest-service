var func = require('../utils/functions')
var PiAssessmentDetailsHelpers = require('../helpers/pi-assessment-details-helpers').PiAssessmentDetailsHelpers
var piAssessmentDetailsHelpers = new PiAssessmentDetailsHelpers()
var ROUTE_CONS = 'HS_PAR_'
var Joi = require('joi')

/**
 * [schemaForInsertion description]
 * @type {[type]}
 */
var schemaForUpdation = Joi.object().keys({
  pi_assessment_type: Joi.number().integer().required(),
  pi_location: Joi.string().required(),
  status: Joi.string().regex(/^[a-zA-Z0-9-_ ]*$/).required(),
  candidate_ids: Joi.array().items(Joi.number().integer().required()).min(1).required()
})

/**
 * [schemaForInsertion description]
 * @type {[type]}
 */
var schemaForUpdationCandidateDetails = Joi.object().keys({
  candidate_details: Joi.array().items(
    Joi.object().keys({
      candidate_id: Joi.number().integer().required(),
      pi_assessment_details_id: Joi.number().integer().required(),
      status: Joi.string().required(),
      pi_candidate_sequence: Joi.number().integer()
    })
  ).min(1).required()
})


module.exports = function(app) {
  app.post(func.urlCons.URL_POST_UPDATE_PI_ASSESSMENT_DETAILS, func.validateRole, function(req, res, next) {
    var urlMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV];
    piAssessmentDetailsHelpers.updatePiAssessmentDetails(req.body, urlMap, function(error, response) {
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

  app.post(func.urlCons.URL_POST_UPDATE_PI_ASSESSMENT_STATUS, func.validateRole,validateUpdateRequestBody, function(req, res, next) {
    var urlMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV];
    piAssessmentDetailsHelpers.updatePiAssessmentStatus(req.body, urlMap, function(error, response) {
      if (error) {
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'response while updating pi assessment status for selected candidates ' + JSON.stringify(response))
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

  app.post(func.urlCons.URL_POST_ADD_PI_CANDIDATE, func.validateRole, function(req, res, next) {
    var urlMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    let userCode = req.headers[func.urlCons.PARAM_USER_CODE]
    piAssessmentDetailsHelpers.addPICandidates(userCode , urlMap, req.body, env, function(error, response) {
      if (error) {
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'response while updating pi assessment status for selected candidates ' + JSON.stringify(error))
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

  /**
   * @api {post} /hirest/v1/updateCandidatePiStatusAbsents
   * @apiName UPDATE CANDIDATE STAGE BASED ON CANDIDATE_ID AND PI_ASSESSMENT_DETAIL_ID
   * @apiVersion 1.0.0
   */
  app.post(func.urlCons.URL_POST_UPDATE_PI_CANDIDATE_DETAILS, func.validateRole,validateUpdateCandidateRequestBody, async function (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_UPDATE_PI_DETAILS, func.logCons.LOG_ENTER)
    const orgNameMap = func.getUrlMap(req)
    const env = req.query[func.urlCons.PARAM_ENV]
    try {
      func.printLog(func.logCons.LOG_LEVEL_INFO, ` update candidate pi stage where request json is = ${req}`)
      const results = await piAssessmentDetailsHelpers.finalizeCandidateForPi(req.body, orgNameMap, env)
      res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
      next()
    } catch (err) {
      res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
      next()
    }
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_UPDATE_PI_CANDIDATE_DETAILS, func.logCons.LOG_EXIT)
  })
}



function validateUpdateRequestBody (req, res, next) {
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

function validateUpdateCandidateRequestBody (req, res, next) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateUpdateCandidateRequestBody()', func.logCons.LOG_ENTER)
  var requestJson = req.body
  Joi.validate(requestJson, schemaForUpdationCandidateDetails, function (err, value) {
    if (err) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error in validating update data')
      res.status(func.httpStatusCode.BAD_REQUEST)
      res.send(func.errorsArrayGenrator(func.generateErrorArrayObject(ROUTER_CONS + func.msgCons.CODE_BAD_REQUEST, err.details[0].message), ROUTER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_ERROR_JOI_VALIDATION))
    } else {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'validation result: ' + JSON.stringify(value))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateUpdateCandidateRequestBody()', func.logCons.LOG_EXIT)
      next()
    }
  })
}
