const func = require('../utils/functions')
// const async = require('async')
const DbOperation = require('./db-operations').DbOperation
const dbOp = new DbOperation()
const HELPER_CONS = 'HI_CYH_'
var _ = require('lodash')

function CampusYearHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of campus year')
}
CampusYearHelpers.prototype.getCampusYearFromInstituteName = async function(instituteName, roundType, stage, orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCampusYearFromInstituteName()', func.logCons.LOG_ENTER)
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `${func.logCons.LOG_PARAM}, institute name = ${instituteName}, stage = ${stage}`)
  try {
    let data = {}
    let errors = []
    const candidateSourceIds = await getCandidateSourceIds(roundType, stage, orgNameMap)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidateSourceIds =${JSON.stringify(candidateSourceIds)}`)
    if (candidateSourceIds.length === 0) {
      return getReturnJson(candidateSourceIds)
    } else {
      const campusDriveIds = await getCampusDriveIds(candidateSourceIds, orgNameMap)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, `campusDriveIds =${JSON.stringify(campusDriveIds)}`)
      if (campusDriveIds.length === 0) {
        return getReturnJson(campusDriveIds)
      } else {
        const campusDriveDetails = await getInstituteIds(campusDriveIds, orgNameMap)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, `campusDriveDetails =${JSON.stringify(campusDriveDetails)}`)
        if (campusDriveDetails === 0) {
          return getReturnJson(campusDriveDetails)
        } else if (instituteName === undefined) {
          let campusDriveYear = await getCampusYearFinalResponse(campusDriveDetails)
          if (campusDriveYear.length !== 0) {
            data[func.dbCons.CAMPUS_DRIVE_DETAILS_INVITE_YEAR] = _.uniq(campusDriveYear)
          }
          return getReturnJson(campusDriveDetails, data)
        } else {
          let instituteDetails = await getInstituteFromInstituteName(func.getValuesArrayFromJson(func.dbCons.FIELD_INSTITUTE_ID, campusDriveDetails), instituteName, orgNameMap)
          if (instituteDetails.length === 0) {
            return getReturnJson(instituteDetails)
          } else {
            let campusDriveYear = await getCampusYearFinalResponse(campusDriveDetails, instituteDetails)
            if (campusDriveYear.length !== 0) {
              data[func.dbCons.CAMPUS_DRIVE_DETAILS_INVITE_YEAR] = _.uniq(campusDriveYear)
            }
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, `instituteDetails =${JSON.stringify(instituteDetails)}`)
            func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusYearFromInstituteName()', func.logCons.LOG_EXIT)
            return getReturnJson(campusDriveDetails, data)
          }
        }
      }
    }
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while getting campus years. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusYearFromInstituteName()', func.logCons.LOG_EXIT)
    throw err
  }
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCampusYearFromInstituteName()', func.logCons.LOG_EXIT)
}

CampusYearHelpers.prototype.getCampusYear = async function(orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'getCampusYear()', func.logCons.LOG_ENTER)
  try {
    let data
    let errors = []
    let campusDriveDetails = await getCampusYearFromDatabase(orgNameMap)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `campusDriveDetails =${JSON.stringify(campusDriveDetails)}`)
    if (campusDriveDetails === 0 || campusDriveDetails.length === 0) {
      return campusDriveDetails
    } else {
      let finalResponseJson = generateFinalResponse(campusDriveDetails)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, `finalResponseJson =${JSON.stringify(finalResponseJson)}`)
      return getReturnJson(campusDriveDetails, finalResponseJson)
    }
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while getting campus years. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusYear()', func.logCons.LOG_EXIT)
    throw err
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusYear()', func.logCons.LOG_EXIT)
}

function generateFinalResponse(campusDriveDetails) {
  let finalResponseJson = []
  let campusYearArray = _.uniq(func.getValuesArrayFromJson(func.dbCons.FIELD_CAMPUS_INVITE_YEAR, campusDriveDetails))
  campusYearArray = _.sortBy(campusYearArray)
  for (let campusDriveYear of campusYearArray) {
    finalResponseJson.push({
      "campus_year": campusDriveYear.substring(func.configCons.FIELD_CAMPUS_DRIVE_DETAILS_INVITE_YEAR_PREFIX.length),
      "campus_drive_details": []
    })
  }
  for (let singleCampusDriveDetail of campusDriveDetails) {
    if (singleCampusDriveDetail[func.dbCons.FIELD_DESIGNATION] !== undefined) {
      for (singleData of finalResponseJson) {
        if (singleCampusDriveDetail[func.dbCons.FIELD_CAMPUS_INVITE_YEAR].substring(func.configCons.FIELD_CAMPUS_DRIVE_DETAILS_INVITE_YEAR_PREFIX.length) === singleData['campus_year'])
          singleData['campus_drive_details'].push(singleCampusDriveDetail)
      }
    }
  }
  finalResponseJson = JSON.parse(JSON.stringify(finalResponseJson).replace(/\"id":/g, '"campus_drive_id":'))
  return finalResponseJson

  // let finalResponseJson = _(campusDriveDetails)
  //   .groupBy(func.dbCons.FIELD_CAMPUS_INVITE_YEAR)
  //   .map((campus_drive_details,campus_year) => ({
  //      campus_drive_details,
  //      campus_year
  //   }))
  //   .value()
}

async function getCampusYearFromDatabase(orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusYearFromDatabase()', func.logCons.LOG_ENTER)
    let projection = getProjectionJsonForCampusDriveDetails()
    dbOp.findByQuery(null, orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      projection,
      function(err, campusDriveDetails) {
        if (err) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching campus drive ids. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusYearFromDatabase()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!campusDriveDetails || campusDriveDetails.length == 0) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `No campus drive found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusYearFromDatabase()', func.logCons.LOG_EXIT)
          return resolve(campusDriveDetails)
        }
        return resolve(campusDriveDetails)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusYearFromDatabase()', func.logCons.LOG_EXIT)
  })
}

