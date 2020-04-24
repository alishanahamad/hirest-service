var ldap = require('ldapjs');
var func = require('../utils/functions');
var ldapConfig = func.config.get('ldap');
//////////////constructor
function LdapHelpers() {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'obj created of ldap-helpers');
}

//This function is used to add user to LDAP
LdapHelpers.prototype.add = function(json, callback) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'add()', func.logCons.LOG_ENTER);
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'json=' + JSON.stringify(json));
    if (!json.cn) return callback(new Error('email'));
    var client = createLdapConnection();
    client.bind(ldapConfig[func.configCons.FIELD_BIND_DN], ldapConfig[func.configCons.FIELD_BIND_CREDENTIALS], function(err) {
        if (err) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while binding in add()=' + err);
            return callback('Error while binding in add()');
        } else {
            var o = json.ou;
            var entry = json;
            delete entry[func.ldapCons.FIELD_ORG];
            var strAdd = func.ldapCons.FIELD_CN + '=' + json[func.ldapCons.FIELD_CN] + ldapConfig[func.configCons.FIELD_ORGANIZATION] + o + ldapConfig[func.configCons.FIELD_LDAP_BASE];
            func.printLog(func.logCons.LOG_LEVEL_INFO, 'add entity string=' + strAdd + ' Entry Json=' + JSON.stringify(json));
            client.add(strAdd, json, function(err) {
                unbindLdapConnection(client);
                if (err) {
                    var errorMessage = err.message;
                    if (errorMessage.match('ENTRY_ALREADY_EXISTS') || errorMessage.match('Entry Already Exists')) {
                        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'ENTRY_ALREADY_EXISTS found=' + err);
                        callback(1);
                    } else {
                        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while adding user=' + err);
                        callback(2);
                    }
                } else {
                    callback(null, 'done');
                    func.printLog(func.logCons.LOG_LEVEL_INFO, 'User added successfully');
                }
            });

        }
    });
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'add()', func.logCons.LOG_EXIT);
};

//This method is used to directly authenticate by directly connecting to the LDAPServer without going via Auth0
LdapHelpers.prototype.ldapAuthentication = function(json, callback) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'ldapAuthentication()', func.logCons.LOG_ENTER);
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'json=' + JSON.stringify(json));
    var client = createLdapConnection();
    client.bind(ldapConfig[func.configCons.FIELD_BIND_DN], ldapConfig[func.configCons.FIELD_BIND_CREDENTIALS], function(err) {
        if (err) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while binding in ldapAuthentication()=' + err);
            return callback('Error while binding in ldapAuthentication()');
        } else {

            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'This is email: ' + json.email);
            var strUser = 'cn=' + json.email + ldapConfig[func.configCons.FIELD_ORGANIZATION] + json.ou + ldapConfig[func.configCons.FIELD_LDAP_BASE];
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'str user : ' + strUser);
            client.bind(strUser, json.password, function(err) {
                unbindLdapConnection(client);
                if (err) {
                    if (err.code === 49) {
                        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Email or Password is incorrect=' + JSON.stringify(err));
                        return callback(1);
                    } else {
                        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while authentication=' + JSON.stringify(err));
                        return callback(2);
                    }
                } else {
                    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'User ' + json.email + ' authenticated successfully');
                    return callback(null, 'User Authenticated Successfully');
                }
            });
        }
    });
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'ldapAuthentication()', func.logCons.LOG_EXIT);
};

//This method will change password in LDAP used for forgot password
LdapHelpers.prototype.ldapChangePassword = function(json, callback) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'ldapChangePassword()', func.logCons.LOG_ENTER);
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'json=' + JSON.stringify(json));
    var client = createLdapConnection();
    //var cn = json.email;
    var cn = json.email
    var newPassword = json.newPassword;

    client.bind(ldapConfig[func.configCons.FIELD_BIND_DN], ldapConfig[func.configCons.FIELD_BIND_CREDENTIALS], function(err) {
        if (err) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while binding in ldapChangePassword()=' + err);
            return callback('Error while binding in ldapChangePassword()');
        } else {
            var change = new ldap.Change({
                operation: 'replace',
                modification: {
                    userPassword: newPassword
                }
            });
            var strChangePwd = 'cn=' + cn + ldapConfig[func.configCons.FIELD_ORGANIZATION] + json.o + ldapConfig[func.configCons.FIELD_LDAP_BASE];
            func.printLog(func.logCons.LOG_LEVEL_INFO, 'This is strChangePwd=' + strChangePwd);
            client.modify(strChangePwd, change, function(error) {
                unbindLdapConnection(client);
                if (error) {
                    func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while modify=' + error);
                    return callback(error);
                } else {
                    func.printLog(func.logCons.LOG_LEVEL_INFO, 'Password changed successfully');
                    return callback(null, 'Password changed successfully');
                }
            });
        }
    });
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'ldapChangePassword()', func.logCons.LOG_EXIT);
};


//This method is used to delete user from LDAP
LdapHelpers.prototype.ldapDeleteUser = function(json, callback) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'ldapDeleteUser()', func.logCons.LOG_ENTER);
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'json=' + JSON.stringify(json));
    var client = createLdapConnection();
    var cn = json.cn;
    client.bind(ldapConfig.BIND_DN, ldapConfig.BIND_CREDENTIALS, function(err) {
        if (err) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while binding in ldapDeleteUser()=' + err);
            return callback('Error while binding in ldapDeleteUser()');
        } else {
            client.del('cn=' + cn + ',ou=SteerHigh,ou=AptitudeLabs,dc=srkay,dc=com', function(error) {
                unbindLdapConnection(client);
                if (error) {
                    func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while delete in ldap' + error);
                    return callback(error);
                } else {
                    func.printLog(func.logCons.LOG_LEVEL_INFO, 'User deleted successfully');
                    return callback(null, 'User deleted successfully');
                }
            });
        }
    });
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'ldapDeleteUser()', func.logCons.LOG_EXIT);
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

function unbindLdapConnection(client) {
    if (!client) {
        client.unbind(function(err) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while unbind=' + err);
        });
    }
}

exports.LdapHelpers = LdapHelpers;

// These are needed for tests
// exports.cryptoHelpers = cryptoHelpers;
