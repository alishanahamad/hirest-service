var func = require('../utils/functions');
EmailVerificationHelpers = require('../helpers/email-verification-helpers')
	.EmailVerificationHelpers;
var emailVerificationHelpers = new EmailVerificationHelpers();
LDAPHelpers = require('../helpers/ldap-helper')
	.LdapHelpers;
var ldaphelpers = new LDAPHelpers();
ApiToken = require('../helpers/api-token')
	.apiToken;
var apiSecurityHelper = new ApiToken();

Rolehelpers = require('../helpers/role-helpers')
	.Rolehelpers;
var rolehelpers = new Rolehelpers();

module.exports = function(app) {
	app.post(func.urlCons.URL_LDAP_LOGIN, func.validateRole, function(req, res, next) {
			var body = req.body;
			var orgName = req.headers[func.urlCons.PARAM_ORG_NAME] + '_' + req.headers[func.urlCons.PARAM_DOMAIN_NAME];
			var userDetails = {
				email: body.email,
				password: body.password,
				ou: orgName
			};
			ldaphelpers.ldapAuthentication(userDetails, function(error, resp) {
				func.printLog(func.logCons.LOG_LEVEL_ERROR, func.msgCons.MSG_ERROR_LDAP_AUTHENTICATION + error);
				if (error) {
					if (error === 1) {
						res.status(func.httpStatusCode.OK);
						return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_INVALID_USER_CREDENTIAL, func.msgCons.MSG_ERROR_INVALID_USER_CREDENTIAL, func.msgCons.CODE_INVALID_USER_CREDENTIAL));
					}
					res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR);
					return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, 'a18107'));
				}
				func.printLog(func.logCons.LOG_LEVEL_INFO, func.msgCons.MSG_LDAP_AUTHENTICATION_SUCCESS + body.email);
				next();
			});
		}, checkEmailVerification,
		checkUserAuthentication, addRoleDetails);
};

function checkEmailVerification(req, res, next) {
	var email = req.body[func.dbCons.FIELD_EMAIL];
  var isResource = req.query[func.urlCons.PARAM_IS_RESOURCE];
	var urlMap = func.getUrlMap(req);
  emailVerificationHelpers.checkUserEmailStatus(email, urlMap, isResource, function(error, verified) {
		if (error) {
			func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while email verification=' + error);
			res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR);
			return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, 'a18107'));
		}
		verified = func.convertIntoArray(verified);
		if (verified.length === 0) {
			func.printLog(func.logCons.LOG_LEVEL_INFO, func.msgCons.MSG_ERROR_ACCOUNT_NOT_ACTIVETED + email);
			res.status(func.httpStatusCode.OK);
      			return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_ACCOUNT_NOT_ACTIVETED, func.msgCons.MSG_DESC_PLZ_ACTIVAT_BY_EMAIL, func.msgCons.CODE_INACTIVE_EMAIL));
    			} else {
      			if (isResource) {
        			func.printLog(func.logCons.LOG_LEVEL_INFO, 'email verification successful for resource, email=' +
          			email + ' resource id = ' + verified[0][func.dbCons.FIELD_RESOURCE_ID] + ' email verified=' + verified[0][func.dbCons.FIELD_EMAIL_VERIFIED]);
        		if (verified[0][func.dbCons.FIELD_EMAIL_VERIFIED])
          			req.body[func.dbCons.FIELD_USER_CODE] = verified[0][func.dbCons.FIELD_RESOURCE_ID];
        		else
			return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_ACCOUNT_NOT_ACTIVETED, func.msgCons.MSG_DESC_PLZ_ACTIVAT_BY_EMAIL, func.msgCons.CODE_INACTIVE_EMAIL));
		} else {
			func.printLog(func.logCons.LOG_LEVEL_INFO, 'email verification successful for user, email=' +
				email + ' code=' + verified[0][func.dbCons.FIELD_USER_CODE] + ' email verified=' + verified[0][func.dbCons.FIELD_EMAIL_VERIFIED]);
			if (verified[0][func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_EMAIL_VERIFIED])
				req.body[func.dbCons.FIELD_USER_CODE] = verified[0][func.dbCons.FIELD_USER_CODE];
			else
				return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_ACCOUNT_NOT_ACTIVETED, func.msgCons.MSG_DESC_PLZ_ACTIVAT_BY_EMAIL, func.msgCons.CODE_INACTIVE_EMAIL));
      }
			next();
		}
	});
}

function checkUserAuthentication(req, res, next) {
	var email = req.body[func.dbCons.FIELD_EMAIL];
	var urlMap = func.getUrlMap(req);
	var orgName = urlMap[func.urlCons.PARAM_ORG_NAME];
	var env = req.query[func.urlCons.PARAM_ENV];
	var userCode = req.body[func.dbCons.FIELD_USER_CODE];
	apiSecurityHelper.apiSecurityToken(userCode, env, urlMap,
		function(data) {
			if (data[func.msgCons.PARAM_ERROR_STATUS]) {
				func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while access token genration for user, email=' + email + 'code=' + userCode);
				res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR);
				return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, 'a18107'));
			} else {
				// var responseJson = func.errorResponseGenrator(func.msgCons.AUTHENTICATION_SUCCESS, userCode, func.msgCons.CODE_AUTHENTICATED, false);
				func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'token= ' + data[func.urlCons.PARAM_ACCESS_TOKEN]);
				// responseJson[func.urlCons.PARAM_ACCESS_TOKEN] = data[func.urlCons.PARAM_ACCESS_TOKEN];
				func.printLog(func.logCons.LOG_LEVEL_INFO, 'Authentication successful for user, email=' + email + ' code=' + userCode);
				res.setHeader(func.urlCons.PARAM_AUTHORIZATION, data[func.urlCons.PARAM_ACCESS_TOKEN]);
				// res.send(responseJson);
				next();
			}
		});
}

function addRoleDetails(req, res, next) {
	var resourceId = req.body[func.dbCons.FIELD_USER_CODE];
	var urlMap = func.getUrlMap(req);
	rolehelpers.assignRole(resourceId, false, urlMap, function(error, roleName, actions) {
		if (error) return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, 'A18407'));
		func.printLog(func.logCons.LOG_LEVEL_INFO, 'user role =' + roleName);
		func.printLog(func.logCons.LOG_LEVEL_INFO, 'role actions=' + JSON.stringify(actions));
		var userData = {};
		userData[func.dbCons.FIELD_USER_CODE] = req.body[func.dbCons.FIELD_USER_CODE];
		userData[func.dbCons.FIELD_ROLE_NAME] = roleName;
		userData[func.dbCons.FIELD_PERMISSION] = actions;
		var dataJson = {};
		dataJson[func.dbCons.COLLECTION_USER_DETAILS] = userData;
		var responseJson = func.responseGenerator(dataJson, 'AS_LLR_200', 'You are login successfully in the system!');
		res.setHeader(func.dbCons.FIELD_ROLE_NAME, roleName);
		res.send(responseJson);
	});
}
