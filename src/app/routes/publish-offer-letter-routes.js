/**
 * The <code>publish-offer-letter.js </code> use to publish offer letter for given data
 *
 * @author Harshil Kothari
 */

var func = require('../utils/functions')
var dbConfig = func.config.get('database')
PublishOfferLetter = require('../helpers/publish-offer-letter-helpers').PublishOfferLetter
var publishOfferLetter = new PublishOfferLetter()
const ROUTER_CONS = "HS_POL_"
module.exports = function(app) {
  /**
   * @api {post} /hirest/v1/publishOfferLetter
   * @apiName PUBLISH OFFER LETTER FOR CANDIDATES
   * @apiVersion 1.0.0
   */
  app.post(func.urlCons.URL_PUBLISH_OFFER_LETTER, func.validateRole, async function(req, res, next) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_PUBLISH_OFFER_LETTER, func.logCons.LOG_ENTER)
    const orgNameMap = func.getUrlMap(req)
    const env = req.query[func.urlCons.PARAM_ENV]
    const userCode = req.headers[func.urlCons.PARAM_USER_CODE]
    // const stage = Number(req.params[func.dbCons.COLLECTION_JSON_STAGE])
    try {
      func.printLog(func.logCons.LOG_LEVEL_INFO, `publish offer letter where request body is = ${req.body}`)
      const results = await publishOfferLetter.publishOfferLetter(userCode, req.body, orgNameMap, env)
      res.status(func.httpStatusCode.OK).send(func.responseGenerator(results, ROUTER_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
      next()
    } catch (err) {
      console.log(err)
      res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
      next()
    }
    func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_PUBLISH_OFFER_LETTER, func.logCons.LOG_EXIT)
  })
};
