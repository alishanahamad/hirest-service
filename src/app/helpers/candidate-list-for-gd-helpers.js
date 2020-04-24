var func = require('../utils/functions');
var dbOp;
var fs = require('fs');
var async = require('async');
var http = require('http');
var smtp = func.config.get('smtp');
var nodemailer = require('nodemailer');
var dateFormat = require('dateformat');
var HELPER_CONS = 'SS_CLFG_';

function GetCandidateList() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of add tpo register helper');
  DbOperation = require('./db-operations').DbOperation;
  dbOp = new DbOperation();
}

function getScoreForPerticularCandidate(urlMap, fetchPersonEmailIDS, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getScoreForPerticularCandidate()', func.logCons.LOG_ENTER);
  var getScoreFromExamDetails = func.getValuesArrayFromJson(func.dbCons.FIELD_EMAIL_ADDRESS, fetchPersonEmailIDS)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_EMAIL_ADDRESS, func.lightBlueCons.OP_IN, getScoreFromExamDetails), urlMap, func.dbCons.COLLECTION_EXAM_SCORE_DETAILS,
    dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true),
    function(error, examScoreDetails) {
      if (error) return callback(new Error().stack, examScoreDetails);
      if (!examScoreDetails || examScoreDetails.length === 0) {
        var examScoreDetails = []
        callback(null, examScoreDetails);
      } else {
        async.forEachOf(examScoreDetails, function(item, key, callback) {
          emailID = item[func.dbCons.FIELD_EMAIL_ADDRESS]
          candidateId = item[func.dbCons.FIELD_ID]
          async.forEachOf(fetchPersonEmailIDS, function(items, keys, callbackinner) {
            if (fetchPersonEmailIDS[keys][func.dbCons.FIELD_EMAIL_ADDRESS] === emailID) {
              item[func.dbCons.FIELD_CANDIDATE_ID] = fetchPersonEmailIDS[keys][func.dbCons.FIELD_ID];
              item[func.dbCons.FIELD_CANDIDATE_SOURCE_ID] = fetchPersonEmailIDS[keys][func.dbCons.FIELD_CANDIDATE_SOURCE_ID]
              item[func.dbCons.FIELD_CAMPUS_DRIVE_ID] = fetchPersonEmailIDS[keys][func.dbCons.FIELD_CAMPUS_DRIVE_ID]
              item[func.dbCons.FIELD_EMAIL_ADDRESS] = emailID
              item[func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME] = fetchPersonEmailIDS[keys][func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME]
            }
            callbackinner()
          }, function(error) {
            if (error) {
              return callback(new Error().stack, examScoreDetails)
            } else {
              callback()
            }
          })
        }, function(error) {
          if (error) {
            return callback(new Error().stack, examScoreDetails)
          } else {
            callback(null, examScoreDetails)
          }
        })
      }
    });
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getScoreForPerticularCandidate()', func.logCons.LOG_EXIT);
}

function getPersonEmailIDs(urlMap, fetchCandidateIDS, stage, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getPersonEmailIDs()', func.logCons.LOG_ENTER);
  var candidateSourceIDS = func.getValuesArrayFromJson(func.dbCons.FIELD_PERSON_ID, fetchCandidateIDS)
  var projection = [];
  projection.push(dbOp.getProjectionJson(func.dbCons.FILED_EMAIL_ADDRESS));
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID));
  // projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_FIRST_NAME));
  // projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_LAST_NAME));
  projection.push(dbOp.getProjectionJson(func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME));
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidateSourceIDS), urlMap, func.dbCons.COLLECTION_PERSON_DETAILS, projection,
    function(error, fetchPersonIDS) {
      if (error) return callback(new Error().stack, fetchPersonIDS);
      if (!fetchPersonIDS || fetchPersonIDS.length === 0) {
        var fetchPersonIDS = []
        callback(null, fetchPersonIDS);
      } else {
        async.forEachOf(fetchPersonIDS, function(item, key, callbackinner) {
          fetchCandidateIDS[key][func.dbCons.FIELD_EMAIL_ADDRESS] = item[func.dbCons.FIELD_EMAIL_ADDRESS]
          fetchCandidateIDS[key][func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME] = item[func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME]
          callbackinner()
        }, function(error) {
          if (error) {
            return callback(new Error().stack, fetchCandidateIDS)
          } else {
            getScoreForPerticularCandidate(urlMap, fetchCandidateIDS, function(error, fetchScore) {
              if (error) return callback(new Error().stack, fetchScore);
              else {
                callback(null, fetchScore);
              }
            });
          }
        })
      }
    });
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getPersonEmailIDs()', func.logCons.LOG_EXIT);
}

