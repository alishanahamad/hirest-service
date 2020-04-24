var func = require('../utils/functions');
var dbConfig = func.config.get('database');
GetCandidateDetailsList = require('../helpers/candidate-details-list-helpers').GetCandidateDetailsList;
var getCandidateDetailsList = new GetCandidateDetailsList();
var async = require('async');
var ROUTES_CONS = 'SS_CDL_';

module.exports = function(app) {
  ////////Add Register
  app.post(func.urlCons.URL_GET_CANDIDATE_DETAILS_DETAILS,func.validateRole, function(req, res, next) {
    var urlMap = func.getUrlMap(req);
    getCandidateDetailsList.getCandidateDetails(urlMap, req.body, function(error, response) {
      if (error) {
        if (response) {
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]));
          return res.send(response);
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR);
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER));
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Candidate details retrieved successfully');
        res.status(func.httpStatusCode.OK);
        return res.send(func.responseGenerator(response, ROUTES_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_CANDIDATE_DETAILS_RETRIEVED));
      }
    });
  });
};
