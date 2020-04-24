'use-strict'
/**
 * The <code> update-design-exam-routes.js</code>
 * @author Leena Patoliya
 */
const func = require('../utils/functions')
const UpdateExamDetails = require('../helpers/update-design-exam-helpers.js').UpdateExamDetails
const updateExamDetails = new UpdateExamDetails()
const ROUTE_CONS = 'HI_UEDR_'

module.exports = function (app) {
    /**
     * @api {post} /hirest/v1/update/exam/data/:id
     * @apiName Update exam data in EXAM_DETAILS
     * @apiVersion 1.0.0
     * @queryParam examId and form data
     */
    app.post(func.urlCons.URL_POST_DELETE_EXAM_DETAILS, async function (req, res, next) {
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_DELETE_EXAM_DETAILS, func.logCons.LOG_ENTER)
        const orgNameMap = func.getUrlMap(req)
        const examID = req.params.id
        try {
            func.printLog(func.logCons.LOG_LEVEL_INFO, `update exam details`)
            const results = await updateExamDetails.updateExamDetails(examID, orgNameMap)
            res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
            next()
        } catch (err) {
            res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
            next()
        }
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_POST_DELETE_EXAM_DETAILS, func.logCons.LOG_EXIT)
    })
}
