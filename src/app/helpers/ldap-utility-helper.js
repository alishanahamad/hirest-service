var ldap = require('ldapjs');
var func = require('../utils/functions');
var ldapConfig = func.config.get('ldap');
//////////////constructor
function LdapUtilityHelpers() {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'obj created of ldap-utility-helpers');
}

//This method is used to delete user from LDAP
LdapUtilityHelpers.prototype.ldapDeleteUser = function(json, callback) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Inside of the LdapUtilityHelpers.prototype.ldapDeleteUser');
    var client = createLdapConnection();
    client.bind(ldapConfig[func.configCons.FIELD_BIND_DN], ldapConfig[func.configCons.FIELD_BIND_CREDENTIALS], function(err) {
        if (err) {
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.msgCons.MSG_ERROR_LDAP_BIND + JSON.stringify(err));
        } else {
            var strDeleteUser = 'cn=' + json.email + ldapConfig[func.configCons.FIELD_ORGANIZATION] + json.org + ldapConfig[func.configCons.FIELD_LDAP_BASE];
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This is strDeleteUser: ' + strDeleteUser);
            client.del(strDeleteUser, function(error) {
                unbindLdapConnection(client);
                if (error) {
                    if (error.code === 32) {
                        func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.msgCons.MSG_ERROR_LDAP_REMOVE + error.code);
                        return callback(1);
                    } else {
                        func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.msgCons.MSG_ERROR_LDAP_REMOVE + error);
                        return callback(2);
                    }
                } else {
                    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.msgCons.MSG_LDAP_USER_REMOVED_SUCCESSFULLY);
                    return callback(null, func.msgCons.MSG_LDAP_USER_REMOVED_SUCCESSFULLY);
                }
            });
        }
    });
};


//This method is used to search user from organization in LDAP
LdapUtilityHelpers.prototype.ldapSearch = function(json, callback) {
    var responseArray = [];
    var responseJSON = {};
    var opts = {
        filter: '(' + func.ldapCons.FIELD_OBJECTCLASS + '=' + func.ldapCons.FIELD_INETORGPERSON + ')',
        scope: func.ldapCons.FIELD_SEARCH_SCOPE,
        attributes: ['*'] //This will give all available details about user
    };

    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Inside of the LdapUtilityHelpers.prototype.ldapSearch');
    var client = createLdapConnection();
    client.bind(ldapConfig[func.configCons.FIELD_BIND_DN], ldapConfig[func.configCons.FIELD_BIND_CREDENTIALS], function(err) {
        if (err) {
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.msgCons.MSG_ERROR_LDAP_BIND + JSON.stringify(err));
        } else {
            var strSearchUser = 'o=' + json.org + ldapConfig[func.configCons.FIELD_LDAP_BASE];
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This is strSearchUser: ' + strSearchUser);
            client.search(strSearchUser, opts, function(err, res) {
                unbindLdapConnection(client);
                if (err) {
                    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This error occured while search' + err);
                    return callback(error);
                } else {
                    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'No error occured during search' + JSON.stringify(res));
                    //This will provide the search result if the relevant entry is found
                    res.on('searchEntry', function(entry) {
                        var entryObject = entry.object;
                        if (json.showPassword === 'true') {
                            responseArray.push(entryObject);
                        } else if (json.showPassword === 'false') {
                            delete entryObject.userPassword;
                            responseArray.push(entryObject);
                        }
                    });
                    //This method will give status of operation if 0 then search was performed without errors
                    res.on('end', function(result) {
                        responseJSON[func.ldapCons.FIELD_ORG_USERS] = responseArray;
                        func.printLog(func.logCons.LOG_LEVEL_INFO, 'Search Status' + result.status);
                        func.printLog(func.logCons.LOG_LEVEL_INFO, 'This is responseJSON inside helper: ' + JSON.stringify(responseJSON));
                        return callback(null, responseJSON);
                    });

                    //If the user to be searched is invalid or the search base is incorrect then this error occurs
                    res.on('error', function(err) {
                        func.printLog(func.logCons.LOG_LEVEL_INFO, 'Error: ' + err.message);
                        return callback(err.message);
                    });
                }
            });
        }
    });
};

