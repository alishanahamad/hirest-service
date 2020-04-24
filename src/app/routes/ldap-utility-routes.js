var func = require('../utils/functions');
LdapUtilityHelpers = require('../helpers/ldap-utility-helper')
	.LdapUtilityHelpers;
var ldaputilityhelpers = new LdapUtilityHelpers();


module.exports = function(app) {
	//This API is used to search users from an organization
	app.get(func.urlCons.URL_UTILITY_LDAP_SEARCH_USER, func.validateRole, validateQueryParams, function(req, res, next) {
		var urlMap = func.getUrlMap(req);
		var showPwd = req.query[func.urlCons.PARAM_SHOW_PASSWORD];
		var orgName = urlMap[func.urlCons.PARAM_ORG_NAME] + '_' + urlMap[func.urlCons.PARAM_DOMAIN_NAME];
		var data = {
			showPassword: showPwd,
			org: orgName
		};
		func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This is org: ' + orgName);
		ldaputilityhelpers.ldapSearch(data, function(error, resp) {
			if (error) {
				func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This problem occured during ldapsearch: ' + error);
				res.send("No such user exists in LDAP");
			} else {
				func.printLog(func.logCons.LOG_LEVEL_INFO, 'Entry searched successfully in LDAP');
				if (resp.orgUsers.length === 0) {
					res.send('There are no users in org');
				} else {
					res.send(resp);
				}
			}
		});
	});

	//This APi is used to delete single user from an organization
	app.post(func.urlCons.URL_UTILITY_LDAP_DELETE_USER, func.validateRole, function(req, res) {
		var body = req.body;
		var orgName = body.organization;
		orgName = orgName + '_' + req.headers[func.urlCons.PARAM_DOMAIN_NAME];
		var data = {
			email: body.email,
			org: orgName
		};
		func.printLog(func.logCons.LOG_LEVEL_INFO, 'This is email: ' + data.email);
		func.printLog(func.logCons.LOG_LEVEL_INFO, 'This is orgName: ' + data.org);
		ldaputilityhelpers.ldapDeleteUser(data, function(error, resp) {
			if (error) {
				if (error === 1) {
					func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This problem occured during ldapdelete: ' + error);
					res.send(data.email + ' does not exist in given organization');
				} else if (error === 2) {
					res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, func.msgCons.CODE_OK, true));
				}
			} else {
				func.printLog(func.logCons.LOG_LEVEL_INFO, 'Entry ' + data.email + ' deleted successfully from LDAP');
				res.send(data.email + ' deleted successfully from LDAP');
			}
		});
	});


	//This APi will search and return whole DIT with all entries in it
	app.get(func.urlCons.URL_UTILITY_LDAP_SEARCH_DIT, func.validateRole, validateQueryParams, function(req, res, next) {
		var showPwd = req.query[func.urlCons.PARAM_SHOW_PASSWORD];
		func.printLog(func.logCons.LOG_LEVEL_INFO, 'This is typeof param: ' + typeof showPwd);
		var orgName = req.headers[func.urlCons.PARAM_ORG_NAME] + '_' + req.headers[func.urlCons.PARAM_DOMAIN_NAME];
		var data = {
			showPassword: showPwd,
			org: orgName
		};
		func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This is org: ' + orgName);
		ldaputilityhelpers.ldapSearchDIT(data, function(error, resp) {
			//TODO:Adding handling if the search returns empty results use loop
			if (error) {
				func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This problem occured during ldapsearch: ' + error);
				res.send("No such user exists in LDAP");
			} else {
				func.printLog(func.logCons.LOG_LEVEL_INFO, 'Entry searched successfully in LDAP');
				res.send(resp);
			}
		});
	});

	//This API allows to delete all entries from an organization
	app.post(func.urlCons.URL_UTILITY_LDAP_DELETE_ALL_USERS, func.validateRole, validateQueryParams, function(req, res) {
		var showPwd = req.query[func.urlCons.PARAM_SHOW_PASSWORD];
		var body = req.body;
		var orgName = body.organization;
		orgName = orgName + '_' + req.headers[func.urlCons.PARAM_DOMAIN_NAME];
		var data = {
			showPassword: showPwd,
			org: orgName
		};
		ldaputilityhelpers.ldapSearch(data, function(error, resp) {
			if (error) {
				func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This problem occured during ldapsearch: ' + error);
				res.send("Internal Server Error");
			} else {
				func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Entry searched successfully in LDAP');
				func.printLog(func.logCons.LOG_LEVEL_DEBUG, '**This is response**' + JSON.stringify(resp));
				var orgUserArray = resp.orgUsers;
				if (orgUserArray.length === 0) {
					func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'No Users in given organization');
					res.send('There are no users in org to delete');
				} else {
					orgUserArray.forEach(function(singleUser) {
						func.printLog(func.logCons.LOG_LEVEL_DEBUG, '**This is cn**' + singleUser[func.ldapCons.FIELD_CN]);
						var json = {
							cn: singleUser[func.ldapCons.FIELD_CN],
							org: data.org
						};
						ldaputilityhelpers.ldapDeleteAllUsers(json, function(error, resp) {
							if (error) {
								func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This problem occured during ldapdelete: ' + error);
								// res.send("No such user exists in LDAP");
							} else {
								func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Entry ' + json.cn + ' deleted successfully from LDAP');
							}
						});

					});
					res.send("All entries deleted");
				}
			}
		});

	});

	//This API allows to delete multiple entries from an organization
	app.post(func.urlCons.URL_UTILITY_LDAP_DELETE_MULTIPLE_USERS, func.validateRole, function(req, res, next) {
		var body = req.body;
		var userArray = body.users;
		var nonExistentUsers = [];
		var existingUsers = [];
		var tracker = 0;
		var responseJSON;
		var orgName = body.organization + '_' + req.headers[func.urlCons.PARAM_DOMAIN_NAME];
		if (userArray.length === 0) {
			func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Invalid number of Users in given organization');
			responseJSON = {
				error: "Please Enter Users to be Deleted"
			};
			return res.send(responseJSON);
		} else {
			userArray.forEach(function(singleUser) {
				func.printLog(func.logCons.LOG_LEVEL_DEBUG, '**This is cn**' + singleUser[func.ldapCons.FIELD_CN]);
				var json = {
					email: singleUser,
					org: orgName
				};
				ldaputilityhelpers.ldapDeleteUser(json, function(error, resp) {
					if (error) {
						if (error === 1) {
							func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This problem occured during ldapdelete: ' + error);
							nonExistentUsers.push(json.email);
						} else {
							res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, func.msgCons.CODE_OK, true));
						}
					} else {
						func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Entry ' + json.cn + ' deleted successfully from LDAP');
						existingUsers.push(json.email);
					}
					func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'nonExistentUsers: ' + JSON.stringify(nonExistentUsers));
					func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'tracker = ' + tracker);
					tracker++;
					if (tracker === userArray.length) {
						if (nonExistentUsers.length === 0) {
							responseJSON = {
								users_deleted_successfully: "All users deleted successfully"
							};
							return res.send(responseJSON);
						} else {
							responseJSON = {
								users_does_not_exist: nonExistentUsers,
								deleted_successfully: existingUsers
							};
							res.send(responseJSON);
						}
					}

				});
			});
		}
	});

	//This APi is used to delete single organization from an organization
	app.post(func.urlCons.URL_UTILITY_LDAP_DELETE_ORG, func.validateRole, function(req, res) {
		var body = req.body;
		var orgName = body.organization + '_' + req.headers[func.urlCons.PARAM_DOMAIN_NAME];
		var data = {
			org: orgName
		};
		func.printLog(func.logCons.LOG_LEVEL_INFO, 'This is email: ' + data.email);
		func.printLog(func.logCons.LOG_LEVEL_INFO, 'This is orgName: ' + data.orgName);
		ldaputilityhelpers.ldapDeleteOrg(data, function(error, resp) {
			if (error === 1) {
				func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This org has child entries: ' + error);
				return res.send("Subordinate entries must be deleted before attempting delete on organization");
			} else {
				func.printLog(func.logCons.LOG_LEVEL_INFO, 'Entry ' + data.email + ' deleted successfully from LDAP');
				return res.send(data.org + ' deleted successfully from LDAP');
			}
		});
	});


	//This function adds org to LDAP
	app.post(func.urlCons.URL_UTILITY_LDAP_ADD_ORG, func.validateRole, function(request, response) {
		var body = request.body;
		var org = (body.organization)
			.replace(/\s/g, '');
		var orgName = org.toLowerCase();
		var domainName = request.query[func.urlCons.PARAM_DOMAIN_NAME] ? request.query[func.urlCons.PARAM_DOMAIN_NAME]: request.headers[func.urlCons.PARAM_DOMAIN_NAME];
		orgName = orgName + '_' + domainName;
		var data = {
			organization: orgName
		};
		var responseJSON;
		func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Lowercase Organization: ' + data.organization);
		ldaputilityhelpers.ldapAddOrg(data, function(error, resp) {
			if (error) {
				responseJSON = (error === 1) ? func.errorResponseGenrator(func.msgCons.MSG_ORG_ALREADY_EXISTS, data.organization + func.msgCons.MSG_ORG_ALREADY_REGISTERED, func.msgCons.CODE_OK, true) :
					func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, func.msgCons.CODE_OK, true);
				func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This problem occured during ldapadd for organization: ' + error);
				response.send(responseJSON);
			} else {
				responseJSON = func.errorResponseGenrator(func.msgCons.MSG_ORG_ADDED_SUCCESSFULLY, data.organization + func.msgCons.MSG_ORG_ADDED_SUCCESSFULLY, func.msgCons.CODE_OK, false);
				func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Organization added successfully to LDAP');
				response.send(responseJSON);
			}
		});
	});

	app.get(func.urlCons.URL_LDAP_ADD_ORG_PAGE, func.validateRole, function(request, response) {
		response.render('ldaporg.ejs');
	});

	app.post(func.urlCons.URL_UTILITY_LDAP_ADD_USER, func.validateRole, function(request, response) {
		var body = request.body;
		var domainName = request.query[func.urlCons.PARAM_DOMAIN_NAME] ? request.query[func.urlCons.PARAM_DOMAIN_NAME] : request.headers[func.urlCons.PARAM_DOMAIN_NAME];
		var orgName = body.organization + '_' + domainName;
		var data = {
			org: orgName,
			cn: body.email,
			sn: body.firstName,
			userPassword: body.password
		};
		var responseJSON;
		ldaputilityhelpers.ldapAddUser(data, function(error, resp) {
			if (error) {
				responseJSON = (error === 1) ? func.errorResponseGenrator(func.msgCons.MSG_USER_ALREADY_EXISTS, data.cn + func.msgCons.MSG_USER_ALREADY_REGISTERED, func.msgCons.CODE_OK, true) :
					func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, func.msgCons.CODE_OK, true);
				func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This problem occured during ldapadd for organization: ' + error);
				response.send(responseJSON);
			} else {
				responseJSON = func.errorResponseGenrator(func.msgCons.MSG_USER_ADDED_SUCCESSFULLY, data.cn + func.msgCons.MSG_USER_ADDED_SUCCESSFULLY, func.msgCons.CODE_OK, false);
				func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'User added successfully to LDAP');
				response.send(responseJSON);
			}
		});
	});

	app.post(func.urlCons.URL_UTILITY_LDAP_ADD_ATTRIBUTE, func.validateRole, function(req, res) {
		var body = req.body;
		var orgName = body.organization + '_' + req.headers[func.urlCons.PARAM_DOMAIN_NAME];
		var attributeDetails = {
			orgName: orgName,
			email: body.email,
			attribute: body.attribute,
			value: body.value
		};
		ldaputilityhelpers.ldapAddAttribute(attributeDetails, function(error, resp) {
			if (error) {
				if (error === 1) {
					responseJSON = func.errorResponseGenrator(func.msgCons.MSG_ATTRIBUTE_ALREADY_EXISTS, attributeDetails.attribute + func.msgCons.MSG_ORG_ALREADY_REGISTERED, func.msgCons.CODE_OK, true);
					res.send(responseJSON);
				} else if (error === 2) {
					responseJSON = func.errorResponseGenrator(func.msgCons.MSG_INVALID_ATTRIBUTE, func.msgCons.MSG_INVALID_ATTRIBUTE, func.msgCons.CODE_OK, true);
					res.send(responseJSON);
				} else {
					responseJSON = func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, func.msgCons.CODE_OK, true);
					res.send(responseJSON);
				}
			} else {
				responseJSON = func.errorResponseGenrator(func.msgCons.MSG_ATTRIBUTE_ADDED_SUCCESSFULLY, attributeDetails.attribute + func.msgCons.MSG_ORG_ADDED_SUCCESSFULLY, func.msgCons.CODE_OK, false);
				func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Organization added successfully to LDAP');
				return res.send(responseJSON);
			}
		});
	});

	function validateQueryParams(req, res, next) {
		var showPwd = req.query[func.urlCons.PARAM_SHOW_PASSWORD];
		if (!showPwd || showPwd !== 'true') {
			req.query[func.urlCons.PARAM_SHOW_PASSWORD] = 'false';
			func.printLog(func.logCons.LOG_LEVEL_INFO, 'This is param if no param is passed: ' + req.query[func.urlCons.PARAM_SHOW_PASSWORD]);
		}
		next();
	}

};
