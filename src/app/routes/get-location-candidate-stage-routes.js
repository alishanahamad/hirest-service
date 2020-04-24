var func = require('../utils/functions');
GetLocationCandidateStageHelpers = require('../helpers/get-location-candidate-stage-helpers').GetLocationCandidateStageHelpers;
var getLocationCandidateStageHelper = new GetLocationCandidateStageHelpers();
var ROUTE_CONS = 'HS_GLCSR_'
var Joi = require('joi')

var schemaForInsertion = Joi.object().keys({
  designation: Joi.string().required(),
  status: Joi.string().regex(/^[-0-9]*$/).required(),
  round_type: Joi.string().required(),
})


module.exports = function(app) {
  app.post(func.urlCons.URL_GET_LOCATION_CANDIDATE_STAGE,validateGetBody, function(req, res) {
    var designation = req.body[func.dbCons.FIELD_DESIGNATION]
    var status = req.body[func.dbCons.FIELD_STATUS]
    var round_type = req.body[func.dbCons.FIELD_ROUND_TYPE]
    var urlMap = func.getUrlMap(req)
    getLocationCandidateStageHelper.getLocation(urlMap, designation, status,round_type, function(error, response) {
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
        return res.send(func.responseGenerator(response, ROUTE_CONS+func.msgCons.CODE_SERVER_OK,func.msgCons.SUCCESS_MSG_DATA_RETRIEVED))
      }
    })
  })
  function validateGetBody(req,res, next){
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
}