//This method is used to search DIT in LDAP
LdapUtilityHelpers.prototype.ldapSearchDIT = function(json, callback) {
    var responseArray = [];
    var responseJSON = {};
    var opts = {
        filter: '(objectclass=*)',
        scope: 'sub',
        attributes: ['*'] //This will give all available details about user
    };

    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Inside of the LdapUtilityHelpers.prototype.ldapSearchDIT');
    var client = createLdapConnection();
    client.bind(ldapConfig[func.configCons.FIELD_BIND_DN], ldapConfig[func.configCons.FIELD_BIND_CREDENTIALS], function(err) {
        if (err) {
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.msgCons.MSG_ERROR_LDAP_BIND + JSON.stringify(err));
        } else {
            var strSearchDIT = func.ldapCons.FIELD_DN;
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This is strSearchUser: ' + strSearchDIT);
            client.search(strSearchDIT, opts, function(err, res) {
                unbindLdapConnection(client);
                if (err) {
                    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.msgCons.MSG_LDAP_SEARCH_ERROR + err);
                    return callback(error);
                } else {
                    //This will provide the search result if the relevant entry is found
                    res.on('searchEntry', function(entry) {
                        var entryObject = entry.object;
                        if (json.showPassword === 'true') {
                            responseArray.push(entryObject);
                        } else if (json.showPassword === 'false') {
                            delete entryObject.userPassword;
                            responseArray.push(entryObject);
                        }
                    });
                    //This method will give status of operation if 0 then search was performed without errors
                    res.on('end', function(result) {
                        responseJSON['DIT'] = responseArray;
                        func.printLog(func.logCons.LOG_LEVEL_INFO, 'Search Status' + result.status);
                        func.printLog(func.logCons.LOG_LEVEL_INFO, 'This is responseJSON inside helper: ' + JSON.stringify(responseJSON));
                        return callback(null, responseJSON);
                    });

                    //If the user to be searched is invalid or the search base is incorrect then this error occurs
                    res.on('error', function(err) {
                        func.printLog(func.logCons.LOG_LEVEL_INFO, 'Error: ' + err.message);
                        return callback(err.message);
                    });
                }
            });
        }
    });
};

LdapUtilityHelpers.prototype.ldapDeleteAllUsers = function(json, callback) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'Inside of the LdapUtilityHelpers.prototype.ldapDeleteUser');
    var client = createLdapConnection();
    client.bind(ldapConfig[func.configCons.FIELD_BIND_DN], ldapConfig[func.configCons.FIELD_BIND_CREDENTIALS], function(err) {
        if (err) {
            func.printLog(func.logCons.LOG_LEVEL_INFO, func.msgCons.MSG_ERROR_LDAP_BIND + JSON.stringify(err));
        } else {
            var strDeleteUser = 'cn=' + json.cn + ldapConfig[func.configCons.FIELD_ORGANIZATION] + json.org + ldapConfig[func.configCons.FIELD_LDAP_BASE];
            func.printLog(func.logCons.LOG_LEVEL_INFO, 'This is strDeleteUser: ' + strDeleteUser);
            client.del(strDeleteUser, function(error) {
                unbindLdapConnection(client);
                if (error) {
                    func.printLog(func.logCons.LOG_LEVEL_INFO, 'This error occured during delete in ldap' + error);
                    return callback(error);
                } else {
                    func.printLog(func.logCons.LOG_LEVEL_INFO, 'User deleted successfully');
                    return callback(null, 'Users Deleted successfully');
                }
            });
        }
    });
};

//This method is used to delete organziation from LDAP
LdapUtilityHelpers.prototype.ldapDeleteOrg = function(json, callback) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Inside of the LdapUtilityHelpers.prototype.ldapDeleteOrg');
    var client = createLdapConnection();
    client.bind(ldapConfig[func.configCons.FIELD_BIND_DN], ldapConfig[func.configCons.FIELD_BIND_CREDENTIALS], function(err) {
        if (err) {
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.msgCons.MSG_ERROR_LDAP_BIND + JSON.stringify(err));
        } else {
            var strDeleteOrg = 'o=' + json.org + ldapConfig[func.configCons.FIELD_LDAP_BASE];
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This is strDeleteUser: ' + strDeleteOrg);
            client.del(strDeleteOrg, function(error) {
                unbindLdapConnection(client);
                if (error) {
                    if (error.code === 66) {
                        func.printLog(func.logCons.LOG_LEVEL_INFO, 'This organization contains child so org deletion not allowed: ' + error);
                        return callback(1);
                    } else {
                        func.printLog(func.logCons.LOG_LEVEL_INFO, 'This error occured during delete org in ldap' + error);
                        return callback(2);
                    }
                } else {
                    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Organization deleted successfully');
                    return callback(null, 'Organization Deleted successfully');
                }
            });
        }
    });
};


//This function can be used to add organization to LDAP
LdapUtilityHelpers.prototype.ldapAddOrg = function(json, callback) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Inside of the LdapUtilityHelpers.prototype.ldapAddOrg');

    var client = createLdapConnection();

    if (!json.organization) {
        return callback(new Error('Org not provided'));
    }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Before the bind');
    client.bind(ldapConfig[func.configCons.FIELD_BIND_DN], ldapConfig[func.configCons.FIELD_BIND_CREDENTIALS], function(err) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Inside of the LdapHelpers AddOrg bind ');
        if (err) {
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.msgCons.MSG_ERROR_LDAP_BIND + err);
            return callback(func.msgCons.MSG_ERROR_LDAP_BIND);
        } else {
            var entry = getOrgEntryDetails(json);
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Entry JSON in addOrg: ' + JSON.stringify(entry));
            var strAddOrg = 'o=' + json.organization + ldapConfig[func.configCons.FIELD_LDAP_BASE];
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This is DN for new org: ' + strAddOrg);
            client.add(strAddOrg, entry, function(err) {
                func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Inside of the LdapHelpers add');
                unbindLdapConnection(client);
                if (err) {
                    if (err.code === 68) {
                        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Organization already exists: ' + JSON.stringify(err));
                        return callback(1);
                    } else {
                        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error occured while adding new organization: ' + JSON.stringify(err));
                        return callback(2);
                    }

                } else {
                    callback(null, 'Organization added successfully');
                    //console.log('Organization added successfully');
                }
            });

        }
    });
};

