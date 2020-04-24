'use strict'
const func = require('../utils/functions')
const AssessmentCandidateDetails = require('../helpers/assessment-candidate-details-helpers.js').AssessmentCandidateDetails
const assessmentCandidateDetails = new AssessmentCandidateDetails()
const ROUTE_CONS = 'HI_UCDR_'

module.exports = function (app) {
  /**
   * @api {post} /hirest/v1/add/candidate/assessment
   * @apiName add candidate assessment
   * @apiVersion 1.0.0
   */
app.post(func.urlCons.URL_POST_ADD_CANDIDATE_ASSESSMENT, async function (req, res, next) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_ADD_CANDIDATE_ASSESSMENT, func.logCons.LOG_ENTER)
  const orgNameMap = func.getUrlMap(req)
  try {
    func.printLog(func.logCons.LOG_LEVEL_INFO, `add candidate assessment`)
    const results = await assessmentCandidateDetails.addCandidateAssessment(req.body, orgNameMap)
    res.status(func.httpStatusCode.OK).send(func.responseGenerator(results, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
    next()
  } catch (err) {
    res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
    next()
  }
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_ADD_CANDIDATE_ASSESSMENT, func.logCons.LOG_EXIT)
})
app.post(func.urlCons.URL_GET_ASSESSMENT_CANDIDATE_DETAILS, async function (req, res, next) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_ASSESSMENT_CANDIDATE_DETAILS, func.logCons.LOG_ENTER)
  const orgNameMap = func.getUrlMap(req)
  try {
    func.printLog(func.logCons.LOG_LEVEL_INFO, `add candidate assessment`)
    let body = req.body
    const results = await assessmentCandidateDetails.getCandidateAssessment(body, orgNameMap)
    res.status(func.httpStatusCode.OK).send(func.responseGenerator(results, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
    next()
  } catch (err) {
    res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
    next()
  }
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_GET_ASSESSMENT_CANDIDATE_DETAILS, func.logCons.LOG_EXIT)
})
app.post(func.urlCons.URL_POST_EDIT_ASSESSMENT_CANDIDATE_DETAILS, async function (req, res, next) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_EDIT_ASSESSMENT_CANDIDATE_DETAILS, func.logCons.LOG_ENTER)
  const orgNameMap = func.getUrlMap(req)
  const body = req.body
  try {
    func.printLog(func.logCons.LOG_LEVEL_INFO, `add candidate assessment`)
    const results = await assessmentCandidateDetails.editCandidateAssessment(body, orgNameMap)
    res.status(func.httpStatusCode.OK).send(func.responseGenerator(results, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
    next()
  } catch (err) {
    res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
    next()
  }
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_EDIT_ASSESSMENT_CANDIDATE_DETAILS, func.logCons.LOG_EXIT)
})
app.post(func.urlCons.URL_POST_DELETE_ASSESSMENT_CANDIDATE_DETAILS, async function (req, res, next) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_DELETE_ASSESSMENT_CANDIDATE_DETAILS, func.logCons.LOG_ENTER)
  try {
    const orgNameMap = func.getUrlMap(req)
    const candidateHistoryId = req.headers.candidate_history_id
    func.printLog(func.logCons.LOG_LEVEL_INFO, `add candidate assessment`)
    const results = await assessmentCandidateDetails.deleteCandidateAssessment(candidateHistoryId, orgNameMap)
    res.status(func.httpStatusCode.OK).send(func.responseGenerator(results, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
    next()
  } catch (err) {
    res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
    next()
  }
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_DELETE_ASSESSMENT_CANDIDATE_DETAILS, func.logCons.LOG_EXIT)
})
}
