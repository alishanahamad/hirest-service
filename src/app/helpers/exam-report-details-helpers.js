/**
 * The <code>exam-report-details-helpers.js </code> use to retrieve exam report details for all the data or list of hierarcy based on company
 *
 * @author Kavish Kapadia
 */

var func = require('../utils/functions')
var async = require('async')
var DbOperation = require('./db-operations').DbOperation
var dbOp = new DbOperation()

var fs = require('fs');
var jsonexport = require('jsonexport');
var nunjucks = require('nunjucks')
var dynamicDomain = func.config.get('mail_domain_dynamic')
var EmailTemplates = require('swig-email-templates')
var templates = new EmailTemplates()
var configJson = func.config.get('mail_domains')
var smtp = func.config.get('smtp')
var nodemailer = require('nodemailer')
var transporter = nodemailer.createTransport(smtp)

var scoreLogicConfig = func.config.get('score_logic')

var smtpTransport = nodemailer.createTransport(smtp)
var smtpSrkCareer = func.config.get('smtp_srkCareer')
var smtpSrkCareerTransport = nodemailer.createTransport(smtpSrkCareer)
var demoHirest = func.config.get('smtp_demo')
var demoHirestTransport = nodemailer.createTransport(demoHirest)

const smtpConnections = {
  'app': smtpSrkCareerTransport,
  'demo': demoHirestTransport,
  'career': smtpSrkCareerTransport,
  undefined: smtpTransport
}

/**
 * [ExamReportDetailsHelpers is a constructor to create required objects]
 * @constructor
 */
function ExamReportDetailsHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'exam-report-details-helpers obj created')
}

var HELPER_CONS = 'HS_ERDR_';

/**
 * [get exam report details]
 * @param  {[type]}   orgNameMap [org and domain name]
 * @param  {[type]}   env        [environment]
 * @param  {Function} callback   [callback function]
 * @return {[type]}              [description]
 */
ExamReportDetailsHelpers.prototype.getExamReportDetails = function(orgNameMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamReportDetails', func.logCons.LOG_ENTER)
  getExamDetails(orgNameMap, function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getExamReportDetails = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamReportDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, response)
    } else if (response.length === 0 || !response) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamReportDetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamReportDetails()', func.logCons.LOG_EXIT)
      return callback(null, response)
    }
  })
}

/**
 * [getExamDetails to get exam details]
 * @param  {[type]} orgNameMap       [org and domain name]
 * @param  {[type]} callbackResponse [callback function]
 * @return {[type]}                  [description]
 */
function getExamDetails(orgNameMap, callbackResponse) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamDetails', func.logCons.LOG_ENTER)
  dbOp.findByQuery(null, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_EXAM_SCORE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getExamDetails dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamDetails()', func.logCons.LOG_EXIT)
      return callbackResponse(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamDetails()', func.logCons.LOG_EXIT)
      return callbackResponse(null, false)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamDetails()', func.logCons.LOG_EXIT)
      generateResponseJson(response, function(error, responseJson) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'generateResponseJson = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateResponseJson()', func.logCons.LOG_EXIT)
          return callbackResponse(new Error().stack, responseJson)
        } else if (!responseJson || responseJson.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateResponseJson()', func.logCons.LOG_EXIT)
          return callbackResponse(null, false)
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateResponseJson()', func.logCons.LOG_EXIT)
          callbackResponse(null, responseJson)
        }
      })
    }
  })
}

/**
 * [generateResponseJson retrieves data]
 * @param  {[type]}   response [retrieved data]
 * @param  {Function} callback [callback function]
 * @return {[type]}            [description]
 */
function generateResponseJson(response, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateResponseJson()', func.logCons.LOG_ENTER)
  var json = []
  async.forEachOf(response, function(item, index, callbackinner) {
    var data = generateJson(item)
    json.push(data)
    callbackinner()
  }, function(error) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateResponseJson()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, json)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateResponseJson()', func.logCons.LOG_EXIT)
      callback(null, json)
    }
  })
}

/**
 * [generateJson to create response json]
 * @param  {[type]} item [unique data]
 * @return {[type]}      [description]
 */
