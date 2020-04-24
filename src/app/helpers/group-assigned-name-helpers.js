'use strict'
/**
 * This function is useful for fetching group name of gd and pi
 * @author Monika Mehta
 */
const func = require('../utils/functions')
// const async = require('async')
const DbOperation = require('./db-operations').DbOperation
const dbOp = new DbOperation()
var _ = require('lodash')

function GroupAssignedNameHelpers () {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of group name')
}

/**
 * [description]
 * @param  {[type]} reqBody    [campus_drive_details with desgination and roundType]
 * @param  {[type]} orgNameMap [description]
 * @param  {[type]} env        [description]
 * @return {[type]}            [description]
 */
GroupAssignedNameHelpers.prototype.getGroupName = async function (reqBody, orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getGroupName()', func.logCons.LOG_ENTER)
  try {
    let errors = []
    const roundType = reqBody[func.dbCons.FIELD_ROUND_TYPE]
    const campusDriveArray = func.getValuesArrayFromJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, reqBody[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS])
    let gdGroupName = await getGroupNameFromGd(campusDriveArray, roundType, orgNameMap)
    // gdGroupName = _.uniqBy(gdGroupName, func.dbCons.UNIVERSITY_GROUP_NAME)
    let candidateSourceDetails = await getCandidatesourceIds(campusDriveArray, orgNameMap)
    let piResponse = await getGroupNameFromPi (candidateSourceDetails, roundType, orgNameMap)
    // piResponse = _.uniqBy(piResponse, func.dbCons.UNIVERSITY_GROUP_NAME)
    let piGroupName = await getCampusDriveIdsFromCandidateSource(candidateSourceDetails, piResponse)
    gdGroupName = JSON.parse(JSON.stringify(gdGroupName).replace(/\"gd_date":/g, '"date":'))
    piGroupName = JSON.parse(JSON.stringify(piGroupName).replace(/\"pi_date":/g, '"date":'))
    let groupName = await getGroupNameWithDesignation(reqBody[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS], _.concat(gdGroupName, piGroupName))
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `gdGroupName =${JSON.stringify(gdGroupName)}`)
    if (gdGroupName.length === 0) {
      return getReturnJson(groupName)
    } else {
      return getReturnJson(groupName)
    }
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while getting group name. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupName()', func.logCons.LOG_EXIT)
    throw err
  }
}

/**
 * [description]
 * @param  {[type]} groupName  [group name]
 * @param  {[type]} orgNameMap [description]
 * @param  {[type]} env        [description]
 * @return {[type]}            [description]
 */
GroupAssignedNameHelpers.prototype.findGroupName = async function (groupName, orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'findGroupName()', func.logCons.LOG_ENTER)
  try {
    let errors = []
    const gdGroupName = await findGroupNameInGd(groupName, orgNameMap)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `gdGroupName =${JSON.stringify(gdGroupName)}`)
    if (gdGroupName.length === 0) {
      const piGroupName = await findGroupNameInPi(groupName, orgNameMap)
      return getReturnGroupNameResponse(piGroupName)
    } else {
      return getReturnGroupNameResponse(groupName)
    }
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while getting group name. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupName()', func.logCons.LOG_EXIT)
    throw err
  }
}

function getReturnGroupNameResponse (groupName) {
  let errors = []
  return {
    data: [],
    errors: errors,
    message: (groupName.length === 0) ? func.msgCons.NO_GROUP_NAME_FOUND : func.msgCons.GROUP_NAME_EXISTS
  }
}

async function findGroupNameInGd (groupName, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findGroupNameInGd()', func.logCons.LOG_ENTER)
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.UNIVERSITY_GROUP_NAME, func.lightBlueCons.OP_EQUAL, groupName),
    orgNameMap,
    dbOp.setCollectionJson(func.dbCons.COLLECTION_GD_GROUP_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
    dbOp.getCommonProjection(), (err, groupNameResponse) => {
      if (err) {
        // Lightblue error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while finding group name. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findGroupNameInGd()', func.logCons.LOG_EXIT)
        return reject(new Error(`Error while fetching group name from gd. ${err}`))
      }
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findGroupNameInGd()', func.logCons.LOG_EXIT)
      return resolve(groupNameResponse)
    })
  })
}

async function findGroupNameInPi (groupName, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findGroupNameInPi()', func.logCons.LOG_ENTER)
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.UNIVERSITY_GROUP_NAME, func.lightBlueCons.OP_EQUAL, groupName),
    orgNameMap,
    dbOp.setCollectionJson(func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
    dbOp.getCommonProjection(), (err, groupNameResponse) => {
      if (err) {
        // Lightblue error
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while finding group name. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findGroupNameInPi()', func.logCons.LOG_EXIT)
        return reject(new Error(`Error while fetching group name from gd. ${err}`))
      }
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findGroupNameInPi()', func.logCons.LOG_EXIT)
      return resolve(groupNameResponse)
    })
  })
}

