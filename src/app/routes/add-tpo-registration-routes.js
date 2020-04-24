/**
 * The <code>group-assigned-name-routes.js</code>
 * @author  ekta kakdia
 */
const func = require('../utils/functions');
AddRegisterHelper = require('../helpers/add-tpo-registration-helpers').AddRegisterHelper
var addRegisterHelper = new AddRegisterHelper()
var async = require('async')
var ROUTES_CONS = 'SS_ATR_'
/**
 * [adding tpo registration api]
 * @param  {[type]} app [description]
 * @return {[payload]}     [https://jsoneditoronline.org/?id=284583aeb8334aaf94eb13b6a44f9ec9]
 */
module.exports = function (app) {
  app.post(func.urlCons.URL_POST_ADD_TPO_REGISTER_DETAILS, async function (req, res) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_ADD_TPO_REGISTER_DETAILS, func.logCons.LOG_ENTER)
    const orgNameMap = func.getUrlMap(req)
    const env = req.query[func.urlCons.PARAM_ENV]
    try {
      func.printLog(func.logCons.LOG_LEVEL_INFO, ` update tpo user details`)
      const results = await addRegisterHelper.AddTPORegister(req.body, orgNameMap, env)
      if(results.data.length === 0){
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(func.responseGenerator(results.data, HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, results.message))
      }else {
        res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, results.message))
      }
    } catch (err) {
      res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
    }
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_ADD_TPO_REGISTER_DETAILS, func.logCons.LOG_EXIT)
  })
}