function generateJson(item) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateJson()', func.logCons.LOG_ENTER)
  var json = {}
  json[func.dbCons.FIELD_ID] = item[func.dbCons.FIELD_ID] !== undefined ? item[func.dbCons.FIELD_ID] : func.msCons.FIELD_NOT_AVAILABLE
  json[func.dbCons.FIELD_FIRST_NAME] = item[func.dbCons.FIELD_FIRST_NAME] !== undefined ? item[func.dbCons.FIELD_FIRST_NAME] : func.msCons.FIELD_NOT_AVAILABLE
  json[func.dbCons.FIELD_LAST_NAME] = item[func.dbCons.FIELD_LAST_NAME] !== undefined ? item[func.dbCons.FIELD_LAST_NAME] : func.msCons.FIELD_NOT_AVAILABLE
  json[func.dbCons.FIELD_EMAIL_ADDRESS] = item[func.dbCons.FIELD_EMAIL_ADDRESS] !== undefined ? item[func.dbCons.FIELD_EMAIL_ADDRESS] : func.msCons.FIELD_NOT_AVAILABLE
  if (item.hasOwnProperty(func.dbCons.FIELD_ALTERNATE_EMAIL_ADDRESS)) {
    json[func.dbCons.FIELD_ALTERNATE_EMAIL_ADDRESS] = item[func.dbCons.FIELD_ALTERNATE_EMAIL_ADDRESS]
  }
  json[func.dbCons.FIELD_MOBILE_NUMBER] = item[func.dbCons.FIELD_MOBILE_NUMBER] !== undefined ? item[func.dbCons.FIELD_MOBILE_NUMBER] : func.msCons.FIELD_NOT_AVAILABLE
  if (item.hasOwnProperty(func.dbCons.FIELD_ALTERNATE_MOBILE_NUMBER)) {
    json[func.dbCons.FIELD_ALTERNATE_MOBILE_NUMBER] = item[func.dbCons.FIELD_ALTERNATE_MOBILE_NUMBER]
  }
  json[func.dbCons.FIELD_INSTITUTE_NAME] = item[func.dbCons.FIELD_INSTITUTE_NAME] !== undefined ? item[func.dbCons.FIELD_INSTITUTE_NAME] : func.msCons.FIELD_NOT_AVAILABLE
  json[func.dbCons.FIELD_ASSIGNED_INSTITUTE_ID] = item[func.dbCons.FIELD_ASSIGNED_INSTITUTE_ID] !== undefined ? item[func.dbCons.FIELD_ASSIGNED_INSTITUTE_ID] : func.msCons.FIELD_NOT_AVAILABLE
  json[func.dbCons.FIELD_DESIGNATION] = item[func.dbCons.FIELD_DESIGNATION] !== undefined ? item[func.dbCons.FIELD_DESIGNATION] : func.msCons.FIELD_NOT_AVAILABLE
  json[func.dbCons.FIELD_CAMPUS_YEAR] = item[func.dbCons.FIELD_CAMPUS_YEAR] !== undefined ? item[func.dbCons.FIELD_CAMPUS_YEAR] : func.msCons.FIELD_NOT_AVAILABLE
  json[func.dbCons.FIELD_COURSE] = item[func.dbCons.FIELD_COURSE] !== undefined ? item[func.dbCons.FIELD_COURSE] : func.msCons.FIELD_NOT_AVAILABLE
  json[func.dbCons.FIELD_STREAM] = item[func.dbCons.FIELD_STREAM] !== undefined ? item[func.dbCons.FIELD_STREAM] : func.msCons.FIELD_NOT_AVAILABLE
  json[func.dbCons.FIELD_STATUS] = item[func.dbCons.FIELD_STATUS] !== undefined ? item[func.dbCons.FIELD_STATUS] : func.msCons.FIELD_NOT_AVAILABLE
  json[func.dbCons.FIELD_CALCULATED_SCORE_DETAILS] = []
  if (item[func.dbCons.FIELD_CALCULATED_SCORE_DETAILS] === func.msCons.FIELD_NOT_AVAILABLE) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateJson()', func.logCons.LOG_EXIT)
    return json
  } else {
    var response = JSON.parse(item[func.dbCons.FIELD_CALCULATED_SCORE_DETAILS])
    var data = {}
    for (var index in response) {
      data[index] = {}
      data[index][func.msCons.FIELD_TOTAL_QUESTIONS] = response[index][func.msCons.FIELD_TOTAL_QUESTIONS]
      data[index][func.msCons.FIELD_TOTAL_ATTEMPTED_QUESTIONS] = response[index][func.msCons.FIELD_TOTAL_ATTEMPTED_QUESTIONS]
      data[index][func.msCons.FIELD_TOTAL_SKIPPED_QUESTIONS] = response[index][func.msCons.FIELD_TOTAL_SKIPPED_QUESTIONS]
      data[index][func.msCons.FIELD_TOTAL_WRONG_ANSWERS] = response[index][func.msCons.FIELD_TOTAL_WRONG_ANSWERS]
      data[index][func.msCons.FIELD_TOTAL_CORRECT_QUESTIONS] = response[index][func.msCons.FIELD_TOTAL_CORRECT_QUESTIONS]
      data[index][func.msCons.FIELD_MARKS_OBTAINED] = response[index][func.msCons.FIELD_MARKS_OBTAINED]
      if (response[index][func.msCons.FIELD_MARKS_OBTAINED] > 0) {
        var percentageFormula = scoreLogicConfig[func.configCons.FIELD_PERCENTAGE_FORMULA]
        percentageCalculated = percentageCalculation(response[index][func.msCons.FIELD_MARKS_OBTAINED], response[index][func.msCons.FIELD_TOTAL_QUESTIONS], percentageFormula)
        data[index][func.msCons.FIELD_PERCENTAGE] = percentageCalculated
      } else {
        data[index][func.msCons.FIELD_PERCENTAGE] = '0'
      }
    }
    json[func.dbCons.FIELD_CALCULATED_SCORE_DETAILS].push(data)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateJson()', func.logCons.LOG_EXIT)
    return json
  }
}
/**
 * percentage calculation
 */