/**
 * [getCampusDriveIdsFromCandidateSource description]
 * @param  {[type]} candidateSourceDetails [candidateSourceIds and campusDriveIds]
 * @param  {[type]} piResponses            [JSON object of piGroupName and candidateSourceIds]
 * @return {[type]}                        [mapping of piGroupName based on candidateSourceIds]
 */
async function getCampusDriveIdsFromCandidateSource (candidateSourceDetails, piResponses) {
  return new Promise((resolve, reject) => {
    for (let piResponse of piResponses) {
      let campusDrive = (func.filterBasedOnValue(candidateSourceDetails, func.dbCons.FIELD_ID, piResponse[func.dbCons.FIELD_CANDIDATE_SOURCE_ID]))
      piResponse[func.dbCons.FIELD_CAMPUS_DRIVE_ID] = campusDrive[0][func.dbCons.FIELD_CAMPUS_DRIVE_ID]
    }
    return resolve(piResponses)
  })
}

function getReturnJson (gdGroupName) {
  let errors = []
  return {
    data: gdGroupName,
    errors: errors,
    message: (gdGroupName.length === 0) ? func.msgCons.NO_GROUP_NAME_FOUND : func.msgCons.SUCCESS_MSG_DATA_RETRIEVED
  }
}

/**
 * [getCandidatesourceIds description]
 * @param  {[type]} campusDriveArray [array of campusDriveIds]
 * @param  {[type]} orgNameMap       [description]
 * @return {[type]}                  [candidateSourceIds and campusDriveIds]
 */
async function getCandidatesourceIds (campusDriveArray, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidatesourceIds()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FILED_ID, true, true))
    projection.push(dbOp.getProjectionJson(func.dbCons.CAMPUS_SOURCE_DETAILS_CAMPUS_ID, true, true))
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.CAMPUS_SOURCE_DETAILS_CAMPUS_ID, func.lightBlueCons.OP_IN, campusDriveArray), orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_CAMPUS_SOURCE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      projection,
      function (err, candidateSourceIds) {
        if (err) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching candidate source ids  ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidatesourceIds()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!candidateSourceIds || candidateSourceIds.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `no groups name found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidatesourceIds()', func.logCons.LOG_EXIT)
          return resolve(candidateSourceIds)
        }
        return resolve(candidateSourceIds)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIds()', func.logCons.LOG_EXIT)
  })
}

/**
 * [getGroupNameFromGd description]
 * @param  {[type]} campusDriveArray [Array of campusDriveIds]
 * @param  {[type]} roundType        [Whether it is ON_SITE OR ON_CAMPUS]
 * @param  {[type]} orgNameMap       [description]
 * @return {[type]}                  [groupName with campusDriveIds]
 */
async function getGroupNameFromGd (campusDriveArray, roundType, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupNameFromGd()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_GD_DATE, true, true))
    projection.push(dbOp.getProjectionJson(func.dbCons.CAMPUS_SOURCE_DETAILS_CAMPUS_ID, true, true))
    var query = getQueryForGdGroupName(campusDriveArray, roundType)
    dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_GD_GROUP_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      projection,
      function (err, gdGroupNames) {
        if (err) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching group assigned name. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupNameFromGd()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!gdGroupNames || gdGroupNames.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `no groups name found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupNameFromGd()', func.logCons.LOG_EXIT)
          return resolve(gdGroupNames)
        }
        return resolve(gdGroupNames)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIds()', func.logCons.LOG_EXIT)
  })
}

/**
 * [getGroupNameFromPi description]
 * @param  {[type]} candidateSourceDetails [JSON object of candidateSoourceId and campusDriveId]
* @param  {[type]} roundType        [Whether it is ON_SITE OR ON_CAMPUS]
* @param  {[type]} orgNameMap       [description]
* @return {[type]}                  [groupName with campusDriveIds]
 */
