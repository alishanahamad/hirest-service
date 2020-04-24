'use strict'

const func = require('../utils/functions')
const CandidateBioDataHelpers = require('../helpers/candidate-bio-data-register-helpers.js').CandidateBioDataHelpers
const candidateBioDataHelpers = new CandidateBioDataHelpers()
const ROUTE_CONS = 'HI_CBDR_'

module.exports = function(app) {
  /**
   * @api {post} /hirest/v1/bioDataforCandidate
   * @apiName POST REGISTER BIO DATA DETAILS FOR CANDIDATES
   * @apiVersion 1.0.0
   */
  app.post(func.urlCons.URL_POST_CANDIDATE_BIO_DATA_REGISTER, func.validateRole, async function(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_CANDIDATE_BIO_DATA_REGISTER, func.logCons.LOG_ENTER)
    const orgNameMap = func.getUrlMap(req)
    const env = req.query[func.urlCons.PARAM_ENV]
    var userCode = req.headers[func.dbCons.FIELD_USER_CODE]
    func.printLog(func.logCons.LOG_LEVEL_INFO, `register bio data details where request body is = ${req.body}`)
    try {
      const results = await candidateBioDataHelpers.registerCandidate(req.body, userCode, orgNameMap, env)
      res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
      next()
    } catch (err) {
      res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
      next()
    }
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_CANDIDATE_BIO_DATA_REGISTER, func.logCons.LOG_EXIT)
  })
  app.get(func.urlCons.URL_GET_BIO_DETAILS, func.validateRole, async function(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_BIO_DETAILS, func.logCons.LOG_ENTER)
    const orgNameMap = func.getUrlMap(req)
    const env = req.query[func.urlCons.PARAM_ENV]
    let message
    var userCode = req.params[func.dbCons.FIELD_USER_CODE]
    try {
      func.printLog(func.logCons.LOG_LEVEL_INFO, `get  biodata details`)
      const results = await candidateBioDataHelpers.getBioDataDetails(userCode, orgNameMap, env)
      if (results.data[func.dbCons.BIODATA_DETAILS] === undefined) {
        message = func.msgCons.NO_BIO_DATA_DETAILS_NOT_FOUND
      } else {
        message = func.msgCons.BIO_DATA_DETAILS_FOUND
      }
      res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, message, results.errors))
      next()
    } catch (err) {
      res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
      next()
    }
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_BIO_DETAILS, func.logCons.LOG_EXIT)
  })
  app.post(func.urlCons.URL_UPDATE_BIO_DATA_FORM, func.validateRole, async function(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_UPDATE_BIO_DATA_FORM, func.logCons.LOG_ENTER)
    const orgNameMap = func.getUrlMap(req)
    const env = req.query[func.urlCons.PARAM_ENV]
    let userCode = req.headers[func.dbCons.FIELD_USER_CODE]
    let message
    try {
      func.printLog(func.logCons.LOG_LEVEL_INFO, `update biodata details`)
      const results = await candidateBioDataHelpers.updateBioDataDetails(req.body, userCode, orgNameMap, env)
      console.log(results)
      if (results.data[func.dbCons.FIELD_UPDATE_DETAILS] === undefined) {
        message = func.msgCons.NO_BIO_DATA_DETAILS_NOT_FOUND
      } else {
        message = func.msgCons.BIO_DATA_UPDATED_SUCCESSFULLY
      }
      res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, message, results.errors))
      next()
    } catch (err) {
      console.log(err)
      res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
      next()
    }
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_UPDATE_BIO_DATA_FORM, func.logCons.LOG_EXIT)
  })
}
