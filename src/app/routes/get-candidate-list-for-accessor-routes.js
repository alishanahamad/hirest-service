var func = require('../utils/functions')
var dbConfig = func.config.get('database')
GetCandidateListForAssessor = require('../helpers/get-candidate-list-for-accessor-helpers').GetCandidateListForAssessor
var getCandidateListForAssessor = new GetCandidateListForAssessor()
var async = require('async')
var ROUTES_CONS = 'SS_CLFA_'
LdapHelpers = require('../helpers/ldap-helper').LdapHelpers
var ldaphelpers = new LdapHelpers()
EmailVerificationHelpers = require('../helpers/email-verification-helpers').EmailVerificationHelpers
var emailVerificationHelpers = new EmailVerificationHelpers()
var configJson = func.config.get('mail_domains')


module.exports = function(app) {
  app.post(func.urlCons.URL_POST_CANDIDATE_LIST_FOR_ASSESSOR, func.validateRole, function(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'get candidate details for accessor ', func.logCons.LOG_ENTER)
    var urlMap = func.getUrlMap(req)
    getCandidateListForAssessor.getCandidateList(req, urlMap, function(error, response) {
      if (error) {
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'response while getting campus candidate details' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'User details retrieved sucessfully')
        res.status(func.httpStatusCode.OK)
        return res.send(func.responseGenerator(response, ROUTES_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_CANDIDATE_DETAILS_RETRIEVED))
      }
    })
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'get candidate details for accessor ', func.logCons.LOG_EXIT)
  })
}