async function getGroupNameFromPi (candidateSourceDetails, roundType, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupNameFromPi()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PI_DATE, true, true))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, true, true))
    var query = getQueryForPiGroupName(func.getValuesArrayFromJson(func.dbCons.FIELD_ID, candidateSourceDetails), roundType)
    dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      projection,
      function (err, piGroupNames) {
        if (err) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching pi group assigned name. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupNameFromPi()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!piGroupNames || piGroupNames.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `no groups name found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupNameFromPi()', func.logCons.LOG_EXIT)
          return resolve(piGroupNames)
        }
        return resolve(piGroupNames)
        // return resolve(_.uniqBy(piGroupNames, func.dbCons.FIELD_CANDIDATE_SOURCE_ID))
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupNameFromPi()', func.logCons.LOG_EXIT)
  })
}

function getQueryForGdGroupName (campusYearArray, roundType){
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROUND_TYPE, func.lightBlueCons.OP_EQUAL, getEnumForRoundType(roundType)))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.CAMPUS_SOURCE_DETAILS_CAMPUS_ID, func.lightBlueCons.OP_IN, campusYearArray))
  return query
}

function getQueryForPiGroupName (candidateSourceIds, roundType) {
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROUND_TYPE, func.lightBlueCons.OP_EQUAL, getEnumForRoundType(roundType)))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_IN, candidateSourceIds))
  return query
}

function getEnumForRoundType (value) {
  switch (value) {
    case func.dbCons.VALUE_ROUND_TYPE_ON_CAMPUS:
      return func.dbCons.ENUM_ROUND_TYPE_ON_CAMPUS
    case func.dbCons.VALUE_ROUND_TYPE_ON_SITE:
      return func.dbCons.ENUM_ROUND_TYPE_ON_SITE
    default:
      return -1
  }
}

/**
 * [getGroupNameWithDesignation description]
 * @param  {[type]} campusDriveDetails [JSON object containing campusDriveId and desgination]
 * @param  {[type]} gdDetails          [Gd and Pi group name with campusDriveIds]
 * @return {[type]}                    [Json object with campusDriveIds,groupName and desgination]
 */
async function getGroupNameWithDesignation (campusDriveDetails, gdDetails) {
  return new Promise((resolve, reject) => {
    for (let gdDetail of gdDetails) {
      let desginationJson = (func.filterBasedOnValue(campusDriveDetails, func.dbCons.CAMPUS_SOURCE_DETAILS_CAMPUS_ID, gdDetail[func.dbCons.CAMPUS_SOURCE_DETAILS_CAMPUS_ID]))
      gdDetail[func.dbCons.COLLECTION_DESIGNATION] = func.getValuesArrayFromJson(func.dbCons.COLLECTION_DESIGNATION, desginationJson)
    }
    let groupByDate = _(gdDetails)
      .groupBy(func.msCons.FIELD_DATE)
      .map((campus_drive_details, date) => ({
        date,
        campus_drive_details
      }))
      .value()
      let groupDateResponse = []
      for (let groupDate of groupByDate) {
        let response = {}
        response[func.msCons.FIELD_DATE] = groupDate[func.msCons.FIELD_DATE]
        let desginationArray = []
        for(let campusDrive of groupDate[func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS]){
          desginationArray = _.concat(desginationArray, campusDrive[func.dbCons.COLLECTION_DESIGNATION])
        }
        response[func.dbCons.COLLECTION_DESIGNATION] = _.uniq(desginationArray)
        groupDateResponse.push(response)
        }
    return resolve(groupDateResponse)
  })
}

/**
 * [description]
 * @param  {[type]} reqBody    [dates with desgination]
 * @param  {[type]} orgNameMap [description]
 * @param  {[type]} env        [description]
 * @return {[type]}            [description]
 */
GroupAssignedNameHelpers.prototype.getGroupNameBasedOnDateAndDesignation = async function(reqBody, orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getGroupNameBasedOnDateAndDesignation()', func.logCons.LOG_ENTER)
  try {
    let errors = []
    const roundType = reqBody[func.dbCons.FIELD_ROUND_TYPE]
    const gd_pi_date = reqBody[func.dbCons.FIELD_GD_PI_DATE]
    const designation = reqBody[func.dbCons.FIELD_DESIGNATION]
    let campusDriveIdArr = await getCampusDriveIdArrayFromDesignation(designation, orgNameMap)
    const campusDriveIdArray = func.getValuesArrayFromJson(func.dbCons.FIELD_ID, campusDriveIdArr)
    let candidateSourceIdArr = await getCandidateSourceIdarrayFromcampusDriveId(campusDriveIdArray, orgNameMap)
    const candidateSourceIdArray = func.getValuesArrayFromJson(func.dbCons.FIELD_ID, candidateSourceIdArr)
    let gdGroupName = await getGroupNameFromGdUsingDateAndRoundType(candidateSourceIdArray, gd_pi_date, roundType, orgNameMap)
    gdGroupName = _.uniqBy(gdGroupName, func.dbCons.UNIVERSITY_GROUP_NAME)
    let piGroupName = await getGroupNameFromPiUsingDateAndRoundType(candidateSourceIdArray, gd_pi_date, roundType, orgNameMap)
    piGroupName = _.uniqBy(piGroupName, func.dbCons.UNIVERSITY_GROUP_NAME)
    let temp = gdGroupName.concat(piGroupName)
    gdGroupName = temp
    const universityGroupName = func.getValuesArrayFromJson(func.dbCons.UNIVERSITY_GROUP_NAME, gdGroupName)
    let universityJson = {};
    universityJson[func.dbCons.UNIVERSITY_GROUP_NAME] = universityGroupName
    if (universityJson.length === 0) {
      return getReturnJson(universityJson)
    } else {
      return getReturnJson(universityJson)
    }
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while getting group name. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupName()', func.logCons.LOG_EXIT)
    throw err
  }
}

function getQueryForPiGroupNameUsingCandidateSourceId(candidateSourceIdArray, gdPiDate, roundType) {
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_PI_DATE, func.lightBlueCons.OP_EQUAL, gdPiDate))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROUND_TYPE, func.lightBlueCons.OP_EQUAL, getEnumForRoundType(roundType)))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_IN, candidateSourceIdArray))
  return query
}

async function getGroupNameFromPiUsingDateAndRoundType(candidateSourceIdArray, gdPiDate, roundType, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupNameFromPiUsingDateAndRoundType()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.UNIVERSITY_GROUP_NAME, true, true))
    var query = getQueryForPiGroupNameUsingCandidateSourceId(candidateSourceIdArray, gdPiDate, roundType)
    dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      projection,
      function(err, gdGroupNames) {
        if (err) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching group assigned name. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupNameFromGd()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!gdGroupNames || gdGroupNames.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `no groups name found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupNameFromGd()', func.logCons.LOG_EXIT)
          return resolve(gdGroupNames)
        }
        return resolve(gdGroupNames)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupNameFromPiUsingDateAndRoundType()', func.logCons.LOG_EXIT)
  })
}

