var func = require('../utils/functions');
var fs = require('fs');
var support;

var DbOperation = require('./db-operations').DbOperation;
var dbOp = new DbOperation();

var dateFormat = require('dateformat');

function Rolehelpers() {
	func.printLog(func.logCons.LOG_LEVEL_INFO, 'obj created of role helpers');
}

Rolehelpers.prototype.assignRole = function(userCode, isResource, urlMap, callbackForUserRole) {
	func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'assignRole()', func.logCons.LOG_ENTER);
	var orgName = urlMap[func.urlCons.PARAM_ORG_NAME];
	func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' userCode=' + userCode + 'isResource =' + isResource + 'orgName' + orgName);
	var userRole;
	var actions;
	dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, generateQueryForRole(userCode, isResource)), urlMap, func.dbCons.COLLECTION_USER_ROLE_DETAILS,
		function(error, roleDetails) {
			func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error in assigning role = ' + JSON.stringify(error));
			if (error) {
				return callbackForUserRole(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER));
			} else if (roleDetails === undefined || roleDetails.length === 0) {
				func.printLog(func.logCons.LOG_LEVEL_INFO, 'user id ' + userCode + ' is a ' + func.dbCons.VALUE_APP_USER);
				userRole = func.dbCons.VALUE_APP_USER;
				getActionData(userRole, urlMap, function(error, actions){
					return callbackForUserRole(null, userRole, actions);
				});
			} else if (roleDetails.length > 1) {
				func.printLog(func.logCons.LOG_LEVEL_ERROR, 'More than one role found!!');
				return callbackForUserRole("More than one role found!!");
			} else {
				var newDate = dateFormat(new Date(), func.dbCons.FIELD_LIGHTBLUE_DATE_FORMAT);
				if (newDate >= roleDetails[func.dbCons.FIELD_EFFECTIVE_DATE_FROM] && newDate <= roleDetails[func.dbCons.FIELD_EFFECTIVE_DATE_TO]) {
					func.printLog(func.logCons.LOG_LEVEL_INFO, 'logged in users role details = ' + JSON.stringify(roleDetails));
					var definedRoleName = getRoleNameFromEnum(roleDetails[func.dbCons.FIELD_ROLE_NAME]);
					if (definedRoleName === -1) {
						userRole = func.dbCons.VALUE_APP_USER;
						getActionData(userRole, urlMap, function(error, actions){
							return callbackForUserRole(null, userRole, actions);
						});
					} else {
						func.printLog(func.logCons.LOG_LEVEL_INFO, 'user id ' + userCode + ' is a ' + definedRoleName);
						userRole = definedRoleName;
						getActionData(userRole, urlMap, function(error, actions){
							return callbackForUserRole(null, userRole, actions);
						});
					}
				} else {
					func.printLog(func.logCons.LOG_LEVEL_ERROR, 'role expired!!!');
					return callbackForUserRole("Role Experied, no role found!!");
				}
			}
		});
	func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'assignRole()', func.logCons.LOG_EXIT);
};


function getActionData(userRole, urlMap, callback) {
	func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getActionData()', func.logCons.LOG_ENTER);
	//var userActionDetails = JSON.parse(fs.readFileSync('./role_jsons/auth-action-mapping.json'));
	dbOp.findByQuery(null, urlMap, func.dbCons.COLLECTION_RBAC_RULE_DETAILS, function(error, rules) {
    if (error)
      return callback(error);
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'rules= ' + rules);
		var userActions = [];
		var userActionDetails = rules;
		var userCan = userActionDetails.filter(function(haveAction) {
			return haveAction[func.dbCons.FIELD_A] == userRole;
		});
		userCan.forEach(function(singleUserAction) {
			userActions.push(singleUserAction[func.dbCons.FIELD_CAN]);
		});
		func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'userCan:' + JSON.stringify(userActions));
		callback(null, userActions);
  });
	func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getActionData()', func.logCons.LOG_EXIT);
}

function generateQueryForRole(userCode, isResource) {
	func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateQueryForRole()', func.logCons.LOG_ENTER);
	var queryArray = [];
	if (isResource) {
		queryArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ENTITY_DETAILS + "." + func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, userCode));
		queryArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ENTITY_DETAILS + "." + func.dbCons.FIELD_TYPE, func.lightBlueCons.OP_EQUAL, 'RESOURCE'));
	} else {
		queryArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ENTITY_DETAILS + "." + func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, userCode));
		queryArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ENTITY_DETAILS + "." + func.dbCons.FIELD_TYPE, func.lightBlueCons.OP_EQUAL, 'USER'));
	}
	func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateQueryForRole()', func.logCons.LOG_EXIT);
	return queryArray;
}

function getRoleNameFromEnum(enumRoleName) {
	func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getRoleNameFromEnum()', func.logCons.LOG_ENTER);
	switch (enumRoleName) {
		case func.dbCons.ENUM_APP_USER:
			return func.dbCons.VALUE_APP_USER;
		case func.dbCons.ENUM_ACCOUNT_ADMIN:
			return func.dbCons.VALUE_ACCOUNT_ADMIN;
		case func.dbCons.ENUM_CONSULTANT_USER:
			return func.dbCons.VALUE_CONSULTANT_USER;
		case func.dbCons.ENUM_APPLICATION_ADMIN:
			return func.dbCons.VALUE_APPLICATION_ADMIN;
		case func.dbCons.ENUM_ANONYMOUS_USER:
			return func.dbCons.VALUE_ANONYMOUS_USER;
		default:
			return -1;
	}
	func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getRoleNameFromEnum()', func.logCons.LOG_EXIT);
}

exports.Rolehelpers = Rolehelpers;

// These are needed for tests
exports.dbOp = dbOp;
