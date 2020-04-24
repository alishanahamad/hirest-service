var async = require('async')
var Client = require('node-rest-client').Client
var client = new Client()
var http = require('http')
var func = require('../utils/functions')
var dbConfig = func.config.get('database')
var db = null
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
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getQueryJsonForOp()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'key=' + key + ' op=' + op + ' value=' + value)
  var query = {}
  query[func.lightBlueCons.FIELD_FIELD] = key
  query[func.lightBlueCons.FIELD_OP] = op
  var fieldValue = func.lightBlueCons.FIELD_RVALUE
  if (Array.isArray(value)) {
    fieldValue = func.lightBlueCons.FIELD_VALUES
    // field name is values
  } else {
    // field name is rvalue/rfield
    if (op === func.lightBlueCons.OP_IN) {
      fieldValue = func.lightBlueCons.FIELD_RFIELD
    }
  }
  query[fieldValue] = value
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getQueryJsonForOp()', func.logCons.LOG_EXIT)
  return query
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
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionJson()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'fieldName=' + fieldName + ' isInclude=' + isInclude + ' isRecursive=' + isRecursive)
  var projection = {}
  projection[func.lightBlueCons.FIELD_FIELD] = fieldName
  if (typeof isInclude === 'undefined') {
    isInclude = true
  }
  projection[func.lightBlueCons.FIELD_INCLUDE] = isInclude

  if (typeof isRecursive === 'undefined') {
    isRecursive = false
  }
  projection[func.lightBlueCons.FIELD_RECURSIVE] = isRecursive
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'projection:', JSON.stringify(projection))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionJson()', func.logCons.LOG_EXIT)
  return projection
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
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getOperationJson()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'op=' + op + ' jsonToAdd=' + JSON.stringify(jsonToAdd))
  var json = {}
  json[op] = jsonToAdd
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getOperationJson()', func.logCons.LOG_EXIT)
  return json
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
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getSequenceIds()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' projection=' + JSON.stringify(projection))
  if (typeof projection === 'function') {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'projection is callback function')
    callback = projection
    projection = this.getCommonProjection()
  }
  this.findByQuery(this.getQueryJsonForOp(func.dbCons.FIELD__ID, func.lightBlueCons.OP_EQUAL, '5804ba45daeea464f18b5a65'), func.dbCons.COLLECTION_SEQUENCE_DETAIL, projection, function (error, data) {
    if (error) { return callback(error) }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'data:' + JSON.stringify(data))
    callback(null, data)
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getSequenceIds()', func.logCons.LOG_EXIT)
}

/**
 * this method will update sequence ids for auto increment values
 *
 * @param {Array|Object}
 *            jsonArrayOfSequesnseIds
 */
