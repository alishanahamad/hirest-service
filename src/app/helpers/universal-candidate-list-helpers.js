const func = require('../utils/functions')
const async = require('async')
const DbOperation = require('./db-operations').DbOperation
const dbOp = new DbOperation()
const HELPER_CONS = 'HS_GUCL_'
var _ = require('lodash')

function UniversalCandidateListHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created to get candidate list')
}

UniversalCandidateListHelpers.prototype.getUniversalCandidateList = async function(body, orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getUniversalCandidateList()', func.logCons.LOG_ENTER)
  try {
    let data = {}
    let errors = []
    let originalKeys = []
    let replaceKeys = []
    let candidateSourceId = await getCandidateSourceDetailsId(body, orgNameMap)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidateSourceId = ${candidateSourceId}`)
    let campusDriveDetails = await getCampusDriveIdFromSourceId(candidateSourceId, orgNameMap)
    let instituteId = await getInstituteIdFromCampusDriveDetails(campusDriveDetails, orgNameMap)
    let personName = await getPersonDetailsFromPersonId(instituteId, orgNameMap)
    let instituteName = await getInstituteNameFromInstituteId(personName, orgNameMap)
    let aggregateExamScore = await getAggregateExamScore(instituteName, orgNameMap)
    originalKeys.push('id')
    originalKeys.push('name')
    replaceKeys.push('candidate_id')
    replaceKeys.push('institute_name')
    let finalJSON = await getRenamedKeysinJSON(aggregateExamScore, originalKeys, replaceKeys)
    data['candidate_list'] = finalJSON

    return {
      data: data,
      errors: errors
    }
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while getting candidate Detail. ${err}`)
    let error = func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER, err)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateFromCampusId()', func.logCons.LOG_EXIT)
    throw error
  }
}

function getCampusArrayfromStatus(candidateList, roundType, type) {
  let campusArray = []
  if (type == 2) {
    for (let candidate of candidateList) {
      if (roundType != func.dbCons.VALUE_ROUND_TYPE_ON_SITE) {
        if (candidate[func.dbCons.COLLECTION_JSON_STAGE] === func.dbCons.ENUM_SELECTED_FOR_GD) {
          campusArray.push(candidate[func.dbCons.FIELD_CAMPUS_DRIVE_ID])
        }
      } else {
        if (candidate[func.dbCons.COLLECTION_JSON_STAGE] === func.dbCons.ENUM_STAGE_SELECTED_IN_GD_FOR_ONSITE) {
          campusArray.push(candidate[func.dbCons.FIELD_CAMPUS_DRIVE_ID])
        }
      }
    }
  } else if (type == 3) {
    for (let candidate of candidateList) {
      if (roundType != func.dbCons.VALUE_ROUND_TYPE_ON_SITE) {
        if (candidate[func.dbCons.COLLECTION_JSON_STAGE] === func.dbCons.ENUM_SELECTED_FOR_PI) {
          campusArray.push(candidate[func.dbCons.FIELD_CAMPUS_DRIVE_ID])
        }
      } else {
        if (candidate[func.dbCons.COLLECTION_JSON_STAGE] === func.dbCons.ENUM_STAGE_SELECTED_IN_PI_FOR_ONSITE) {
          campusArray.push(candidate[func.dbCons.FIELD_CAMPUS_DRIVE_ID])
        }
      }
    }
  }
  return campusArray
}

/* get candidate scource id and person id from candidate details */

async function getCandidateSourceDetailsId(body, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceDetailsId()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, true, true))
    var roundType = body['round_type']
    var type = body['type']
    var stage
    if (type == 2) {
      if (roundType != func.dbCons.VALUE_ROUND_TYPE_ON_SITE) {
        stage = func.dbCons.ENUM_SELECTED_FOR_GD
      } else {
        stage = func.dbCons.ENUM_STAGE_SELECTED_IN_GD_FOR_ONSITE
      }
    } else if (type == 3) {
      if (roundType != func.dbCons.VALUE_ROUND_TYPE_ON_SITE) {
        stage = func.dbCons.ENUM_SELECTED_FOR_PI
      } else {
        stage = func.dbCons.ENUM_STAGE_SELECTED_IN_PI_FOR_ONSITE
      }
    }
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PERSON_ID, true, true))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
    dbOp.findByKey(func.dbCons.COLLECTION_JSON_STAGE, func.lightBlueCons.OP_EQUAL, stage, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), projection, function(err, candidateDetailsId) {
      if (err) {
        // Lightblue Error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching candidate details(source_id,candidate_id). ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceDetailsId()', func.logCons.LOG_EXIT)
        return reject(err)
      } else if (!candidateDetailsId || candidateDetailsId.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `no candidate details found`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceDetailsId()', func.logCons.LOG_EXIT)
        return reject(new Error(`invalid candidate id ${candidateId}`))
      }

      return resolve(candidateDetailsId)
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceDetailsId()', func.logCons.LOG_EXIT)
  })
}

