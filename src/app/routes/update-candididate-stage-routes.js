var func = require('../utils/functions');
var dbConfig = func.config.get('database');
UpdateCandidateStage = require('../helpers/update-candididate-stage-helpers').UpdateCandidateStage;
var updateCandidateStage = new UpdateCandidateStage();
const ROUTER_CONS = "HS_UCS_";
var Joi = require('joi')

module.exports = function(app) {
  var schemaForChangeCandidateLevel = Joi.object().keys({
    candidate_id: Joi.any().required(),
    stage: Joi.any().required()
  });

  function validateCandidateJson(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateCandidateJson()', func.logCons.LOG_ENTER)
    var validCandidateJson = Joi.validate(req.body, schemaForChangeCandidateLevel)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateCandidateJson =' + JSON.stringify(validCandidateJson))
    if (validCandidateJson[func.msgCons.PARAM_ERROR] !== null) {
      var invalidLevelResponse = func.generateErrorArrayObject(ROUTER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_ERROR_INVALID_REQUEST)
      res.status(func.httpStatusCode.BAD_REQUEST)
      res.send(func.errorsArrayGenrator(invalidLevelResponse, ROUTER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_ERROR_INVALID_REQUEST))
    } else {
      req.body = validCandidateJson[func.dbCons.FIELD_VALUE]
      next()
    }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateCandidateJson()', func.logCons.LOG_EXIT)
  }
  app.post(func.urlCons.URL_POST_CHANAGE_STAGE_FOR_CANDIDATE, validateCandidateJson, func.validateRole, function(req, res) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_CHANAGE_STAGE_FOR_CANDIDATE, func.logCons.LOG_ENTER);
    var urlMap = func.getUrlMap(req);
    updateCandidateStage.updateStageForCandidate(req.body, urlMap, function(error, response) {
      if (error) {
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'response while getting update candidate details' + JSON.stringify(response));
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]));
          return res.send(response);
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR);
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER));
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Update Candidate Stage');
        res.status(func.httpStatusCode.OK);
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_ASSESSMENT_DETAILS, func.logCons.LOG_EXIT);
        return res.send(func.responseGenerator(response, ROUTER_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_SUCCESS_FETCHED_DATA));
      }
    });
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_CHANAGE_STAGE_FOR_CANDIDATE, func.logCons.LOG_EXIT);
  });


};
