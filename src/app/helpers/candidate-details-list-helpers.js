var func = require('../utils/functions');
var dbOp;
var fs = require('fs');
var async = require('async');
var http = require('http');
var smtp = func.config.get('smtp');
var nodemailer = require('nodemailer');
var HELPER_CONS = 'SS_CDL_';

function GetCandidateDetailsList() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of candidate details list');
  DbOperation = require('./db-operations').DbOperation;
  dbOp = new DbOperation();
}


function getPersonIdFromCandidateSourceDetails(urlMap, personDetails, item, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getPersonIdFromCandidateSourceDetails()', func.logCons.LOG_ENTER);
  var personDetailsFromJson = {};
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FILED_ID, func.lightBlueCons.OP_EQUAL, item), urlMap, func.dbCons.COLLECTION_PERSON_DETAILS, dbOp.getCommonProjection(), function(error, data) {
    if (error) return callback(new Error().stack, data);
    if (!data || data.length === 0) {
      var response = [];
      return callback(null, response);
    } else {
      personDetailsFromJson[func.dbCons.FILED_FIRST_NAME] = data[0][func.dbCons.FILED_FIRST_NAME];
      personDetailsFromJson[func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME] = data[0][func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME]
      personDetailsFromJson[func.dbCons.FILED_LAST_NAME] = data[0][func.dbCons.FILED_LAST_NAME];
      personDetailsFromJson[func.dbCons.FIELD_NAME] = data[0][func.dbCons.FILED_FIRST_NAME] + ' ' + data[0][func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME] + ' ' + data[0][func.dbCons.FILED_LAST_NAME]
      personDetailsFromJson[func.dbCons.FIELD_COURSE] = personDetails[0][func.dbCons.FIELD_COURSE];
      personDetailsFromJson[func.dbCons.FIELD_STREAM] = personDetails[0][func.dbCons.FIELD_STREAM];
      personDetailsFromJson[func.dbCons.COLLECTION_JSON_STAGE] = personDetails[0][func.dbCons.COLLECTION_JSON_STAGE];
      if (personDetails[0][func.dbCons.FIELD_SIGNED_OFFER_LETTER_URL] !== undefined){
        personDetailsFromJson[func.dbCons.FIELD_UNSIGNED_OFFER_LETTER_URL] = personDetails[0][func.dbCons.FIELD_SIGNED_OFFER_LETTER_URL];
      }
      if (personDetails[0][func.dbCons.FIELD_UNSIGNED_OFFER_LETTER_URL] !== undefined){
        personDetailsFromJson[func.dbCons.FIELD_UNSIGNED_OFFER_LETTER_URL] = personDetails[0][func.dbCons.FIELD_UNSIGNED_OFFER_LETTER_URL];
      }
      personDetailsFromJson[func.dbCons.FILED_PERSON_ID] = item;
      personDetailsFromJson[func.dbCons.FIELD_CANDIDATE_ID] = personDetails[0][func.dbCons.FIELD_ID]
      return callback(null, personDetailsFromJson);
    }
  });
}
GetCandidateDetailsList.prototype.getCandidateDetails = function(urlMap, body, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateDetails()', func.logCons.LOG_ENTER);
  var personDetailsJson = [];
  async.eachOfSeries(body[func.dbCons.FILED_PERSON_ID], function(item, key, callbackdata) {
      dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FILED_PERSON_ID, func.lightBlueCons.OP_EQUAL, item), urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, dbOp.getCommonProjection(), function(error, personDetails) {
        if (error) return callback(new Error().stack, personDetails);
        if (!personDetails || personDetails.length === 0) {
          var response = [];
          return callbackdata();
        } else {
          getPersonIdFromCandidateSourceDetails(urlMap, personDetails, item, function(error, fetchJSON) {
            if (error) return callbackdata(new Error().stack, fetchJSON);
            if (!fetchJSON || fetchJSON.length === 0) {
              var response = [];
              return callbackdata();
            } else {
              personDetailsJson.push(fetchJSON);
              callbackdata();
            }
          });
        }
      });
    },
    function(err) {
      if (err) {
        //TODO: ADD 2nd Argument
        return callback(new Error().stack);
      } else {
        callback(null, personDetailsJson);
      }
    });
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCandidateDetails()', func.logCons.LOG_EXIT);
};
exports.GetCandidateDetailsList = GetCandidateDetailsList;