DbOperation.prototype.updateSequesnceIds = function (jsonArrayOfSequesnseIds, callback) {
  // TODO: add update query
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateSequesnceIds()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'jsonArrayOfSequesnseIds=' + JSON.stringify(jsonArrayOfSequesnseIds))
  this.update(this.getQueryJsonForOp(func.dbCons.FIELD__ID, func.lightBlueCons.OP_EQUAL, '5804ba45daeea464f18b5a65'), func.dbCons.COLLECTION_SEQUENCE_DETAIL, this.getOperationJson(func.lightBlueCons.OP_SET, jsonArrayOfSequesnseIds), function (error, result) {
    if (error) { return callback(error) }
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'sequence ids are updated')
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateSequesnceIds()', func.logCons.LOG_EXIT)
    callback(null, result)
  })
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
DbOperation.prototype.findByKey = function (key, op, value, urlMap, collection, projection, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByKey()', func.logCons.LOG_ENTER)
  var orgName = urlMap[func.urlCons.PARAM_ORG_NAME] + '_' + urlMap[func.urlCons.PARAM_DOMAIN_NAME]
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'try to find by:' + key + ' of value:' + value + ' collection=' + JSON.stringify(collection) + ' orgName=' + orgName + ' projection=' + projection)
  this.findByQuery(this.getQueryJsonForOp(key, op, value), urlMap, collection, projection, callback)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByKey()', func.logCons.LOG_EXIT)
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
DbOperation.prototype.findByQuery = function (query, urlMap, collection, projection, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByQuery()', func.logCons.LOG_ENTER)
  var orgName = urlMap[func.urlCons.PARAM_ORG_NAME] + '_' + urlMap[func.urlCons.PARAM_DOMAIN_NAME]
  var collectionMap = getCollectionMap(collection)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'query=' + JSON.stringify(query) + ' orgName=' + orgName + ' collection=' + JSON.stringify(collection) + ' projection=' + JSON.stringify(projection))
  var url = getLightBlueURL(func.lightBlueCons.CRUD_FIND, orgName, collectionMap[func.lightBlueCons.PARAM_NAME], collectionMap[func.lightBlueCons.PARAM_VERSION])
  if (typeof projection === 'function') {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'projection is callback function')
    callback = projection
    projection = this.getCommonProjection()
  }
  find(url, query, projection, callback)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findByQuery()', func.logCons.LOG_EXIT)
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
DbOperation.prototype.update = function (query, urlMap, collection, updateJson, projection, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'update()', func.logCons.LOG_ENTER)
  var orgName = urlMap[func.urlCons.PARAM_ORG_NAME] + '_' + urlMap[func.urlCons.PARAM_DOMAIN_NAME]
  var collectionMap = getCollectionMap(collection)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + 'query=' + JSON.stringify(query) + ' collection=' + JSON.stringify(collection) + ' orgName=' + orgName + ' updateJson=' + JSON.stringify(updateJson) + ' projection=' + JSON.stringify(projection))
  var url = getLightBlueURL(func.lightBlueCons.CRUD_UPDATE, orgName, collectionMap[func.lightBlueCons.PARAM_NAME], collectionMap[func.lightBlueCons.PARAM_VERSION])
  var argsJson = {}
  if (typeof projection === 'function') {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'projection is callback function')
    callback = projection
    argsJson = getJsonForUpdate(query, null, updateJson)
  } else { argsJson = getJsonForUpdate(query, projection, updateJson) }
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'argsJson:' + JSON.stringify(argsJson))
  lightBlueCall(url, argsJson, callback)
} // update by query
/**
 * insert data in given collection name
 * @param {String} collection use db-constants (COLLECTION_)
 * @param {Array} data
 * @param {Array|Function} projection use getCommonProjection() or getProjectionJson()
 * @param {Function} callback
 */
DbOperation.prototype.insert = function (urlMap, collection, data, size, projection, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insert()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' collectio=' + JSON.stringify(collection) + ' data:' + JSON.stringify(data) + ' projection=' + JSON.stringify(projection))
  var orgName = urlMap[func.urlCons.PARAM_ORG_NAME] + '_' + urlMap[func.urlCons.PARAM_DOMAIN_NAME]
  var collectionMap = getCollectionMap(collection)
  var url = getLightBlueURL(func.lightBlueCons.CRUD_INSERT, orgName, collectionMap[func.lightBlueCons.PARAM_NAME], collectionMap[func.lightBlueCons.PARAM_VERSION])
  if (isNaN(size)) {
    callback = projection
    projection = size
    size = dbConfig.batch_insert
  } else {
    size = size > 0
      ? size
      : dbConfig.batch_insert
  }
  // TODO: other possiblity is true(allow batchwise using default batch_insert) or false
  performChunkWiseInsert(url, data, func.lightBlueCons.METHOD_PUT, size, projection, callback)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insert()', func.logCons.LOG_EXIT)
}

/// ////////////delete
DbOperation.prototype.delete = function (query, urlMap, collection, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'delete()', func.logCons.LOG_ENTER)
  var orgName = urlMap[func.urlCons.PARAM_ORG_NAME] + '_' + urlMap[func.urlCons.PARAM_DOMAIN_NAME]
  var collectionMap = getCollectionMap(collection)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' orgName=' + orgName + ' collection=' + JSON.stringify(collection))
  if (!query) {
    callback("query can't be null")
  }
  var url = getLightBlueURL(func.lightBlueCons.CRUD_DELETE, orgName, collectionMap[func.lightBlueCons.PARAM_NAME], collectionMap[func.lightBlueCons.PARAM_VERSION])
  var dataz = {}
  dataz = getJsonForDelete(query)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'data:' + JSON.stringify(dataz))
  lightBlueCall(url, dataz, func.lightBlueCons.METHOD_POST, callback)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'delete()', func.logCons.LOG_EXIT)
}

