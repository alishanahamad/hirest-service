/**
 * The <code>exam-score-helpers.js</code>
 *
 * @author Vacha Dakwala, Ashita Shah, Shweta Metaliya
 */

var func = require('../utils/functions')
var async = require('async')
var DbOperation = require('./db-operations').DbOperation
var dbOp = new DbOperation()
var url = require('url')
var surveyConfig = func.config.get('survey_service')
var reportConfig = func.config.get('report')
var scoreLogicConfig = func.config.get('score_logic')
var Client = require('node-rest-client').Client
var client = new Client()
var ExamScoreDetailsCalculationHelpers = require('./exam-score-details-calculation-helpers').ExamScoreDetailsCalculationHelpers
var examScoreDetailsCalculationHelpers = new ExamScoreDetailsCalculationHelpers()
var ExamReportDetailsHelpers = require('./exam-report-details-helpers').ExamReportDetailsHelpers
var examReportDetailsHelpers = new ExamReportDetailsHelpers()
var HELPER_CONS = 'HS_ESH_'

function ExamScoreHelpers () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of exam score helper')
}

ExamScoreHelpers.prototype.getSurveyRecipientUrl = function (body, orgNameMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getSurveyRecipientUrl()', func.logCons.LOG_ENTER)
  var orgNameForInsertion = {}
  orgNameForInsertion[func.urlCons.PARAM_ORG_NAME] = orgNameMap[func.urlCons.PARAM_ORG_NAME]
  orgNameForInsertion[func.urlCons.PARAM_DOMAIN_NAME] = orgNameMap[func.urlCons.PARAM_DOMAIN_NAME]
  var url = getAddRecipientUrl(orgNameMap, env)
  var orgNameSurvey = {}
  var envVar = env !== '-1' ?
    env + '-' :
    ''
  orgNameSurvey[func.urlCons.PARAM_ORG_NAME] = surveyConfig[func.configCons.FIELD_SURVEY_SERVICE_ORG_NAME]
  orgNameSurvey[func.urlCons.PARAM_DOMAIN_NAME] = surveyConfig[func.configCons.FIELD_SURVEY_SERVICE_DOMAIN_NAME]
  var args = getAddRecipientArgJson(body, orgNameSurvey)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getSurveyRecipientUrl arg JSON for survey service:' + JSON.stringify(args))
  client.post(url, args, function (data, res) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'getSurveyRecipientUrl()recipient details data is' + JSON.stringify(data))
    var errorsArray = data[func.msgCons.RESPONSE_ERRORS]
    if (data[func.msgCons.PARAM_ERROR_STATUS] === true || errorsArray.length !== 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getSurveyRecipientUrl()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, data)
    } else {
      saveCandidateExamDetails(data.data, orgNameMap, function (error, CandidateList) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'saveCandidateExamDetails = ' + error)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveCandidateExamDetails()', func.logCons.LOG_EXIT)
          return callback(new Error().stack, 'saveCandidateExamDetails() error saving candidate exam details')
        } else {
          if (!CandidateList || CandidateList.length === 0) {
            return callback(null, 'saveCandidateExamDetails() No candidate exam details saved')
          } else {
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'CandidateList()', func.logCons.LOG_EXIT)
          }
        }
      })
      callback(null, data.data)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getSurveyRecipientUrl()', func.logCons.LOG_EXIT)
    }
  }).on('error', function (error) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getSurveyRecipientUrl() error while adding recipient: ' + error)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getSurveyRecipientUrl()', func.logCons.LOG_EXIT)
    return callback(error)
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getSurveyRecipientUrl()', func.logCons.LOG_EXIT)
}

function getAddRecipientUrl (orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAddRecipientUrl()', func.logCons.LOG_ENTER)
  var path = surveyConfig[func.configCons.FIELD_CANDIDATE_URL]
  var interMediatoryurl = func.generateUrl(surveyConfig[func.configCons.FIELD_PROTOCOL], surveyConfig[func.configCons.FIELD_HOST], surveyConfig[func.configCons.FIELD_PORT], env, orgNameMap, path)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAddRecipientUrl()', func.logCons.LOG_EXIT)
  return interMediatoryurl
}

function getAddRecipientArgJson (body, orgNameSurvey) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAddRecipientArgJson()', func.logCons.LOG_ENTER)
  var argJson = {}
  argJson[func.configCons.FIELD_DATA] = getAddRecipientBodyJson(body, orgNameSurvey)
  argJson[func.configCons.FIELD_HEADERS] = {}
  argJson[func.configCons.FIELD_HEADERS][func.configCons.FIELD_CONTENT_TYPE] = surveyConfig[func.configCons.FIELD_CONTENT_TYPE]
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getAddRecipientArgJson() argJson:' + JSON.stringify(argJson))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAddRecipientArgJson()', func.logCons.LOG_EXIT)
  return argJson
}