function percentageCalculation(marks_obtained, total_questions, formula) {
  var score = null
  formula = formula.replace(func.msCons.FIELD_MARKS_OBTAINED, Number(marks_obtained))
  formula = formula.replace(func.msCons.FIELD_TOTAL_QUESTIONS, Number(total_questions))
  score = eval(formula) // eslint-disable-line
  score = score.toFixed(2)
  return score
}

/**
 * [put data into exam score details]
 * @param  {[type]}   email      [email id]
 * @param  {[type]}   orgNameMap [org and domain name]
 * @param  {[type]}   env        [environment]
 * @param  {Function} callback   [callback function]
 * @return {[type]}              [description]
 */
ExamReportDetailsHelpers.prototype.postExamReportDetails = function(email, orgNameMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'postExamReportDetails', func.logCons.LOG_ENTER)
  getPersonDetails(email, orgNameMap, function(error, personDetails) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getPersonDetails = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetails()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, personDetails)
    } else if (personDetails.length === 0 || !personDetails) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetails()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      getCandidateDetails(personDetails[0][func.dbCons.FIELD_ID], orgNameMap, function(error, candidateDetails) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCandidateDetails = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, candidateDetails)
        } else if (!candidateDetails || candidateDetails.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails()', func.logCons.LOG_EXIT)
          return callback(null, [])
        } else {
          getCampusDriveId(candidateDetails[0][func.dbCons.FIELD_CANDIDATE_SOURCE_ID], orgNameMap, function(error, driveId) {
            if (error) {
              func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCampusDriveId = ' + error)
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveId()', func.logCons.LOG_EXIT)
              return callback(new Error().stack, driveId)
            } else if (driveId.length === 0 || !driveId) {
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveId()', func.logCons.LOG_EXIT)
              return callback(null, [])
            } else {
              getCampusDriveDetails(driveId[0][func.dbCons.FIELD_CAMPUS_DRIVE_ID], orgNameMap, function(error, campusDriveDetails) {
                if (error) {
                  func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCampusDriveDetails = ' + error)
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDetails()', func.logCons.LOG_EXIT)
                  return callback(new Error().stack, campusDriveDetails)
                } else if (campusDriveDetails.length === 0 || !campusDriveDetails) {
                  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDetails()', func.logCons.LOG_EXIT)
                  return callback(null, [])
                } else {
                  getInstituteDetails(campusDriveDetails[0][func.dbCons.FIELD_ASSIGNED_INSTITUTE_ID], orgNameMap, function(error, instituteDetails) {
                    if (error) {
                      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getInstituteDetails = ' + error)
                      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteDetails()', func.logCons.LOG_EXIT)
                      return callback(new Error().stack, instituteDetails)
                    } else if (instituteDetails.length === 0 || !instituteDetails) {
                      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteDetails()', func.logCons.LOG_EXIT)
                      return callback(null, [])
                    } else {
                      var insertJson = generateInsertJson(personDetails, candidateDetails, campusDriveDetails, instituteDetails)
                      checkExistence(insertJson, orgNameMap, function(error, validation) {
                        if (error) {
                          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'checkExistence = ' + error)
                          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkExistence()', func.logCons.LOG_EXIT)
                          return callback(new Error().stack, validation)
                        } else if (validation.length >= 1) {
                          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkExistence()', func.logCons.LOG_EXIT)
                          return callback(null, [func.msgCons.MSG_MORE_THAN_ONE_EXAM_REPORT_DATA_FOUND])
                        } else {
                          putIntoExamReport(insertJson, orgNameMap, function(error, insertResponse) {
                            if (error) {
                              func.printLog(func.logCons.LOG_LEVEL_ERROR, 'putIntoExamReport = ' + error)
                              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'putIntoExamReport()', func.logCons.LOG_EXIT)
                              return callback(new Error().stack, insertResponse)
                            } else if (insertResponse.length === 0 || !insertResponse) {
                              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'putIntoExamReport()', func.logCons.LOG_EXIT)
                              return callback(null, [])
                            } else {
                              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'putIntoExamReport()', func.logCons.LOG_EXIT)
                              callback(null, insertResponse)
                            }
                          })
                        }
                      })
                    }
                  })
                }
              })
            }
          })
        }
      })
    }
  })
}

