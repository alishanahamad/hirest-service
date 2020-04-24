var func = require('../utils/functions');
var dbConfig = func.config.get('database');
AddCampusDrivesrHelper = require('../helpers/tpo-campus-drives-helpers').AddCampusDrivesrHelper;
var addCampusDrivesrHelper = new AddCampusDrivesrHelper();
var async = require('async');
var ROUTES_CONS = 'SS_TCD_';

module.exports = function(app) {
  ////////Add Register
  app.post(func.urlCons.URL_POST_ADD_CAMPUS_DRIVES_DETAILS, function(req, res, next) {
    var urlMap = func.getUrlMap(req);
    addCampusDrivesrHelper.AddCampusDrivesDetails(urlMap, req.body, function(error, response) {
      if (error) {
        if (response) {
          res.status(func.getStatusCode(response[func.msgCons.RESPONSE_STATUS_CODE]));
          return res.send(response);
        }
        res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR);
        res.send(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER));
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Campus Drives details added successfully');
        res.status(func.httpStatusCode.OK);
        return res.send(func.responseGenerator(response, func.msgCons.CODE_UAM_SUCCESS, func.msgCons.MSG_CAMPUS_DRIVES_INSERTED));
      }
    });
  });

  function validateCampusDetails(req, res, next) {
    var dataInputJson = func.convertIntoArray(req.body);
    var invalidObjects = [];
    async.eachOfSeries(dataInputJson, function(item, key, callback) {
        if (!item[func.dbCons.FIELD_COURSE] ||
           item[func.dbCons.FIELD_COURSE] === "" ||
            item[func.dbCons.FIELD_COURSE] === null ||
             !item[func.dbCons.FIELD_STREAM] ||
             item[func.dbCons.FIELD_STREAM] === "" ||
             item[func.dbCons.FIELD_STREAM] === null ||
              !item[func.dbCons.COMMON_CREATED_BY] ||
               item[func.dbCons.COMMON_CREATED_BY] === "" ||
                item[func.dbCons.COMMON_CREATED_BY] === null ||
                !item[func.dbCons.COMMON_UPDATED_BY] ||
                item[func.dbCons.COMMON_UPDATED_BY] === "" ||
                 item[func.dbCons.COMMON_UPDATED_BY] === null ||
                 !item[func.dbCons.FILED_CAMPUS_PROPOSED_DATE] ||
                  item[func.dbCons.FILED_CAMPUS_PROPOSED_DATE] === "" ||
                  item[func.dbCons.FILED_CAMPUS_PROPOSED_DATE] === null ||
                  !item[func.dbCons.FIELD_CAMPUS_START_DATE] ||
                  item[func.dbCons.FIELD_CAMPUS_START_DATE] === "" ||
                   item[func.dbCons.FIELD_CAMPUS_START_DATE] === null ||
                   !item[func.dbCons.FIELD_CAMPUS_INVITE_YEAR] ||
                    item[func.dbCons.FIELD_CAMPUS_INVITE_YEAR] === null ||
                    item[func.dbCons.FIELD_CAMPUS_INVITE_YEAR] === "" ||
                     !item[func.dbCons.FILED_USER_CODE] ||
                     item[func.dbCons.FILED_USER_CODE] === "" ||
                      item[func.dbCons.FILED_USER_CODE] === null ||
                      item[func.dbCons.BATCH_SIZE] === null ||
                      item[func.dbCons.BATCH_SIZE] === ""
                    ) {
          invalidObjects.push(func.errorObjectGenrator('SS_TCD_400', 'Please provide the proper Data'));
        }
        callback();
      },
      function(err) {
        if (invalidObjects.length > 0) {
          res.status(func.httpStatusCode.BAD_REQUEST);
          res.send(func.errorsArrayGenrator(invalidObjects, "SS_TCD_500", "Please provide the proper Data"));
        } else {
          next();
        }
      });
  }
};