function getAddRecipientBodyJson (body, orgNameToSend) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAddRecipientBodyJson()', func.logCons.LOG_ENTER)
  var bodyJson = {}
  bodyJson[func.msCons.FIELD_SURVEY_ORG_NAME] = orgNameToSend
  bodyJson[func.msCons.FIELD_CANDIDATE_DETAILS] = body
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAddRecipientBodyJson()', func.logCons.LOG_EXIT)
  return bodyJson
}

ExamScoreHelpers.prototype.getExamScore = function (body, orgNameMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamScore()', func.logCons.LOG_ENTER)
  var bodyJson = func.convertIntoArray(body)
  getAllScoreDetails(bodyJson, orgNameMap, env, function (error, inputJson) {
    if (error) return callback(new Error().stack, inputJson)
    else {
      updateExamScore(inputJson, orgNameMap, function (error, updatedJson) {
        if (error) return callback(new Error().stack, updatedJson)
        else callback(null, updatedJson)
      })
    }
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getExamScore()', func.logCons.LOG_EXIT)
}

function getAllScoreDetails (bodyJson, orgNameMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAllScoreDetails()', func.logCons.LOG_ENTER)
  var allExamStatistics = {}
  async.eachOfSeries(bodyJson, function (itemCandidate, keyCandidate, callbackCandidate) {
    var email = itemCandidate[func.msCons.FIELD_CANDIDATE_EMAIL_ADDRESS]
    getPersonalScoreDetails(itemCandidate, email, orgNameMap, env, function (error, personalStatistics) {
      if (error) return callbackCandidate(new Error().stack)
      else {
        var examArray = Object.keys(personalStatistics)
        var examArray1 = func.convertIntoArray(examArray)
        var totalStatisticsJson = {}
        totalStatisticsJson[func.msCons.FIELD_TOTAL_QUESTIONS] = 0
        totalStatisticsJson[func.msCons.FIELD_TOTAL_ATTEMPTED_QUESTIONS] = 0
        totalStatisticsJson[func.msCons.FIELD_TOTAL_SKIPPED_QUESTIONS] = 0
        totalStatisticsJson[func.msCons.FIELD_TOTAL_CORRECT_ANSWERS] = 0
        totalStatisticsJson[func.msCons.FIELD_TOTAL_PARTIAL_CORRECT_QUESTION] = 0
        totalStatisticsJson[func.msCons.FIELD_TOTAL_WRONG_ANSWERS] = 0
        totalStatisticsJson[func.msCons.FIELD_MARKS_OBTAINED] = 0
        totalStatisticsJson[func.msCons.FIELD_EXAM_SCORE_STATUS] = func.dbCons.ENUM_EXAM_NOT_GIVEN
        async.eachOfSeries(examArray1, function (itemExam, keyExam, callbackExam) {
          totalStatisticsJson[func.msCons.FIELD_TOTAL_QUESTIONS] = totalStatisticsJson[func.msCons.FIELD_TOTAL_QUESTIONS] + personalStatistics[itemExam][func.msCons.FIELD_TOTAL_QUESTIONS]
          totalStatisticsJson[func.msCons.FIELD_TOTAL_ATTEMPTED_QUESTIONS] = totalStatisticsJson[func.msCons.FIELD_TOTAL_ATTEMPTED_QUESTIONS] + personalStatistics[itemExam][func.msCons.FIELD_TOTAL_ATTEMPTED_QUESTIONS]
          totalStatisticsJson[func.msCons.FIELD_TOTAL_SKIPPED_QUESTIONS] = totalStatisticsJson[func.msCons.FIELD_TOTAL_SKIPPED_QUESTIONS] + personalStatistics[itemExam][func.msCons.FIELD_TOTAL_SKIPPED_QUESTIONS]
          totalStatisticsJson[func.msCons.FIELD_TOTAL_CORRECT_ANSWERS] = totalStatisticsJson[func.msCons.FIELD_TOTAL_CORRECT_ANSWERS] + personalStatistics[itemExam][func.msCons.FIELD_TOTAL_CORRECT_ANSWERS]
          totalStatisticsJson[func.msCons.FIELD_TOTAL_PARTIAL_CORRECT_QUESTION] = totalStatisticsJson[func.msCons.FIELD_TOTAL_PARTIAL_CORRECT_QUESTION] + personalStatistics[itemExam][func.msCons.FIELD_TOTAL_PARTIAL_CORRECT_QUESTION]
          totalStatisticsJson[func.msCons.FIELD_TOTAL_WRONG_ANSWERS] = totalStatisticsJson[func.msCons.FIELD_TOTAL_WRONG_ANSWERS] + personalStatistics[itemExam][func.msCons.FIELD_TOTAL_WRONG_ANSWERS]
          totalStatisticsJson[func.msCons.FIELD_MARKS_OBTAINED] = totalStatisticsJson[func.msCons.FIELD_MARKS_OBTAINED] + personalStatistics[itemExam][func.msCons.FIELD_MARKS_OBTAINED]
          callbackExam()
        }, function (error) {
          if (error) return callbackCandidate(new Error().stack)
          else {
            totalStatisticsJson[func.msCons.FIELD_EXAM_SCORE_STATUS] = (totalStatisticsJson[func.msCons.FIELD_TOTAL_ATTEMPTED_QUESTIONS] == 0 && totalStatisticsJson[func.msCons.FIELD_TOTAL_SKIPPED_QUESTIONS] == 0) ? func.dbCons.ENUM_EXAM_NOT_GIVEN : func.dbCons.ENUM_EXAM_GIVEN
            personalStatistics[func.msCons.FIELD_AGGREGATE_EXAM_SCORE] = totalStatisticsJson
            allExamStatistics[email] = personalStatistics
            callbackCandidate()
          }
        })
      }
    })
  }, function (error) {
    if (error) return callback(new Error().stack)
    else callback(null, allExamStatistics)
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAllScoreDetails()', func.logCons.LOG_EXIT)
}

function getPersonalScoreDetails (singleCandidate, email, orgNameMap, env, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonalScoreDetails()', func.logCons.LOG_ENTER)
  var statisticsJson = {}
  async.eachOfSeries(singleCandidate[func.msCons.FIELD_SURVEY_URLS_ARRAY], function (itemLink, keyLink, callbackLink) {
    var url_parts = url.parse(itemLink, true)
    var surveyId = JSON.parse(func.decodeUsingBase64(url_parts.query[func.dbCons.FIELD_SURVEY_ID]))
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonalScoreDetails() email:' + email)
    getStatisticsFromReportService(orgNameMap, env, surveyId, email, function (error, singleStatisticsJson) {
      if (error) return callbackLink(new Error().stack, singleStatisticsJson)
      else {
        dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_QUESTIONNAIRE_LINK, func.lightBlueCons.OP_EQUAL, itemLink), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_EXAM_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function (error, candidateExamDetails) {
          if (error) return callbackLink(new Error().stack, candidateExamDetails)
          else if (!candidateExamDetails || candidateExamDetails.length === 0) return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_PROPER_DATA), HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_PROPER_DATA))
          else {
            dbOp.findByKey(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, candidateExamDetails[0][func.dbCons.FIELD_EXAM_ID], orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_EXAM_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function (error, examDetails) {
              if (error) return callbackLink(new Error().stack, examDetails)
              else if (!examDetails || examDetails.length !== 1) return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_PROPER_DATA), HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_PROPER_DATA))
              else {
                statisticsJson[examDetails[0][func.dbCons.FIELD_TEMPLATE_NAME]] = generateSingleJson(singleStatisticsJson, examDetails)
                callbackLink()
              }
            })
          }
        })
      }
    })
  }, function (error) {
    if (error) return callback(new Error().stack)
    else callback(null, statisticsJson)
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonalScoreDetails()', func.logCons.LOG_EXIT)
}

