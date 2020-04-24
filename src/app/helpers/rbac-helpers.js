var func = require('../utils/functions')
var fs = require('fs')
var dbOp
var RBAC = require('rbac2')
var dateFormat = require('dateformat')
var userActionDetails = JSON.parse(fs.readFileSync('./json_files/API_to_action_mapping_JSON.json'))
var HELPER_CONS = 'RH_'

function RbacHelpers () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of rbac helpers')
  DbOperation = require('./db-operations').DbOperation
  dbOp = new DbOperation()
}

RbacHelpers.prototype.getUserRole = function (userCode, request, callbackForUserRole) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserRole()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, func.logCons.LOG_PARAM + ' userCode=' + userCode + 'request path = ' + request.route.path)
  var actionData = getUserActionFromApiURL(request)
  var urlMap = {}

  func.printLog(func.logCons.LOG_LEVEL_DEBUG, ' request query in rbac helper = ' + JSON.stringify(request.query))
  var domainName = request.query.domain_name
    ? request.query.domain_name
    : request.headers[func.urlCons.PARAM_DOMAIN_NAME]
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, ' domain name in rbac helper = ' + domainName)
  urlMap[func.urlCons.PARAM_ORG_NAME] = request.headers[func.urlCons.PARAM_ORG_NAME]
  urlMap[func.urlCons.PARAM_DOMAIN_NAME] = domainName
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, ' urlMap in rbac helper = ' + JSON.stringify(urlMap))
  if (typeof userCode === 'undefined') { checkRoleActionMapping(func.dbCons.VALUE_APP_USER, actionData, urlMap, callbackForUserRole) } else {
    dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, generateQueryForRole(userCode, request.query.is_resource)), urlMap, func.dbCons.COLLECTION_USER_ROLE_DETAILS, function (error, roleDetails) {
      if (actionData === -1) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'No action found')

        return callbackForUserRole(true, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.MSG_NO_ACTION_FOUND), HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.MSG_NO_ACTION_FOUND))
        // return callbackForUserRole(true, func.errorResponseGenrator(func.msgCons.MSG_NO_ACTION_FOUND, func.msgCons.MSG_NO_ACTION_DEFINED, func.msgCons.CODE_UNDEFINED_ACTION));
      }
      if (error) {
        return callbackForUserRole(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
      } else if (roleDetails === undefined || roleDetails.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'user id ' + userCode + ' is a ' + func.dbCons.VALUE_APP_USER + ' and is trying to do = ' + actionData)
        checkRoleActionMapping(func.dbCons.VALUE_APP_USER, actionData, urlMap, callbackForUserRole)
      } else if (roleDetails.length > 1) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'More than one role found!!')
        return callbackForUserRole(true, func.errorResponseGenrator(func.msgCons.MSG_MORE_THAN_ONE_RULE_FOUND, func.msgCons.MSG_MORE_THAN_ONE_RULE_FOUND, func.msgCons.CODE_UNDEFINED_ACTION))
      } else {
        var newDate = dateFormat(new Date(), func.dbCons.FIELD_LIGHTBLUE_DATE_FORMAT)
        if (newDate >= roleDetails[0][func.dbCons.FIELD_EFFECTIVE_DATE_FROM] && newDate <= roleDetails[0][func.dbCons.FIELD_EFFECTIVE_DATE_TO]) {
          func.printLog(func.logCons.LOG_LEVEL_INFO, 'logged in users role details = ' + JSON.stringify(roleDetails))
          getRoleNameFromEnum(roleDetails[0][func.dbCons.FIELD_ROLE_NAME], urlMap, function (error, definedRoleName) {
            if (error) {
              func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while retriving role details')
              return callbackForUserRole(func.errorResponseGenrator(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER))
            } else if (definedRoleName === -1) {
              checkRoleActionMapping(func.dbCons.VALUE_APP_USER, actionData, urlMap, callbackForUserRole)
            } else {
              func.printLog(func.logCons.LOG_LEVEL_INFO, 'user id ' + userCode + ' is a ' + definedRoleName + ' and is trying to do = ' + actionData)
              checkRoleActionMapping(definedRoleName, actionData, urlMap, callbackForUserRole)
            }
          })
        } else {
          return callbackForUserRole(null, false)
        }
      }
    })
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserRole()', func.logCons.LOG_EXIT)
}

function checkRoleActionMapping (role, action, urlMap, callbackRbackResult) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkRoleActionMapping()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(null, urlMap, func.dbCons.COLLECTION_RBAC_RULE_DETAILS, function (error, rules) {
    if (error) {
      return callbackRbackResult(error)
    }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'rules= ' + rules)
    var rbac = new RBAC(rules)
    rbac.check(role, action, function (error, result) {
      if (error) {
        return callbackRbackResult(error)
      }
      func.printLog(func.logCons.LOG_LEVEL_INFO, role + ' can do ' + action + ' : ' + result)
      callbackRbackResult(null, result)
    })
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkRoleActionMapping()', func.logCons.LOG_EXIT)
}

function generateQueryForRole (userCode, isResource) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateQueryForRole()', func.logCons.LOG_ENTER)
  var queryArray = []
  if (isResource) {
    queryArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ENTITY_DETAILS + '.' + func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, userCode))
    queryArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ENTITY_DETAILS + '.' + func.dbCons.FIELD_TYPE, func.lightBlueCons.OP_EQUAL, 'RESOURCE'))
  } else {
    queryArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ENTITY_DETAILS + '.' + func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, userCode))
    queryArray.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ENTITY_DETAILS + '.' + func.dbCons.FIELD_TYPE, func.lightBlueCons.OP_EQUAL, 'USER'))
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateQueryForRole()', func.logCons.LOG_EXIT)
  return queryArray
}

function getRoleNameFromEnum (enumRoleName, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getRoleNameFromEnum()', func.logCons.LOG_ENTER)
  dbOp.findByKey(func.dbCons.FIELD_ROLE_IDENTIFIER, func.lightBlueCons.OP_EQUAL, enumRoleName, urlMap, func.dbCons.COLLECTION_ROLE_DETAILS,
    function (error, roleDetail) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Values of roleDetails collection is :' + JSON.stringify(roleDetail))
      if (roleDetail) {
        roleDetail = func.convertIntoArray(roleDetail)
      }
      if (error) callback(error)
      else if (roleDetail !== undefined && roleDetail.length === 0) {
        callback(null, -1)
      } else {
        callback(null, roleDetail[0][func.dbCons.FIELD_ROLE_NAME])
      }
    })
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getRoleNameFromEnum()', func.logCons.LOG_EXIT)
}

function getUserActionFromApiURL (request) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserActionFromApiURL()', func.logCons.LOG_ENTER)
  var action = userActionDetails[request.route.path]
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'action json= ' + JSON.stringify(action))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserActionFromApiURL()', func.logCons.LOG_EXIT)
  if (!action) { return -1 } else {
    return action
  }
}

exports.RbacHelpers = RbacHelpers
