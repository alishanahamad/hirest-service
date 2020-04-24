'use strict'
const func = require('../utils/functions')
const EditDesignExamHelpers = require('../helpers/edit-design-exam-helpers.js').EditDesignExamHelpers
const editDesignExamHelpers = new EditDesignExamHelpers()
const ROUTE_CONS = 'HI_UCDR_'

module.exports = function (app) {
  /**
   * @api {post} /hirest/v1/edit/design/exam
   * @apiName edit design exam
   * @apiVersion 1.0.0
   */
app.post(func.urlCons.URL_POST_EDIT_EXAM_DETAILS, async function (req, res, next) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_EDIT_EXAM_DETAILS, func.logCons.LOG_ENTER)
  const orgNameMap = func.getUrlMap(req)
  try {
    func.printLog(func.logCons.LOG_LEVEL_INFO, `edit design exam`)
    const results = await editDesignExamHelpers.editDesignExam(req.body, orgNameMap)
    res.status(func.httpStatusCode.OK).send(func.responseGenerator(results, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
    next()
  } catch (err) {
    res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
    next()
  }
  func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_EDIT_EXAM_DETAILS, func.logCons.LOG_EXIT)
})
}
