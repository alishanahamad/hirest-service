'use strict'
/**
 * @author Alishan Ahamad
 */

var func = require('../utils/functions')
var GetOfferLetterHelper = require('../helpers/offer-letter-helpers').OfferLetterHelper
var getOfferLetterHelper = new GetOfferLetterHelper()
var ROUTE_CONS = 'HS_OLR'

module.exports = function(app) {
  /**
   * @api {post} /hirest/v1/sendJoiningInstructionMail
   * @apiName SEND JOINGING INSTRUCTION MAIL TO TPO
   * @apiVersion 1.0.0
   */
  app.post(func.urlCons.URL_SEND_JOINING_INSTRUCTION_MAIL_TO_TPO, function(req, res, next) {
    var urlMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    var body = req.body
    var candidateID = body.candidateID
    getOfferLetterHelper.sendInstructionMail(candidateID, body, env, urlMap, function(error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching details ' + JSON.stringify(error))
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'response while sending notification mail to Admin ' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(ROUTE_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        res.status(func.httpStatusCode.OK)
        return res.send(response)
      }
    })
  })
}
