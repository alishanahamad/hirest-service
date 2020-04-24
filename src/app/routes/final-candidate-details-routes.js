var func = require('../utils/functions')
var FinalCandidateDetailsHelpers = require('../helpers/final-candidate-details-helpers').FinalCandidateDetailsHelpers
var finalCandidateDetailsHelpers = new FinalCandidateDetailsHelpers()
var Joi = require('joi')

var schemaForInsertion = Joi.object().keys({
  designation: Joi.string().required(),
  location: Joi.string().required(),
  round_type: Joi.string().required(),
})

module.exports = function (app) {
  app.post(func.urlCons.URL_POST_FINAL_CANDIDATE_DETAILS, validateGetBody, function (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_POST_FINAL_CANDIDATE_DETAILS, func.logCons.LOG_ENTER)
    var orgNameMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    var userCode = req.headers[func.urlCons.PARAM_USER_CODE]
    finalCandidateDetailsHelpers.getFinalCandidateDetails(req.body, userCode, orgNameMap, env, function (error, response) {
      if (error) {
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching final candidates list for userCode = ' + userCode + ' Error = ' + JSON.stringify(response))
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

function validateGetBody (req, res, next){
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateGetBody()', func.logCons.LOG_ENTER);
  var requestJson = req.body
  Joi.validate(requestJson, schemaForInsertion, function (err, value) {
    if (err) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error in validating insert data')
      res.status(func.httpStatusCode.BAD_REQUEST)
      res.send(func.errorsArrayGenrator(func.generateErrorArrayObject(ROUTER_CONS + func.msgCons.CODE_BAD_REQUEST, err.details[0].message), ROUTER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_ERROR_JOI_VALIDATION))
    } else {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'validation result: ' + JSON.stringify(value))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateGetBody()', func.logCons.LOG_EXIT)
      next()
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateGetBody()', func.logCons.LOG_EXIT);
}
