var Client = require('node-rest-client').Client;
var client = new Client();
var func = require('../utils/functions');
var securityConfig = func.config.get('security');
// ////////////constructor
// TODO: add get method
function apiToken() {}

/**
 * this method will call light blue server for CRUD operation and return
 * response data
 *
 * @param {String} url for calling lighblue REST api
 * @param {String} agrs contains query/projection in data json
 * @param {String} httpMethod name for the operation default value is POST
 * @param {Function} callback this function give reponse from light blue server
 */
apiToken.prototype.apiSecurityToken = function(userCode, env, urlMap, isResource, callback) {
  var resourceQuery = '';
  if (typeof isResource === 'function') {
    callback = isResource;
    isResource = false;
  }
  resourceQuery = '?' + func.urlCons.PARAM_IS_RESOURCE + '=' + isResource + '&&' + func.urlCons.PARAM_DOMAIN_NAME + '=' + urlMap[func.urlCons.PARAM_DOMAIN_NAME];
  var path = securityConfig[func.configCons.FIELD_GET_TOKEN_PATH] + '/' + userCode + resourceQuery;
  var url = func.generateUrl(securityConfig[func.configCons.FIELD_PROTOCOL], securityConfig[func.configCons.FIELD_HOST], securityConfig[func.configCons.FIELD_PORT], env, urlMap, path);
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, "url in api token=" + url);
  var orgName = urlMap[func.urlCons.PARAM_ORG_NAME];
  var args = {
    headers: {
      "orgName": orgName
    }
  }
  client.get(url, args, function(data, response) {
    callback(data);
  });
};

apiToken.prototype.verifyToken = function(token, userCode, env, urlMap, isResource, callback) {

  var resourceQuery = '';
  // if (typeof isResource !== 'undefined') {
  // func.printLog(func.logCons.LOG_LEVEL_INFO, 'isResource=' + JSON.stringify(isResource));
  resourceQuery = '?' + func.urlCons.PARAM_IS_RESOURCE + '=' + isResource + '&&' + func.urlCons.PARAM_DOMAIN_NAME + '=' + urlMap[func.urlCons.PARAM_DOMAIN_NAME];
  // }
  // callback = isResource;
  // else resourceQuery = '?' + func.urlCons.PARAM_IS_RESOURCE + '=' + true;
  var data = {};
  data[func.urlCons.PARAM_ACCESS_TOKEN] = token;
  data[func.urlCons.PARAM_ID] = userCode;
  var orgName = urlMap[func.urlCons.PARAM_ORG_NAME];
  var args = {
    data: data,
    headers: {
      "Content-Type": "application/json",
      "orgName": orgName
    }
  };
  var path = securityConfig[func.configCons.FIELD_VERIFY_TOKEN_PATH] + resourceQuery;
  var url = func.generateUrl(securityConfig[func.configCons.FIELD_PROTOCOL], securityConfig[func.configCons.FIELD_HOST], securityConfig[func.configCons.FIELD_PORT], env, urlMap, path);
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'url=' + JSON.stringify(url));
  client.post(url, args, function(data, response) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'data from verification of access token' + JSON.stringify(data));
    callback(data);
  });
};

exports.apiToken = apiToken;