/**
 * update or insert
 * @param {String} collection use db-constants (COLLECTION_)
 * @param {Array} data
 * @param {Array|Function} projection use getCommonProjection() or getProjectionJson()
 * @param {Function} callback
 */
DbOperation.prototype.save = function (urlMap, collection, data, projection, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'save()', func.logCons.LOG_ENTER)
  var orgName = urlMap[func.urlCons.PARAM_ORG_NAME] + '_' + urlMap[func.urlCons.PARAM_DOMAIN_NAME]
  var collectionMap = getCollectionMap(collection)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' collection=' + JSON.stringify(collection) + ' data:' + JSON.stringify(data) + ' projection=' + JSON.stringify(projection))
  var url = getLightBlueURL(func.lightBlueCons.CRUD_SAVE, orgName, collectionMap[func.lightBlueCons.PARAM_NAME], collectionMap[func.lightBlueCons.PARAM_VERSION])
  var dataz = {}
  if (typeof projection === 'function') {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'projection is callback function')
    callback = projection
    dataz = getJsonForSave(data)
  } else { dataz = getJsonForSave(data, projection) }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'data:' + JSON.stringify(dataz))
  lightBlueCall(url, dataz, callback)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'save()', func.logCons.LOG_EXIT)
}
/**
 * Common projection for collection
 */
DbOperation.prototype.getCommonProjection = function () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCommonProjection()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(this.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true))
  projection.push(this.getProjectionJson(func.dbCons.COMMON_UPDATED_BY, false))
  projection.push(this.getProjectionJson(func.dbCons.COMMON_UPDATED_ON, false))
  projection.push(this.getProjectionJson(func.dbCons.COMMON_CREATED_BY, false))
  projection.push(this.getProjectionJson(func.dbCons.COMMON_CREATED_ON, false))
  projection.push(this.getProjectionJson(func.dbCons.FIELD__ID, false, true))
  projection.push(this.getProjectionJson(func.lightBlueCons.FIELD_OBJECT_TYPE, false))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCommonProjection()', func.logCons.LOG_EXIT)
  return projection
}
/// /////////////////////////////////
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
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getQueryJsonArrayForOp()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' key=' + key + ' op:' + op + ' value=' + value)
  var query = {}
  query[func.lightBlueCons.FIELD_ARRAY] = key
  query[func.lightBlueCons.FIELD_CONTAINS] = op
  query[func.lightBlueCons.FIELD_VALUES] = value
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getQueryJsonArrayForOp()', func.logCons.LOG_EXIT)
  return query
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
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getQueryJsonArrayForElementValue()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' arrayValue=' + arrayValue + ' elemMatchValue:' + JSON.stringify(elemMatchValue))
  var query = {}
  query[func.lightBlueCons.FIELD_ARRAY] = arrayValue
  query[func.lightBlueCons.FIELD_ELEM_MATCH] = elemMatchValue
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getQueryJsonArrayForElementValue()', func.logCons.LOG_EXIT)
  return query
}
/**
 * delete data from given collection name
 *
 * @param {Json} query
 * @param {String} collection
 * @param {Function} callback
 */
DbOperation.prototype.delete = function (query, urlMap, collection, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'delete()', func.logCons.LOG_ENTER)
  var orgName = urlMap[func.urlCons.PARAM_ORG_NAME] + '_' + urlMap[func.urlCons.PARAM_DOMAIN_NAME]
  var collectionMap = getCollectionMap(collection)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' collection=' + JSON.stringify(collection))
  if (!query) {
    callback("query can't be null")
  }
  var url = getLightBlueURL(func.lightBlueCons.CRUD_DELETE, orgName, collection[func.lightBlueCons.PARAM_NAME], collection[func.lightBlueCons.PARAM_VERSION])
  var dataz = {}
  dataz = getJsonForUpdate(query)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'data:' + JSON.stringify(dataz))
  lightBlueCall(url, dataz, func.lightBlueCons.METHOD_POST, callback)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'delete()', func.logCons.LOG_EXIT)
}

