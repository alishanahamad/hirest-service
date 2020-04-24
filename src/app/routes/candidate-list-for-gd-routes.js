var func = require('../utils/functions')
var dbConfig = func.config.get('database')
GetCandidateList = require('../helpers/candidate-list-for-gd-helpers').GetCandidateList
var getCandidateList = new GetCandidateList()
var ROUTES_CONS = 'SS_CLFG_'

module.exports = function(app) {
  app.post(func.urlCons.URL_GET_CANDIDATE_LIST_FOR_GD, func.validateRole, function(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'get campus candidate details ', func.logCons.LOG_ENTER)
    var body = req.body;
    var urlMap = func.getUrlMap(req)
    getCandidateList.getCandidateListForGd(urlMap, body, function(error, response) {
      if (error) {
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'response while getting campus candidate details' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'Candidate details retrieved sucessfully')
        res.status(func.httpStatusCode.OK)
        return res.send(func.responseGenerator(response, ROUTES_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_CANDIDATE_LIST_RETRIVED))
      }
    })
  })
}
