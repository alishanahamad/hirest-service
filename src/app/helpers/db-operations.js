'use strict'
/**
 * Tier for Db Operation
 * @type {[type]}
 */
const func = require('../utils/functions')
const crypto = require('./crypto-client')
const DbOperationCore = require('./db-operations-core').DbOperation
const dbOp = new DbOperationCore()
const dbConfig = func.config.get('database')
const ENUM_ENC = 'enc'
const ENUM_DEC = 'dec'
// ////////////constructor
function DbOperation () {}
/**
 * this method will genrate json object for query
 * example-1  var key = 'survey_id', op ='$eq', value = 3
 *  => { field: 'survey_id', op: '$eq', rvalue: 3 }
 *
 * example-2  var key = 'survey_id', op ='$eq', value = [3,4]
 *  => { field: 'survey_id', op: '$eq', values: [3,4] }
 *
 * example-3  var key = 'survey_response_options', op ='$in', value = 'survey_option_id'
 *  => { field: 'survey_response_options', op: '$in', rfield: 'survey_option_id' }
 *
 * @param {String} key value of the field param of json (use db-constants FIELD_)
 * @param {String} op operation name (use lighblue constants OP_)
 * @param {String|Array} value
 *            if value is String then it will take field name as
 *            rvalue/rfield if value is array then it will take field name as
 *            values
 * @return {Json} query
 */
DbOperation.prototype.getQueryJsonForOp = function getQueryJsonForOp (key, op, value) {
  return dbOp.getQueryJsonForOp(key, op, value)
}
/**
 * this method will genrate json object for projection
 *
 *  example-1  var fieldName = 'survey_id', include =true, recursive = false
 *  => { field: 'survey_id', include: true, recursive: false }
 *
 * @param {String} fieldName use db-constants for field name (FIELD_)
 * @param {Boolean} isInclude
 * @param {Boolean} isRecursive
 * @return {Json} projection
 */
DbOperation.prototype.getProjectionJson = function getProjectionJson (fieldName, isInclude, isRecursive) {
  return dbOp.getProjectionJson(fieldName, isInclude, isRecursive)
}

/**
 * this method will genrate json object for operation
 *
 *  example-1  var opName = '$set', jsonToAdd = { 'survey_id': 1}
 *  => { '$set': { 'survey_id': 1 } }
 *
 *  example-2  var opName = '$and',
 *      jsonToAdd = [
 *                      { field: 'survey_id', op: '$eq', rvalue: 3 },
 *                    { field: 'user_id', op: '$eq', rvalue: 12 }
 *                    ]
 *  => {
 *          '$and': [
 *                  { field: 'survey_id', op: '$eq', rvalue: 3 },
 *                  { field: 'user_id', op: '$eq', rvalue: 12 }
 *                ]
 *      }
 *
 *  example-1  var updateJson
 *  => { field: 'survey_id', include: true, recursive: false }
 *
 * @param {String} op (lightBlueCons OP_)
 * @param {Array|Json} jsonToAdd
 */
DbOperation.prototype.getOperationJson = function getOperationJson (op, jsonToAdd) {
  return dbOp.getOperationJson(op, jsonToAdd)
}
/**
 * this method will return current ids for auto incr mention in projection
 *
 * @param {Array} projection of ids that you want use for auto increment
 * @param {Function} callback
 *
 * @return ids mention in projection
 */
DbOperation.prototype.getSequenceIds = function (projection, callback) {
  return dbOp.getSequenceIds(projection, callback)
}

/**
 * this method will update sequence ids for auto increment values
 *
 * @param {Array|Object}
 *            jsonArrayOfSequesnseIds
 */
