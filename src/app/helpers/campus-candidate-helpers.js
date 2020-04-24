var func = require('../utils/functions')
var async = require('async')
var dbOp
var HELPERS_CONST_STATUS = 'HS_UDH_'

function CampusCandidateHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of user details helper')
  DbOperation = require('./db-operations').DbOperation
  dbOp = new DbOperation()
}
CampusCandidateHelpers.prototype.campusCandidateDetails = function(campusDriveId, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'campusCandidateDetails()', func.logCons.LOG_ENTER);
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.CAMPUS_SOURCE_DETAILS_CAMPUS_ID, func.lightBlueCons.OP_EQUAL, campusDriveId), orgNameMap, func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true), function(error, candidateSourceResponse) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while geting campus source details = ' + JSON.stringify(error))
      return callback(new Error().stack)
    } else if (candidateSourceResponse.length === 0) {

      func.printLog(func.logCons.LOG_LEVEL_INFO, func.msgCons.ERROR_MSG_NO_CANDIDATE_SOURCE_DETAILS_NOT_RETRIEVED)
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPERS_CONST_STATUS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_NO_CANDIDATE_SOURCE_DETAILS_NOT_RETRIEVED), HELPERS_CONST_STATUS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.SUCCESS_MSG_USER_DETAILS_NOT_FOUND));
    } else {
      let query = []
      query.push(dbOp.getQueryJsonForOp(func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_EQUAL, candidateSourceResponse[0]['id']))
      query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_NOT_EQUAL, func.dbCons.ENUM_CANDIDATE_EXAM_PUBLISHED))
      dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, dbOp.getProjectionJson(func.dbCons.COLLECTION_JSON_USER_ID, true, true), function(error, candidateDetailResponse) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while geting campus source details = ' + JSON.stringify(error))
          return callback(new Error().stack)
        } else if (candidateDetailResponse.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, func.msgCons.ERROR_MSG_NO_CANDIDATE_SOURCE_DETAILS_NOT_RETRIEVED)
          return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPERS_CONST_STATUS + func.msgCons.CODE_SERVER_OK, func.msgCons.ERROR_MSG_NO_CANDIDATE_SOURCE_DETAILS_NOT_RETRIEVED), HELPERS_CONST_STATUS + func.msgCons.CODE_SERVER_OK, func.msgCons.ERROR_MSG_NO_CANDIDATE_SOURCE_DETAILS_NOT_RETRIEVED));
        } else {
          var respJSONArray = []
          async.forEachOf(candidateDetailResponse, function(item, key, callbackinnerIns) {
            var responseJson = {};
            dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, item[func.dbCons.FIELD_USER_ID]), orgNameMap, func.dbCons.COLLECTION_USER_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function(error, userDetailResponse) {
              if (error) {
                callbackinnerIns()
              } else if (userDetailResponse.length == 0) {
                callbackinnerIns()
              } else {
                userDetailResponse[0][func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_CONTACT] = userDetailResponse[0][func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_CONTACT]

                userDetailResponse[0][func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_USER_EMAIL] = userDetailResponse[0][func.dbCons.FIELD_PROFILE][func.dbCons.FIELD_USER_EMAIL]
                respJSONArray.push(userDetailResponse[0]);
                callbackinnerIns()
              }
            })
          }, function(error) {
            if (error) {

              func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error in async loop' + error)
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'error in async loop ', func.logCons.LOG_EXIT)
              return callback(new Error().stack);
            } else {
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'campus candidate detail ', func.logCons.LOG_EXIT)
              return callback(null, func.responseGenerator(respJSONArray, HELPERS_CONST_STATUS + func.msgCons.CODE_SERVER_OK, func.msgCons.SUCCESS_MSG_USER_DETAILS_RETRIVED))
            }
          })
        }
      })
    }
  })

  func.printLog(func.logCons.LOG_LEVEL_INFO, 'campusCandidateDetails()', func.logCons.LOG_EXIT);


}


exports.CampusCandidateHelpers = CampusCandidateHelpers
