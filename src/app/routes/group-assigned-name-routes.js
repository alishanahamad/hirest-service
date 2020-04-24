'use strict'
/**
 * The <code>group-assigned-name-routes.js</code>
 * @author Monika Mehta
 */
const func = require('../utils/functions')
const GroupAssignedNameHelpers = require('../helpers/group-assigned-name-helpers.js').GroupAssignedNameHelpers
const groupAssignedNameHelpers = new GroupAssignedNameHelpers()
const ROUTE_CONS = 'HI_GANR_'

module.exports = function (app) {
  /**
   * @api {post} /hirest/v1/getGroupName
   * @apiName BASED ON CAMPUS YEAR GET GROUP NAME
   * @apiVersion 1.0.0
   */
app.post(func.urlCons.URL_POST_GROUP_ASSIGNED_NAME, func.validateRole, async function (req, res, next) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_GROUP_ASSIGNED_NAME, func.logCons.LOG_ENTER)
  const orgNameMap = func.getUrlMap(req)
  const env = req.query[func.urlCons.PARAM_ENV]
  try {
    func.printLog(func.logCons.LOG_LEVEL_INFO, ` fetch group name`)
    const results = await groupAssignedNameHelpers.getGroupName(req.body, orgNameMap, env)
    res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
    next()
  } catch (err) {
    res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
    next()
  }
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_GROUP_ASSIGNED_NAME, func.logCons.LOG_EXIT)
})


/**
 * @api {post} /hirest/v1/findGroupName
 * @apiName FIND GROUP NAME
 * @apiVersion 1.0.0
 */
app.get(func.urlCons.URL_POST_GROUP_NAME, func.validateRole, async function (req, res, next) {
func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_GROUP_NAME, func.logCons.LOG_ENTER)
const orgNameMap = func.getUrlMap(req)
const env = req.query[func.urlCons.PARAM_ENV]
try {
  func.printLog(func.logCons.LOG_LEVEL_INFO, ` find group name`)
  const groupName = req.query[func.dbCons.UNIVERSITY_GROUP_NAME]
  const results = await groupAssignedNameHelpers.findGroupName(groupName, orgNameMap, env)
  res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
  next()
} catch (err) {
  res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
  next()
}
func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_GROUP_NAME, func.logCons.LOG_EXIT)
})

/**
 * @api {post} /hirest/v1/getGroupNameFromDateAndDesignation
 * @apiName GET GROUP NAME BASED ON DATE AND DESIGNATION
 * @apiVersion 1.0.0
 */
app.post(func.urlCons.URL_POST_GET_GROUPNAME_FROM_DATE_AND_DESIGNATION,func.validateRole, async function (req, res, next) {
func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_GET_GROUPNAME_FROM_DATE_AND_DESIGNATION, func.logCons.LOG_ENTER)
const orgNameMap = func.getUrlMap(req)
const env = req.query[func.urlCons.PARAM_ENV]
try {
 func.printLog(func.logCons.LOG_LEVEL_INFO, ` fetch group name based on dates and designation`)
 const results = await groupAssignedNameHelpers.getGroupNameBasedOnDateAndDesignation(req.body, orgNameMap, env)
 res.status(func.httpStatusCode.OK).send(func.responseGenerator(results, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
 next()
} catch (err) {
 res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
 next()
}
func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_GET_GROUPNAME_FROM_DATE_AND_DESIGNATION, func.logCons.LOG_EXIT)
})

}
