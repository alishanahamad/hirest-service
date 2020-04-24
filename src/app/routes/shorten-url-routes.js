var func = require('../utils/functions')
ShortUrlHelper = require('../helpers/short-url-helpers')
  .ShortUrlHelper
var fs = require('fs')
var dbConfig = func.config.get('database')
var shortUrlHelper = new ShortUrlHelper()
module.exports = function(app) {
  app.post(func.urlCons.URL_SHORT_URL, func.validateRole, validateShortUrlParams, function(req, res, next) {
    var urlMap = func.getUrlMap(req)
    // urlMap[func.urlCons.PARAM_DOMAIN_NAME] = req.query[func.urlCons.PARAM_DOMAIN_NAME] ? req.query[func.urlCons.PARAM_DOMAIN_NAME] : urlMap[func.urlCons.PARAM_DOMAIN_NAME];
    var longUrl = req.body[func.urlCons.PARAM_URL]
    var surveyId = req.body[func.urlCons.FIELD_SURVEY_ID];
    var env = req.query[func.urlCons.PARAM_ENV]
    // var orgName = dbConfig[func.configCons.FIELD_DEFAULT_ORG_NAME];
    // urlMap[func.urlCons.PARAM_ORG_NAME] = orgName;
    if (surveyId === undefined) {
      shortUrlHelper.getShortenUrl(longUrl, env, urlMap, function(error, shortUrl) {
        if (error) {
          res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
          return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
        }
        res.status(func.httpStatusCode.OK)
        var json = func.errorResponseGenrator(func.msgCons.MSG_CONVERTED_SUCESSFULLY, func.msgCons.MSG_CONVERTED_SUCESSFULLY, func.msgCons.OK, false)
        json[func.urlCons.PARAM_URL] = shortUrl
        res.send(json)
      })
    } else {
      shortUrlHelper.getShortenUrlforTakeSurvey(longUrl, env, urlMap, surveyId, function(error, shortUrl) {
        if (error) {
          res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
          return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
        }
        res.status(func.httpStatusCode.OK)
        var json = func.errorResponseGenrator(func.msgCons.MSG_CONVERTED_SUCESSFULLY, func.msgCons.MSG_CONVERTED_SUCESSFULLY, func.msgCons.OK, false)
        json[func.urlCons.PARAM_URL] = shortUrl
        res.send(json)
      })
    }
  })
  app.get(func.urlCons.URL_LONG_URL, func.validateRole, validateLongUrlParams, function(req, res, next) {
    var urlMap = func.getUrlMap(req)
    var code = req.params[func.urlCons.PARAM_CODE]
    // urlMap[func.urlCons.PARAM_DOMAIN_NAME] = req.query[func.urlCons.PARAM_DOMAIN_NAME] ? req.query[func.urlCons.PARAM_DOMAIN_NAME] : urlMap[func.urlCons.PARAM_DOMAIN_NAME];
    // var orgName = dbConfig[func.configCons.FIELD_DEFAULT_ORG_NAME];
    shortUrlHelper.getLongUrl(code, urlMap, function(error, longUrl) {
      if (error) {
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      }
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'longUrl......' + longUrl)
      res.redirect(longUrl)
    })
  })
  // function generateShortenUrl(protocol,host,path,surveyId)
  // {
  //   return protocol +'://' + host +'/' + path + '/' + surveyId;
  // }
  app.get(func.urlCons.URL_LONG_URL_S, function(req, res, next) {
    var urlMakeMap = func.splitUrlMethod(req.get('host'));
    var surveyId = req.params[func.urlCons.FIELD_SURVEY_ID];
    var shortUrlConfigJson = func.config.get('shorten_url')
    var link = req.get('host');
    var urlLink = link.split(':' + shortUrlConfigJson[func.urlCons.PARAM_PORT]);
    var finalLink = urlLink[0];
    var shorten_url = shortUrlConfigJson[func.urlCons.PARAM_PROTOCOL] + '://' + finalLink + func.urlCons.URL_S + "/" + surveyId;
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'shorten_url befor getLongUrlbyUrl......' + shorten_url)
    shortUrlHelper.getLongUrlbyUrl(urlMakeMap, shorten_url, function(error, longUrl) {
      if (error) {
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      }
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'longUrl......' + longUrl)
      res.redirect(longUrl)
    })
  })

  function validateLongUrlParams(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateLongUrlParams()', func.logCons.LOG_ENTER)
    var code = req.params[func.urlCons.PARAM_CODE]

    if (!code) {
      res.status(func.httpStatusCode.BAD_REQUEST)
      return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_INVALID_REQUEST, func.msgCons.MSG_INVALID_URL_FORMAT, func.msgCons.CODE_INVALID_PARAM))
    }
    code = func.decodeUsingBase64(code)
    try {
      code = JSON.parse(code)
    } catch (e) {
      res.status(func.httpStatusCode.BAD_REQUEST)
      return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_INVALID_REQUEST, func.msgCons.MSG_INVALID_URL_FORMAT, func.msgCons.CODE_INVALID_PARAM))
    }
    req.params[func.urlCons.PARAM_CODE] = code[0][func.dbCons.FIELD_URL_DETAIL_KEY]
    req.headers[func.urlCons.PARAM_ORG_NAME] = code[0][func.urlCons.PARAM_ORG_NAME] ? code[0][func.urlCons.PARAM_ORG_NAME] : req.query[func.urlCons.PARAM_ORG_NAME]
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateLongUrlParams()', func.logCons.LOG_EXIT)
    next()
  }

  function validateShortUrlParams(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateShortUrlParams()', func.logCons.LOG_ENTER)
    var longUrl = req.body[func.urlCons.PARAM_URL]
    var validator = require('validator')
    var shortUrlConfigJson = func.config.get('shorten_url')
    var options = {}
    options[func.urlCons.PARAM_PROTOCOLS] = shortUrlConfigJson[func.urlCons.PARAM_PROTOCOLS]
    options[func.urlCons.PARAM_REQUIRE_PROTOCOL] = shortUrlConfigJson[func.urlCons.PARAM_REQUIRE_PROTOCOL]
    if (!validator.isURL(longUrl, options)) {
      res.status(func.httpStatusCode.BAD_REQUEST)
      return res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_INVALID_REQUEST, func.msgCons.MSG_INVALID_URL_FORMAT, func.msgCons.CODE_INVALID_PARAM))
    }
    next()
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'validateShortUrlParams()', func.logCons.LOG_EXIT)
  }
}