function getEnumStatusFromValue(value) {
  switch (value) {
    case func.dbCons.ENUM_STAGE_FOR_GD:
      return func.dbCons.ENUM_SELECTED_FOR_GD
    case func.dbCons.ENUM_STAGE_FOR_PI:
      return func.dbCons.ENUM_SELECTED_FOR_PI
    case func.dbCons.VALUE_SELECTED_IN_PI_FOR_ONSITE:
      return func.dbCons.ENUM_STAGE_SELECTED_IN_PI_FOR_ONSITE
    case func.dbCons.VALUE_SELECTED_IN_GD_FOR_ONSITE:
      return func.dbCons.ENUM_STAGE_SELECTED_IN_GD_FOR_ONSITE
    default:
      return 1
  }
}

function getFinalCandidateList(stage, fetchCandidateIDS) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getFinalCandidateList()', func.logCons.LOG_ENTER);
  var candidateSourceIDS = func.getValuesArrayFromJson(func.dbCons.FIELD_ID, fetchCandidateIDS)
  var andArray = [];
  andArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_IN, candidateSourceIDS));
  andArray.push(dbOp.getQueryJsonForOp(func.dbCons.COLLECTION_JSON_STAGE, func.lightBlueCons.OP_EQUAL, getEnumStatusFromValue(stage)));
  return andArray;
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getFinalCandidateList()', func.logCons.LOG_EXIT);
}

function mappingJson(sourceJson, destinationJson, sourceField, destSourceField, destinationField, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'mappingJson()', func.logCons.LOG_ENTER)
  async.forEachOf(sourceJson, function(sourceItem, key, sourceCallbackinner) {
    async.forEachOf(destinationJson, function(destinationItem, key, destinationCallbackinner) {
      if (sourceItem[sourceField] == destinationItem[destSourceField]) {
        for (let destObj of destinationField) {
          sourceItem[destObj] = destinationItem[destObj]
        }
        destinationCallbackinner()
      } else {
        destinationCallbackinner()
      }
    }, function(error) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'mappingJson()', func.logCons.LOG_EXIT)
        return sourceCallbackinner(new Error().stack, sourceJson)
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'mappingJson()', func.logCons.LOG_EXIT)
        sourceCallbackinner(null, sourceJson)
      }
    })
  }, function(error) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'mappingJson()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, sourceJson)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'mappingJson()', func.logCons.LOG_EXIT)
      callback(null, sourceJson)
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'mappingJson()', func.logCons.LOG_EXIT)
}

function getPersonId(urlMap, fetchCandidateIDS, stage, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getPersonId()', func.logCons.LOG_ENTER);
  queryForDB = getFinalCandidateList(stage, fetchCandidateIDS);
  var candidateSourceIDS = func.getValuesArrayFromJson(func.dbCons.FIELD_ID, fetchCandidateIDS)
  var projection = [];
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PERSON_ID));
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID));
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID));
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, queryForDB), urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, projection, function(error, fetchPersonIDS) {
    if (error) return callback(new Error().stack, fetchPersonIDS);
    if (!fetchPersonIDS || fetchPersonIDS.length === 0) {
      var fetchPersonIDS = []
      callback(null, fetchPersonIDS);
    } else {
      var sourceField = func.dbCons.FIELD_CANDIDATE_SOURCE_ID
      var destSourceField = func.dbCons.FIELD_ID
      var destinationFields = []
      destinationFields.push(func.dbCons.FIELD_CAMPUS_DRIVE_ID)
      mappingJson(fetchPersonIDS, fetchCandidateIDS, sourceField, destSourceField, destinationFields, function(error, jsonResponse) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
          return callback(new Error().stack, jsonResponse)
        } else if (!jsonResponse || jsonResponse.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
          return callback(new Error().stack, jsonResponse)
        } else {
          getPersonEmailIDs(urlMap, jsonResponse, stage, function(error, fetchPersonIds) {
            if (error) return callback(new Error().stack, fetchPersonIds);
            else {
              callback(null, fetchPersonIds);
            }
          });
        }
      })

    }
  });
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getPersonId()', func.logCons.LOG_EXIT);
}

