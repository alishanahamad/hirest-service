var func = require('../utils/functions')
// var urlConfig = require('../../config/shorten-url');
var fs = require('fs')
var DbOperation = require('./db-operations').DbOperation
var dbOp = new DbOperation()
var alphabet = '123456789abcdefghijkmnopqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
var base = alphabet.length

var dbConfig = func.config.get('database')
// / /////////constructor
function ShortUrlHelper () {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'obj created of shorturl helpers')
}

// function encode(num){
//   var encoded = '';
//   while (num){
//     var remainder = num % base;
//     num = Math.floor(num / base);
//     encoded = alphabet[remainder].toString() + encoded;
//   }
//   return encoded;
// }
ShortUrlHelper.prototype.getShortenUrlforTakeSurvey = function (longUrl, env, urlMap, surveyId, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getShortenUrlforTakeSurvey()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'longUrl=' + longUrl)
  // var urlQueryParam = func.urlCons.PARAM_ON + '=' + func.encodeUsingBase64(urlMap[func.urlCons.PARAM_ORG_NAME]) + '&' + func.urlCons.PARAM_DN + '=' + func.encodeUsingBase64(urlMap[func.urlCons.PARAM_DOMAIN_NAME]) + '&' + func.urlCons.PARAM_ENC + '=' + true

  var shortUrlConfigJson = func.config.get('shorten_url')
  var path = func.urlCons.URL_S + '/' + surveyId
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'generated long url after addition of org,domain name query params =  ' + path)
  // var shortUrldata = func.generateUrl(shortUrlConfigJson[func.urlCons.PARAM_PROTOCOL], shortUrlConfigJson[func.urlCons.PARAM_HOST], shortUrlConfigJson[func.urlCons.PARAM_PORT], env, urlMap, path)
  var shortUrldataArray = func.generateUrl(shortUrlConfigJson[func.urlCons.PARAM_PROTOCOL], shortUrlConfigJson[func.urlCons.PARAM_HOST], shortUrlConfigJson[func.urlCons.PARAM_PORT], env, urlMap, path)
  shortUrldataArray = shortUrldataArray.split(':' + shortUrlConfigJson[func.urlCons.PARAM_PORT])
  var shortUrldata = shortUrldataArray[0] + shortUrldataArray[1]
  dbOp.insert(urlMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_SHORTEN_URL_DETAILS, func.dbCons.COMMON_VERSION_1_1_0), generateDataToSave(longUrl, shortUrldata), getUrlKeyProjection(true),
    function (error, shortUrl) {
      if (error) return callback(error)
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'genrated shortUrl:' + shortUrldata + ' for longUrl:' + longUrl)
      callback(null, shortUrldata)
    })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getShortenUrlforTakeSurvey()', func.logCons.LOG_EXIT)
}
ShortUrlHelper.prototype.getShortenUrl = function (longUrl, env, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getShortenUrl()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'longUrl=' + longUrl)
  var urlQueryParam = func.urlCons.PARAM_ON + '=' + func.encodeUsingBase64(urlMap[func.urlCons.PARAM_ORG_NAME]) + '&' + func.urlCons.PARAM_DN + '=' + func.encodeUsingBase64(urlMap[func.urlCons.PARAM_DOMAIN_NAME]) + '&' + func.urlCons.PARAM_ENC + '=' + true
  // if (longUrl.indexOf('?') > -1)
  //   longUrl = longUrl + '&' + urlQueryParam;
  // else
  //   longUrl = longUrl + '?' + urlQueryParam;
  // var orgName = dbConfig[func.configCons.FIELD_DEFAULT_ORG_NAME];
  // urlMap[func.urlCons.PARAM_ORG_NAME] = orgName;
  dbOp.insert(urlMap, func.dbCons.COLLECTION_SHORTEN_URL_DETAILS, generateDataToSave(longUrl), getUrlKeyProjection(true),
    function (error, shortUrl) {
      if (error) return callback(error)
      var shortUrlConfigJson = func.config.get('shorten_url')
      shortUrl[0][func.urlCons.PARAM_ORG_NAME] = urlMap[func.urlCons.PARAM_ORG_NAME]
      shortUrl = func.encodeUsingBase64(shortUrl)
      var path = func.urlCons.URL_L + '/' + shortUrl + '?' + urlQueryParam
      //console.log(shortUrlConfigJson[func.urlCons.PARAM_HOST])
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'generated long url after addition of org,domain name query params =  ' + path)
      shortUrl = func.generateUrl(shortUrlConfigJson[func.urlCons.PARAM_PROTOCOL], shortUrlConfigJson[func.urlCons.PARAM_HOST], shortUrlConfigJson[func.urlCons.PARAM_PORT], env, urlMap, path)
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'genrated shortUrl:' + shortUrl + ' for longUrl:' + longUrl)
      callback(null, shortUrl)
    })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getShortenUrl()', func.logCons.LOG_EXIT)
}

