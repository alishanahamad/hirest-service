var func = require('../utils/functions')

var dbOp
var HELPERS_CONST_STATUS = 'HS_DEH_'
AttributeLookupDetailsHelpers = require('./attribute-lookup-details-helpers').AttributeLookupDetailsHelpers
var attributeLookupDetailsHelpers = new AttributeLookupDetailsHelpers()
function CreateExamHelpers () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of design exam helper')
  DbOperation = require('./db-operations').DbOperation
  dbOp = new DbOperation()
}
CreateExamHelpers.prototype.insertExam = function (urlMap, body, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'insertExamHelpers()', func.logCons.LOG_ENTER)
  dbOp.insert(urlMap, func.dbCons.COLLECTION_EXAM_DETAILS, body, dbOp.getCommonProjection(), function (error, insertResponse) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while inserting exam details = ' + JSON.stringify(error))
      return callback(new Error().stack)
    } else if (insertResponse == 0) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, func.msgCons.ERROR_MSG_NO_EXAM_DETAILS_INSERTED)
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPERS_CONST_STATUS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_NO_EXAM_DETAILS_INSERTED), HELPERS_CONST_STATUS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_NO_EXAM_DETAILS_INSERTED))
    } else {
      var resJson = {}
      resJson[func.msgCons.RESPONSE_EXAM_DETAIL] = insertResponse
      callback(null, func.responseGenerator(resJson, HELPERS_CONST_STATUS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_CREATE_EXAM_INSERTED))
    }
  })

  func.printLog(func.logCons.LOG_LEVEL_INFO, 'insertExamHelpers()', func.logCons.LOG_EXIT)
}

CreateExamHelpers.prototype.getExamTemplateListByChild = function (env, orgNameMap, deptArray, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getExamTemplateListByChild()', func.logCons.LOG_ENTER)

  if (deptArray == 'ALL') {
    var query = null
    getExamDetailsFromDB(query, orgNameMap, callback)
  } else {
    var query = []
    query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ATTRIBUTE_TYPE, func.lightBlueCons.OP_EQUAL, func.dbCons.FIELD_EXAM_TARGET))
    query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ATTRIBUTE_VALUE, func.lightBlueCons.OP_EQUAL, deptArray[0]))
    query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_EQUAL, func.dbCons.FIELD_STATUS_ACTIVE))
    dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, func.dbCons.COLLECTION_LOOKUP_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, lookupDetails) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting lookup details = ' + JSON.stringify(error))
        return callback(new Error().stack)
      } else if (lookupDetails === undefined) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, ' designationLookUpIdArrayUndefined =  ' + JSON.stringify(designationLookUpIdArray))
        callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPERS_CONST_STATUS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_EXAM_DETAILS), HELPERS_CONST_STATUS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_EXAM_DETAILS))
      } else if (lookupDetails.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, ' designationLookUpIdArrayLength =  ' + JSON.stringify(designationLookUpIdArray))
        callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPERS_CONST_STATUS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_EXAM_DETAILS_DATA), HELPERS_CONST_STATUS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_EXAM_DETAILS_DATA))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, ' lookup details =  ' + JSON.stringify(lookupDetails))
        var designationLookUpIdArray = []
        designationLookUpIdArray.push(lookupDetails[0][func.dbCons.FIELD_PARENT_ATTRIBUTE_ID])
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, ' designationLookUpIdArray =  ' + JSON.stringify(designationLookUpIdArray))
        attributeLookupDetailsHelpers.getParentAttributeDetailsByID(designationLookUpIdArray, orgNameMap, env, function (error, response) {
          if (error) {
            return callback(new Error().stack)
          } else {
            if (response.length === 0 || !response) {
              return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPERS_CONST_STATUS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_EXAM_DETAILS_DATA), HELPERS_CONST_STATUS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_EXAM_DETAILS_DATA))
            }
            var lookupDetailsArray = []
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, ' lookupResponse =  ' + JSON.stringify(response))
            lookupDetailsArray.push(response[0][func.dbCons.FIELD_ATTRIBUTE_VALUE])
            query = dbOp.getQueryJsonArrayForOp(func.dbCons.FIELD_TARGET_DEPARTMENT, func.lightBlueCons.OP_ALL, lookupDetailsArray)
            return getExamDetailsFromDB(query, orgNameMap, callback)
          }
        })
      }
    })
  }
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getExamTemplateListByChild()', func.logCons.LOG_EXIT)
}

