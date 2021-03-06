var func = require('../utils/functions')
var dbConfig = func.config.get('database')
GetTPOUserDetails = require('../helpers/get-tpo-user-details-helpers').GetTPOUserDetails
var getTPOUserDetails = new GetTPOUserDetails()
var async = require('async')
var ROUTES_CONS = 'SS_CDL_'

module.exports = function (app) {
  app.get(func.urlCons.URL_GET_TPO_USER_DETAILS_DETAILS, func.validateRole, function (req, res, next) {
    var userCode = req.params[func.dbCons.FIELD_USER_CODE]
    var urlMap = func.getUrlMap(req)
    getTPOUserDetails.getTPODetails(urlMap, userCode, function (error, response) {
      if (error) {
        if (response) {
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'TPO User retrieved successfully')
        res.status(func.httpStatusCode.OK)
        return res.send(func.responseGenerator(response, ROUTES_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_TPO_USER_RETRIEVED))
      }
    })
  })
}
