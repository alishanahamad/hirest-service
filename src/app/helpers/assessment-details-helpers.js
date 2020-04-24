var func = require('../utils/functions');
var Client = require('node-rest-client').Client;
var client = new Client();
var async = require('async');
var dbOp;
var _ = require('lodash');

function GetAssessmentDetailsHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of get assessment details helper');
  DbOperation = require('./db-operations').DbOperation;
  dbOp = new DbOperation();
}

GetAssessmentDetailsHelpers.prototype.getAssessmentDetails = function(category, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessmentDetails()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'category_id: ' + category)
  getAssessmentDetailsForParticularCategory(category, urlMap, function(error, response) {
    var response = _.sortBy(response, 'order');
    if (error) {
      return callback(new Error().stack, response);
    } else if (response.length === 0) {
      return callback(null, []);
    } else {
      return callback(null, response);
    }
  });
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessmentDetails()', func.logCons.LOG_EXIT)
}

function getAssessmentDetailsForParticularCategory(category, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessmentDetailsForParticularCategory()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ASSESSMENT_CATEGORY, func.lightBlueCons.OP_EQUAL, category), urlMap, func.dbCons.COLLECTION_ASSESSMENT_PARAM_DETAILS,
  dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true),
  function (error, fetchAllDetails) {
    if (error) {
      return callback(new Error().stack, fetchAllDetails);
    } else if (!fetchAllDetails || fetchAllDetails.length === 0) {
      return callback(null, []);
    } else {
      return callback(null, fetchAllDetails);
    }
  });
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAssessmentDetailsForParticularCategory()', func.logCons.LOG_EXIT)
}
exports.GetAssessmentDetailsHelpers = GetAssessmentDetailsHelpers;
