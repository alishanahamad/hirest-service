// app/utils/functions.js
var winston = require('winston')
var WinstonGraylog2 = require('winston-graylog2')
var config = require('config')
var winstonConfig = config.get('winston_config')
var logConfig = config.get('log')
var dbConfig = config.get('database')
var fs = require('fs')
var nodemailer = require('nodemailer')
var smtp = config.get('smtp')
var smtpTransport = nodemailer.createTransport(smtp)
var EmailTemplates = require('swig-email-templates')
var templates = new EmailTemplates()
var Map = require('collections/map')
var dateFormat = require('dateformat')
var logger = new winston.Logger({
  transports: [winstonConfig.isConsole ?
    new winston.transports.Console({
      level: logConfig.level,
      timestamp: function () {
        return (new Date()).toLocaleTimeString()
      },
      json: logConfig.format,
      colorize: logConfig.colorize
    }) :
    winstonConfig.isFile ?
    new (require('winston-daily-rotate-file'))({
      prepend: true,
      json: true,
      prettyPrint: true,
      level: logConfig.level,
      datePattern: 'MM_dd_yyyy_HH',
      timestamp: true,
      filename: winstonConfig.log_path + '.log',
      maxsize: 10000000,
      maxFiles: 30
    }) :
    new (WinstonGraylog2)({
      name: 'Graylog',
      level: logConfig.level,
      silent: false,
      handleExceptions: false,
      graylog: {
        servers: [{
          host: winstonConfig.grayLog_host,
          port: winstonConfig.grayLog_port
        }],
        facility: 'Hirest-Service',
        bufferSize: 1400
      }
    })
  ] // exitOnError: false
})

/**
 * To avoid access token for the API URLs
 */
function accessTokenNotvalidUrl () {
  var listOfUrls = []
  //  listOfUrls.push('/sendGdReportMail');
  // listOfUrls.push('/addReasonForUnavability/')
  // listOfUrls.push('/getInstituteDetails') //admin -- validate done
  // listOfUrls.push('/updateInstituteDetails/'); //admin -- validate done
  // listOfUrls.push('/getCampusDriveList') // admin -- validate done
  // listOfUrls.push('/updateCampusDriveListStatus/') // admin -- validate done
  // listOfUrls.push('/updateCampusDriveDetails/')  // admin -- validate done
  // listOfUrls.push('/candidateExamStatus/')  // ADMIN   -- validate done
  // listOfUrls.push('/designExamTemplate');   //ADMIN  --- validate done
  // listOfUrls.push('/getExamTemplateList')  // ADMIN  --- validate done
  // listOfUrls.push('/recipientSurveyUrl')  //ADMIN  --- validate done
  // listOfUrls.push('/exam/report/details')  //ADMIN --- validate done
  // listOfUrls.push('/institute/list') //ADMIN  -- validate done
  // listOfUrls.push('/getCampusCandidateDetails/');  // ADMIN --- validate done
  // listOfUrls.push('/scorestatistics'); //ADMIN  --- validate done
  // listOfUrls.push('/add/exam/report/details'); // ADMIN -- validate done
  // listOfUrls.push('/updateSignupCandidateUrl');  //ADMIN  --- validate done
  listOfUrls.push('/addTpoRegisterDetails') // TPO  --- validate done
  // listOfUrls.push('/getCampusCandidateDetailsSendMail') // TPO
  // listOfUrls.push('/addCampusDrivesDetails'); // TPO  --- validate done
  // listOfUrls.push('/getCampusDetails/');    // TPO   ----
  // listOfUrls.push('/getCandidateDetails');   // TPO
  // listOfUrls.push('/addPiCandidate') // CANDIDATE
  // listOfUrls.push('/publishOfferLetter') // CANDIDATE
  // listOfUrls.push('/updateCandidatePiStatusAbsents') // CANDIDATE
  listOfUrls.push('/candidateregistration') // CANDIDATE
  listOfUrls.push('/candidate/register/link/close/')

  //  listOfUrls.push('/particularexamdetails/')  // CANDIDATE -- validate done
  // listOfUrls.push('/getExamListData/')  // CANDIDATE  --- validate done
  // listOfUrls.push('/exam/status')  //CANDIDATE -- validate done
  // listOfUrls.push('/shortlistedCampusDriveList/')
  listOfUrls.push('/attribute/details') // ADMIN,CANDIDATE,TPO,APP_USER
  listOfUrls.push('/parent/attribute/details') // ADMIN,CANDIDATE,TPO,APP_USER
  // listOfUrls.push('/sendExamReport')
  // listOfUrls.push('/updateCandidateExamStatus/')  //ADMIN --role done
  // listOfUrls.push('/getTPODetails/')  // TPO  --- validate done
  // listOfUrls.push('/getAssessmentDetails/')
  // listOfUrls.push('/getLocationList/')
  // listOfUrls.push('/candidatelist/')
  // listOfUrls.push('/getGdScoreDetailsForGroupIds')
  // listOfUrls.push('/university/detail')
  // listOfUrls.push('/getCandidateListForGd')
  // listOfUrls.push('/getFinalCandidateList')
  // listOfUrls.push('/candidate/campus/')
  // listOfUrls.push('/getGroupNameFromDateAndDesignation')
  // listOfUrls.push('/gd/institute/list')
  // listOfUrls.push('/getGdPIInstituteList')
  // listOfUrls.push('/addPIDetails')
  // listOfUrls.push('/addGdCandidate')
  // listOfUrls.push('/candidateListPI')
  // listOfUrls.push('/sendEmailtoAdminForHireCandidateList')
  // listOfUrls.push('/sendJoiningInstructionMail')
  return listOfUrls
}