DbOperation.prototype.callTestServiceStatus = function (callback) {
  var args = {
    headers: {
      'Content-Type': 'application/json'
    }
  }
  var URL = dbConfig.protocol + '://' + dbConfig.host + ':' + dbConfig.port + func.lightBlueCons.URL_REST_DATA + func.urlCons.URL_TEST_SERVICE
  client.get(URL, args, function (data, response) {
    if (!data) { callback(createResponse(true)) } else if (data[func.dbCons.PARAM_ERROR]) { callback(data) } else { callback(null, data) }
  }).on(func.dbCons.PARAM_ERROR, function (err) {
    callback(createResponse(true))
  })
}

/**
 * return the collection object with name and version
 *
 * @param {JSON|String} collection {'name': 'survey_details', version: '1.0.0'}
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

/**
 * return the collection object to set name and version
 *
 * @param {JSON|String} collection {'name': 'survey_details', version: '1.0.0'}
 */

DbOperation.prototype.setCollectionJson = function (name, version) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'setCollectionJson()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' name=' + name + ' version=' + version)
  var collection = {}
  collection[func.lightBlueCons.PARAM_NAME] = name
  collection[func.lightBlueCons.PARAM_VERSION] = version
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'setCollectionJson()', func.logCons.LOG_EXIT)
  return collection
}

/**
 * find data for given query in given collection name
 *
 * @param {String} url
 * @param {Json} query
 * @param {Array|Function} projection
 * @param {Function} callback
 */
function find (url, query, projection, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'find()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' url=' + url + ' query=' + JSON.stringify(query) + ' projection=' + JSON.stringify(projection))
  let queryWithDefaultCondition = addDefaultConditionInQuery(query)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `queryWithDefaultCondition = ${JSON.stringify(queryWithDefaultCondition)}`)
  var argsJson = getJsonForFind(queryWithDefaultCondition, projection)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'argsJson:' + JSON.stringify(argsJson))
  var responseFromLightBlue = function (error, data) {
    if (error) { return callback(error) }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'return data from lighblue:' + JSON.stringify(data))
    // if (data.length === 1)
    //   return callback(null, data[0]);
    callback(null, data)
  }
  lightBlueCall(url, argsJson, responseFromLightBlue)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'find()', func.logCons.LOG_EXIT)
}
/**
 * @param query
 * append the {is_deleted field as a false}
 */
function addDefaultConditionInQuery (query) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addDefaultConditionInQuery()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `setting default query for = ${JSON.stringify(query)}`)
  let defaultQuery = {}
  if(query === null || !query) {
    defaultQuery = getQueryForIsDeleted()
  } else {
    let isDeletedFieldExist = checkIsDeletedFieldExist(query)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `isDeletedFieldExist = ${JSON.stringify(isDeletedFieldExist)}`)
    if (!isDeletedFieldExist)  {
      defaultQuery[func.lightBlueCons.OP_AND] = []
      defaultQuery[func.lightBlueCons.OP_AND] = [query, getQueryForIsDeleted()]
    } else {
      defaultQuery = query
    }
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `defaultQuery = ${JSON.stringify(defaultQuery)}`)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addDefaultConditionInQuery()', func.logCons.LOG_EXIT)
  return defaultQuery
}

function getQueryForIsDeleted () {
  let isDeleteQueryJson = {}
  isDeleteQueryJson[func.lightBlueCons.FIELD_FIELD] = func.dbCons.COMMON_IS_DELETED
  isDeleteQueryJson[func.lightBlueCons.FIELD_OP] = func.lightBlueCons.OP_EQUAL
  isDeleteQueryJson[func.lightBlueCons.FIELD_RVALUE] = func.dbCons.VALUE_DEFAULT_IS_DELETED
  return isDeleteQueryJson
}