function getProjectionJsonForCampusDriveDetails() {
  let projectionJson = []
  projectionJson.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_INVITE_YEAR, true, true))
  projectionJson.push(dbOp.getProjectionJson(func.dbCons.FIELD_INSTITUTE_ID, true, true))
  projectionJson.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
  projectionJson.push(dbOp.getProjectionJson(func.dbCons.FIELD_DESIGNATION, true, true))
  return projectionJson
}

function getReturnJson(ids, response) {
  let data = {}
  let errors = []
  return {
    data: (response === undefined) ? data : response,
    errors: errors,
    message: (ids.length === 0) ? func.msgCons.NO_CAMPUS_YEAR_FOUND : func.msgCons.SUCCESS_MSG_CAMPUS_YEAR_RETRIEVED
  }
}

async function getCandidateSourceIds (roundType, stage, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIds()', func.logCons.LOG_ENTER)
    const collectionName = (stage == func.dbCons.ENUM_SELECTED_FOR_GD) ? func.dbCons.COLLECTION_GD_GROUP_DETAILS : func.dbCons.COLLECTION_PI_ASSESSMENT_DETAILS
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID, true, true))
    // let query = (getEnumForRoundType(roundType) === func.dbCons.ENUM_ROUND_TYPE_ON_CAMPUS) ? null :
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ROUND_TYPE, func.lightBlueCons.OP_EQUAL, getEnumForRoundType(roundType)), orgNameMap,
      dbOp.setCollectionJson(collectionName, func.dbCons.COMMON_VERSION_1_0_0),
      projection,
      function(err, candidateSourceIds) {
        if (err) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching candidate source id. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIds()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!candidateSourceIds || candidateSourceIds.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `no gd groups found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIds()', func.logCons.LOG_EXIT)
          return resolve(candidateSourceIds)
        }
        const candidateSourceUniqueIds = _.uniq(func.getValuesArrayFromJson(func.dbCons.COLLECTION_JSON_CANDIDATE_SOURCE_ID, candidateSourceIds))
        return resolve(candidateSourceUniqueIds)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCandidateSourceIds()', func.logCons.LOG_EXIT)
  })
}


function getEnumForRoundType(value) {
  switch (value) {
    case func.dbCons.VALUE_ROUND_TYPE_ON_CAMPUS:
      return func.dbCons.ENUM_ROUND_TYPE_ON_CAMPUS
    case func.dbCons.VALUE_ROUND_TYPE_ON_SITE:
      return func.dbCons.ENUM_ROUND_TYPE_ON_SITE
    default:
      return -1
  }
}

async function getCampusDriveIds(candidateSourceIds, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIds()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, true, true))
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidateSourceIds), orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      projection,
      function(err, campusDriveIds) {
        if (err) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching campus drive ids. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIds()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!candidateSourceIds || candidateSourceIds.length == 0) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `no campus drive found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIds()', func.logCons.LOG_EXIT)
          return reject(candidateSourceIds)
        }
        const campusDriveUniqueIds = _.uniq(func.getValuesArrayFromJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, campusDriveIds))
        return resolve(campusDriveUniqueIds)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIds()', func.logCons.LOG_EXIT)
  })
}