DbOperation.prototype.updateSequesnceIds = function (jsonArrayOfSequesnseIds, callback) {
  return dbOp.updateSequesnceIds(jsonArrayOfSequesnseIds, callback)
}
/**
 * find data for given key and value from given collection name
 * example-1  var key = 'survey_id', op ='$eq', value = 3, collection = '{name: survey_quetion, version: 1.0.0}'
 * example-2  var projection = {}
 *
 * @param {String} key use db-constants for field name (FIELD_)
 * @param {String} op use lighblue-constants (OP_)
 * @param {String|Integer} value
 * @param {JSON} collection use db-constants for collection name (COLLECTION_)
 * @param {Array|Function} projection
 * @param {Function} callback
 */
DbOperation.prototype.findByKey = async function (key, op, value, urlMap, collection, projection, callback) {
  const orgName = urlMap[func.urlCons.PARAM_ORG_NAME] + '_' + urlMap[func.urlCons.PARAM_DOMAIN_NAME]
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'try to find by:' + key + ' of value:' + value + ' collection=' + JSON.stringify(collection) + ' orgName=' + orgName + ' projection=' + projection)
  this.findByQuery(this.getQueryJsonForOp(key, op, value), urlMap, collection, projection, callback)
  // this.findByQuery(query, urlMap, collection, projection, callback)
}
/**
 * find data for given query in given collection name
 * var query= { 'array': 'rule_criteria',
 *                    'elemMatch': {
 *                        '$and': [
 *                            {
 *                              'field': 'question_id',
 *                              'op': '$eq',
 *                              'rvalue': 1
 *                            },
 *                            {
 *                              'field': 'response_option_id',
 *                              'op': '$eq',
 *                              'rvalue': 2001
 *                            }
 *                          ]
 *                 }
 *               }
 *    var projection={ field: 'survey_id', include: true, recursive: false }
 *
 * @param {Json} query (use getQueryJsonForOp() method)
 * @param {Json} collection use db-constants (COLLECTION_)
 * @param {Array|Function} projection use getCommonProjection() or getProjectionJson()
 * @param {Function} callback
 */
DbOperation.prototype.findByQuery = async function (query, urlMap, collection, projection, callback) {
  // let isKeyEncField = await crypto.checkFields(key, value, urlMap)
  const collectionMap = getCollectionMap(collection)
  let cryptoQuery = await crypto.getCryptoQuery(query, urlMap, collectionMap)
  const decryptedResponse = async (error, retrivedData) => {
    if (error) {
      return callback(error)
    }
    const cryptoType = ENUM_DEC
    const cryptoPayload = await crypto.getCryptoPayload(cryptoType, retrivedData, urlMap, collectionMap[func.lightBlueCons.PARAM_NAME])
    let finalResponse
    if (cryptoPayload.isCryptoRequired) {
      finalResponse = cryptoPayload.data
    } else {
      finalResponse = retrivedData
    }
    callback(null, finalResponse)
  }
  dbOp.findByQuery(cryptoQuery, urlMap, collection, projection, decryptedResponse)
}
/**
 * update data for given query in given collection name
 *
 * @param {Json} query (use getQueryJsonForOp() method)
 * @param {String} collection use db-constants (COLLECTION_)
 * @param {Json} updateJson (use getUpdateJson() or getOperationJson() method)
 * @param {Array|Function} projection use getCommonProjection() or getProjectionJson()
 * @param {Function} callback
 */