/* get campus drive id from candidate source id in candidate source details collecation */

async function getCampusDriveIdFromSourceId(candidateDetails, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdFromSourceId()', func.logCons.LOG_ENTER)
    var candidateSourceId = generateIdArray(candidateDetails, func.dbCons.FIELD_CANDIDATE_SOURCE_ID)
    var projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, true, true))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidateSourceId), orgNameMap, func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, projection, function(err, campusDriveId) {
      if (err) {
        // Lightblue Error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching person id. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdFromSourceId()', func.logCons.LOG_EXIT)
        return reject(err)
      } else if (!campusDriveId || campusDriveId.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `no campus drive details details found`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdFromSourceId()', func.logCons.LOG_EXIT)
        return reject(new Error(`invalid campusDrive id ${campusDriveId}`))
      }
      var sourceField = func.dbCons.FIELD_CANDIDATE_SOURCE_ID
      var destSourceField = func.dbCons.FIELD_ID
      var destinationFields = []
      destinationFields.push(func.dbCons.FIELD_CAMPUS_DRIVE_ID)
      mappingJson(candidateDetails, campusDriveId, sourceField, destSourceField, destinationFields, function(error, jsonResponse) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
        } else if (!jsonResponse || jsonResponse.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
        } else {
          return resolve(jsonResponse)
        }
      })
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdFromSourceId()', func.logCons.LOG_EXIT)
  })
}

/* get institute id from campus drive id in campus drive details collection */
async function getInstituteIdFromCampusDriveDetails(campusDriveDetails, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteIdFromCampusDriveDetails()', func.logCons.LOG_ENTER)
    var campusDriveId = generateIdArray(campusDriveDetails, func.dbCons.FIELD_CAMPUS_DRIVE_ID)
    var projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_INSTITUTE_ID, true, true))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, campusDriveId), orgNameMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, projection, function(err, instituteId) {
      if (err) {
        // Lightblue Error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching institute  id. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdFromSourceId()', func.logCons.LOG_EXIT)
        return reject(err)
      } else if (!instituteId || instituteId.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `no campus drive details details found`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdFromSourceId()', func.logCons.LOG_EXIT)
        return reject(new Error(`invalid campusDrive id ${instituteId}`))
      }
      var sourceField = func.dbCons.FIELD_CAMPUS_DRIVE_ID
      var destSourceField = func.dbCons.FIELD_ID
      var destinationFields = []
      destinationFields.push(func.dbCons.FIELD_INSTITUTE_ID)
      mappingJson(campusDriveDetails, instituteId, sourceField, destSourceField, destinationFields, function(error, jsonResponse) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
        } else if (!jsonResponse || jsonResponse.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
        } else {
          return resolve(jsonResponse)
        }
      })
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdFromSourceId()', func.logCons.LOG_EXIT)
  })
}

/* get person name from person id in person details collection */

async function getPersonDetailsFromPersonId(personDetails, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromPersonId()', func.logCons.LOG_ENTER)
    var personId = generateIdArray(personDetails, func.dbCons.FILED_PERSON_ID)
    var projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FILED_FIRST_NAME, true, true))
    projection.push(dbOp.getProjectionJson(func.dbCons.FILED_LAST_NAME, true, true))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
    projection.push(dbOp.getProjectionJson(func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS, true, true))
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, personId), orgNameMap, func.dbCons.COLLECTION_PERSON_DETAILS, projection, function(err, personName) {
      if (err) {
        // Lightblue Error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching person name. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromPersonId()', func.logCons.LOG_EXIT)
        return reject(err)
      } else if (!personName || personName.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `no person details found`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonDetailsFromPersonId()', func.logCons.LOG_EXIT)
        return reject(new Error(`invalid person name ${personName}`))
      }
      var sourceField = func.dbCons.FILED_PERSON_ID
      var destSourceField = func.dbCons.FIELD_ID
      var destinationFields = []
      destinationFields.push(func.dbCons.FILED_FIRST_NAME)
      destinationFields.push(func.dbCons.FILED_LAST_NAME)
      destinationFields.push(func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS)
      mappingJson(personDetails, personName, sourceField, destSourceField, destinationFields, function(error, jsonResponse) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
        } else if (!jsonResponse || jsonResponse.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
        } else {
          return resolve(jsonResponse)
        }
      })
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdFromSourceId()', func.logCons.LOG_EXIT)
  })
}