/**
 * [getPersonDetails to get person details from email id]
 * @param  {[type]} email                    [email id]
 * @param  {[type]} orgNameMap               [org and domain name]
 * @param  {[type]} callbackForPersonDetails [callback function]
 * @return {[type]}                          [description]
 */
function getPersonDetails(email, orgNameMap, callbackForPersonDetails) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetails', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_EMAIL_ADDRESS, func.lightBlueCons.OP_EQUAL, email))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ALTERNATE_EMAIL_ADDRESS, func.lightBlueCons.OP_EQUAL, email))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_OR, query), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_PERSON_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), getProjectionOverPersonDetails(), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getPersonDetails dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetails()', func.logCons.LOG_EXIT)
      return callbackForPersonDetails(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetails()', func.logCons.LOG_EXIT)
      return callbackForPersonDetails(new Error().stack, [])
    } else if (response.length > 1) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetails()', func.logCons.LOG_EXIT)
      return callbackForPersonDetails(new Error().stack, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetails()', func.logCons.LOG_EXIT)
      return callbackForPersonDetails(null, response)
    }
  })
}

/**
 * [getCandidateDetails retrieve candidate details]
 * @param  {[type]} personId                 [person id]
 * @param  {[type]} orgNameMap               [org and domain name]
 * @param  {[type]} callbackForPersonDetails [callback function]
 * @return {[type]}                          [description]
 */
function getCandidateDetails(personId, orgNameMap, callbackForPersonDetails) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_PERSON_ID, func.lightBlueCons.OP_EQUAL, personId)
  dbOp.findByQuery(query, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), getProjectionOverCandidateDetails(), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCandidateDetails dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails()', func.logCons.LOG_EXIT)
      return callbackForPersonDetails(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails()', func.logCons.LOG_EXIT)
      return callbackForPersonDetails(new Error().stack, [])
    } else if (response.length > 1) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails()', func.logCons.LOG_EXIT)
      return callbackForPersonDetails(new Error().stack, [])
    } else {
      dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_ID, func.lightBlueCons.OP_EQUAL, response[0][func.dbCons.FILED_ID]), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_EXAM_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function(error, candidateExamDetailsResponse) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'candidateExamDetails dbOperation = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'candidateExamDetails()', func.logCons.LOG_EXIT)
          return callbackForPersonDetails(new Error().stack, candidateExamDetails)
        } else if (!candidateExamDetailsResponse || candidateExamDetailsResponse.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'candidateExamDetails()', func.logCons.LOG_EXIT)
          return callbackForPersonDetails(null, [])
        } else {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'candidateExamDetails()', func.logCons.LOG_EXIT)
          callbackForPersonDetails(null, response)
        }
      })
      // func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails()', func.logCons.LOG_EXIT)
      // return callbackForPersonDetails(null, response)
    }
  })
}

