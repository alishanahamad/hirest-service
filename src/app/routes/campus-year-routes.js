'use strict'

const func = require('../utils/functions')
const CampusYearHelpers = require('../helpers/campus-year-helpers.js').CampusYearHelpers
const campusYearHelpers = new CampusYearHelpers()
const ROUTE_CONS = 'HI_CYR_'

module.exports = function (app) {
  /**
   * @api {post} /hirest/v1/getCampusYear
   * @apiName GET CAMPUS YEAR BASED ON INSTITUTE NAME AND STAGE
   * @apiVersion 1.0.0
   */
  app.get(func.urlCons.URL_GET_CAMPUS_YEAR, func.validateRole, async function (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_CAMPUS_YEAR, func.logCons.LOG_ENTER)
    const orgNameMap = func.getUrlMap(req)
    const env = req.query[func.urlCons.PARAM_ENV]
    const instituteName = req.query[func.dbCons.FIELD_INSTITUTE_NAME]
    const stage = req.query[func.dbCons.COLLECTION_JSON_STAGE]
    const roundType = req.query[func.dbCons.FIELD_ROUND_TYPE]
    try {
      func.printLog(func.logCons.LOG_LEVEL_INFO, ` fetch campus year of institute name = ${instituteName} and stage = ${stage}`)
      const results = await campusYearHelpers.getCampusYearFromInstituteName(instituteName, roundType, stage, orgNameMap, env)
      res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
      next()
    } catch (err) {
      res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
      next()
    }
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_CAMPUS_YEAR, func.logCons.LOG_EXIT)
  })

  app.get(func.urlCons.URL_GET_DEFAULT_CAMPUS_YEARS,  func.validateRole, async function (req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_CAMPUS_YEAR_V2, func.logCons.LOG_ENTER)
    const orgNameMap = func.getUrlMap(req)
    const env = req.query[func.urlCons.PARAM_ENV]
    try {
      func.printLog(func.logCons.LOG_LEVEL_INFO, `fetch all campus year present in database`)
      const results = await campusYearHelpers.getCampusYear(orgNameMap, env)
      res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
      next()
    } catch (err) {
      res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
      next()
    }
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_CAMPUS_YEAR, func.logCons.LOG_EXIT)
  })
}
