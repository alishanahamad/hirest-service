var func = require('../utils/functions');
var Client = require('node-rest-client').Client;
var client = new Client();
var async = require('async');
var dbOp;
var HELPER_CONS = 'HS_GURDH_';
function GetUserRoleDetailsHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of getUserRoleDetails helper');
  DbOperation = require('./db-operations').DbOperation;
  dbOp = new DbOperation();
}

GetUserRoleDetailsHelpers.prototype.getUserRoleDetails = function(urlMap, roleType, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserRoleDetails()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'roleType= '+roleType);
  getRoleType(urlMap,roleType,callback);
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserRoleDetails()', func.logCons.LOG_EXIT)
  }

  function getRoleType(urlMap, roleType, callback){
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside getRoleType()', func.logCons.LOG_ENTER)
    dbOperationToGetRoleId(urlMap, roleType, function(error,response){
      if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'callRoleDetailsCollection dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callRoleDetailsCollection()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callRoleDetailsCollection()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'callGdScoreDetailsCollection()', func.logCons.LOG_EXIT)
      var myArr = [];
      async.forEachOf(response,function(value,key,callbackinner){
        myArr.push(value[func.dbCons.FIELD_ROLE_IDENTIFIER])
        callbackinner();
      },function(error){
        dbOperationToGetSpecificRoleUsers(urlMap,myArr,function(error,resBody){
          var myBody=[]
            async.forEachOf(resBody,function(value,key,callbackinner2){
              var id = value[func.dbCons.FIELD_ENTITY_DETAILS][func.dbCons.FIELD_ID]
              var rolesType = value[func.dbCons.FIELD_ROLE_NAME]
                var roleIdentifier;
                dbOperationToGetRoleNameAndEmail(urlMap,id,function(error,res){
                    if(error){
                      callbackinner2();
                    }
                    else{
                      dbOperationToGetRoleNameFromIdentifier(urlMap,rolesType, function(error,result){

                        if(error){
                          callbackinner2();
                        }
                        else{
                          roleIdentifier = result[0][func.dbCons.FIELD_ROLE_NAME];
                          var myArr1 = {};
                          myArr1[func.dbCons.FIELD_USER_CODE] = id;
                          myArr1[func.dbCons.FIELD_NAME] = res[0][func.dbCons.FIELD_USER_DATA][func.dbCons.FIELD_GIVEN_NAME]+" "+res[0][func.dbCons.FIELD_USER_DATA][func.dbCons.FIELD_FAMILY_NAME];
                          var emailId = res[0][func.dbCons.FIELD_USER_DATA][func.dbCons.FIELD_EMAIL]
                          myArr1[func.dbCons.FIELD_EMAIL] = emailId;
                          myArr1[func.dbCons.FIELD_ROLE_NAME] = rolesType;
                          myArr1[func.dbCons.FIELD_ROLE_IDENTIFIER] = roleIdentifier;
                          myBody.push(myArr1)
                          callbackinner2();
                        }
                      })
                    }
                });
            }, function(error){
                return callback(null,myBody)
            })

        })
      })
    }
  });
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside getRoleType()', func.logCons.LOG_EXIT)
}


function dbOperationToGetRoleNameFromIdentifier(urlMap, roleIdentifier,callback){
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetRoleNameFromIdentifier()', func.logCons.LOG_EXIT)
  dbOp.findByKey(func.dbCons.FIELD_ROLE_IDENTIFIER, func.lightBlueCons.OP_EQUAL, roleIdentifier, urlMap, func.dbCons.COLLECTION_ROLE_DETAILS, dbOp.getProjectionJson(func.dbCons.FIELD_ROLE_NAME, true, true),function (error, roleName) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching user role name = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToGetRoleNameFromIdentifier()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, roleName)
    } else if (!roleName || roleName.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'no role type = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToGetRoleNameFromIdentifier()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToGetRoleNameFromIdentifier()', func.logCons.LOG_EXIT)
      callback(null, roleName)
    }
  });
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetRoleNameFromIdentifier()', func.logCons.LOG_EXIT)
}


function dbOperationToGetRoleNameAndEmail(urlMap, userId, callback){
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetRoleNameAndEmail()', func.logCons.LOG_EXIT)
  dbOp.findByKey(func.dbCons.FIELD_USER_CODE, func.lightBlueCons.OP_EQUAL, userId, urlMap, func.dbCons.COLLECTION_USER_DETAILS, dbOp.getProjectionJson(func.dbCons.FIELD_PROFILE, true, true),function (error, rolesID) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching user role name = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToGetRoleNameAndEmail()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, rolesID)
    } else if (!rolesID || rolesID.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'no email and name = ' + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToGetRoleNameAndEmail()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToGetSpecificRoleUsers()', func.logCons.LOG_EXIT)
      callback(null, rolesID)
    }
  });
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetSpecificRoleUsers()', func.logCons.LOG_EXIT)
}


  function dbOperationToGetSpecificRoleUsers(urlMap, res, callback){
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetSpecificRoleUsers()', func.logCons.LOG_EXIT)
    var projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ENTITY_DETAILS, true, true))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ROLE_NAME, true, true))
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROLE_NAME, func.lightBlueCons.OP_IN, res), urlMap, func.dbCons.COLLECTION_USER_ROLE_DETAILS, projection,function (error, rolesID) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching user role name = ' + JSON.stringify(error))
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToGetSpecificRoleUsers()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, rolesID)
      } else if (!rolesID || rolesID.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'no specific name = ' + JSON.stringify(error))
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToGetSpecificRoleUsers()', func.logCons.LOG_EXIT)
        return callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToGetSpecificRoleUsers()', func.logCons.LOG_EXIT)
        return callback(null, rolesID)
      }
    });
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetSpecificRoleUsers()', func.logCons.LOG_EXIT)
  }



  function dbOperationToGetRoleId(urlMap,role, callback){
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetRoleId()', func.logCons.LOG_EXIT)
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROLE_NAME, func.lightBlueCons.OP_IN, role), urlMap, func.dbCons.COLLECTION_ROLE_DETAILS, dbOp.getProjectionJson(func.dbCons.FIELD_ROLE_IDENTIFIER, true, true),function (error, rolesID) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching user role name = ' + JSON.stringify(error))
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToGetRoleId()', func.logCons.LOG_EXIT)
        return callback(new Error().stack, rolesID)
      } else if (!rolesID || rolesID.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'no role name = ' + JSON.stringify(error))
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToGetRoleId()', func.logCons.LOG_EXIT)
        return callback(null, [])
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'dbOperationToGetRoleId()', func.logCons.LOG_EXIT)
        return callback(null, rolesID)
      }
    });
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'inside dbOperationToGetRoleId()', func.logCons.LOG_EXIT)
  }
exports.GetUserRoleDetailsHelpers = GetUserRoleDetailsHelpers;
