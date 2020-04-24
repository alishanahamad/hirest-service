/**
 * The <code>attribute-lookup-details-helpers.js </code> use to retrieve lookup details for given attribute data
 *
 * @author Kavish Kapadia, Harshil Kothari
 */
var func = require('../utils/functions')
var AttributeLookupDetailsHelpers = require('../helpers/attribute-lookup-details-helpers').AttributeLookupDetailsHelpers
var attributeLookupDetailsHelpers = new AttributeLookupDetailsHelpers()
var ROUTE_CONS = 'HS_ALDR_'

module.exports = function (app) {
  app.get(func.urlCons.URL_GET_PARENT_CHILD_ATTRIBUTE_DETAILS, function (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_GET_PARENT_CHILD_ATTRIBUTE_DETAILS, func.logCons.LOG_ENTER)
    var orgNameMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    var attributeValue = req.query[func.dbCons.FIELD_VALUE]
    attributeLookupDetailsHelpers.getParentChildAttribute(attributeValue, orgNameMap, env, function (error, response) {
      if (error) {
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        if (response.length === 0 || !response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'could not complete the task: ' + JSON.stringify(response))
          res.status(func.httpStatusCode.OK)
          func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_EXAM_REPORT_DETAILS, func.logCons.LOG_EXIT)
          return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_SUCCESS_FETCHED_DATA))
        }
        res.status(func.httpStatusCode.OK)
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_ATTRIBUTE_DETAILS, func.logCons.LOG_EXIT)
        return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_SUCCESS_FETCHED_DATA))
      }
    })
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_PARENT_CHILD_ATTRIBUTE_DETAILS, func.logCons.LOG_EXIT)
  })
  app.get(func.urlCons.URL_GET_ATTRIBUTE_DETAILS, function (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_GET_ATTRIBUTE_DETAILS, func.logCons.LOG_ENTER)
    var orgNameMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    var attributeType = req.query[func.dbCons.FIELD_TYPE]
    attributeLookupDetailsHelpers.getAttributeDetails(attributeType, orgNameMap, env, function (error, response) {
      if (error) {
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        if (response.length === 0 || !response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'could not complete the task: ' + JSON.stringify(response))
          res.status(func.httpStatusCode.OK)
          func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_EXAM_REPORT_DETAILS, func.logCons.LOG_EXIT)
          return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_SUCCESS_FETCHED_DATA))
        }
        res.status(func.httpStatusCode.OK)
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_ATTRIBUTE_DETAILS, func.logCons.LOG_EXIT)
        return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_SUCCESS_FETCHED_DATA))
      }
    })
  })
  app.post(func.urlCons.URL_GET_PARENT_ATTRIBUTE_DETAILS, function (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_GET_PARENT_ATTRIBUTE_DETAILS, func.logCons.LOG_ENTER)
    var orgNameMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    var attributeIds = req.body[func.dbCons.FIELD_ID]
    attributeLookupDetailsHelpers.getParentAttributeDetails(attributeIds, orgNameMap, env, function (error, response) {
      if (error) {
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        if (response.length === 0 || !response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'could not complete the task: ' + JSON.stringify(response))
          res.status(func.httpStatusCode.OK)
          func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_PARENT_ATTRIBUTE_DETAILS, func.logCons.LOG_EXIT)
          return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_SUCCESS_FETCHED_DATA))
        }
        res.status(func.httpStatusCode.OK)
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_PARENT_ATTRIBUTE_DETAILS, func.logCons.LOG_EXIT)
        return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_SUCCESS_FETCHED_DATA))
      }
    })
  })

  app.post(func.urlCons.URL_GET_INSTITUTE_LIST_FROM_DESIGNATION, func.validateRole, function (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.urlCons.URL_GET_INSTITUTE_LIST_FROM_DESIGNATION, func.logCons.LOG_ENTER)
    var orgNameMap = func.getUrlMap(req)
    var env = req.query[func.urlCons.PARAM_ENV]
    var designation = req.body[func.dbCons.FIELD_DESIGNATION]
    attributeLookupDetailsHelpers.getInstituteListFromDesignation(designation, orgNameMap, env, function (error, response) {
      if (error) {
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR)
        res.send(func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else {
        if (response.length === 0 || !response) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'could not complete the task: ' + JSON.stringify(response))
          res.status(func.httpStatusCode.OK)
          func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_INSTITUTE_LIST_FROM_DESIGNATION, func.logCons.LOG_EXIT)
          return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_SUCCESS_FETCHED_DATA))
        }
        res.status(func.httpStatusCode.OK)
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_INSTITUTE_LIST_FROM_DESIGNATION, func.logCons.LOG_EXIT)
        return res.send(func.responseGenerator(response, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, func.msgCons.MSG_SUCCESS_FETCHED_DATA))
      }
    })
  })
}