function checkIsDeletedFieldExist (query) {
  if (query.hasOwnProperty(func.lightBlueCons.OP_AND) || query.hasOwnProperty(func.lightBlueCons.OP_OR) || query.hasOwnProperty(func.lightBlueCons.OP_ANY) || query.hasOwnProperty(func.lightBlueCons.OP_ALL) || query.hasOwnProperty(func.lightBlueCons.OP_NOT)) {
    let arrayOpration = Object.keys(query)[0]
    let queryJsons = query[arrayOpration]
    let qFields = queryJsons.map(q => q[func.lightBlueCons.FIELD_FIELD])
    if (qFields.indexOf(func.dbCons.COMMON_IS_DELETED) > -1 ) {
      return true
    } else {
      return false
    }
  } else {
    if (query.hasOwnProperty(func.lightBlueCons.FIELD_FIELD)) {
      return (query[func.lightBlueCons.FIELD_FIELD] === func.dbCons.COMMON_IS_DELETED) ? true : false
    } else {
      return false
    }
  }
}
/**
 * create json for find
 *  example-1  var query = { field: 'survey_id', op: '$eq', rvalue: 3 }
 *             var projection={ field: 'survey_id', include: true, recursive: false }
 *  => {    'query':{ field: 'survey_id', op: '$eq', rvalue: 3 }
 *          'projection':{ field: 'survey_id', include: true, recursive: false }
 *      }
 * @param {Json} query
 * @param {Json} projection
 * @return {Json} findJson
 */
function getJsonForFind (query, projection) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getJsonForFind()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' query=' + JSON.stringify(query) + ' projection=' + JSON.stringify(projection))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getJsonForFind()', func.logCons.LOG_EXIT)
  return getJsonForFindAndUpdate(query, projection)
}

/**
 * create json for update
 *  example-1  var query = { field: 'survey_id', op: '$eq', rvalue: 3 }
 *             var update = { '$set': { 'survey_id': 1 } }
 *  => {    'query':{ field: 'survey_id', op: '$eq', rvalue: 3 }
 *          'update':{ '$set': { 'survey_id': 1 } }
 *      }
 *
 * @param {Json} query
 * @param {Json} projection
 * @param {Json} update
 * @return {Json} updateJson
 */
function getJsonForUpdate (query, projection, update) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getJsonForUpdate()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' query=' + JSON.stringify(query) + ' update=' + JSON.stringify(update))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getJsonForUpdate()', func.logCons.LOG_EXIT)
  return getJsonForFindAndUpdate(query, projection, update)
}
/**
 * create json for find/update
 * @param {Json} query
 * @param {Array} projection
 * @param {Json} update
 * @return {Json} findOrUpdateJson
 */
function getJsonForFindAndUpdate (query, projection, update) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getJsonForFindAndUpdate()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' query=' + JSON.stringify(query) + ' projection=' + projection + ' update=' + JSON.stringify(update))
  var json = {}
  if (query !== null) {
    json[func.lightBlueCons.FIELD_QUERY] = query
  }
  if (projection) { json[func.lightBlueCons.FIELD_PROJECTION] = projection }
  if (update) { json[func.lightBlueCons.FIELD_UPDATE] = update }
  var args = {
    data: json,
    headers: {
      'Content-Type': 'application/json'
    }
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getJsonForFindAndUpdate()', func.logCons.LOG_EXIT)
  return args
}

/**
 * create json for Delete
 * @param {Json} query
 */
function getJsonForDelete (query) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getJsonForDelete()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' query=' + JSON.stringify(query))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getJsonForDelete()', func.logCons.LOG_EXIT)
  return getJsonForFindAndUpdate(query)
}
/**
 * create json for insert
 * @param  {Array} dataz
 * @param {Json} projection
 * @return {Json} insertJson
 */
function getJsonForInsert (dataz, projection) {
  return getJsonForInsertAndSave(dataz, projection)
}

/**
 * create json for save
 * @param  {Array} dataz
 * @param {Json} projection
 * @return {Json} insertJson
 */
function getJsonForSave (dataz, projection) {
  return getJsonForInsertAndSave(dataz, projection, true)
}

/**
 * create json for insert/save
 * @param  {Array} dataz
 * @param {Json} projection
 * @param  {Boolean} isUpsert
 * @return {Json} insertJson
 */
