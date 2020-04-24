var express = require('express')
var fs = require('fs')
var func = require('./app/utils/functions')
var configAuth = func.config.get('server')
var port = configAuth.port
apiToken = require('./app/helpers/api-token').apiToken
var apiToken = new apiToken()
var Client = require('node-rest-client').Client
var client = new Client()
var configHelper = require('@scikey/config-helper-module')

// configuration ======================
function config () {
  var app = express()
	// Import configuration
  setMiddelWares(app)
  setRoutes(app)
  return app
}

// ===================================================
// CONFIGURE ALL API SETTING
// ===================================================

function setMiddelWares (app) {
  var compression = require('compression')
	// compress all responses
  app.use(compression())
	// ///////////////////////////////////////////////////
  var bodyParser = require('body-parser')
	// parse application/x-www-form-urlencoded
  app.use(bodyParser.urlencoded({
    extended: false
  }))
	// parse application/json
  app.use(bodyParser.json({
    limit: '4MB'
  }))
  configHelper.initialize(func.config.get('config_helper_module_config'))
	// ///////////////////////////////////////////////////////
  app.disable('x-powered-by')
	// //////////////////////////////////////////////////server
  app.set('view engine', 'ejs') // set up ejs for templating
  app.set('views', './app/views')
  app.use(express.static('./apidoc'))
  app.use(express.static('./app/views'))
  app.use(express.static(__dirname + '/app/views'))
	// //////////////////////////////////////////////////////
  var session = require('express-session')
  var flash = require('connect-flash')
  app.use(session({
    secret: 'shhhhhhh',
    resave: false,
    saveUninitialized: true
  }))
  app.use(flash()) // use connect-flash for flash messages stored in
	// ////////////////////////////////////////////////////////

	// validate client and allow all access header
  app.use(function (req, res, next) {
    var jsonContent = func.config.get('validate_client')
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'validation configuration : ' + JSON.stringify(jsonContent))
    var url = func.getRequestUrl(req)
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'url = ' + url)
		// set orgName
    var org = func.getOrgName(req)
    req.headers[func.urlCons.PARAM_ORG_NAME] = org[1]
		// set domainName
    req.headers[func.urlCons.PARAM_DOMAIN_NAME] = func.getDomainName(req.get('host'))
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'url = ' + url)
    res.header(func.getAllowHeader())

    if (url.indexOf(jsonContent.url_prefix) > -1 && jsonContent.is_enable) {
      var booleanValidate = func.validateClient(req)
      if (!booleanValidate) {
        res.status(func.httpStatusCode.FORBIDDEN)
        return res.send(func.errorResponseGenrator(func.msgCons.MSG_INVALID_USER, func.msgCons.MSG_INVALID_USER, func.msgCons.CODE_CORS_ACCESS_DENIED, true))
      }
    }
    if (req.method === 'OPTIONS') {
      res.status(func.httpStatusCode.OK)
      return res.send()
    }
    var env = org[0]
    var orgName = req.headers[func.urlCons.PARAM_ORG_NAME]
    var userCode = req.headers[func.urlCons.PARAM_ID] || req.params[func.urlCons.PARAM_ID] || req.body[func.urlCons.PARAM_ID] || req.query[func.urlCons.PARAM_ID]
    var token = req.headers[func.dbCons.FIELD_TOKEN]
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'Token in header=' + token)
    var urlMap = func.getUrlMap(req)
    var isResource = (req.query[func.urlCons.PARAM_IS_RESOURCE] === 'true') ?
			true :
			false
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'isResource in query=' + isResource)

    if (func.urlValidatedForAccessToken(url)) {
      if (token && userCode) {
        apiToken.verifyToken(token, userCode, env, urlMap, isResource, function (result) {
          if (result[func.msgCons.PARAM_ERROR_STATUS] === true) {
            res.status(func.httpStatusCode.FORBIDDEN)
            return res.send(func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.CODE_FORBIDDEN, func.msgCons.MSG_TOKEN_INVALID), func.msgCons.CODE_FORBIDDEN, func.msgCons.MSG_TOKEN_INVALID))
          } else {
            next()
          }
        })
      } else {
        res.status(func.httpStatusCode.FORBIDDEN)
        return res.send(func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.CODE_FORBIDDEN, func.msgCons.MSG_TOKEN_NOT_AVAILABLE), func.msgCons.CODE_FORBIDDEN, func.msgCons.MSG_TOKEN_NOT_AVAILABLE))
      }
    } else {
      next()
    }
  })
}

function setRoutes (app) {
  var routesFolder = './app/routes/'
  fs.readdir(routesFolder, function (err, routes) {
    routes.forEach(function (route) {
      require(routesFolder + route)(app)
    })
  })
}

var listner = config().listen(port, function () {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'The Hirest Service is running on port:' + port)
})