/**
 * common functions required in project
 */
var self = module.exports = {
  logCons: require('./constants/log-constants'),
  urlCons: require('./constants/url-constants'),
  configCons: require('./constants/config-constants'),
  msgCons: require('./constants/msg-constants'),
  msCons: require('./constants/ms-constants'),
  lightBlueCons: require('./constants/lightblue-constants'),
  dbCons: require('./constants/db-constants'),
  httpStatusCode: require('http-status-codes'),
  ldapCons: require('./constants/ldap-constants'),
  config: config,

  /**
   *  useful for rounding the number
   **/

  round: function (value, precision) {
    var multiplier = Math.pow(10, precision || 0)
    return Math.round(value * multiplier) / multiplier
  },

  /**
   *  useful for doing average of the number
   **/

  averageOfNumber: function (elmt) {
    var sum = 0
    for (var i = 0; i < elmt.length; i++) {
      sum += parseFloat(elmt[i], 10) // don't forget to add the base
    }
    var avg = sum / elmt.length
    return avg
  },

  /**
   * filter from array
   **/
  filterBasedOnValue: function filterBasedOnValue (inputArray, field, value) {
    this.printLog(this.logCons.LOG_LEVEL_DEBUG, 'filterInputArrayBasedOnValue()', this.logCons.LOG_ENTER)
    var filteredValue = inputArray.filter(function (item) {
      return item[field] === value
    })
    this.printLog(this.logCons.LOG_LEVEL_DEBUG, 'filteredValue =' + JSON.stringify(filteredValue))
    this.printLog(this.logCons.LOG_LEVEL_DEBUG, 'filterInputArrayBasedOnValue()', this.logCons.LOG_EXIT)
    return filteredValue
  },
  /**
   * filter from nested array
   **/
  filterBasedOnNestedValue: function filterBasedOnNestedValue (inputNestedArray, field, nestedField, value) {
    this.printLog(this.logCons.LOG_LEVEL_DEBUG, 'filterInputArrayBasedOnNestedValue()', this.logCons.LOG_ENTER)
    var filteredNestedValues = inputNestedArray.filter(function (item) {
      return item[field][nestedField] === value
    })
    // this.printLog(this.logCons.LOG_LEVEL_DEBUG, 'filteredNestedValues =' + JSON.stringify(filteredNestedValues))
    this.printLog(this.logCons.LOG_LEVEL_DEBUG, 'filterInputArrayBasedOnNestedValue()', this.logCons.LOG_EXIT)
    return filteredNestedValues
  },

  /**
   * This method will generate flatten json from array of json
   * e.g. [{a:1,b:101},{a:2,b:201}] => { a_1:1, b_1:101, a_2:2, b_2:202 }
   * @param  {Array} arrayJson [description]
   * @return {JSON}           [description]
   */
  generateFlattenObjectFromJsonArray: async function generateFlattenObjectFromArray (arrayJson) {
    let flatJson = {}
    let count = 1
    for (let obj of arrayJson) {
      for (let key in obj) {
        flatJson[key + '_' + count] = obj[key]
      }
      count++
    }
    return flatJson
  },

  /**
   * This method will generate flatten json from array of object
   * e.g. key = foo, and value = ["a", "b"] => { foo_1: "a", foo_2: "b" }
   * @param  {Array} arrayOfObject [description]
   * @param  {String} key       [description]
   * @return {JSON}           [description]
   */
  generateFlattenJsonFromArrayObject: async function generateFlattenJsonFromArrayObject (arrayOfObject, key) {
    let flatJsonObj = {}
    for (let i = 0; i < arrayOfObject.length; i++) {
      flatJsonObj[key + '_' + (i + 1)] = arrayOfObject[i]
    }
    return flatJsonObj
  },

  /**
   * This method will generate flatten json from neste object
   * e.g. {a:{b:c}} => {a_b:c}
   * @param  {[type]} nestedJson [description]
   * @param  {[type]} prefix     [description]
   * @param  {[type]} current    [description]
   * @return {[type]}            [description]
   */
  generateFlattenJsonFromNestedJsonObject: function generateFlattenJsonFromNestedJsonObject (nestedJson, prefix, current) {
    prefix = prefix || []
    current = current || {}
    if (typeof (nestedJson) === 'object' && nestedJson !== null) {
      Object.keys(nestedJson).forEach(key => {
        generateFlattenJsonFromNestedJsonObject(nestedJson[key], prefix.concat('_' + key), current)
      })
    } else {
      current[prefix] = nestedJson
    }
    return current
  },
  /**
   * Generate Map from JSON Array
   **/
  jsonArrayToMap: function jsonArrayToMap (jsonArray, key, value, isLowerCase) {
    var map = new Map()
    isLowerCase = (isLowerCase) ?
      true :
      false
    jsonArray.forEach(function (json) {
      var mapKey = isLowerCase ?
        (isNaN(json[key]) ?
          json[key].toLowerCase() :
          json[key]) :
        json[key]
      var mapValue = !isLowerCase ?
        (isNaN(json[value]) ?
          json[value].toLowerCase() :
          json[value]) :
        json[value]
      map.set(mapKey, mapValue)
    })
    return map
  },

  /**
   * verify the date is valid
   **/
  verifyMyDate: function verifyMyDate (d) {
    var re = /^((((19|[2-9]\d)\d{2})[\/\.-](0[13578]|1[02])[\/\.-](0[1-9]|[12]\d|3[01])\s(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]))|(((19|[2-9]\d)\d{2})[\/\.-](0[13456789]|1[012])[\/\.-](0[1-9]|[12]\d|30)\s(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]))|(((19|[2-9]\d)\d{2})[\/\.-](02)[\/\.-](0[1-9]|1\d|2[0-8])\s(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9]))|(((1[6-9]|[2-9]\d)(0[48]|[2468][048]|[13579][26])|((16|[2468][048]|[3579][26])00))[\/\.-](02)[\/\.-](29)\s(0[0-9]|1[0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])))$/g
    //         yyyy -       MM      -       dd           hh     :   mm  :   ss
    return re.test(d)
  },

  /**
   * verify the IP is valid
   **/
  validateIPAddress: function validateIPAddress (ipaddress) {
    if (ipaddress.indexOf('localhost') === 0 || /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {
      return (true)
    }
    return (false)
  },

  /**
   * validity of url
   *
   * @param {String} url url for validate
   *
   */
  validateWebURL: function validateWebURL (url) {
    var expression = '(https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9][a-zA-Z0-9-]+[a-zA-Z0-9]\.[^\s]{2,}|https?:\/\/(?:www\.|(?!www))[a-zA-Z0-9]\.[^\s]{2,}|www\.[a-zA-Z0-9]\.[^\s]{2,})'
    if (url.match(expression)) {
      return true
    } else {
      return false
    }
  },
  /**
   * response json payload
   *
   * @param {Json} responseData response json data
   * @param {String} responseStatusCode response status code
   * @param {String} responseStatusMsg response status msg
   * @param {JsonArray} responseErrors array of errors
   *
   */
  responseGenerator: function (responseData, responseStatusCode, responseStatusMsg, responseErrors) {
    var responseJson = {}
    responseJson[self.msgCons.RESPONSE_DATA] = responseData
    responseJson[self.msgCons.RESPONSE_STATUS_CODE] = responseStatusCode
    responseJson[self.msgCons.RESPONSE_STATUS_MSG] = responseStatusMsg

    // errors
    if (responseErrors === undefined) {
      responseJson[self.msgCons.RESPONSE_ERRORS] = []
    } else {
      responseJson[self.msgCons.RESPONSE_ERRORS] = responseErrors
    }

    return responseJson
  },

  /**
   * response json payload
   *
   * @param {String} code error code
   * @param {String} msg error msg
   *
   */
  errorObjectGenrator: function (code, msg) {
    var responseJson = {}
    // CODE
    if (typeof code === 'undefined') {
      responseJson[this.msgCons.PARAM_ERROR_CODE] = this.msgCons.CODE_INTERNAL_SERVER
    } else {
      responseJson[this.msgCons.PARAM_ERROR_CODE] = code
    }

    // MSG
    if (msg === undefined) {
      responseJson[this.msgCons.PARAM_ERROR_MSG] = this.msgCons.MSG_ERROR_SERVER_ERROR
    } else {
      responseJson[this.msgCons.PARAM_ERROR_MSG] = msg
    }

    return responseJson
  },

  /**
   * role is valid
   */
  validateRole: function validateRole (req, res, next) {
    self.printLog(self.logCons.LOG_LEVEL_INFO, 'validate role method called...')
    var userCode = req.headers[self.urlCons.PARAM_ID] || req.params[self.urlCons.PARAM_ID] || req.body[self.urlCons.PARAM_ID] || req.query[self.urlCons.PARAM_ID]
    self.printLog(self.logCons.LOG_LEVEL_DEBUG, 'request query in function js= ' + JSON.stringify(req.query))
    // self.printLog(self.logCons.LOG_LEVEL_DEBUG, 'request query in function js= ' + );

    rbacHelpers.getUserRole(userCode, req, function (error, isAccess) {
      if (error) {
        if (isAccess) {
          res.status(self.httpStatusCode.NOT_FOUND)
          res.send(isAccess)
        } else {
          res.status(self.httpStatusCode.INTERNAL_SERVER_ERROR)
          res.send(error)
        }
      } else {
        if (!isAccess) {
          res.status(self.httpStatusCode.FORBIDDEN)
          return res.send(self.errorsArrayGenrator(self.generateErrorArrayObject('RB_' + self.msgCons.CODE_FORBIDDEN, self.msgCons.MSG_UNAUTHORIZED_USER), 'RB_' + self.msgCons.CODE_FORBIDDEN, self.msgCons.MSG_NOT_ALLOWED_TO_DO_ACTION))
        } else {
          next()
        }
      }
    })
  },

  /**
   * error array response json payload
   *
   */
  errorResponseGenrator: function (msg, desc, code, status) {
    var responseJson = {}
    if (typeof status === 'undefined') {
      status = true
    }
    if (typeof code === 'undefined') {
      code = this.msgCons.CODE_INTERNAL_SERVER
    }
    responseJson[this.msgCons.PARAM_ERROR_STATUS] = status
    responseJson[this.msgCons.PARAM_ERROR_CODE] = code
    responseJson[this.msgCons.PARAM_ERROR_MSG] = msg
    responseJson[this.msgCons.PARAM_ERROR_DESC] = desc
    return responseJson
  },
  errorsArrayGenrator: function (errorArray, code, msg, data) {
    var responseJson = {}
    if (typeof errorArray !== 'undefined' || errorArray.length > 0) {
      responseJson[self.msgCons.RESPONSE_ERRORS] = errorArray
    } else {
      responseJson[self.msgCons.RESPONSE_ERRORS] = []
    }

    // CODE
    if (typeof code === 'undefined') {
      responseJson[self.msgCons.RESPONSE_STATUS_CODE] = self.msgCons.CODE_INTERNAL_SERVER_ERROR
    } else {
      responseJson[self.msgCons.RESPONSE_STATUS_CODE] = code
    }

    // MSG
    if (typeof msg === 'undefined') {
      responseJson[self.msgCons.RESPONSE_STATUS_MSG] = self.msgCons.MSG_ERROR_SERVER_ERROR
    } else {
      responseJson[self.msgCons.RESPONSE_STATUS_MSG] = msg
    }

    // DATA
    if (typeof data === 'undefined') {
      responseJson[self.msgCons.RESPONSE_DATA] = {}
    } else {
      responseJson[self.msgCons.RESPONSE_DATA] = data
    }
    return responseJson
  },

  /**
   * get Status Code
   */
  getStatusCode: function getStatusCode (statusCode) {
    this.printLog(this.logCons.LOG_LEVEL_INFO, 'statusCode = ' + statusCode)
    if (statusCode === undefined) {
      statusCode = 'DF_ER_500'
    }
    var status = statusCode.split('_')
    return status[status.length - 1]
  },

  /**
   * generate Url for other MS/UI
   */
  generateUrl: function generateUrl (protocol, host, port, env, urlMap, path) {
    var subDomain
    this.printLog(this.logCons.LOG_LEVEL_INFO, 'generateUrl()', this.logCons.LOG_ENTER)
    this.printLog(this.logCons.LOG_LEVEL_INFO, 'urlMap= ' + JSON.stringify(urlMap))
    this.printLog(this.logCons.LOG_LEVEL_INFO, 'host= ' + JSON.stringify(host))
    this.printLog(this.logCons.LOG_LEVEL_INFO, 'env= ' + env)
    if (this.validateIPAddress(host[urlMap[this.urlCons.PARAM_DOMAIN_NAME]])) {
      subDomain = host[urlMap[this.urlCons.PARAM_DOMAIN_NAME]]
      this.printLog(this.logCons.LOG_LEVEL_INFO, 'host ' + subDomain + ' is ip address or localhost')
    } else {
      var domainName = urlMap[this.urlCons.PARAM_DOMAIN_NAME]
      var defaultHostName = config.get(this.configCons.FIELD_DEFAULT_HOST_NAME)
      var hostName = host[domainName] ?
        host[domainName] :
        defaultHostName
      var orgName = urlMap[this.urlCons.PARAM_ORG_NAME]
      if (domainName === 'steerhigh' && env === '-1') {
        subDomain = hostName
      } else {
        subDomain = (env === '-1' ?
          '' :
          (env + '-')) + orgName + '.' + hostName
      }
      this.printLog(this.logCons.LOG_LEVEL_INFO, 'host is not ip address host=' + subDomain)
    }
    var url = protocol + '://' + subDomain + ':' + port + path
    this.printLog(this.logCons.LOG_LEVEL_DEBUG, 'generated url=' + url)
    this.printLog(this.logCons.LOG_LEVEL_INFO, 'generateUrl()', this.logCons.LOG_EXIT)
    return url
  },

  /**
   * CREATE CLONE OF JSON OBJECT
   *@param {Json} a
   * @returns {Json} json payload with all allow header param
   */
  cloneJsonObject: function cloneJsonObject (a) {
    return JSON.parse(JSON.stringify(a))
  },

  /**
   * genrate json header for allow cross origin
   *
   * @returns {Json} json payload with all allow header param
   */
  getAllowHeader: function () {
    var json = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Expose-Headers': 'Authorization, File-Name',
      'Access-Control-Allow-Headers': 'Origin, X-Requested-With, Content-Type, Accept, Authorization,token,orgName,user_code,File-Name',
      'Access-Control-Request-Methods': 'POST, GET, PUT, DELETE, OPTIONS'
    }
    return json
  },

  /**
   * get orgName from request
   *
   * maping : 1=headers,2=params,3=query,4=body,5=root
   */
  getOrgName: function (req, fromWhere) {
    if (fromWhere === undefined) {
      fromWhere = 1
    }
    var org = []
    var orgTemp = this.getOrgField(req, fromWhere)
    if (!orgTemp) {
      orgTemp = dbConfig[this.configCons.FIELD_DEFAULT_ORG_NAME]
    }
    org = orgTemp.split('-')
    if (!org[1]) {
      org[1] = org[0]
      org[0] = '-1'
    }
    if (fromWhere !== 5) {
      req.query[this.urlCons.PARAM_ENV] = org[0]
    }
    this.printLog(this.logCons.LOG_LEVEL_INFO, 'org name is=' + org[1])
    this.printLog(this.logCons.LOG_LEVEL_INFO, 'set env=' + req.query[this.urlCons.PARAM_ENV])
    return org
  },

  /**
   * get domain name from hostName
   *
   * maping : 1=headers,2=params,3=query,4=body,5=root
   */
  getDomainName: function (hostName) {
    var hostNameArray = hostName.split('.')
    var domainName = hostNameArray[hostNameArray.length - 2]
    var appDomainNames = config.get('domain_names')
    this.printLog(this.logCons.LOG_LEVEL_DEBUG, 'application domainNames = ' + JSON.stringify(appDomainNames))
    var suffixName = appDomainNames[domainName] ?
      appDomainNames[domainName] :
      appDomainNames[this.configCons.FIELD_DEFAULT_DOMAIN_NAME]
    return suffixName
  },

  /**
   * get url map from request
   *
   */
  getUrlMap: function (req, fromWhere) {
    if (fromWhere === undefined) {
      fromWhere = 1
    }
    var json = {}
    json[this.urlCons.PARAM_ORG_NAME] = this.getOrgField(req, fromWhere)
    json[this.urlCons.PARAM_DOMAIN_NAME] = req.query[this.urlCons.PARAM_DOMAIN_NAME] ?
      req.query[this.urlCons.PARAM_DOMAIN_NAME] :
      req.headers[this.urlCons.PARAM_DOMAIN_NAME]
    json[self.urlCons.PARAM_ENV] = (req.query[self.urlCons.PARAM_ENV]) ? req.query[self.urlCons.PARAM_ENV] : '-1'
    this.printLog(this.logCons.LOG_LEVEL_DEBUG, 'urlMap in getUrlMap() =  ' + JSON.stringify(json))
    return json
  },

  /**
   * get orgName from different path of request
   *
   */
  getOrgField: function (json, fromWhere) {
    switch (fromWhere) {
      case 1:
        return json.headers[this.urlCons.PARAM_ORG_NAME]
      case 2:
        return json.params[this.urlCons.PARAM_ORG_NAME]
      case 3:
        return json.query[this.urlCons.PARAM_ORG_NAME]
      case 4:
        return json.body[this.urlCons.PARAM_ORG_NAME]
      case 5:
        return json[this.urlCons.PARAM_ORG_NAME]
    }
  },

  /**
   * email is valid
   **/
  validateEmail: function validateEmail (email) {
    var regexForEmail = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return regexForEmail.test(email)
  },

  /**
   * For Multiple Error Object
   **/
  generateErrorArrayObject: function (code, msg) {
    self.printLog(self.logCons.LOG_LEVEL_DEBUG, 'generateErrorArrayObject()', self.logCons.LOG_ENTER)
    var errorArray = []
    errorArray.push(self.errorObjectGenrator(code, msg))
    self.printLog(self.logCons.LOG_LEVEL_DEBUG, 'generateErrorArrayObject()', self.logCons.LOG_EXIT)
    return errorArray
  },

  /**
   * To Shuffle the array
   **/
  shuffle: function (array) {
    var currentIndex = array.length,
      temporaryValue,
      randomIndex
    // While there remain elements to shuffle...
    while (currentIndex !== 0) {
      // Pick a remaining element...
      randomIndex = Math.floor(Math.random() * currentIndex)
      currentIndex -= 1
      // And swap it with the current element.
      temporaryValue = array[currentIndex]
      array[currentIndex] = array[randomIndex]
      array[randomIndex] = temporaryValue
    }
    return array
  },

  /**
   * get full url of caller
   *
   * @param {Request}
   *            req request object
   * @return {String} full url of request
   */
  getRequestUrl: function (req) {
    return req.protocol + '://' + req.get('host') + req.originalUrl
  },

  /**
   * get ip addres of caller
   *
   * @param {Request}
   *            req request object
   * @return {String} ip address of request
   */
  getRequestIp: function (req) {
    var ipAddress
    // The request may be forwarded from local web server.
    var forwardedIpsStr = req.header('x-forwarded-for')
    if (forwardedIpsStr) {
      // 'x-forwarded-for' header may return multiple IP addresses in
      // the format: 'client IP, proxy 1 IP, proxy 2 IP' so take the
      // the first one
      var forwardedIps = forwardedIpsStr.split(',')
      ipAddress = forwardedIps[0]
    }
    if (!ipAddress) {
      // If request was not forwarded
      ipAddress = req.connection.remoteAddress
    }
    this.printLog(this.logCons.LOG_LEVEL_INFO, 'IP: ' + ipAddress)
    return ipAddress
  },

  /**
   * Method is used to validate client which request our backend service
   * which will only be allowed to IPs listed in config
   *
   * @param req
   * @return {Boolean} true/false
   */
  validateClient: function validateClient (req) {
    var fs = require('fs')
    var jsonContent = func.config.get('validate_client')
    this.printLog(this.logCons.LOG_LEVEL_INFO, 'Client IP:' + this.getRequestIp(req).split(':')[3])
    if (jsonContent.allowed_ips.indexOf(this.getRequestIp(req).split(':')[3]) > -1) {
      this.printLog(this.logCons.LOG_LEVEL_DEBUG, 'Valid client')
      return true
    } else {
      this.printLog(this.logCons.LOG_LEVEL_DEBUG, 'Invalid client')
      return false
    }
  },

  /**
   * Method is used to validate url need accesstoken validation or not
   *
   * @param reqUrl
   * @return {Boolean} true/false
   */
  urlValidatedForAccessToken: function urlValidatedForAccessToken (reqUrl) {
    var url = require('url')
    var urlList = accessTokenNotvalidUrl()
    var path = url.parse(reqUrl).pathname.split(/[0-9\.]+/)
    this.printLog(this.logCons.LOG_LEVEL_INFO, 'path=' + path)
    var urlPath = path[1].split('?')
    this.printLog(this.logCons.LOG_LEVEL_INFO, 'pathname=' + urlPath[0])
    if (urlList.indexOf(path[1]) > -1) {
      return false
    }
    return true
  },

  /**
   * print log according to profile
   * @param {Integer} level
   * @param {String} msg
   * @param {String} type
   */
  printLog: function (level, msg, type) {
    // TODO:if msg is json then use JSON.stringify()
    if (typeof type !== 'undefined') {
      switch (type) {
        case 0: // ENTER
          msg = this.logCons.LOG_ENTER_INTO_FUNC + msg
          break
        case 1: // EXIT
          msg = this.logCons.LOG_EXIT_FROM_FUNC + msg
          break
      }
    }
    logger.log(level, msg)
  },

  /**
   * this method will check jsonObject is array or not.
   * @param {JSON} jsonObject
   */
  convertIntoArray: function (jsonObject) {
    if (!Array.isArray(jsonObject)) {
      return [jsonObject]
    }
    return jsonObject
  },

  /**
   * remove fieldz from json object var json = { z: '123', y: '456' } var
   * fieldz = [z] => { y: '456' }
   *
   * @param {Array} fieldz to remove from given json
   * @param {Json} json for remove given fieldz
   */
  removeField: function (fieldz, json) {
    this.printLog(this.logCons.LOG_LEVEL_DEBUG, 'removeField()', this.logCons.LOG_ENTER)
    if (typeof (fieldz.length) === 'undefined') {
      fieldz = [fieldz]
    }
    for (var i = 0; i < fieldz.length; i++) {
      if (json.hasOwnProperty(fieldz[i])) {
        delete json[fieldz[i]]
      }
    }
  },

  /**
   * Merge object b with object a.
   *
   * var a = { z: '123' } , b = { y: '456' }; => { z: '123', y: '456' }
   *
   * @param {Json} a
   * @param {Json} b
   * @return {Json}
   */
  mergeJsons: function (a, b) {
    if (a && b) {
      for (var key in b) {
        a[key] = b[key]
      }
    }
    return a
  },

  /**
   * this method will return random value within min max
   *
   * @param {Integer} min
   * @param {Integer} max
   * @return {Integer} randomNumber random value within min max
   */
  randomNumber: function (min, max) {
    return Math.floor(Math.random() * (max - min)) + min
  },

  /**
   * Sorting the number
   **/
  numSort: function (a, b) {
    return a - b
  },

  /**
   * Sorting the string
   **/
  stringSort: function (a, b) {
    a = a.toLowerCase()
    b = b.toLowerCase()
    if (a < b) {
      return 1
    }
    if (a > b) {
      return -1
    }
    return 0
  },

  /**
   * Sorting the array
   **/
  sortArray: function (array, isNumber) {
    var compareFunction
    if (typeof isNumber === 'undefined' || isNumber) {
      compareFunction = this.numsort
    } else {
      compareFunction = this.stringSort
    }
    var result = array.sort(compareFunction)
    return result
  },

  /**
   * this method will accept string and encode it using base64
   * var json = { z: '123' } => eyJ6IjoiMTIzIn0=
   *
   * @param {Json} json
   * @return {String} encodedString
   */
  encodeUsingBase64: function (json) {
    return new Buffer(JSON.stringify(json)).toString('base64')
  },

  /**
   * this method will accept base64 encoded string and decode it
   *   var encodedString = 'eyJ6IjoiMTIzIn0=' => { z: '123' }
   *
   * @param {String} encodedString
   * @return {Json} decodedString
   */
  decodeUsingBase64: function (encodedString) {
    return new Buffer(encodedString, 'base64').toString('ascii')
  },

  /**
   * this method will return given field value array from json
   *
   *
   * @param {String} field
   * @return {Json} json
   */
  getValuesArrayFromJson: function (field, json) {
    var arrayJson = this.convertIntoArray(json)
    var valueArray = []
    arrayJson.forEach(function (resultObject) {
      valueArray.push(resultObject[field])
    })
    return valueArray
  },

  /**
   * this method will send error mail to our grp
   **/
  sendErrorMail: function (context, subjectRoutes) {
    var mailConfig = config.get('error_mail')
    var flag = mailConfig[self.configCons.FIELD_SEND_EMAIL_FLAG]
    if (flag) {
      self.printLog(self.logCons.LOG_LEVEL_INFO, 'Context in function.js:' + JSON.stringify(context))
      self.printLog(self.logCons.LOG_LEVEL_INFO, 'subject in function.js:' + subjectRoutes)
      // var context = response;
      var subject = subjectRoutes
      var email = mailConfig[self.configCons.FIELD_EMAIL_ID]
      var path = mailConfig[self.configCons.FIELD_EMAIL_TEMPLATE_PATH]
      templates.render(path, context, function (err, html, text) {
        if (err) {
          return err
        }
        smtpTransport.sendMail(self.generateMailOptions(email, subject, html, text), function (error, responseMail) {
          if (error) {
            self.printLog(self.logCons.LOG_LEVEL_DEBUG, 'error in mail ...' + error)
            return error
          }
          self.printLog(self.logCons.LOG_LEVEL_DEBUG, 'sendEMails()', self.logCons.LOG_EXIT)
          return 'Mail Sent'
        })
      })
    }
  },

  /**
   * this method will generate mail options
   **/
  generateMailOptions: function (to, sub, html, text, attachments) {
    self.printLog(self.logCons.LOG_LEVEL_DEBUG, 'generateMailOptions()', self.logCons.LOG_ENTER)
    var mailOptions = {}
    mailOptions = {
      from: '"SteerHigh" <no-reply@srkay.com>',
      to: to,
      subject: sub,
      html: html,
      text: text
    }
    if (typeof attachments !== 'function') {
      mailOptions[self.configCons.PARAM_ATTACHMENTS] = attachments
    }
    self.printLog(self.logCons.LOG_LEVEL_DEBUG, 'generateMailOptions()', self.logCons.LOG_EXIT)
    return mailOptions
  },

  /**
   * this method will generate context mail
   **/
  generateContextForErrorMail: function (errorStack, fileName, failingFunctionName, apiName, serviceName, errorLevel, inputParameters, env) {
    var context = {}
    var date = new Date()
    context[self.configCons.FIELD_ERROR_STACK] = errorStack
    context[self.configCons.FIELD_FILE_NAME] = fileName
    context[self.configCons.FIELD_FAILING_FUNCTION_NAME] = failingFunctionName
    context[self.configCons.FIELD_API_NAME] = apiName
    context[self.configCons.FIELD_SERVICE_NAME] = serviceName
    context[self.configCons.FIELD_ERROR_DATETIME] = dateFormat(date, 'yyyy-mm-dd hh:MM:ss TT')
    context[self.configCons.FIELD_ERROR_LEVEL] = errorLevel
    context[self.configCons.FIELD_INPUT_PARAMETERS] = JSON.stringify(inputParameters)
    if (env === '-1') {
      env = 'prod'
    }
    context[self.configCons.FIELD_ENVIRONMENT] = env
    return context
  },

  /**
   * this method return subject
   **/
  generateSubject: function (serviceName, apiName) {
    return 'Alert - Error in ' + serviceName + ' for ' + apiName
  },

  /**
   * Checks if json is valid or not
   **/
  checkValidJson: function checkValidJson (json) {
    this.printLog(this.logCons.LOG_LEVEL_DEBUG, 'checkValidJson()', this.logCons.LOG_ENTER)
    this.printLog(this.logCons.LOG_LEVEL_DEBUG, 'checkValidJson()', this.logCons.LOG_EXIT)
    if (json === undefined || json == null || Object.keys(json).length === 0) {
      return false
    }
    return true
  }
}
// To initalize the rbac helpers
RbacHelpers = require('../helpers/rbac-helpers').RbacHelpers
var rbacHelpers = new RbacHelpers()