CreateExamHelpers.prototype.getExamTemplateListByParent = function (env, orgNameMap, deptArray, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getExamTemplateListByParent()', func.logCons.LOG_ENTER)

  if (deptArray == 'ALL') {
    var query = null
    getExamDetailsFromDB(query, orgNameMap, callback)
  } else {
    var query = []
    query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ATTRIBUTE_TYPE, func.lightBlueCons.OP_EQUAL, func.dbCons.FIELD_EXAM_TARGET))
    query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ATTRIBUTE_VALUE, func.lightBlueCons.OP_EQUAL, deptArray[0]))
    query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_EQUAL, func.dbCons.FIELD_STATUS_ACTIVE))
    dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, func.dbCons.COLLECTION_LOOKUP_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, lookupDetails) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting lookup details = ' + JSON.stringify(error))
        return callback(new Error().stack)
      } else if (lookupDetails === undefined) {
        callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPERS_CONST_STATUS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_EXAM_DETAILS), HELPERS_CONST_STATUS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_EXAM_DETAILS))
      } else if (lookupDetails.length === 0) {
        callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPERS_CONST_STATUS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_EXAM_DETAILS_DATA), HELPERS_CONST_STATUS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_EXAM_DETAILS_DATA))
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, ' lookup details =  ' + JSON.stringify(lookupDetails))
        var designationLookUpIdArray = []
        designationLookUpIdArray.push(lookupDetails[0][func.dbCons.FIELD_LOOKUP_DETAILS_ID])
        attributeLookupDetailsHelpers.getParentAttributeDetails(designationLookUpIdArray, orgNameMap, env, function (error, response) {
          if (error) {
            return callback(new Error().stack)
          } else {
            if (response.length === 0 || !response) {
              return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPERS_CONST_STATUS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_EXAM_DETAILS_DATA), HELPERS_CONST_STATUS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_EXAM_DETAILS_DATA))
            }
            var lookupDetailsArray = []
            lookupDetailsArray.push(response[0][func.dbCons.FIELD_ATTRIBUTE_VALUE])
            query = dbOp.getQueryJsonArrayForOp(func.dbCons.FIELD_TARGET_DEPARTMENT, func.lightBlueCons.OP_ALL, lookupDetailsArray)
            return getExamDetailsFromDB(query, orgNameMap, callback)
          }
        })
      }
    })
  }
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getExamTemplateListByParent()', func.logCons.LOG_EXIT)
}
function getExamDetailsFromDB (query, orgNameMap, callback) {
  dbOp.findByQuery(query, orgNameMap, func.dbCons.COLLECTION_EXAM_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting exam templates = ' + JSON.stringify(error))
      return callback(new Error().stack)
    } else if (response == undefined) {
      callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPERS_CONST_STATUS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_EXAM_DETAILS), HELPERS_CONST_STATUS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_EXAM_DETAILS))
    } else if (response.length === 0) {
      callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPERS_CONST_STATUS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_EXAM_DETAILS_DATA), HELPERS_CONST_STATUS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_EXAM_DETAILS_DATA))
    } else {
      callback(null, func.responseGenerator(response, HELPERS_CONST_STATUS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_EXAM_DETAIL_RETRIVED))
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getExamTemplateList()', func.logCons.LOG_EXIT)
}

exports.CreateExamHelpers = CreateExamHelpers