DbOperation.prototype.update = async function (query, urlMap, collection, updateJson, projection, callback) {
  // PRE Action to Crypto
  const collectionMap = getCollectionMap(collection)
  let cryptoQuery = await crypto.getCryptoQuery(query, urlMap, collectionMap)
  const originalData = func.convertIntoArray(updateJson[func.lightBlueCons.OP_SET])
  let dbPayload
  let cipherFields
  const cryptoType = ENUM_ENC
  const cipherData = await crypto.getCryptoPayload(cryptoType, func.convertIntoArray(originalData), urlMap, collectionMap[func.lightBlueCons.PARAM_NAME])
  if (cipherData.isCryptoRequired) {
    dbPayload = cipherData.data
    cipherFields = cipherData.fields
  } else {
    dbPayload = originalData
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `data will updated in database = ${JSON.stringify(dbPayload[0])}`)
  updateJson[func.lightBlueCons.OP_SET] = dbPayload[0]
  // POST Action to Crypto
  const decryptedResponse = async (error, updateResponse) => {
    if (error) {
      return callback(error)
    }
    let finalResponse
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `cipher fields = ${JSON.stringify(cipherFields)}`)
    if (cipherData.isCryptoRequired === true) {
      const cryptoType = ENUM_DEC
      const cryptoPayload = await crypto.getCryptoPayload(cryptoType, updateResponse, urlMap, collectionMap[func.lightBlueCons.PARAM_NAME])
      finalResponse = cryptoPayload.data
    } else {
      finalResponse = updateResponse
    }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `finalResponse = ${JSON.stringify(finalResponse)}`)
    callback(null, finalResponse)
  }
  dbOp.update(cryptoQuery, urlMap, collection, updateJson, projection, decryptedResponse)
}
/**
 * insert data in given collection name
 * @param {String} collection use db-constants (COLLECTION_)
 * @param {Array} data
 * @param {Array|Function} projection use getCommonProjection() or getProjectionJson()
 * @param {Function} callback
 */
DbOperation.prototype.insert = async function (urlMap, collection, data, size, projection, callback) {
  // Use for encryption part, variable declartion and intialization
  const collectionMap = getCollectionMap(collection)
  const originalData = func.cloneJsonObject(data)
  let dbPayload
  let cipherFields
  const cryptoType = ENUM_ENC
  const cipherData = await crypto.getCryptoPayload(cryptoType, func.convertIntoArray(data), urlMap, collectionMap[func.lightBlueCons.PARAM_NAME])
  if (cipherData.isCryptoRequired) {
    dbPayload = cipherData.data
    cipherFields = cipherData.fields
  } else {
    dbPayload = originalData
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `data will store in database = ${JSON.stringify(dbPayload)}`)
  if (isNaN(size)) {
    callback = projection
    projection = size
    size = dbConfig.batch_insert
  } else {
    size = size > 0
      ? size
      : dbConfig.batch_insert
  }
  const decryptedResponse = async (error, insertedData) => {
    if (error) {
      return callback(error)
    }
    let finalResponse
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `cipher fields = ${JSON.stringify(cipherFields)}`)
    if (cipherData.isCryptoRequired === true) {
      const cryptoType = ENUM_DEC
      const cryptoPayload = await crypto.getCryptoPayload(cryptoType, insertedData, urlMap, collectionMap[func.lightBlueCons.PARAM_NAME])
      finalResponse = cryptoPayload.data
    } else {
      finalResponse = insertedData
    }
    callback(null, finalResponse)
  }
  dbOp.insert(urlMap, collection, dbPayload, size, projection, decryptedResponse)
}

/**
 * delete data from given collection name
 *
 * @param {Json} query
 * @param {Json} urlMap
 * @param {String} collection
 * @param {Function} callback
 */
DbOperation.prototype.delete = async function (query, urlMap, collection, callback) {
  const collectionMap = getCollectionMap(collection)
  let cryptoQuery = await crypto.getCryptoQuery(query, urlMap, collectionMap)
  dbOp.delete(cryptoQuery, urlMap, collection, callback)
}

/**
 * update or insert
 * @param {String} collection use db-constants (COLLECTION_)
 * @param {Array} data
 * @param {Array|Function} projection use getCommonProjection() or getProjectionJson()
 * @param {Function} callback
 */
