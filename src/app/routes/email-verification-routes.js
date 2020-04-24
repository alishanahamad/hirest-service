var nodemailer = require('nodemailer');
var shortid = require('shortid');
var func = require('../utils/functions');
// var smtp = func.config.get('smtp');
// var config = func.config.get('front_end');
var dbConfig = func.config.get('database');
EmailVerificationHelpers = require('../helpers/email-verification-helpers')
	.EmailVerificationHelpers;
var emailVerificationHelpers = new EmailVerificationHelpers();
CandidateRegisterHelpers = require('../helpers/candidate-registration-helpers').CandidateRegisterHelpers;
var candidateRegisterHelpers = new CandidateRegisterHelpers();

module.exports = function(app) {
	app.get(func.urlCons.URL_VERIFY_ACTIVATION_CODE, func.validateRole, function(req, res) {
		var org = func.getOrgName(req, 2);
		var orgName = org[1];
		var isResetPwd = req.query[func.urlCons.PARAM_IS_RESET_PWD];
		var urlMap = {};
		urlMap[func.urlCons.PARAM_ORG_NAME] = orgName;
		urlMap[func.urlCons.PARAM_DOMAIN_NAME] = req.headers[func.urlCons.PARAM_DOMAIN_NAME];
		var env = org[0];
		var mailRes = {};
		func.printLog(func.logCons.LOG_LEVEL_DEBUG, "Domain is matched. Information is from Authentic email");
		var activationCode = req.params.activation_code;
		// function for finding userCode from activation code
		emailVerificationHelpers.findUserCode(activationCode, urlMap, function(error, resp) {
			if (error) { // error in finding user code from activation_code_detail
				mailRes = func.errorResponseGenrator('invalid activationCode', 'error in finding user code from activation_code_detail', 'a18010');
				res.status(func.httpStatusCode.BAD_REQUEST);
				return res.send(mailRes);
			}
			if (resp.length !== 0) {
				var ex_date = new Date(resp.activation_code_expiry_time);
				var current_date = new Date();
				func.printLog(func.logCons.LOG_LEVEL_DEBUG, "time difference :" + ex_date - current_date);
				if ((ex_date - current_date) > 0) {
					emailVerificationHelpers.updateUserDetails(resp.user_code, urlMap, function(error, response) {
						if (error) { // data aren't updated in user detail
							res.status(func.httpStatusCode.BAD_REQUEST);
							return res.send("user detail is not updated");
						}
						func.printLog(func.logCons.LOG_LEVEL_INFO, "data are updated in user detail");
						var path = '';
						if (isResetPwd)
							path = config[func.configCons.FIELD_PATH][urlMap[func.urlCons.PARAM_DOMAIN_NAME]] + config[func.configCons.FIELD_PWD_RESET_PAGE][urlMap[func.urlCons.PARAM_DOMAIN_NAME]] + '?ac=' + activationCode + '&&is_resource=false';
						else
							path = config[func.configCons.FIELD_PATH][urlMap[func.urlCons.PARAM_DOMAIN_NAME]] + config[func.configCons.FIELD_LOGIN_PAGE][urlMap[func.urlCons.PARAM_DOMAIN_NAME]];
						var redirectLogInUrl = func.generateUrl(config[func.configCons.FIELD_PROTOCOL], config[func.configCons.FIELD_HOST], config[func.configCons.FIELD_PORT], env, urlMap, path);
						res.redirect(redirectLogInUrl);
					});
				}
			} else { // invalid activation code - user code can be found associated with requested activation code
				mailRes = func.errorResponseGenrator('invalid activation code', 'user code can be found associated with requested activation code', 'a18011', true);
				res.status(func.httpStatusCode.BAD_REQUEST);
				res.send(mailRes);
			}
		});
	});

	app.post(func.urlCons.URL_VERIFY_UNIQUE_EMAIL, func.validateRole, function(req, res) {
		//var orgName = req.headers[func.urlCons.PARAM_ORG_NAME];
		var urlMap = func.getUrlMap(req);
		var env = req.query[func.urlCons.PARAM_ENV];
		var isResource = req.query.is_resource;
		var responseJson = {};
		emailVerificationHelpers.findUniqueUser(req.body.email, isResource, urlMap, function(error, response) {
			response = func.convertIntoArray(response);
			if (isResource) {
				// resources response handle
				if (response.length === 0) {
					responseJson = func.errorResponseGenrator('unique resource', 'unique resource', 'a18101', true);
				} else {
					responseJson = func.errorResponseGenrator('registered resource', 'registered resource', 'a18103', false);
				}
			} else {
				if (response.length === 0) { // unique email
					responseJson = func.errorResponseGenrator('unique user', func.msgCons.MSG_UNIQUE_EMAIL, 'a18101', false);
				} else if (response.length === 1) { // email is not unique
					if (response[0].profile_data.identities[0].isSocial === true) { // social account
						responseJson = func.errorResponseGenrator('You may have already registered with either google or facebook account', 'You may have already registered with either google or facebook account.', 'a18102');
					} else if (response[0].profile_data.identities[0].isSocial === false) { // user registered with our app
						responseJson = func.errorResponseGenrator(func.msgCons.MSG_NOT_UNIQUE_EMAIL, 'descrption will be added soon', 'a18103');
					}
				} else { // multiple social accounts
					responseJson = func.errorResponseGenrator('You may have already registered with google and facebook account', 'You may have already registered with google and facebook account', 'a18104');
				}
			}
			res.send(responseJson);
		});
	});

	app.post(func.urlCons.URL_FORGOT_PASSWORD, func.validateRole, function(req, response) {
		//var orgName = req.headers[func.urlCons.PARAM_ORG_NAME];
		var urlMap = func.getUrlMap(req);
		var responseJson = {};
		var env = req.query[func.urlCons.PARAM_ENV];
		var isResource = req.query[func.urlCons.PARAM_IS_RESOURCE];
		var isSocialDisable = req.query[func.urlCons.PARAM_IS_SOCIAL_DISABLE];
		var surveyMode = req.query[func.urlCons.PARAM_SURVEY_MODE];
		emailVerificationHelpers.forgotPassword(req.body.email, env, isResource, urlMap, isSocialDisable, surveyMode, function(err, res) {
			if (err) {
				responseJson = func.errorResponseGenrator(func.msgCons.MSG_ERROR_FORGOT_PASS, func.msgCons.MSG_ERROR_FORGOT_PASS, 'a18031');
				response.status(func.httpStatusCode.BAD_REQUEST);
				return response.send(responseJson);
			}
			responseJson = func.errorResponseGenrator(res, func.msgCons.MSG_EMAIL_SENT, 'a18032', false);
			response.status(func.httpStatusCode.OK);
			return response.send(responseJson);
		});
	});

	app.post(func.urlCons.URL_RESET_PASSWORD, func.validateRole, function(req, res) {
		//var orgName = req.headers[func.urlCons.PARAM_ORG_NAME];
		var urlMap = func.getUrlMap(req);
		var env = req.query[func.urlCons.PARAM_ENV];
		var isResource = req.query[func.urlCons.PARAM_IS_RESOURCE];
		func.printLog(func.logCons.LOG_LEVEL_DEBUG, "org name from reset password param is=" + urlMap[func.urlCons.PARAM_ORG_NAME]);
		emailVerificationHelpers.resetPassword(req.body, isResource, urlMap, function(err, response) {
			if (err) {
				res.status(func.httpStatusCode.BAD_REQUEST);
				responseJson = func.errorResponseGenrator(err, 'Error occured while reseting password. Please try again', 'a18033');
				return res.send(responseJson);
			}
			responseJson = func.errorResponseGenrator(func.msgCons.MSG_PWD_CHANGED, func.msgCons.MSG_PWD_CHANGED, func.msgCons.CODE_PWD_CHANGED, false);
			res.status(func.httpStatusCode.OK);
			res.send(responseJson);
		});
	});

	app.post(func.urlCons.URL_RESEND_EMAIL, func.validateRole, function(req, res) {
		//var orgName = req.headers[func.urlCons.PARAM_ORG_NAME];
		var urlMap = func.getUrlMap(req);
		var env = req.query[func.urlCons.PARAM_ENV];
		emailVerificationHelpers.resendEmail(req.body[func.dbCons.FIELD_EMAIL], env, urlMap, function(err, response) {
			if (err) {
				responseJson = func.errorResponseGenrator(err, func.msgCons.MSG_ERROR_EMAIL_NOT_SENT, 'a18035');
				res.status(func.httpStatusCode.BAD_REQUEST);
				return res.send(responseJson);
			}
			responseJson = func.errorResponseGenrator(func.msgCons.MSG_EMAIL_SENT, func.msgCons.MSG_EMAIL_SENT, func.msgCons.CODE_EMAIL_SENT, false);
			res.status(func.httpStatusCode.OK);
			res.send(responseJson);
		});
	});
};
