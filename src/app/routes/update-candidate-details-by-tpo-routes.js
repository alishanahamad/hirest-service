var func = require('../utils/functions')
var UpdateCandidateDetailsByTpoHelper = require('../helpers/update-candidate-details-by-tpo-helpers').UpdateCandidateDetailsByTpoHelper
var updateCandidateDetailsByTpoHelper = new UpdateCandidateDetailsByTpoHelper()

var ROUTE_CONS = 'HS_UCDBTR_'

module.exports = function(app) {
  app.post(func.urlCons.URL_POST_REASON_FOR_UNAVAIBILITY_OF_CANDIDATE_DETAILS, func.validateRole, validateBody, function(req, res) {
    var personId = req.params[func.dbCons.FIELD_PERSON_ID]
    var reasonForNotAppearing = req.body[func.dbCons.FIELD_REASON]
    var urlMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    updateCandidateDetailsByTpoHelper.updateCandidateReason(personId, urlMap, reasonForNotAppearing, function(error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while inserting reason of unavailibility of candidate ' + JSON.stringify(error))
        if (response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'response while inserting reason ' + JSON.stringify(response))
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]))
          return res.send(response)
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        res.status(func.httpStatusCode.OK)
        var resJson = {}
        resJson[func.dbCons.COLLECTION_CANDIDATE_DETAILS] = response
        resJson[func.msgCons.RESPONSE_STATUS_CODE] = func.msgCons.CODE_ASH_SUCCESS
        return res.send(func.responseGenerator(resJson,ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_UPDATE_CANDIDATE_DETAILS))
      }
    })
  });


  function validateBody(req,res, next){
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateBody()', func.logCons.LOG_ENTER);
    var reason=req.body[func.dbCons.FIELD_REASON]
    if(reason==undefined){
      var json = func.errorsArrayGenrator(generateErrorArrayObject(ROUTE_CONS+func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_REASON_NOT_CORRECT), func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_YOU_HAVE_NOT_ENTERED_ANY_REASON);
				res.status(func.getStatusCode(func.msgCons.CODE_BAD_REQUEST));
				res.send(json);
    }
    else{
      if(reason === ""){
        var json = func.errorsArrayGenrator(generateErrorArrayObject(ROUTE_CONS+func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_REASON_NOT_CORRECT), func.msgCons.CODE_BAD_REQUEST, func.msgCons.MSG_YOU_HAVE_NOT_ENTERED_ANY_REASON);
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

  app.post(func.urlCons.URL_POST_SEND_EMAIL_TO_ADMIN_FOR_HIRE_CANDIDATE,func.validateRole, async function (req, res, next) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_SEND_EMAIL_TO_ADMIN_FOR_HIRE_CANDIDATE, func.logCons.LOG_ENTER)
  const orgNameMap = func.getUrlMap(req)
  const env = req.query[func.urlCons.PARAM_ENV]
  var userCode = req.headers[func.dbCons.FIELD_USER_CODE]
  try {
   func.printLog(func.logCons.LOG_LEVEL_INFO, `send email to admin for hire candidate`)
   const results = await updateCandidateDetailsByTpoHelper.sendMailToAdminForHireCandidate(userCode,req.body, orgNameMap, env)
   res.status(func.httpStatusCode.OK).send(func.responseGenerator(results, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
   next()
  } catch (err) {
   res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
   next()
  }
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_SEND_EMAIL_TO_ADMIN_FOR_HIRE_CANDIDATE, func.logCons.LOG_EXIT)
  })
}