function generateSingleJson (singleStatisticsJson, examDetails) {
  var formula = scoreLogicConfig[func.configCons.FIELD_SCORE_FORMULA]
  var respondentAnalytics = singleStatisticsJson.length === 0 ? [] : JSON.parse(singleStatisticsJson[func.msCons.FIELD_QUESTIONS_RESPONDENT_ANALYTICS])
  var responseAnalytics = singleStatisticsJson.length === 0 ? [] : JSON.parse(singleStatisticsJson[func.msCons.FIELD_QUESTIONS_RESPONSES_ANALYTICS])
  var singleFormattedJson = {}
  singleFormattedJson[func.msCons.FIELD_TOTAL_QUESTIONS] = examDetails.length === 0 ? 0 : examDetails[0][func.dbCons.FIELD_NO_OF_QUESTIONS]
  singleFormattedJson[func.msCons.FIELD_TOTAL_ATTEMPTED_QUESTIONS] = singleStatisticsJson.length === 0 ? 0 : respondentAnalytics[func.msCons.FIELD_ATTEMPTED_QUESTIONS]
  singleFormattedJson[func.msCons.FIELD_TOTAL_SKIPPED_QUESTIONS] = singleStatisticsJson.length === 0 ? 0 : respondentAnalytics[func.msCons.FIELD_SKIPPED_QUESTIONS]
  singleFormattedJson[func.msCons.FIELD_TOTAL_CORRECT_ANSWERS] = singleStatisticsJson.length === 0 ? 0 : responseAnalytics[func.msCons.FIELD_CORRECT_ANSWER]
  singleFormattedJson[func.msCons.FIELD_TOTAL_PARTIAL_CORRECT_QUESTION] = singleStatisticsJson.length === 0 ? 0 : responseAnalytics[func.msCons.FIELD_PARTIALLYCORRECT_ANSWER]
  singleFormattedJson[func.msCons.FIELD_TOTAL_WRONG_ANSWERS] = singleStatisticsJson.length === 0 ? 0 : responseAnalytics[func.msCons.FIELD_INCORRECT_ANSWER]
  singleFormattedJson[func.msCons.FIELD_MARKS_OBTAINED] = singleStatisticsJson.length === 0 ? 0 : marksCalculation(singleFormattedJson, formula)
  singleFormattedJson[func.msCons.FIELD_EXAM_SCORE_STATUS] = (singleFormattedJson[func.msCons.FIELD_TOTAL_ATTEMPTED_QUESTIONS] == 0 && singleFormattedJson[func.msCons.FIELD_TOTAL_SKIPPED_QUESTIONS] == 0) ? func.dbCons.ENUM_EXAM_NOT_GIVEN : func.dbCons.ENUM_EXAM_GIVEN
  return singleFormattedJson
}

