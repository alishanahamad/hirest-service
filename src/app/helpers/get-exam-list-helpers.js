var func = require('../utils/functions');
var Client = require('node-rest-client').Client;
var client = new Client();
var async = require('async');
var dbOp;
var candidateSourceId;
var candidateId;
var examIdAndStatusArray = [];
var HELPER_CONS = 'HS_GELH_';
// var examIdAndStatusObject = {};

GetExamListDetailsHelper.prototype.getExamListData = function(userId, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamTemplate()', func.logCons.LOG_ENTER)
  getExamDataForParticularCandidate(userId, urlMap, callback);
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamTemplate()', func.logCons.LOG_EXIT)
}
exports.GetExamListDetailsHelper = GetExamListDetailsHelper;

function GetExamListDetailsHelper() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of get exam list data helper');
  DbOperation = require('./db-operations').DbOperation;
  dbOp = new DbOperation();
}

function getExamDataForParticularCandidate(userId, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside getExamDataForParticularCandidate()', func.logCons.LOG_ENTER)
  callCandidateDetailsCollection(userId, urlMap, function(error, candidateData) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'callCandidateDetailsCollection dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callCandidateDetailsCollection()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, candidateData)
    } else if (!candidateData || candidateData.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callCandidateDetailsCollection()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callCandidateDetailsCollection()', func.logCons.LOG_EXIT)
      callCandidateExamDetailsCollection(candidateData[0][func.dbCons.COLLECTION_CANDIDATE_DETAILS_ID], urlMap, function(error, candidateExamDetailsdata) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'callCandidateExamDetailsCollection dbOperation = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callCandidateExamDetailsCollection()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, candidateExamDetailsdata)
        } else if (!candidateExamDetailsdata || candidateExamDetailsdata.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callCandidateExamDetailsCollection()', func.logCons.LOG_EXIT)
          return callback(null, [])
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callCandidateExamDetailsCollection()', func.logCons.LOG_EXIT)
          async.eachOfSeries(candidateExamDetailsdata, function(value, key, callbackInner) {
            var examIdAndStatusObject = {}
            examIdAndStatusObject[func.msCons.FIELD_CANDIDATE_EXAM_DETAILS_ID] = value[func.dbCons.FIELD_ID]
            examIdAndStatusObject[func.dbCons.FIELD_EXAM_ID] = value[func.dbCons.FIELD_EXAM_ID]
            examIdAndStatusObject[func.dbCons.FIELD_STATUS] = value[func.dbCons.FIELD_STATUS]
            examIdAndStatusArray.push(examIdAndStatusObject)
            callbackInner()
          }, function(error) {
            if (error) {
              return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP))
            } else {
              callExamDetailsCollection(examIdAndStatusArray, urlMap, function(error, examDetailsdata) {
                if (error) {
                  func.printLog(func.logCons.LOG_LEVEL_ERROR, 'callExamDetailsCollection dbOperation = ' + error)
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callExamDetailsCollection()', func.logCons.LOG_EXIT)
                  return callback(new Error().stack, examDetailsdata)
                } else if (!examDetailsdata || examDetailsdata.length === 0) {
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callExamDetailsCollection()', func.logCons.LOG_EXIT)
                  return callback(null, [])
                } else {
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callExamDetailsCollection()', func.logCons.LOG_EXIT)
                  var finalExamCandidateArr = []
                  async.eachOfSeries(examIdAndStatusArray, function(value, key, callbackInner) {
                    // var examStatus = examDetailsdata.filter(function(singleObjectExam) {
                    //   if (singleObjectExam[func.dbCons.FIELD_ID] === value[func.dbCons.FIELD_EXAM_ID]) {
                    //     return singleObjectExam
                    //   }
                    // })
                    const examStatus = func.filterBasedOnValue(examDetailsdata, func.dbCons.FIELD_ID, value[func.dbCons.FIELD_EXAM_ID])
                    examStatus[0][func.dbCons.FIELD_STATUS] = getEnumStatusFromValue(value[func.dbCons.FIELD_STATUS]);
                    examStatus[0][func.msCons.FIELD_CANDIDATE_EXAM_DETAILS_ID] = value[func.msCons.FIELD_CANDIDATE_EXAM_DETAILS_ID]
                    finalExamCandidateArr.push(func.cloneJsonObject(examStatus[0]))
                    callbackInner()
                  }, function(error) {
                    if (error) {
                      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP))
                    } else {
                      exmIdAndStatusObject = {}
                      examIdAndStatusArray = []
                      callback(null, finalExamCandidateArr)
                    }
                  });

                }
              });
            }
          });
        }
      });
    }
  });
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside getExamDataForParticularCandidate()', func.logCons.LOG_EXIT)
}