async function getInstituteIds(campusDriveIds, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteIds()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.CAMPUS_DRIVE_DETAILS_INVITE_YEAR, true, true))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_INSTITUTE_ID, true, true))
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, campusDriveIds), orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      projection,
      function(err, campusDriveDetails) {
        if (err) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching campus drive ids. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteIds()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!campusDriveDetails || campusDriveDetails.length == 0) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `no campus drive found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteIds()', func.logCons.LOG_EXIT)
          return resolve(campusDriveDetails)
        }
        return resolve(campusDriveDetails)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteIds()', func.logCons.LOG_EXIT)
  })
}

async function getInstituteFromInstituteName(instituteIds, instituteName, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteFromInstituteName()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID, true, true))
    let queryForInstituteDetails = []
    queryForInstituteDetails.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_NAME, func.lightBlueCons.OP_EQUAL, instituteName))
    queryForInstituteDetails.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, instituteIds))
    let queryJsonForIntitute = dbOp.getOperationJson(func.lightBlueCons.OP_AND, queryForInstituteDetails)
    dbOp.findByQuery(queryJsonForIntitute, orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_INSTITUTE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      projection, (err, instituteIds) => {
        if (err) {
          // Lightblue Error
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while fetching institute ids. ${err} for institueName = ${instituteName}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteFromInstituteName()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!instituteIds || instituteIds.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `no institute name found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteFromInstituteName()', func.logCons.LOG_EXIT)
          return resolve(instituteIds)
        }
        return resolve(instituteIds)
      })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getInstituteFromInstituteName()', func.logCons.LOG_EXIT)
  })
}

async function getCampusYearFinalResponse(campusDriveDetails, instituteDetails) {
  return new Promise((resolve, reject) => {
    let campusDriveYear = []
    if (instituteDetails !== undefined) {
      instituteDetails = JSON.parse(JSON.stringify(instituteDetails).replace(/\"id":/g, '"institute_id":'))
      for (let instituteDetail of instituteDetails) {
        let temp = campusDriveYear.concat((func.filterBasedOnValue(campusDriveDetails, func.dbCons.FIELD_INSTITUTE_ID, instituteDetail[func.dbCons.FIELD_INSTITUTE_ID])))
        campusDriveYear = temp
      }
      campusDriveYear = func.getValuesArrayFromJson(func.dbCons.CAMPUS_DRIVE_DETAILS_INVITE_YEAR, campusDriveYear)
    } else {
      campusDriveYear = func.getValuesArrayFromJson(func.dbCons.CAMPUS_DRIVE_DETAILS_INVITE_YEAR, campusDriveDetails)
    }
    let campusDriveYearArray = []
    campusDriveYear.filter(function(year) {
      campusDriveYearArray.push(year.substring(func.configCons.FIELD_CAMPUS_DRIVE_DETAILS_INVITE_YEAR_PREFIX.length))
    })
    return resolve(campusDriveYearArray)
  })
}

exports.CampusYearHelpers = CampusYearHelpers