ShortUrlHelper.prototype.getLongUrl = function (code, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getLongUrl()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'code=' + code)
  //  var orgName = dbConfig[func.configCons.FIELD_DEFAULT_ORG_NAME];
  //  urlMap[func.urlCons.PARAM_ORG_NAME] = orgName;
  dbOp.findByKey(func.dbCons.FIELD_URL_DETAIL_KEY, func.lightBlueCons.OP_EQUAL, code, urlMap, func.dbCons.COLLECTION_SHORTEN_URL_DETAILS, getUrlKeyProjection(false),
    function (error, urlJson) {
      if (error) return callback(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'found longUrl:' + urlJson[func.dbCons.FIELD_URL_DETAIL_VALUE] + ' for code:' + code)
      urlJson = func.convertIntoArray(urlJson)
      if (urlJson.length !== 1) {
        callback(func.errorResponseGenrator(func.msgCons.MSG_NO_LONGURL_FOUND, func.msgCons.MSG_NO_LONGURL_FOUND, func.msgCons.CODE_NO_LONGURL_FOUND))
      } else {
        callback(null, urlJson[0][func.dbCons.FIELD_URL_DETAIL_VALUE])
      }
    })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getLongUrl()', func.logCons.LOG_EXIT)
}
ShortUrlHelper.prototype.getLongUrlbyUrl = function (urlMap, shorten_url, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getLongUrlbyUrl()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'shorten_url=' + shorten_url)
  dbOp.findByKey(func.dbCons.FIELD_SHORTEN_URL_KEY, func.lightBlueCons.OP_EQUAL, shorten_url, urlMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_SHORTEN_URL_DETAILS, func.dbCons.COMMON_VERSION_1_1_0), getUrlKeyProjection(false),
    function (error, urlJson) {
      if (error) return callback(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'found longUrl:' + urlJson[func.dbCons.FIELD_URL_DETAIL_VALUE] + ' for shorten_url:' + shorten_url)
      urlJson = func.convertIntoArray(urlJson)
      if (urlJson.length !== 1) {
        callback(func.errorResponseGenrator(func.msgCons.MSG_NO_LONGURL_FOUND, func.msgCons.MSG_NO_LONGURL_FOUND, func.msgCons.CODE_NO_LONGURL_FOUND))
      } else {
        callback(null, urlJson[0][func.dbCons.FIELD_URL_DETAIL_VALUE])
      }
    })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getLongUrl()', func.logCons.LOG_EXIT)
}

function generateDataToSave (longUrl, shorten_url) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateDataToSave()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'longUrl=' + longUrl)
  // var shortid = require('shortid');
  var dataz = []
  var urlData = {}
  urlData[func.dbCons.FIELD_URL_DETAIL_VALUE] = longUrl
  // urlData[func.dbCons.FIELD_PROFILE] = shortid.generate();
  urlData[func.dbCons.FIELD_SHORTEN_URL_KEY] = shorten_url
  urlData[func.dbCons.COMMON_CREATED_BY] = 'master'
  urlData[func.dbCons.COMMON_UPDATED_BY] = 'master'
  dataz.push(urlData)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateDataToSave()', func.logCons.LOG_EXIT)
  return dataz
}
// function getShortUrlConfigJson() {
//     var validateConfig = fs.readFileSync('./config/shorten-url.json');
//     func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateConfig=' + JSON.stringify(validateConfig));
//     return JSON.parse(validateConfig);
// }

function getUrlKeyProjection (isKeyOrValue) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUrlKeyProjection()', func.logCons.LOG_ENTER)
  var projection = []
  if (isKeyOrValue) {
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_URL_DETAIL_KEY))
  } else {
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_URL_DETAIL_VALUE))
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUrlKeyProjection()', func.logCons.LOG_EXIT)
  return projection
}
exports.ShortUrlHelper = ShortUrlHelper

// These are needed for tests
exports.dbOp = dbOp