function marksCalculation (json, formula) {
  var score = null
  formula = formula.replace(func.configCons.FIELD_CORRECT_ANSWER, Number(scoreLogicConfig[func.configCons.FIELD_CORRECT_ANSWER]))
  formula = formula.replace(func.configCons.FIELD_TOTAL_CORRECT_ANSWERS, Number(json[func.msCons.FIELD_TOTAL_CORRECT_ANSWERS]))
  formula = formula.replace(func.configCons.FIELD_WRONG_ANSWER, Number(scoreLogicConfig[func.configCons.FIELD_WRONG_ANSWER]))
  formula = formula.replace(func.configCons.FIELD_TOTAL_WRONG_ANSWERS, Number(json[func.msCons.FIELD_TOTAL_WRONG_ANSWERS]))
  score = eval(formula) // eslint-disable-line
  return score
}

function getStatisticsFromReportService (orgNameMap, env, surveyId, email, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getStatisticsFromReportService()', func.logCons.LOG_ENTER)
  var url = getStatisticsUrl(orgNameMap, env, surveyId)
  var args = getStatisticsArgJson(surveyId, email)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getStatisticsFromReportService() url:' + url)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getStatisticsFromReportService() args: ' + JSON.stringify(args))
  client.post(url, args, function (data, res) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'getStatisticsFromReportService()recipient details data is' + JSON.stringify(data))
    var errorsArray = data[func.msgCons.RESPONSE_ERRORS]
    if (data[func.msgCons.PARAM_ERROR_STATUS] === true || errorsArray.length !== 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getStatisticsFromReportService()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, 'getStatisticsFromReportService() error while adding recipient details')
    } else {
      callback(null, data.data)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getStatisticsFromReportService()', func.logCons.LOG_EXIT)
    }
  }).on('error', function (error) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getStatisticsFromReportService() error while adding recipient: ' + error)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getStatisticsFromReportService()', func.logCons.LOG_EXIT)
    return callback(error)
  })
}

function getStatisticsUrl (orgNameMap, env, surveyId) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getStatisticsUrl()', func.logCons.LOG_ENTER)
  var path = reportConfig[func.configCons.FIELD_REPORT_EXAM_STATISTICS]
  var interMediatoryurl = func.generateUrl(reportConfig[func.configCons.FIELD_PROTOCOL], reportConfig[func.configCons.FIELD_HOST], reportConfig[func.configCons.FIELD_PORT], env, orgNameMap, path)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getStatisticsUrl()', func.logCons.LOG_EXIT)
  return interMediatoryurl
}

function getStatisticsBodyJson (surveyId, email) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getStatisticsBodyJson()', func.logCons.LOG_ENTER)
  var bodyJson = {}
  bodyJson[func.dbCons.FIELD_SURVEY_ID] = surveyId
  bodyJson[func.configCons.FIELD_EMAIL_ID] = email
  bodyJson[func.urlCons.PARAM_ORG_NAME] = reportConfig[func.configCons.FIELD_REPORT_SERVICE_ORG_NAME]
  bodyJson[func.urlCons.PARAM_DOMAIN_NAME] = reportConfig[func.configCons.FIELD_REPORT_SERVICE_DOMAIN_NAME]
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getStatisticsBodyJson()', func.logCons.LOG_EXIT)
  return bodyJson
}