function getCampusDriveId(urlMap, fetchDetails, stage, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCampusDriveId()', func.logCons.LOG_ENTER);
  var candidateSourceIDS = func.getValuesArrayFromJson(func.dbCons.FIELD_ID, fetchDetails)
  var projection = [];
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID));
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID));
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CAMPUS_DRIVE_ID, func.lightBlueCons.OP_IN, candidateSourceIDS), urlMap, func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, projection,
    function(error, fetchCandidateIDS) {
      if (error) return callback(new Error().stack, fetchCandidateIDS);
      if (!fetchCandidateIDS || fetchCandidateIDS.length === 0) {
        var fetchCandidateIDS = []
        callback(null, fetchCandidateIDS);
      } else {
        getPersonId(urlMap, fetchCandidateIDS, stage, function(error, fetchPersonIds) {
          if (error) return callback(new Error().stack, fetchPersonIds);
          else {
            callback(null, fetchPersonIds);
          }
        });
      }
    });
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCampusDriveId()', func.logCons.LOG_EXIT);
}

function getUserBasedDetails(designation,year, fetchAllIDS) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getUserBasedDetails()', func.logCons.LOG_ENTER);
  var institueIDS = func.getValuesArrayFromJson(func.dbCons.FIELD_ID, fetchAllIDS)
  var andArray = [];
  andArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_DESIGNATION, func.lightBlueCons.OP_EQUAL, designation));
  andArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CAMPUS_INVITE_YEAR, func.lightBlueCons.OP_EQUAL, year));
  andArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_INSTITUTE_ID, func.lightBlueCons.OP_IN, institueIDS));
  return andArray;
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getUserBasedDetails()', func.logCons.LOG_EXIT);
}

function matchCandidateDetailsID(urlMap, designation, fetchAllIDS, stage,year, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'matchCandidateDetailsID()', func.logCons.LOG_ENTER);
  query = getUserBasedDetails(designation,year, fetchAllIDS);
  var projection = [];
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID));
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), urlMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, projection, function(error, fetchDetails) {
    if (error) return callback(new Error().stack, fetchDetails);
    if (!fetchDetails || fetchDetails.length === 0) {
      var fetchDetails = []
      callback(null, fetchDetails);
    } else {
      getCampusDriveId(urlMap, fetchDetails, stage, function(error, fetchRegisterJSON) {
        if (error) return callback(new Error().stack, fetchRegisterJSON);
        else {
          callback(null, fetchRegisterJSON);
        }
      });
    }
  });
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'matchCandidateDetailsID()', func.logCons.LOG_EXIT);
}
GetCandidateList.prototype.getCandidateListForGd = function(urlMap, body, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateListForGd()', func.logCons.LOG_ENTER);
  var designation = body[func.dbCons.COLLECTION_DESIGNATION];
  var universityName = body[func.dbCons.FIELD_UNIVERSITY_NAME];
  var stage = body[func.dbCons.COLLECTION_JSON_STAGE];
  var year = body[func.dbCons.FIELD_CAMPUS_YEAR];
  var projection = [];
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_NAME));
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID));
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_NAME, func.lightBlueCons.OP_IN, universityName), urlMap, func.dbCons.COLLECTION_INSTITUTE_DETAILS, projection, function(error, fetchAllInstituteIDS) {
    if (error) return callback(new Error().stack, fetchAllInstituteIDS);
    if (!fetchAllInstituteIDS || fetchAllInstituteIDS.length === 0) {
      var fetchAllInstituteIDS = []
      callback(null, fetchAllInstituteIDS);
    } else {
      matchCandidateDetailsID(urlMap, designation, fetchAllInstituteIDS, stage,year, function(error, fetchRegisterJSON) {
        if (error) return callback(new Error().stack, fetchRegisterJSON);
        else {
          callback(null, fetchRegisterJSON);
        }
      });
    }
  });
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateListForGd()', func.logCons.LOG_EXIT);
};
exports.GetCandidateList = GetCandidateList;