DbOperation.prototype.save = async function (urlMap, collection, data, projection, callback) {
  // Use for encryption part, variable declartion and intialization
  const collectionMap = getCollectionMap(collection)
  const originalData = func.cloneJsonObject(data)
  let dbPayload
  let cipherFields
  const cryptoType = ENUM_ENC
  const cipherData = await crypto.getCryptoPayload(cryptoType, func.convertIntoArray(data), urlMap, collectionMap[func.lightBlueCons.PARAM_NAME])
  if (cipherData.isCryptoRequired) {
    dbPayload = cipherData.data
    cipherFields = cipherData.fields
  } else {
    dbPayload = originalData
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `data will store in database = ${JSON.stringify(dbPayload)}`)
  const decryptedResponse = async (error, insertedData) => {
    if (error) {
      return callback(error)
    }
    let finalResponse
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `cipher fields = ${JSON.stringify(cipherFields)}`)
    if (cipherData.isCryptoRequired === true) {
      const cryptoType = ENUM_DEC
      const cryptoPayload = await crypto.getCryptoPayload(cryptoType, insertedData, urlMap, collectionMap[func.lightBlueCons.PARAM_NAME])
      finalResponse = cryptoPayload.data
    } else {
      finalResponse = insertedData
    }
    callback(null, finalResponse)
  }
  dbOp.save(urlMap, collection, data, projection, decryptedResponse)
}
/**
 * Common projection for collection
 */
DbOperation.prototype.getCommonProjection = function () {
  return dbOp.getCommonProjection()
}
// / /////////////////////////////////
/**
 * this method will genrate query for JSON Array
 * example-1  var key = 'survey_id', op ='$any', values = [3,4]
 *  => { array: 'survey_id', contains: '$any', values: [3,4] }
 *
 * @param {String} key value of the array param of json (use db-constants FIELD_)
 * @param {String} op operation name (use lighblue constants OP_)
 * @param {Array} value
 * Value of array will take field name as values
 * @return {Json} query
 */
DbOperation.prototype.getQueryJsonArrayForOp = function (key, op, value) {
  return dbOp.getQueryJsonArrayForOp(key, op, value)
}

/**
 * this method will genrate query for JSON object which is in the JSON Array
 * example-1  var arrayValue = 'survey_id', elemMatchValue ='$any'
 *  => { array: 'survey_id', contains: '$any', values: [3,4] }
 *
 * @param {String} arrayValue value of the arrayValue param of json (use db-constants FIELD_)
 * @param {Json} elemMatchValue
 * Value of elemMatchValue will take JSON query for match element of array
 * @return {Json} query
 */
DbOperation.prototype.getQueryJsonArrayForElementValue = function (arrayValue, elemMatchValue) {
  return dbOp.getQueryJsonArrayForElementValue(arrayValue, elemMatchValue)
}

/**
 * USED For Pinging the lighblue Server
 * @param  {Function} callback [description]
 * @return {[type]}            [description]
 */
DbOperation.prototype.callTestServiceStatus = function (callback) {
  dbOp.callTestServiceStatus(callback)
}

/**
 * return the collection object to set name and version
 *
 * @param {JSON|String} collection {'name': 'survey_details', version: '1.0.0'}
 */
DbOperation.prototype.setCollectionJson = function (name, version) {
  return dbOp.setCollectionJson(name, version)
}

/**
 * [getCollectionMap description]
 * @param  {[type]} collection [description]
 * @return {[type]}            [description]
 */
function getCollectionMap (collection) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCollectionMap()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'collection' + JSON.stringify(collection))
  var collectionMap = {}
  collectionMap[func.lightBlueCons.PARAM_NAME] = ''
  collectionMap[func.lightBlueCons.PARAM_VERSION] = ''
  if (typeof collection !== 'object') {
    collectionMap[func.lightBlueCons.PARAM_NAME] = collection
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'default version get selected!')
    collectionMap[func.lightBlueCons.PARAM_VERSION] = dbConfig[func.configCons.DEFAULT_METADATA_VERSION]
  } else {
    collectionMap[func.lightBlueCons.PARAM_NAME] = collection[func.lightBlueCons.PARAM_NAME]
    collectionMap[func.lightBlueCons.PARAM_VERSION] = (!collection[func.lightBlueCons.PARAM_VERSION])
      ? dbConfig[func.configCons.DEFAULT_METADATA_VERSION]
      : collection[func.lightBlueCons.PARAM_VERSION]
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCollectionMap()', func.logCons.LOG_EXIT)
  return collectionMap
}

exports.DbOperation = DbOperation