function getQueryForGdGroupNameUsingCandidateSourceId(candidateSourceIdArray, gdPiDate, roundType) {
  var query = []
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_GD_DATE, func.lightBlueCons.OP_EQUAL, gdPiDate))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROUND_TYPE, func.lightBlueCons.OP_EQUAL, getEnumForRoundType(roundType)))
  query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, func.lightBlueCons.OP_IN, candidateSourceIdArray))
  return query
}
/**
 * [getGroupNameFromGd description]
 * @param  {[type]} gdPiDate        [campus drive gd or pi date]
 * @param  {[type]} roundType        [Whether it is ON_SITE OR ON_CAMPUS]
 * @param  {[type]} orgNameMap       [description]
 * @param {[type]} designation        [designation of candidate]
 * @return {[type]}                  [groupName with campusDriveIds]
 */
async function getGroupNameFromGdUsingDateAndRoundType(candidateSourceIdArray, gdPiDate, roundType, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupNameFromGdUsingDateAndRoundType()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.UNIVERSITY_GROUP_NAME, true, true))
    var query = getQueryForGdGroupNameUsingCandidateSourceId(candidateSourceIdArray, gdPiDate, roundType)
    dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_GD_GROUP_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      projection,
      function(err, gdGroupNames) {
        if (err) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching group assigned name. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupNameFromGd()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!gdGroupNames || gdGroupNames.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `no groups name found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupNameFromGd()', func.logCons.LOG_EXIT)
          return resolve(gdGroupNames)
        }
        return resolve(gdGroupNames)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupNameFromGdUsingDateAndRoundType()', func.logCons.LOG_EXIT)
  })
}


async function getCampusDriveIdArrayFromDesignation(designation, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdArrayFromDesignation()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FILED_ID, true, true))
    dbOp.findByKey(func.dbCons.FIELD_DESIGNATION, func.lightBlueCons.OP_EQUAL, designation, orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      projection,
      function(err, campusDriveidArray) {
        if (err) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching campus drive id from designation. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'get campus drive id from designation()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!campusDriveidArray || campusDriveidArray.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `no campus found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupNameFromGd()', func.logCons.LOG_EXIT)
          return resolve(campusDriveidArray)
        }
        return resolve(campusDriveidArray)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdArrayFromDesignation()', func.logCons.LOG_EXIT)
  })
}
async function getCandidateSourceIdarrayFromcampusDriveId(campusDriveIdArray, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIdarrayFromcampusDriveId()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FILED_ID, true, true))
    dbOp.findByKey(func.dbCons.CAMPUS_SOURCE_DETAILS_CAMPUS_ID, func.lightBlueCons.OP_IN, campusDriveIdArray, orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_CAMPUS_SOURCE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      projection,
      function(err, candidateSouceIdArray) {
        if (err) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetchingcandidate source id from campus drive id. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'get candidate source id from campus drive id()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!candidateSouceIdArray || candidateSouceIdArray.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `no campus found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getGroupNameFromGd()', func.logCons.LOG_EXIT)
          return resolve(candidateSouceIdArray)
        }
        return resolve(candidateSouceIdArray)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIdarrayFromcampusDriveId()', func.logCons.LOG_EXIT)
  })
}

exports.GroupAssignedNameHelpers = GroupAssignedNameHelpers
