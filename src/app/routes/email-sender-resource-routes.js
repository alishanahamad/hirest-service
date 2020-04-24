var nodemailer = require('nodemailer');
var shortid = require('shortid');
var Client = require('node-rest-client')
  .Client;
var client = new Client();
var func = require('../utils/functions');
var dbConfig = func.config.get('database');

EmailSenderResourceHelpers = require('../helpers/email-sender-resource-helpers')
  .EmailSenderResourceHelpers;
var emailSenderResourceHelpers = new EmailSenderResourceHelpers();

module.exports = function(app) {
  /**
   * [description]
   * @param  {[type]} request [description]
   * @param  {[type]} res     [description]
   * @return {[type]}         [description]
   */
  app.get(func.urlCons.URL_VERIFY_RESOURCE_ACTIVATION_CODE, function(request, res) {
    var env_org = request.params[func.urlCons.PARAM_ORG_NAME];
    var urlParam = [];
    urlParam = env_org.split('_');
    var urlMap = {};
    urlMap[func.urlCons.PARAM_ORG_NAME] = urlParam[1];
    urlMap[func.urlCons.PARAM_DOMAIN_NAME] = request.headers[func.urlCons.PARAM_DOMAIN_NAME];
    var env = urlParam[0];
    var activationCode = request.params[func.dbCons.FIELD_ACTIVATION_CODE];
    var isResetPwd = request.query[func.urlCons.PARAM_IS_RESET_PWD];
    func.printLog(func.logCons.LOG_LEVEL_INFO, "Activation code: " + activationCode);
    emailSenderResourceHelpers.verifyResourceActivationCode(activationCode, isResetPwd, urlMap, env, function(err, result) {
      if (err) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, err);
        res.status(func.getStatusCode(result[func.msgCons.RESPONSE_STATUS_CODE]));
        return res.send(result);
      } else {
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'Activation code =' + JSON.stringify(result));
        res.status(func.httpStatusCode.OK);
        res.redirect(result);
      }
    });
  });
};