/* get institute name from institute id in institute details collection */

async function getInstituteNameFromInstituteId(instituteDetails, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteNameFromInstituteId()', func.logCons.LOG_ENTER)
    var instituteId = generateIdArray(instituteDetails, func.dbCons.FIELD_INSTITUTE_ID)
    var projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_INSTITUTE_DETAILS_NAME, true, true))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, instituteId), orgNameMap, func.dbCons.COLLECTION_INSTITUTE_DETAILS, projection, function(err, instituteName) {
      if (err) {
        // Lightblue Error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching institute name. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteNameFromInstituteId()', func.logCons.LOG_EXIT)
        return reject(err)
      } else if (!instituteName || instituteName.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `no institute details found`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteNameFromInstituteId()', func.logCons.LOG_EXIT)
        return reject(new Error(`invalid person name ${instituteName}`))
      }
      var sourceField = func.dbCons.FIELD_INSTITUTE_ID
      var destSourceField = func.dbCons.FIELD_ID
      var destinationFields = []
      destinationFields.push(func.dbCons.FIELD_INSTITUTE_DETAILS_NAME)
      mappingJson(instituteDetails, instituteName, sourceField, destSourceField, destinationFields, function(error, jsonResponse) {
        if (error) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
        } else if (!jsonResponse || jsonResponse.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
        } else {
          return resolve(jsonResponse)
        }
      })
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdFromSourceId()', func.logCons.LOG_EXIT)
  })
}

async function getRenamedKeysinJSON(finalJSON, originalKeys, replaceKeys) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getRenamedKeysinJSON()', func.logCons.LOG_ENTER)
    for (var i = 0; i < originalKeys.length; i++) {
      for (let obj of finalJSON) {
        var key = originalKeys[i]

        var replacekey = replaceKeys[i]

        obj[replacekey] = obj[key]
        delete obj[key]
      }
    }

    return resolve(finalJSON)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getRenamedKeysinJSON()', func.logCons.LOG_EXIT)
  })
}

/* get aggregate exam score from email id in exam score details collection*/
async function getAggregateExamScore(examDetails, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAggregateExamScore()', func.logCons.LOG_ENTER)
    var emailId = generateIdArray(examDetails, func.dbCons.FIELD_EMAIL_ADDRESS)
    var projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_EMAIL_ADDRESS))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CALCULATED_SCORE_DETAILS))
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_EMAIL_ADDRESS, func.lightBlueCons.OP_IN, emailId), orgNameMap,
      func.dbCons.COLLECTION_EXAM_SCORE_DETAILS, projection,
      function(err, aggregateExamScore) {
        if (err) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching institute name. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAggregateExamScore()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!aggregateExamScore || aggregateExamScore.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `no aggregate score found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getAggregateExamScore()', func.logCons.LOG_EXIT)
          var aggregateExamScore = []
          return reject(null, aggregateExamScore)
        }
        var result = _.map(aggregateExamScore, item => ({
          marks_obtained: JSON.parse(item.calculated_score_details).aggregate_exam_score.marks_obtained,
          email_address: item.email_address
        }));
        var sourceField = func.dbCons.FIELD_EMAIL_ADDRESS
        var destSourceField = func.dbCons.FIELD_EMAIL_ADDRESS
        var destinationFields = []
        destinationFields.push(func.msCons.FIELD_MARKS_OBTAINED)

        mappingJson(examDetails, result, sourceField, destSourceField, destinationFields, function(error, jsonResponse) {
          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
          } else if (!jsonResponse || jsonResponse.length === 0) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
          } else {
            return resolve(jsonResponse)
          }
        })
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdFromSourceId()', func.logCons.LOG_EXIT)
  })
}

/* used for json mapping */
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

/* generate id array */

function generateIdArray(originalJSON, fieldName) {
  var idArray = []
  var array = originalJSON.filter(function(obj) {
    idArray.push(obj[fieldName])
    return idArray
  })
  return idArray
}

exports.UniversalCandidateListHelpers = UniversalCandidateListHelpers
