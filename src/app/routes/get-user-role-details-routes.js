var func = require('../utils/functions')
var GetUserRoleDetailsHelpers = require('../helpers/get-user-role-details-helpers').GetUserRoleDetailsHelpers
var getUserRoleDetailsHelpers = new GetUserRoleDetailsHelpers()
var ROUTE_CONS = 'HS_GURDR_'

module.exports = function(app) {
  app.post(func.urlCons.URL_POST_USER_ROLE_DETAILS, func.validateRole, validateBody, function(req, res) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'getUserRoleDetails()', func.logCons.LOG_ENTER)
    var roleType = req.body[func.dbCons.FIELD_ENTITY_DETAILS_TYPE];
    var urlMap = func.getUrlMap(req)
    getUserRoleDetailsHelpers.getUserRoleDetails(urlMap, roleType, function(error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while getting user role details data ' + JSON.stringify(error))
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'response while getting user role details data ' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        res.status(func.httpStatusCode.OK)
        var resJson = {}
        resJson[func.dbCons.COLLECTION_USER_ROLE_DETAILS] = response
        resJson[func.msgCons.RESPONSE_STATUS_CODE] = func.msgCons.CODE_ASH_SUCCESS
        return res.send(func.responseGenerator(resJson, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_USER_ROLE_DETAILS))
      }
    })
  })

  function validateBody(req,res, next){
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateBody()', func.logCons.LOG_ENTER);
    var type=req.body[func.dbCons.FIELD_ENTITY_DETAILS_TYPE]
    if(type==undefined){
      var json = func.errorsArrayGenrator(generateErrorArrayObject(ROUTE_CONS+func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_ROLE_DETAILS_INVALID), func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_ROLE_DETAILS_EMPTY);
        res.status(func.getStatusCode(func.msgCons.CODE_BAD_REQUEST));
        res.send(json);
    }
    else{
      if(type.length===0 || type === "" || /^\d+$/.test(type)==true || typeof type!="object"){
        // console.log("typeof type is=================",typeof type);
        var json = func.errorsArrayGenrator(generateErrorArrayObject(ROUTE_CONS+func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_ROLE_DETAILS_INVALID), func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_ROLE_DETAILS_EMPTY);
          res.status(func.getStatusCode(func.msgCons.CODE_BAD_REQUEST));
          res.send(json);
      }
      else{
          next();
      }
    }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateBody()', func.logCons.LOG_EXIT);
  }

  function generateErrorArrayObject(code, msg) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateErrorArrayObject()', func.logCons.LOG_ENTER);
    var errorArray = [];
    errorArray.push(func.errorObjectGenrator(code, msg));
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateErrorArrayObject()', func.logCons.LOG_EXIT);
    return errorArray;
  }
}