function getStatisticsArgJson (surveyId, email) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAddRecipientArgJson()', func.logCons.LOG_ENTER)
  var argJson = {}
  argJson[func.configCons.FIELD_DATA] = getStatisticsBodyJson(surveyId, email)
  argJson[func.configCons.FIELD_HEADERS] = {}
  argJson[func.configCons.FIELD_HEADERS][func.configCons.FIELD_CONTENT_TYPE] = reportConfig[func.configCons.FIELD_CONTENT_TYPE]
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getAddRecipientArgJson() argJson:' + JSON.stringify(argJson))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAddRecipientArgJson()', func.logCons.LOG_EXIT)
  return argJson
}

function getPersonDetailsFromEmail (emailID, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromEmail()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_EMAIL_ADDRESS, func.lightBlueCons.OP_EQUAL, emailID), orgNameMap, func.dbCons.COLLECTION_PERSON_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, personDetailsResponse) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching from person detail collection for email_id = ' + emailID + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromEmail()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, personDetailsResponse)
    } else if (!personDetailsResponse || personDetailsResponse.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromEmail()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      getCandidateDetailsFromPersonId(personDetailsResponse[0][func.dbCons.FILED_ID], orgNameMap, callback)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromEmail()', func.logCons.LOG_EXIT)
    }
  })
}

function getCandidateDetailsFromPersonId (personId, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsFromPersonId()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_PERSON_ID, func.lightBlueCons.OP_EQUAL, personId), orgNameMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, candidataDetailsResponse) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching from candidate_details collection for person_id = ' + personId + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsFromPersonId()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, candidataDetailsResponse)
    } else if (!candidataDetailsResponse || candidataDetailsResponse.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsFromPersonId()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      getCandidateExamDetailsFromCandidateId(candidataDetailsResponse[0][func.dbCons.FILED_ID], orgNameMap, callback)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetailsFromPersonId()', func.logCons.LOG_EXIT)
    }
  })
}

function getCandidateExamDetailsFromCandidateId (candidateId, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetailsFromCandidateId()', func.logCons.LOG_ENTER)
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_ID, func.lightBlueCons.OP_EQUAL, candidateId), orgNameMap, func.dbCons.COLLECTION_CANDIDATE_EXAM_DETAILS, dbOp.getProjectionJson(func.lightBlueCons.FIELD_ALL, true, true), function (error, candidataDetailsResponse) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'error while fetching from candidate_exam_details collection for candidate_id = ' + candidateId + JSON.stringify(error))
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetailsFromCandidateId()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, candidataDetailsResponse)
    } else if (!candidataDetailsResponse || candidataDetailsResponse.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetailsFromCandidateId()', func.logCons.LOG_EXIT)
      return callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateExamDetailsFromCandidateId()', func.logCons.LOG_EXIT)
      return callback(null, candidataDetailsResponse)
    }
  })
}

function updateExamScore (inputJson, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateExamScore()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateExamScore() Input Json:' + JSON.stringify(inputJson))
  var keys = Object.keys(inputJson)
  var keysArray = func.convertIntoArray(keys)
  var jsonToSend = []
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateExamScore() array of emails:' + JSON.stringify(keysArray))
  async.eachOfSeries(keysArray, function (itemScore, keyScore, callbackScore) {
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'updateExamScore() single email for score:' + itemScore)
    var email = itemScore
    getPersonDetailsFromEmail(email, orgNameMap, function (error, response) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'get candidate exam details from email id ' + JSON.stringify(error))
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromEmail()', func.logCons.LOG_EXIT)
        return callbackScore(new Error().stack, response)
      } else if (!response || response.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'no candidate exam detail found for emailId' + email, func.logCons.LOG_EXIT)
        return callbackScore(null, [])
      } else {
        var json = {}
        var arrayJsonStatus = []
        async.eachOfSeries(response, function (item, key, callbackInnerResponse) {
          if (item[func.dbCons.CANDIDATE_EXAM_DETAILS_STATUS] == func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_IN_PROGRESS || item[func.dbCons.CANDIDATE_EXAM_DETAILS_STATUS] == func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_SYSTEM_CLOSED || item[func.dbCons.CANDIDATE_EXAM_DETAILS_STATUS] == func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_COMPLETED) {
            arrayJsonStatus.push(func.dbCons.ENUM_EXAM_GIVEN)
            callbackInnerResponse()
          } else {
            callbackInnerResponse()
          }
        }, function (error) {
          if (error) {
            return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP))
          } else {
            if (arrayJsonStatus.length > 0) {
              json[func.dbCons.FIELD_STATUS] = arrayJsonStatus[0]
            }
            json[func.dbCons.FIELD_CALCULATED_SCORE_DETAILS] = JSON.stringify(inputJson[itemScore])
            dbOp.update(getQueryForupdateExamScore(email), orgNameMap, func.dbCons.COLLECTION_EXAM_SCORE_DETAILS, dbOp.getOperationJson(func.lightBlueCons.OP_SET, json), dbOp.getCommonProjection(), function (error, response) {
              if (error) {
                return callbackScore(new Error().stack, response)
              } else if (!response || response.length === 0) {
                return callbackScore(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_UPDATE_DATA), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_UPDATE_DATA))
              } else {
                jsonToSend.push(response[0])
                callbackScore()
              }
            })
          }
        })
      }
    })
  }, function (error) {
    if (error) {
      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP))
    } else {
      callback(null, jsonToSend)
    }
  })
}