/**
 * [getCampusDriveId retrieves campus drive id]
 * @param  {[type]} candidateSourceId  [candidate source id]
 * @param  {[type]} orgNameMap         [org and domain name]
 * @param  {[type]} callbackForDriveId [callback fucntion]
 * @return {[type]}                    [description]
 */
function getCampusDriveId(candidateSourceId, orgNameMap, callbackForDriveId) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveId', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, candidateSourceId))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_SOURCE_TYPE, func.lightBlueCons.OP_EQUAL, func.msCons.FIELD_CAMPUS))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), getProjectionOverCandidateSourceDetails(), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCampusDriveId dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveId()', func.logCons.LOG_EXIT)
      return callbackForDriveId(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveId()', func.logCons.LOG_EXIT)
      return callbackForDriveId(new Error().stack, [])
    } else if (response.length > 1) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveId()', func.logCons.LOG_EXIT)
      return callbackForDriveId(new Error().stack, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveId()', func.logCons.LOG_EXIT)
      return callbackForDriveId(null, response)
    }
  })
}

/**
 * [getCampusDriveDetails from campus drive collection]
 * @param  {[type]} driveId                 [campus drive id]
 * @param  {[type]} orgNameMap              [org and domain name]
 * @param  {[type]} callbackForDriveDetails [callback function]
 * @return {[type]}                         [description]
 */
function getCampusDriveDetails(driveId, orgNameMap, callbackForDriveDetails) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDetails', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, driveId)
  dbOp.findByQuery(query, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), getProjectionOverCampusDriveDetails(), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCampusDriveDetails dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDetails()', func.logCons.LOG_EXIT)
      return callbackForDriveDetails(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDetails()', func.logCons.LOG_EXIT)
      return callbackForDriveDetails(new Error().stack, [])
    } else if (response.length > 1) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDetails()', func.logCons.LOG_EXIT)
      return callbackForDriveDetails(new Error().stack, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDetails()', func.logCons.LOG_EXIT)
      return callbackForDriveDetails(null, response)
    }
  })
}

/**
 * [getInstituteDetails from institute details collection]
 * @param  {[type]} instituteId                 [institute id]
 * @param  {[type]} orgNameMap                  [org and domain name]
 * @param  {[type]} callbackForInstituteDetails [callback function]
 * @return {[type]}                             [description]
 */
function getInstituteDetails(instituteId, orgNameMap, callbackForInstituteDetails) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteDetails', func.logCons.LOG_ENTER)
  var query = dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, instituteId)
  dbOp.findByQuery(query, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_INSTITUTE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), getProjectionOverInstituteDetails(), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getInstituteDetails dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteDetails()', func.logCons.LOG_EXIT)
      return callbackForInstituteDetails(new Error().stack, response)
    } else if (!response || response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteDetails()', func.logCons.LOG_EXIT)
      return callbackForInstituteDetails(new Error().stack, [])
    } else if (response.length > 1) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteDetails()', func.logCons.LOG_EXIT)
      return callbackForInstituteDetails(new Error().stack, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteDetails()', func.logCons.LOG_EXIT)
      return callbackForInstituteDetails(null, response)
    }
  })
}

/**
 * [checkExistence to validate existence of data in exam_score_details]
 * @param  {[type]} insertJson         [json to be inserted]
 * @param  {[type]} orgNameMap         [org and domain name]
 * @param  {[type]} callbackValidation [callback function]
 * @return {[type]}                    [description]
 */
function checkExistence(insertJson, orgNameMap, callbackValidation) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkExistence', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_EMAIL_ADDRESS, func.lightBlueCons.OP_EQUAL, insertJson[func.dbCons.FIELD_EMAIL_ADDRESS]))
  // query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ALTERNATE_EMAIL_ADDRESS, func.lightBlueCons.OP_EQUAL, insertJson[func.dbCons.FIELD_ALTERNATE_EMAIL_ADDRESS]))
  var finalQuery = []
  finalQuery.push(dbOp.getOperationJson(func.lightBlueCons.OP_OR, query))
  finalQuery.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CAMPUS_YEAR, func.lightBlueCons.OP_EQUAL, insertJson[func.dbCons.FIELD_CAMPUS_YEAR]))
  dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, finalQuery), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_EXAM_SCORE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'checkExistence dbOperation = ' + error)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkExistence()', func.logCons.LOG_EXIT)
      return callbackValidation(new Error().stack, response)
    } else if (response.length >= 1) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkExistence()', func.logCons.LOG_EXIT)
      return callbackValidation(null, response)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'checkExistence()', func.logCons.LOG_EXIT)
      return callbackValidation(null, [])
    }
  })
}