LdapUtilityHelpers.prototype.ldapAddUser = function(json, callback) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Inside of the LdapUtilityHelpers.prototype.ldapAddUser' + JSON.stringify(json));

    var client = createLdapConnection();

    if (!json[func.ldapCons.FIELD_CN]) {
        return callback(new Error('Email not provided'));
    }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Before the bind');
    client.bind(ldapConfig[func.configCons.FIELD_BIND_DN], ldapConfig[func.configCons.FIELD_BIND_CREDENTIALS], function(err) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Inside of the LdapHelpers AddUser bind ');
        if (err) {
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.msgCons.MSG_ERROR_LDAP_BIND + err);
            return callback(func.msgCons.MSG_ERROR_LDAP_BIND);
        } else {
            var entry = getUserEntryDetails(json);
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Entry JSON in addOrg: ' + JSON.stringify(entry));
            var strAddUser = func.ldapCons.FIELD_CN + '=' + json[func.ldapCons.FIELD_CN] + ldapConfig[func.configCons.FIELD_ORGANIZATION] + json[func.ldapCons.FIELD_ORGANIZATION] + ldapConfig[func.configCons.FIELD_LDAP_BASE];
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This is DN for new user: ' + strAddUser);
            client.add(strAddUser, entry, function(err) {
                func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Inside of the LdapHelpers add');
                unbindLdapConnection(client);
                if (err) {
                    if (err.code === 68) {
                        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'User already exists: ' + JSON.stringify(err));
                        return callback(1);
                    } else {
                        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error occured while adding new user: ' + JSON.stringify(err));
                        return callback(2);
                    }

                } else {
                    callback(null, 'User added successfully');
                    func.printLog(func.logCons.LOG_LEVEL_ERROR, 'User Added successfully ');
                }
            });

        }
    });
};


//This method will change password in LDAP used for adding attributes to the entry
LdapUtilityHelpers.prototype.ldapAddAttribute = function(json, callback) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'ldapChangePassword()', func.logCons.LOG_ENTER);
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'json=' + JSON.stringify(json));
    var client = createLdapConnection();

    client.bind(ldapConfig[func.configCons.FIELD_BIND_DN], ldapConfig[func.configCons.FIELD_BIND_CREDENTIALS], function(err) {
        var attribute = json.attribute;
        var value = json.value;

        if (err) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, func.msgCons.MSG_ERROR_LDAP_BIND + err);
            return callback(func.msgCons.MSG_ERROR_LDAP_BIND);
        } else {
            var modification = {};
            modification[attribute] = value;
            var change = new ldap.Change({
                operation: 'add',
                modification: modification
            });

            var strAddAttribute = 'cn=' + json.email + ldapConfig[func.configCons.FIELD_ORGANIZATION] + json.orgName + ldapConfig[func.configCons.FIELD_LDAP_BASE];

            client.modify(strAddAttribute, change, function(error) {
                unbindLdapConnection(client);
                if (error) {
                    if (error.code === 20) {
                        func.printLog(func.logCons.LOG_LEVEL_INFO, 'This attribute already exists');
                        return callback(1);
                    } else if (error.code === 16) {
                        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'No such Attribute exists for this entry: ' + error);
                        return callback(2);
                    } else {
                        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'This error occured while adding attribute: ' + error.code);
                        return callback(3);
                    }
                } else {
                    func.printLog(func.logCons.LOG_LEVEL_INFO, 'Attribute added successfully');
                    return callback(null, 'Attribute added successfully');
                }
            });

        }
    });
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'ldapChangePassword()', func.logCons.LOG_EXIT);
};


function createLdapConnection() {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'ldap connection object created');
    return ldap.createClient(getLdapConnectionUrlJSon());
}

function getLdapConnectionUrlJSon() {
    var ldapConnecionUrl = {};
    ldapConnecionUrl[func.ldapCons.FIELD_URL] = ldapConfig[func.configCons.FIELD_PROTOCOL] + "://" + ldapConfig[func.configCons.FIELD_HOST] + ":" + ldapConfig[func.configCons.FIELD_PORT];
    return ldapConnecionUrl;
}

function getUserEntryDetails(json) {
    var entry = {
        cn: json.cn,
        sn: json.sn,
        userPassword: json.userPassword,
        objectClass: 'inetOrgPerson'
    };
    return entry;
}


function getOrgEntryDetails(json) {
    var entry = {
        o: json.organization,
        objectClass: 'organization'
    };
    return entry;
}

function unbindLdapConnection(client) {
    if (!client) {
        client.unbind(function(err) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while unbind=' + err);
        });
    }
}
exports.LdapUtilityHelpers = LdapUtilityHelpers;