function getQueryForupdateExamScore (keys) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getQueryForupdateExamScore()', func.logCons.LOG_ENTER)
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_EMAIL_ADDRESS, func.lightBlueCons.OP_EQUAL, keys))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ALTERNATE_EMAIL_ADDRESS, func.lightBlueCons.OP_EQUAL, keys))
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getQueryForupdateExamScore()', func.logCons.LOG_EXIT)
  return dbOp.getOperationJson(func.lightBlueCons.OP_OR, query)
}

function saveCandidateExamDetails (data, orgNameMap, callback) {
  async.forEachOf(data, function (item, key, callbackinner) {
    var candidateJson = {}
    var encryptedEmail = item.candidate_email_address
    var user_id
    var candidataDetails = {}
    getUserID(encryptedEmail, orgNameMap, function (error, UserID) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getUserID = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserID()', func.logCons.LOG_EXIT)
        callbackinner()
      } else {
        if (!UserID[0]) {
          callbackinner()
        } else if (UserID[0] === undefined) {
          callbackinner()
        } else {
          user_id = UserID[0].user_code
          getCandidateDetails(user_id, orgNameMap, function (error, CandidateJSON) {
            if (error) {
              func.printLog(func.logCons.LOG_LEVEL_ERROR, 'getCandidateDetails = ' + error)
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails()', func.logCons.LOG_EXIT)
            } else {
              if (!CandidateJSON) {} else if (CandidateJSON[0] === undefined) {} else {
                updateCandidateStatus(func.getValuesArrayFromJson(func.dbCons.FIELD_ID, CandidateJSON), orgNameMap, function (error, candidateStatusResponse) {
                  candidataDetails = CandidateJSON
                  insertCandidateExamDetails(user_id, candidataDetails[0], item, orgNameMap, function (error, response) {
                    if (error) {
                      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'saveCandidateExamDetails = ' + error)
                      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveCandidateExamDetails()', func.logCons.LOG_EXIT)
                    } else {
                      if (!response) {} else {
                        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveCandidateExamDetails()', func.logCons.LOG_EXIT)
                      }
                    }
                  })
                })
                func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateDetails()', func.logCons.LOG_EXIT)
              }
            }
          })
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUserID()', func.logCons.LOG_EXIT)
          callbackinner()
        }
      }
    })
  }, function (error) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'saveCandidateExamDetails() ' + error)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'saveCandidateExamDetails()', func.logCons.LOG_EXIT)
    }
  })
}

function updateCandidateStatus (candidateIds, urlMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateStatus()', func.logCons.LOG_ENTER)
  var body = {}
  body[func.dbCons.FIELD_STATUS] = func.dbCons.ENUM_CANDIDATE_EXAM_PUBLISHED
  dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidateIds), urlMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, dbOp.getOperationJson(func.lightBlueCons.OP_SET, body), dbOp.getCommonProjection(), function (error, updatedCandidateDetail) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while updating candidate status = ' + JSON.stringify(error) + ' for candidate_id = ' + candidateIds)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateExamDetailsById()', func.logCons.LOG_EXIT)
      return callback(new Error().stack, updateCandidateStatus)
    }
    if (!updatedCandidateDetail || updatedCandidateDetail.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'status not updated in candidate_details' + candidateIds, func.logCons.LOG_EXIT)
      return callback(null, updatedCandidateDetail)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateStatus()', func.logCons.LOG_EXIT)
      return callback(null, updatedCandidateDetail)
    }
  })
}