/**
 * [putIntoExamReport holds db operation for insert]
 * @param  {[type]} insertJson     [json to be inserted]
 * @param  {[type]} orgNameMap     [org and domain name]
 * @param  {[type]} callbackInsert [callback function]
 * @return {[type]}                [description]
 */
function putIntoExamReport(insertJson, orgNameMap, callbackInsert) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'putIntoExamReport()', func.logCons.LOG_ENTER)
  dbOp.insert(orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_EXAM_SCORE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), insertJson, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function(error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'putIntoExamReport db operation: ' + response)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'putIntoExamReport()', func.logCons.LOG_EXIT)
      return callbackInsert(new Error().stack, response)
    } else if (response.length === 0 || !response) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'putIntoExamReport()', func.logCons.LOG_EXIT)
      return callbackInsert(new Error().stack, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'putIntoExamReport()', func.logCons.LOG_EXIT)
      callbackInsert(null, response)
    }
  })
}

/**
 * [generateInsertJson creates insert json for inssert]
 * @param  {[type]} personDetails      [result from person details collection]
 * @param  {[type]} candidateDetails   [result from candidate details collection]
 * @param  {[type]} campusDriveDetails [result from campus drive details collection]
 * @param  {[type]} instituteDetails   [result from institute details collection]
 * @return {[type]}                    [description]
 */
function generateInsertJson(personDetails, candidateDetails, campusDriveDetails, instituteDetails) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateInsertJson', func.logCons.LOG_ENTER)
  var json = {}
  json[func.dbCons.FIELD_FIRST_NAME] = personDetails[0][func.dbCons.FIELD_FIRST_NAME] !== undefined ? personDetails[0][func.dbCons.FIELD_FIRST_NAME] : func.msCons.FIELD_NOT_AVAILABLE
  json[func.dbCons.FIELD_LAST_NAME] = personDetails[0][func.dbCons.FIELD_LAST_NAME] !== undefined ? personDetails[0][func.dbCons.FIELD_LAST_NAME] : func.msCons.FIELD_NOT_AVAILABLE
  json[func.dbCons.FIELD_EMAIL_ADDRESS] = personDetails[0][func.dbCons.FIELD_EMAIL_ADDRESS] !== undefined ? personDetails[0][func.dbCons.FIELD_EMAIL_ADDRESS] : func.msCons.FIELD_NOT_AVAILABLE
  if (personDetails[0].hasOwnProperty(func.dbCons.FIELD_ALTERNATE_EMAIL_ADDRESS)) {
    json[func.dbCons.FIELD_ALTERNATE_EMAIL_ADDRESS] = personDetails[0][func.dbCons.FIELD_ALTERNATE_EMAIL_ADDRESS]
  }
  json[func.dbCons.FIELD_MOBILE_NUMBER] = personDetails[0][func.dbCons.FIELD_MOBILE_NUMBER] !== undefined ? personDetails[0][func.dbCons.FIELD_MOBILE_NUMBER] : func.msCons.FIELD_NOT_AVAILABLE
  if (personDetails[0].hasOwnProperty(func.dbCons.FIELD_ALTERNATE_MOBILE_NUMBER)) {
    json[func.dbCons.FIELD_ALTERNATE_MOBILE_NUMBER] = personDetails[0][func.dbCons.FIELD_ALTERNATE_MOBILE_NUMBER]
  }
  json[func.dbCons.FIELD_ASSIGNED_INSTITUTE_ID] = instituteDetails[0][func.dbCons.FIELD_ID] !== undefined ? instituteDetails[0][func.dbCons.FIELD_ID] : func.msCons.FIELD_NOT_AVAILABLE
  json[func.dbCons.FIELD_INSTITUTE_NAME] = instituteDetails[0][func.dbCons.FIELD_NAME] !== undefined ? instituteDetails[0][func.dbCons.FIELD_NAME] : func.msCons.FIELD_NOT_AVAILABLE
  json[func.dbCons.FIELD_DESIGNATION] = campusDriveDetails[0][func.dbCons.FIELD_DESIGNATION] !== undefined ? campusDriveDetails[0][func.dbCons.FIELD_DESIGNATION] : func.msCons.FIELD_NOT_AVAILABLE
  json[func.dbCons.FIELD_CAMPUS_YEAR] = campusDriveDetails[0][func.dbCons.FIELD_CAMPUS_INVITE_YEAR] !== undefined ? campusDriveDetails[0][func.dbCons.FIELD_CAMPUS_INVITE_YEAR] : func.msCons.FIELD_NOT_AVAILABLE
  json[func.dbCons.FIELD_COURSE] = candidateDetails[0][func.dbCons.FIELD_COURSE] !== undefined ? candidateDetails[0][func.dbCons.FIELD_COURSE] : func.msCons.FIELD_NOT_AVAILABLE
  json[func.dbCons.FIELD_STREAM] = candidateDetails[0][func.dbCons.FIELD_STREAM] !== undefined ? candidateDetails[0][func.dbCons.FIELD_STREAM] : func.msCons.FIELD_NOT_AVAILABLE
  json[func.dbCons.FIELD_CALCULATED_SCORE_DETAILS] = func.msCons.FIELD_NOT_AVAILABLE
  json[func.dbCons.COMMON_CREATED_BY] = 'system'
  json[func.dbCons.COMMON_UPDATED_BY] = 'system'
  json[func.dbCons.FIELD_STATUS] = func.dbCons.ENUM_EXAM_NOT_GIVEN
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateInsertJson', func.logCons.LOG_EXIT)
  return json
}

