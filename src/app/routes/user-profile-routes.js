var func = require('../utils/functions')
UserProfileHelpers = require('../helpers/user-profile-helpers')
  .UserProfileHelpers
var userProfileHelpers = new UserProfileHelpers()
var ROUTES_CONS = 'HS_UPR_'
module.exports = function (app) {
  app.post(func.urlCons.URL_UPDATE_PROFILE,func.validateRole,validateUpdateProfileJson, function (req, res, next) {
  var urlMap = func.getUrlMap(req)
  var userCode = req.params[func.dbCons.FIELD_USER_CODE]
  userProfileHelpers.updateUserProfile(userCode, urlMap, req.body, function (error, response) {
  if (error) {
      if (response) {
        res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_UPDATE_PROFILE, func.logCons.LOG_EXIT)
        return res.send(response)
      }
      res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
      func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_UPDATE_PROFILE, func.logCons.LOG_EXIT)
      res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
    }
    else{
      res.status(func.httpStatusCode.OK)
      func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_UPDATE_PROFILE, func.logCons.LOG_EXIT)
      return res.send(func.responseGenerator(response, ROUTES_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.UPDATE_USER_DETAIL))
    }
  })
})


  function validateUpdateProfileJson (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateUpdateProfileJson()', func.logCons.LOG_ENTER)
    var upsConfig = func.config.get('ups')
    var jsonLength = Object.keys(req.body)
      .length
  if (jsonLength === 0) {
      res.status(func.httpStatusCode.BAD_REQUEST) // bad request
      return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_INVALID_REQUEST, func.msgCons.MSG_ERROR_NO_SUCH_FIELD, func.msgCons.CODE_INVALID_PARAM))
    }
    var isAllowed = upsConfig[func.configCons.FIELD_IS_ALLOWED_OR_RESTRICTED],
      jsonToUpdate = {},
      assessorJsonToUpdate = {},
      tracker = 0
    Object.keys(req.body)
      .forEach(function (key) {
        if (upsConfig[func.configCons.USER_DETAILS_FIELD].indexOf(key) > -1) {
          if (isAllowed) jsonToUpdate[func.dbCons.FIELD_PROFILE + '.' + key] = req.body[key]
        }
        else if(upsConfig[func.configCons.ASSESSOR_DETAILS_FIELD].indexOf(key) > -1){
          if (isAllowed) assessorJsonToUpdate[key] = req.body[key]
        }
        else {
          if (!isAllowed) jsonToUpdate[key] = req.body[key]
        }
        tracker++
        if (tracker === jsonLength) {
          var body = {};
          body[func.dbCons.FIELD_USER_DETAILS] = jsonToUpdate;
          body[func.dbCons.FIELD_ACCESSOR_DETAILS] = assessorJsonToUpdate
          req.body = body
          next()
        }
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateUpdateProfileJson()', func.logCons.LOG_EXIT)
  }

}