function getUserID (email, orgNameMap, callback) {
  var emailField = func.dbCons.FIELD_PROFILE_DATA + '.' + func.dbCons.FIELD_EMAIL
  dbOp.findByKey(emailField, func.lightBlueCons.OP_EQUAL, email, orgNameMap, func.dbCons.COLLECTION_USER_DETAILS, dbOp.getProjectionJson(func.dbCons.FIELD_USER_CODE, true, true), function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting user code = ' + JSON.stringify(error))
      callback(new Error().stack, response)
    } else if (response == undefined) {
      callback(new Error().stack, [])
    } else if (response.length === 0 || response === []) {
      callback(null, [])
    } else {
      callback(null, response)
    }
  })
}

function getCandidateDetails (user_id, orgNameMap, callback) {
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, true, true))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_USER_ID, func.lightBlueCons.OP_EQUAL, user_id), orgNameMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, projection, function (error, response) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while getting candidate details = ' + JSON.stringify(error))
      callback(new Error().stack, [])
    } else if (response.length === 0) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, func.msgCons.ERROR_MSG_NO_CANDIDATE_DETAILS_RETRIEVED)
      callback(null, [])
    } else {
      func.printLog(func.logCons.LOG_LEVEL_INFO, func.msgCons.MSG_CANDIDATE_DETAILS_RETRIEVED)
      callback(null, response)
    }
  })
}

function insertCandidateExamDetails (user_id, candidataDetails, surveyUrlDetails, orgNameMap, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertCandidateExamDetails()', func.logCons.LOG_ENTER)
  var candidateExamDetailsBody = {}
  async.forEachOf(surveyUrlDetails.survey_urls_array, function (item, key, callbackinner) {
    candidateExamDetailsBody = generateCandidateExamDetailBody(user_id, candidataDetails, item, surveyUrlDetails)
    dbOp.insert(orgNameMap, func.dbCons.COLLECTION_CANDIDATE_EXAM_DETAILS, candidateExamDetailsBody, dbOp.getCommonProjection(), function (error, insertResponse) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'Error while inserting candidate exam details = ' + JSON.stringify(error))
        callbackinner
      } else if (insertResponse === 0) {
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.msgCons.ERROR_MSG_NO_CANIDATE_EXAM_DETAILS_INSERTED)
        callbackinner
      } else {
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.msgCons.SUCCESS_MSG_CANDIDATE_EXAM_INSERTED)
        callbackinner
      }
    })
  }, function (error) {
    if (error) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, 'insertCandidateExamDetails()', func.logCons.LOG_EXIT)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertCandidateExamDetails()', func.logCons.LOG_EXIT)
    }
  })
}

function generateCandidateExamDetailBody (user_id, candidataDetails, item, surveyUrlDetails) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateCandidateExamDetailBody()', func.logCons.LOG_EXIT)
  var candidateExamDetailBody = {}
  candidateExamDetailBody[func.dbCons.FIELD_DURING] = surveyUrlDetails[func.dbCons.FIELD_DURING]
  candidateExamDetailBody[func.dbCons.FIELD_QUESTIONNAIRE_LINK] = item[func.dbCons.FIELD_SURVEY_URL]
  candidateExamDetailBody[func.dbCons.COLLECTION_CANDIDATE_EXAM_DETAILS_CANDIDATE_ID] = candidataDetails.id
  candidateExamDetailBody[func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID] = candidataDetails[func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID]
  candidateExamDetailBody[func.dbCons.FIELD_EXAM_ID] = item[func.dbCons.FIELD_EXAM_ID]
  candidateExamDetailBody[func.dbCons.FIELD_EXAM_QUESTIONNAIRE_LINK] = item[func.dbCons.FIELD_CANDIDATE_SURVEY_LINK]
  candidateExamDetailBody[func.dbCons.FIELD_STATUS] = 0
  candidateExamDetailBody[func.dbCons.FIELD_START_TIME] = ''
  candidateExamDetailBody[func.dbCons.FIELD_END_TIME] = ''
  candidateExamDetailBody[func.dbCons.COMMON_CREATED_BY] = func.dbCons.FIELD_ADMIN
  candidateExamDetailBody[func.dbCons.COMMON_UPDATED_BY] = func.dbCons.FIELD_ADMIN
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateCandidateExamDetailBody()', func.logCons.LOG_EXIT)
  return candidateExamDetailBody
}