/**
 * [getProjectionOverPersonDetails to get projection over person details collection]
 * @return {[type]} [description]
 */
function getProjectionOverPersonDetails() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverPersonDetails()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_FIRST_NAME, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_LAST_NAME, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_EMAIL_ADDRESS, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ALTERNATE_EMAIL_ADDRESS, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_MOBILE_NUMBER, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ALTERNATE_MOBILE_NUMBER, true, true))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverPersonDetails()', func.logCons.LOG_EXIT)
  return projection
}

/**
 * [getProjectionOverCandidateDetails to get projection over candidate details collection]
 * @return {[type]} [description]
 */
function getProjectionOverCandidateDetails() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverCandidateDetails()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_USER_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PERSON_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_COURSE, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_STREAM, true, true))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverCandidateDetails()', func.logCons.LOG_EXIT)
  return projection
}

/**
 * [getProjectionOverCandidateSourceDetails to get projection over candidate source details collection]
 * @return {[type]} [description]
 */
function getProjectionOverCandidateSourceDetails() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverCandidateDetails()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, true, true))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverCandidateDetails()', func.logCons.LOG_EXIT)
  return projection
}

/**
 * [getProjectionOverCampusDriveDetails to get projection over campus drive details collection]
 * @return {[type]} [description]
 */
function getProjectionOverCampusDriveDetails() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverCampusDriveDetails()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ASSIGNED_INSTITUTE_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_INVITE_YEAR, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_DESIGNATION, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_COURSE, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_STREAM, true, true))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverCampusDriveDetails()', func.logCons.LOG_EXIT)
  return projection
}

/**
 * [getProjectionOverInstituteDetails to get projection over institute details collection]
 * @return {[type]} [description]
 */
function getProjectionOverInstituteDetails() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverInstituteDetails()', func.logCons.LOG_ENTER)
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_NAME, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getProjectionOverInstituteDetails()', func.logCons.LOG_EXIT)
  return projection
}

ExamReportDetailsHelpers.prototype.sendExamReportDetail = function(urlMap, body, callback) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'sendExamReportDetail()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'body =' + JSON.stringify(body));
  generateCsvFile(body[func.dbCons.FIELD_EMAIL_ADDRESS], urlMap, body[func.dbCons.FIELD_INSTITUTE_DETAILS], body[func.dbCons.FIELD_USER_NAME], callback);
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'sendExamReportDetail()', func.logCons.LOG_EXIT)
}

