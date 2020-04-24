var func = require('../utils/functions')
var dbConfig = func.config.get('database')
SelectedCandidateList = require('../helpers/selected-candidate-for-gd-pi-helpers').SelectedCandidateList
var selectedCandidateList = new SelectedCandidateList()
var async = require('async')
var ROUTES_CONS = 'SS_SCFGP_'

module.exports = function(app) {
  app.post(func.urlCons.URL_POST_CANDIDATE_LIST_FOR_GD, func.validateRole, function(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'get campus candidate details ', func.logCons.LOG_ENTER)
    var body = req.body;
    var urlMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    selectedCandidateList.getCandidateListForGdPI(env, urlMap, body, function(error, response) {
      if (error) {
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'response while getting campus candidate details' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'Candidate details updated sucessfully')
        res.status(func.httpStatusCode.OK)
        return res.send(func.responseGenerator(response, ROUTES_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_CANDIDATE_LIST_UPDATED))
      }
    })
  })
}