ExamScoreHelpers.prototype.updateCandidateExamStatus = function (campusDriveId, examStatus, orgNameMap, env, callback) {
  var self = this
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateExamStatus()', func.logCons.LOG_ENTER)
//  dbOp.findByKey(func.dbCons.FIELD_CAMPUS_DRIVE_ID, func.lightBlueCons.OP_EQUAL, campusDriveId, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function (error, candidateSourceDocument) {
  //  if (error) return callback(new Error().stack, candidateSourceDocument)
    // else if (!candidateSourceDocument || candidateSourceDocument.length === 0) {
    //   return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_PROPER_DATA), HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_PROPER_DATA))
    // }
  //  else {
      // var jsonToUpdate = {}
      // jsonToUpdate[func.dbCons.CANDIDATE_EXAM_DETAILS_STATUS] = getEnumStatusFromValue(examStatus.toUpperCase())
      // dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_EQUAL, candidateSourceDocument[0][func.dbCons.FIELD_ID]), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_EXAM_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getOperationJson(func.lightBlueCons.OP_SET, jsonToUpdate), dbOp.getCommonProjection(), function (error, updatedCandidateExam) {
      //   if (error) return callback(new Error().stack, updatedCandidateExam)
      //   else if (!updatedCandidateExam || updatedCandidateExam.length === 0) {
      //     return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_UPDATE_DATA), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_UPDATE_DATA))
      //   } else {
  examScoreDetailsCalculationHelpers.getCampusStudentDetails(campusDriveId, orgNameMap, env, function (error, emailIdList) {
    if (error) {
      return callback(new Error().stack, emailIdList)
    } else if (!emailIdList || emailIdList.length === 0) {
      return callback(new Error().stack, emailIdList)
    } else {
      var emailIdArray = func.getValuesArrayFromJson(func.msCons.FIELD_CANDIDATE_EMAIL_ADDRESS, emailIdList)
      async.eachOfSeries(emailIdArray, function (itemEmail, keyEmail, callbackEmail) {
        examReportDetailsHelpers.postExamReportDetails(itemEmail, orgNameMap, env, function (error, examScoreDocument) {
          if (error) return callbackEmail(new Error().stack, examScoreDocument)
          else callbackEmail()
        })
      }, function (error) {
        if (error) {
          return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_ASYNC_LOOP))
        } else {
          self.getExamScore(emailIdList, orgNameMap, env, function (error, updatedExamScoreDocumentList) {
            if (error) {
              return callback(new Error().stack, updatedExamScoreDocumentList)
            } else if (!updatedExamScoreDocumentList || updatedExamScoreDocumentList.length === 0) {
              return callback(null, [])
            }
            // else callback(null, updatedExamScoreDocumentList)
        //  })
            else {
              dbOp.findByKey(func.dbCons.FIELD_CAMPUS_DRIVE_ID, func.lightBlueCons.OP_EQUAL, campusDriveId, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getCommonProjection(), function (error, candidateSourceDocument) {
                if (error) return callback(new Error().stack, candidateSourceDocument)
                else if (!candidateSourceDocument || candidateSourceDocument.length === 0) {
                  return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_PROPER_DATA), HELPER_CONS + func.msgCons.CODE_NOT_FOUND, func.msgCons.ERROR_MSG_NO_PROPER_DATA))
                } else {
                  var jsonToUpdate = {}
                  jsonToUpdate[func.dbCons.CANDIDATE_EXAM_DETAILS_STATUS] = getEnumStatusFromValue(examStatus.toUpperCase())
                  dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_EQUAL, candidateSourceDocument[0][func.dbCons.FIELD_ID]), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_EXAM_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getOperationJson(func.lightBlueCons.OP_SET, jsonToUpdate), dbOp.getCommonProjection(), function (error, updatedCandidateExam) {
                    if (error) return callback(new Error().stack, updatedCandidateExam)
                    else if (!updatedCandidateExam || updatedCandidateExam.length === 0) {
                      return callback(new Error().stack, func.errorsArrayGenrator(func.generateErrorArrayObject(HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_UPDATE_DATA), HELPER_CONS + func.msgCons.CODE_BAD_REQUEST, func.msgCons.ERROR_MSG_UPDATE_DATA))
                    } else {
                      return callback(null, updatedExamScoreDocumentList)
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
      //   }
      // })
  //  }
  // })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateCandidateExamStatus()', func.logCons.LOG_EXIT)
}

function getEnumStatusFromValue (value) {
  switch (value) {
    case func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_PUBLISHED:
      return func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_PUBLISHED
    case func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_AVAILABLE:
      return func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_AVAILABLE
    case func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_IN_PROGRESS:
      return func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_IN_PROGRESS
    case func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_COMPLETED:
      return func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_COMPLETED
    case func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_SYSTEM_CLOSED:
      return func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_SYSTEM_CLOSED
    case func.dbCons.CANDIDATE_EXAM_STATUS_VALUE_CLOSED:
      return func.dbCons.CANDIDATE_EXAM_STATUS_ENUM_CLOSED
    default:
      return -1
  }
}

exports.ExamScoreHelpers = ExamScoreHelpers
