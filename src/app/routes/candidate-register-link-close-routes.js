'use strict'
const func = require('../utils/functions')
const CandidateRegisterLinkCloseHelpers = require('../helpers/candidate-register-link-close-helpers.js').CandidateRegisterLinkCloseHelpers
const candidateRegisterLinkCloseHelpers = new CandidateRegisterLinkCloseHelpers()
const ROUTE_CONS = 'CS_CRLC';
module.exports = function(app){
  app.get(func.urlCons.URL_CANDIATE_REGISTRATION_DEACTIVATE_LINK, async function(req,res){
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_CANDIATE_REGISTRATION_DEACTIVATE_LINK, func.logCons.LOG_ENTER)
    const orgNameMap = func.getUrlMap(req)
    const campusDriveId = req.params[func.dbCons.CAMPUS_SOURCE_DETAILS_CAMPUS_ID]
    try{
      func.printLog(func.logCons.LOG_LEVEL_INFO, `get candidate register link close routes`)
      const results = await candidateRegisterLinkCloseHelpers.candidateRegisterInfo(campusDriveId, orgNameMap)
      res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.status_message, []))
    }catch(err){
      console.log("vvvvvvvvvvv",err);
      func.printLog(func.logCons.LOG_LEVEL_ERROR, `err = ${JSON.stringify(err)}`)
      res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(func.errorsArrayGenrator(err, ROUTE_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_SERVER_ERROR, err.data))
    }
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_CANDIATE_REGISTRATION_DEACTIVATE_LINK, func.logCons.LOG_EXIT)

  })
}