function callCandidateDetailsCollection(userId, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside callCandidateDetailsCollection()', func.logCons.LOG_ENTER)
  dbOp.findByKey(func.dbCons.FIELD_USER_ID, func.lightBlueCons.OP_EQUAL, userId, urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function(error, candidateDetailsData) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching candidate details = ' + JSON.stringify(error) + 'for user_id: ' + userId)
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'callCandidateExamDetailsCollection dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callCandidateExamDetailsCollection()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, candidateDetailsData)
    } else if (!candidateDetailsData || candidateDetailsData.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'no candidate details for user_id: ' + userId)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callCandidateExamDetailsCollection()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callCandidateExamDetailsCollection()', func.logCons.LOG_EXIT)
      callback(null, candidateDetailsData)
    }
  });
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside callCandidateDetailsCollection()', func.logCons.LOG_EXIT)
}

function getQueryforCandidateExams(candidateId) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getQueryForupdateExamScore()', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.COLLECTION_CANDIDATE_EXAM_DETAILS_CANDIDATE_ID, func.lightBlueCons.OP_EQUAL, candidateId))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_STATUS, func.lightBlueCons.OP_GREATER_THAN, func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_PUBLISHED))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getQueryForupdateExamScore()', func.logCons.LOG_EXIT)
  return dbOp.getOperationJson(func.lightBlueCons.OP_AND, query)
}

function callCandidateExamDetailsCollection(candidateId, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside callCandidateExamDetailsCollection()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(getQueryforCandidateExams(candidateId), urlMap, func.dbCons.COLLECTION_CANDIDATE_EXAM_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function(error, candidateExamDetailsData) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching candidate exam details = ' + JSON.stringify(error) + 'for candidate_id: ' + candidateId + 'and candidate exam_status greater than published')
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callCandidateExamDetailsCollection()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, candidateExamDetailsData)
    } else if (!candidateExamDetailsData || candidateExamDetailsData.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'no candidate exam details = ' + JSON.stringify(error) + 'for candidate_id: ' + candidateId + 'and candidate exam_status greater than published')
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callCandidateExamDetailsCollection()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callCandidateExamDetailsCollection()', func.logCons.LOG_EXIT)
      callback(null, candidateExamDetailsData)
    }
  });
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside callCandidateExamDetailsCollection()', func.logCons.LOG_EXIT)
}

function callExamDetailsCollection(examIdArray, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside callExamDetailsCollection()', func.logCons.LOG_ENTER)
  var examIds = func.getValuesArrayFromJson(func.dbCons.FIELD_EXAM_ID, examIdArray);
  dbOp.findByKey(func.dbCons.COLLECTION_CANDIDATE_EXAM_DETAILS_FIELD_EXAM_ID, func.lightBlueCons.OP_IN, examIds, urlMap, func.dbCons.COLLECTION_EXAM_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function(error, examDetailsData) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'data from ExamDetailsCollection ' + examDetailsData);
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching candidate exam details = ' + JSON.stringify(error) + 'for exam_id array: ' + examIds)
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'callExamDetailsCollection dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callExamDetailsCollection()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, examDetailsData)
    } else if (!examDetailsData || examDetailsData.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'no candidate exam details for exam_id array: ' + examIds)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callExamDetailsCollection()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callExamDetailsCollection()', func.logCons.LOG_EXIT)
      callback(null, examDetailsData)
    }
  });
}

function getEnumStatusFromValue(value) {
  switch (value) {
    case func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_AVAILABLE:
      return func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_AVAILABLE
    case func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_IN_PROGRESS:
      return func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_IN_PROGRESS
    case func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_COMPLETED:
      return func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_COMPLETED
    case func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_SYSTEM_CLOSED:
      return func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_SYSTEM_CLOSED
    case func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_CLOSED:
      return func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_CLOSED
    case func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_PUBLISHED:
      return func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_PUBLISHED
    default:
      return -1
  }
}