function generateCsvFile(email, urlMap, examReportJSON, recpient_name, callbacKSurveydata) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'generateCsvFile()', func.logCons.LOG_ENTER)
  var fileName = func.dbCons.FILE_ASSESSMENT_REPORT + '.csv';
  var path = './app/views/'
  if (!fs.existsSync(path)) {
    fs.mkdirSync(path);
  }
  var options = {
    headerPathString: " - "
  };
  jsonexport(examReportJSON, options, function(err, examReportJSON, callback) {
    if (err)
      callback(new Error().stack, func.errorsArrayGenrator(func.errorObjectGenrator(HELPER_CONS + func.msgCons.DATA_IS_NOT_AVAILABLE, func.msgCons.DATA_CAN_NOT_WRITE_FILE), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.DATA_CAN_NOT_WRITE_FILE));
    fs.writeFile(path + fileName, examReportJSON, '', function(err) {
      if (err)
        return callbacKSurveydata(new Error().stack, func.errorsArrayGenrator(func.errorObjectGenrator(HELPER_CONS + func.msgCons.DATA_IS_NOT_AVAILABLE, func.msgCons.DATA_CAN_NOT_WRITE_FILE), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.DATA_CAN_NOT_WRITE_FILE));
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'csv file generated!');
      var context = {};
      context[func.dbCons.FIELD_USERNAME] = recpient_name;
      var orgName = urlMap[func.urlCons.PARAM_ORG_NAME]
      sendEmail(orgName, examReportJSON, email, configJson[func.configCons.FIELD_CAMPUS_SUMMARY_OF_THE_ASSESSMENT], func.msgCons.PLACEMENT_SUMMARY_OF_THE_ASSESSMENT_SUB, context, dynamicDomain[urlMap[func.urlCons.PARAM_DOMAIN_NAME]], function(error, response) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'sendEmail() email error:' + error) // verify the format of error
          return callbacKSurveydata(new Error().stack, response)
        }
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'generateCsvFile()', func.logCons.LOG_EXIT)
        callbacKSurveydata(null, response)
      })
      // callbacKSurveydata(null, data);
    });
  });
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'generateCsvFile()', func.logCons.LOG_EXIT)
}

function sendEmail(orgName, examReportJSON, email, path, sub, context, domain, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_ENTER)
  templates.render(path, context, function(error, html, text, subject) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, path, func.logCons.LOG_ENTER)
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Error in sendMail', func.logCons.LOG_ENTER)
      return callback(new Error().stack)
    }
    if (func.validateEmail(email)) {
      if (smtpConnections[orgName] !== undefined) {
        var mailOptions = generateMailOptions(examReportJSON, email, sub, html, text, domain, smtpConnections[orgName])
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'Mail configuration for ' + orgName + ' used')
        smtpConnections[orgName].sendMail(mailOptions, function(error, response) {
          if (error) {
            return callback('Error in sending Mail: ' + error)
          }
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Response ' + response)
          smtpConnections[orgName].close()
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_ENTER)
          return callback(null, 'Mail Sent')
        })
      } else {
        func.printLog(func.logCons.LOG_LEVEL_INFO, 'Default mail configuration used')
        var mailOptions = generateMailOptions(examReportJSON, email, sub, html, text, domain, smtpTransport)
        smtpTransport.sendMail(mailOptions, function(error, response) {
          if (error) {
            return callback('Error in sending Mail: ' + error)
          }
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'Response ' + response)
          smtpTransport.close()
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_ENTER)
          return callback(null, 'Mail Sent')
        })
      }
    } else {
      func.printLog(func.logCons.LOG_LEVEL_INFO, "No need to send mail - user haven't provide email")
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'sendEmail()', func.logCons.LOG_EXIT)
      return callback(true, 'Mail Not Sent')
    }
  })
}

function generateMailOptions(examReportJSON, to, sub, html, text, domain, smtpObject) {
  var path = './app/views/' + 'Assessment_Report.csv'
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailOptions()', func.logCons.LOG_ENTER)
  var fromEmail = ''
  if (smtpObject['options']['auth']['user'] !== undefined) {
    fromEmail = smtpObject['options']['auth']['user']
  } else {
    fromEmail = '<no-reply@srkay.com>'
  }
  var attachments = {}
  attachments.filename = 'Assessment_Report.csv'
  attachments.contentType = 'text/csv'
  attachments.content = examReportJSON
  attachments.path = path
  attachments.cid = to
  var mailOptions = {
    from: domain[func.dbCons.FIELD_NAME] + ' ' + fromEmail,
    to: to,
    cc: domain[func.configCons.FIELD_CC],
    bcc: domain[func.configCons.FIELD_BCC],
    subject: sub,
    html: html,
    attachments: attachments,
    text: text,
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateMailOptions()', func.logCons.LOG_EXIT)
  return mailOptions
}

exports.ExamReportDetailsHelpers = ExamReportDetailsHelpers