function getJsonForInsertAndSave (dataz, projection, isUpsert) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getJsonForInsertAndSave()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' dataz=' + dataz + ' projection=' + JSON.stringify(projection) + ' isUpsert=' + isUpsert)
  var json = {}
  json[func.lightBlueCons.FIELD_DATA] = dataz
  if (isUpsert) { json[func.lightBlueCons.FIELD_UPSERT] = true }
  if (projection) { json[func.lightBlueCons.FIELD_PROJECTION] = projection }
  var args = {
    data: json,
    headers: {
      'Content-Type': 'application/json'
    }
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getJsonForInsertAndSave()', func.logCons.LOG_EXIT)
  return args
}
// batch_insert
function performChunkWiseInsert (url, data, httpMethod, size, projection, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'performChunkWiseInsert()', func.logCons.LOG_ENTER)
  data = func.convertIntoArray(data)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' url=' + url + ' data=' + JSON.stringify(data) + ' data length=' + data.length + ' httpMethod=' + httpMethod + ' size=' + size)
  var modifiedCount = 0
  var processed = []
  var isProcessed = !(typeof projection === 'function')
  for (var i = 0; i < data.length; i += size) {
    var smallArray = data.slice(i, i + size)
    var dataz = {}
    if (typeof projection === 'function') {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'projection is callback function')
      callback = projection
      dataz = getJsonForInsert(smallArray)
    } else { dataz = getJsonForInsert(smallArray, projection) }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'chunk wise data to insert:' + JSON.stringify(dataz))

    lightBlueCall(url, dataz, httpMethod, function (error, response) {
      if (error) {
        return callback(error)
      }
      if (isProcessed) {
        processed = processed.concat(response)
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'chunk wise data inserted processed=' + processed)
      } else {
        modifiedCount += response
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'chunk wise data inserted modifiedCount=' + modifiedCount)
      }
      if (processed.length === data.length || modifiedCount === data.length) {
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'returning from chunk wise insert')
        return callback(null, (isProcessed
          ? processed
          : modifiedCount))
      }
    })
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'performChunkWiseInsert()', func.logCons.LOG_EXIT)
}

/**
 * this method will genrate url for lightblue call
 * 'http://52.169.219.155:8080/rest/data/?/user_additional_info/1.0.0',
 *
 * @param {String} crudOperationName name the crud operarion
 * @param {String} collectionName name of the collection on which operarions will
 *            perfom (use constants from db-constants file)
 * @param {String} versionNumber number of the version
 */
function getLightBlueURL (crudOperationName, orgName, collectionName, versionNumber) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getLightBlueURL()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' crudOperationName=' + crudOperationName + ' collectionName=' + collectionName + ' orgName=' + orgName + ' versionNumber=' + versionNumber)
  if (!orgName) {
    orgName = dbConfig[func.configCons.FIELD_DEFAULT_ORG_NAME]
  }
  var url = dbConfig[func.configCons.FIELD_PROTOCOL] + '://' + dbConfig[func.configCons.FIELD_HOST] + ':' + dbConfig[func.configCons.FIELD_PORT] + func.lightBlueCons.URL_REST_DATA + crudOperationName + '/' + orgName + '/' + collectionName + '/' + versionNumber
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'lightBlue url=' + url)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getLightBlueURL()', func.logCons.LOG_EXIT)
  return url
}

DbOperation.prototype.callTestServiceStatus = function (callback) {
  var args = {
    headers: {
      'Content-Type': 'application/json'
    }
  }
  var URL = dbConfig[func.configCons.FIELD_PROTOCOL] + '://' + dbConfig[func.configCons.FIELD_HOST] + ':' + dbConfig[func.configCons.FIELD_PORT] + func.lightBlueCons.URL_REST_DATA + func.urlCons.URL_TEST_SERVICE
  client.get(URL, args, function (data, response) {
    if (!data) { callback(createResponse(true)) } else if (data[func.dbCons.PARAM_ERROR]) { callback(data) } else { callback(null, data) }
  }).on(func.dbCons.PARAM_ERROR, function (err) {
    callback(createResponse(true))
  })
}

function createResponse (error) {
  var response = {}
  response[func.dbCons.PARAM_ERROR] = error
  response[func.dbCons.PARAM_STATUS] = func.msgCons.MSG_LIGHTBLUE_DOWN
  return response
}
/**
 * this method will call light blue server for CRUD operation and return
 * response data
 *
 * @param {String} url for calling lighblue REST api
 * @param {String} agrs contains query/projection in data json
 * @param {String} httpMethod name for the operation default value is POST
 * @param {Function} callback this function give reponse from light blue server
 */
function lightBlueCall (url, args, httpMethod, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'lightBlueCall()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' url=' + url + ' args=' + args + 'httpMethod=' + httpMethod)
  if (typeof httpMethod === 'function') {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'httpMethod set as POST')
    callback = httpMethod
    httpMethod = func.lightBlueCons.METHOD_POST
  }
  // FIXME: http is better one and registerMethod concept is increasing the process
  client.registerMethod('lightBlueMethod', url, httpMethod)
  client.methods.lightBlueMethod(args, function (data, response) {
    // FIXME:timeout +  2 times retrieve
    // func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'response=' + response);
    func.printLog(func.logCons.LOG_LEVEL_INFO, data[func.lightBlueCons.FIELD_STATUS] + ':data in lighblue call:' + JSON.stringify(data))
    if (data[func.lightBlueCons.FIELD_STATUS] === func.lightBlueCons.STATUS_ERROR) { callback(new Error('wrong query')) } else if (data[func.lightBlueCons.FIELD_STATUS] === func.lightBlueCons.STATUS_PARTIAL) { handlePartialStatusResponse(data, callback) } else { handleCompleteStatusResponse((args.data.hasOwnProperty(func.lightBlueCons.FIELD_PROJECTION)), data, callback) }
  }).on('error', function (err) {
    callback(new Error('error in lightblue=' + err))
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'lightBlueCall()', func.logCons.LOG_EXIT)
}

function createResponse (error) {
  var response = {}
  response[func.dbCons.PARAM_ERROR] = error
  response[func.dbCons.PARAM_STATUS] = func.msgCons.MSG_LIGHTBLUE_DOWN
  return response
}

// TODO: Update error repsponse object
function handlePartialStatusResponse (data, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'handlePartialStatusResponse()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' data=' + (data))
  var dataErrorsArray = data[func.lightBlueCons.FIELD_DATA_ERRORS]
  var errorsArray = []
  for (var i = 0; i < dataErrorsArray.length; i++) {
    var errors = dataErrorsArray[i][func.lightBlueCons.FIELD_ERRORS]
    for (var j = 0; j < errors.length; j++) {
      var errorJson = {}
      errorJson[func.msgCons.PARAM_ERROR_MSG] = errors[j][func.lightBlueCons.FIELD_ERROR_CODE]
      errorJson[func.msgCons.PARAM_ERROR_DESC] = errors[j][func.lightBlueCons.FIELD_MSG]
      errorsArray.push(errorJson)
    }
  }
  var json = {}
  json[func.msgCons.PARAM_ERROR_STATUS] = true
  json[func.msgCons.PARAM_ERROR_CODE] = func.msgCons.CODE_LIGHBLUE_PARTIAL_ERROR
  json[func.lightBlueCons.FIELD_MODIFIED_COUNT] = data[func.lightBlueCons.FIELD_MODIFIED_COUNT]
  json[func.lightBlueCons.FIELD_ERRORS] = errorsArray
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'handlePartialStatusResponse()', func.logCons.LOG_EXIT)
  return callback(json)
}

function handleCompleteStatusResponse (isProcessed, data, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'handleCompleteStatusResponse()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' isProcessed=' + isProcessed + ' data=' + (data))
  if (data[func.lightBlueCons.FIELD_MODIFIED_COUNT] === 0) {
    if (data.hasOwnProperty(func.lightBlueCons.FIELD_PROCESSED)) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'no error found:' + (data))
      return callback(null, data[func.lightBlueCons.FIELD_PROCESSED])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'no update: ' + JSON.stringify(data))
      return callback(null, 0)
    }
  } else {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'modifiedCount:' + data[func.lightBlueCons.FIELD_MODIFIED_COUNT])
    if (isProcessed) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'projection passed returning processed:' + JSON.stringify(data))
      if (data[func.lightBlueCons.FIELD_PROCESSED]) { return callback(null, data[func.lightBlueCons.FIELD_PROCESSED]) } else { return callback(new Error('data error')) }
    }
    return callback(null, data[func.lightBlueCons.FIELD_MODIFIED_COUNT])
  }
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'not match any condition returning all data from lightblue')
  callback(null, data)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'handleCompleteStatusResponse()', func.logCons.LOG_EXIT)
}

exports.DbOperation = DbOperation

// These are needed for tests
exports.restClient = client
