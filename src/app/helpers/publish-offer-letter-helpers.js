var func = require('../utils/functions')
var Client = require('node-rest-client').Client
var client = new Client()
var async = require('async')
var _ = require('lodash')
const ROUTER_CONS = 'HS_POL_'
var dbOp
var fs = require('fs')
var config = func.config.get('front_end')
var nunjucks = require('nunjucks')
var pdf = require('html-pdf')
var configJson = func.config.get('mail_domains')
var HELPER_CONS = 'HS_POLH_'
const moment = require('moment');
var AttributeLookupDetailsHelpers = require('./attribute-lookup-details-helpers').AttributeLookupDetailsHelpers
var attributeLookupDetailsHelpers = new AttributeLookupDetailsHelpers()
var cloudinary = require('cloudinary');
var cloudinary_account = func.config.get('cloudinary_account')
const now = moment(new Date())

function PublishOfferLetter() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of publish offer letter helper')
  DbOperation = require('./db-operations').DbOperation
  dbOp = new DbOperation()
  cloudinary.config({
    cloud_name: cloudinary_account.cloud_name,
    api_key: cloudinary_account.api_key,
    api_secret: cloudinary_account.api_secret
  });
}
PublishOfferLetter.prototype.publishOfferLetter = async function (userCode, body, orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'publishOfferLetter()', func.logCons.LOG_ENTER)
  var candidate_details = body[func.msCons.FIELD_CANDIDATE_DETAILS]
  var type = body[func.msCons.FIELD_TYPE]
  var personIdResponse, nameResponse, campusResponse, candidateDetails, referenceNumberResponse, singleCandidate, finalResponse, updateResponse, fullNameResponse
  try {
    let data = {}
    if (type === func.msCons.FIELD_CAMPUS) {
      personIdResponse = await getPersonIdfromCandidateId(candidate_details, getProjectionForCampus(), destinationProjectionforCampus(), orgNameMap)
      nameResponse = await getPersonNamefromPersonId(personIdResponse, orgNameMap)
      campusResponse = await getCampusDriveIdFromSourceId(nameResponse, orgNameMap)
      candidateDetails = await getDesignationFromCampusId(campusResponse, orgNameMap)
      referenceNumberResponse = await getReferenceNumberfromCandidateDetails(orgNameMap)
      let finalCandidate = []
      for (let candidate of candidateDetails) {
        singleCandidate = await getDepartmentfromDesignation(candidate, orgNameMap, env)
        finalCandidate.push(singleCandidate)
      }
      finalResponse = await generateLetterJson(finalCandidate, referenceNumberResponse, orgNameMap);
      for (let candidate of finalResponse) {
        fullNameResponse = await generateLetterByteStream(candidate)
        updateResponse = await updateDetailsforCandidate(fullNameResponse, orgNameMap)
      }
      return finalResponse
    } else {
      let personIdResponse1 = await getPersonIdfromCandidateId(candidate_details, getProjectionForConsultancy(), destinationProjectionforConsultancy(), orgNameMap)
      nameResponse = await getPersonNamefromPersonId(personIdResponse1, orgNameMap)
      referenceNumberResponse = await getReferenceNumberfromCandidateDetails(orgNameMap)
      finalResponse = await generateLetterJsonforConsultancy(nameResponse, referenceNumberResponse, orgNameMap);
      for (let candidate of finalResponse) {
        fullNameResponse = await generateLetterByteStream(candidate)
        updateResponse = await updateDetailsforCandidate(fullNameResponse, orgNameMap)
      }
      return finalResponse
    }

  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while publishing offer letter. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'publishOfferLetter()', func.logCons.LOG_EXIT)
    throw err
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'publishOfferLetter()', func.logCons.LOG_EXIT)
}

function getProjectionForCampus() {
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PERSON_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_REFERENCE_NUMBER))
  return projection
}

function getProjectionForConsultancy() {
  var projection = []
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PERSON_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_REFERENCE_NUMBER))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_DESIGNATION))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_DEPARTMENT))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_DATE_OF_JOINING))
  projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_APPOINTED_LOCATION))
  return projection
}

function destinationProjectionforCampus() {
  var destinationFields = []
  destinationFields.push(func.dbCons.FIELD_PERSON_ID)
  destinationFields.push(func.dbCons.FIELD_CANDIDATE_SOURCE_ID)
  destinationFields.push(func.dbCons.FIELD_REFERENCE_NUMBER)
  return destinationFields
}

function destinationProjectionforConsultancy() {
  var destinationFields = []
  destinationFields.push(func.dbCons.FIELD_PERSON_ID)
  destinationFields.push(func.dbCons.FIELD_CANDIDATE_SOURCE_ID)
  destinationFields.push(func.dbCons.FIELD_REFERENCE_NUMBER)
  destinationFields.push(func.dbCons.FIELD_DESIGNATION)
  destinationFields.push(func.dbCons.FIELD_DEPARTMENT)
  destinationFields.push(func.dbCons.FIELD_DATE_OF_JOINING)
  // destinationFields.push(func.dbCons.FIELD_APPOINTED_LOCATION)
  return destinationFields
}

async function getPersonIdfromCandidateId(body, projection, destinationFields, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonIdfromCandidateId()', func.logCons.LOG_ENTER)
    var candidateIds = func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_ID, body)
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, candidateIds), orgNameMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, projection, function (error, personIds) {
      if (error) return reject(error)
      if (!personIds || personIds.length === 0) {
        personIds = []
        return reject(personIds)
      } else {
        var sourceField = func.dbCons.FIELD_CANDIDATE_ID
        var destSourceField = func.dbCons.FIELD_ID
        mappingJson(body, personIds, sourceField, destSourceField, destinationFields, function (error, jsonResponse) {
          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
            return reject(error)
          } else if (!jsonResponse || jsonResponse.length === 0) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
            return reject(jsonResponse)
          } else {
            return resolve(jsonResponse)
          }
        })
      }
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonIdfromCandidateId()', func.logCons.LOG_EXIT)
  })
}
async function updateDetailsforCandidate(body, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateDetailsforCandidate()', func.logCons.LOG_ENTER)
    var jsonToUpdate = {}
    jsonToUpdate[func.dbCons.FIELD_REFERENCE_NUMBER] = body[func.dbCons.FIELD_REFERENCE_NUMBER]
    jsonToUpdate[func.dbCons.FIELD_HEAD_DETAILS] = body[func.dbCons.FIELD_HEAD_DETAILS]
    jsonToUpdate[func.dbCons.FIELD_DATE_OF_JOINING] = body[func.dbCons.FIELD_DATE_OF_JOINING]
    jsonToUpdate[func.dbCons.FIELD_PROBATION_PERIOD] = body[func.dbCons.FIELD_PROBATION_PERIOD]
    jsonToUpdate[func.dbCons.FIELD_OFFICE_LOCATION] = body[func.dbCons.FIELD_OFFICE_LOCATION]
    jsonToUpdate[func.dbCons.FIELD_UNSIGNED_OFFER_LETTER_URL] = body[func.dbCons.FIELD_UNSIGNED_OFFER_LETTER_URL]
    let query = []
    query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, body[func.dbCons.FIELD_CANDIDATE_ID]))
    dbOp.update(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getOperationJson(func.lightBlueCons.OP_SET, jsonToUpdate), dbOp.getCommonProjection(), function (error, updateCandidate) {
      if (error) return reject(error)
      else if (!updateCandidate || updateCandidate.length === 0) {
        var updateCandidate = []
        return reject(updateCandidate)
      } else {
        return resolve(updateCandidate)
      }
    })
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateDetailsforCandidate()', func.logCons.LOG_EXIT)
}
async function getPersonNamefromPersonId(body, orgNameMap) {
  return new Promise((resolve, reject) => {

    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonNamefromPersonId()', func.logCons.LOG_ENTER)
    var personIds = func.getValuesArrayFromJson(func.dbCons.FIELD_PERSON_ID, body)
    var projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_FIRST_NAME))
    projection.push(dbOp.getProjectionJson(func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_LAST_NAME))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_GENDER))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID))
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, personIds), orgNameMap, func.dbCons.COLLECTION_PERSON_DETAILS, projection, function (error, nameResponse) {
      if (error) return reject(error)
      if (!nameResponse || nameResponse.length === 0) {
        nameResponse = []
        return reject(nameResponse)
      } else {
        var sourceField = func.dbCons.FIELD_PERSON_ID
        var destSourceField = func.dbCons.FIELD_ID
        var destinationFields = []
        destinationFields.push(func.dbCons.FIELD_FIRST_NAME)
        destinationFields.push(func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME)
        destinationFields.push(func.dbCons.FIELD_LAST_NAME)
        destinationFields.push(func.dbCons.FIELD_GENDER)
        mappingJson(body, nameResponse, sourceField, destSourceField, destinationFields, function (error, jsonResponse) {
          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
            return reject(error)
          } else if (!jsonResponse || jsonResponse.length === 0) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
            return reject(jsonResponse)
          } else {
            return resolve(jsonResponse)
          }
        })
      }
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonNamefromPersonId()', func.logCons.LOG_EXIT)
  })
}

function convertGenderNumberToString(gender) {
  if (gender === 0) {
    return 'Mr.'
  } else if (gender === 1) {
    return 'Ms.'
  }
}
async function getCampusDriveIdFromSourceId(body, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdFromSourceId()', func.logCons.LOG_ENTER)
    var personIds = func.getValuesArrayFromJson(func.dbCons.FIELD_CANDIDATE_SOURCE_ID, body)
    var projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID))
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, personIds), orgNameMap, func.dbCons.COLLECTION_CANDIDATE_SOURCE_DETAILS, projection, function (error, campusResponse) {
      if (error) return reject(error)
      if (!campusResponse || campusResponse.length === 0) {
        campusResponse = []
        return reject(campusResponse)
      } else {
        var sourceField = func.dbCons.FIELD_CANDIDATE_SOURCE_ID
        var destSourceField = func.dbCons.FIELD_ID
        var destinationFields = []
        destinationFields.push(func.dbCons.FIELD_CAMPUS_DRIVE_ID)
        mappingJson(body, campusResponse, sourceField, destSourceField, destinationFields, function (error, jsonResponse) {
          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
            return reject(error)
          } else if (!jsonResponse || jsonResponse.length === 0) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
            return reject(jsonResponse)
          } else {
            return resolve(jsonResponse)
          }
        })
      }
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveIdFromSourceId()', func.logCons.LOG_EXIT)
  })
}
async function getDesignationFromCampusId(body, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDesignationFromCampusId()', func.logCons.LOG_ENTER)
    var personIds = func.getValuesArrayFromJson(func.dbCons.FIELD_CAMPUS_DRIVE_ID, body)
    var projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_DESIGNATION))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_ID))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_CTC))
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_IN, personIds), orgNameMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, projection, function (error, designationResponse) {
      if (error) return reject(error)
      if (!designationResponse || designationResponse.length === 0) {
        designationResponse = []
        return reject(designationResponse)
      } else {
        var sourceField = func.dbCons.FIELD_CAMPUS_DRIVE_ID
        var destSourceField = func.dbCons.FIELD_ID
        var destinationFields = []
        destinationFields.push(func.dbCons.FIELD_DESIGNATION)
        mappingJson(body, designationResponse, sourceField, destSourceField, destinationFields, function (error, jsonResponse) {
          if (error) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
            return reject(error)
          } else if (!jsonResponse || jsonResponse.length === 0) {
            func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
            return reject(jsonResponse)
          } else {
            return resolve(jsonResponse)
          }
        })
      }
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDesignationFromCampusId()', func.logCons.LOG_EXIT)
  })
}

async function getReferenceNumberfromCandidateDetails(orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getReferenceNumberfromCandidateDetails()', func.logCons.LOG_ENTER)
    var projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_REFERENCE_NUMBER))
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_OBJECT_TYPE, func.lightBlueCons.OP_EQUAL, func.dbCons.COLLECTION_CANDIDATE_DETAILS), orgNameMap, func.dbCons.COLLECTION_CANDIDATE_DETAILS, projection, function (error, referenceNumberResponse) {
      if (error) return reject(error)
      if (!referenceNumberResponse || referenceNumberResponse.length === 0) {
        referenceNumberResponse = []
        return reject(referenceNumberResponse)
      } else {
        return resolve(referenceNumberResponse);
      }
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getReferenceNumberfromCandidateDetails()', func.logCons.LOG_EXIT)
  })
}
async function getDepartmentfromDesignation(body, orgNameMap, env) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDepartmentfromDesignation()', func.logCons.LOG_ENTER)
    attributeLookupDetailsHelpers.getParentChildAttribute(body[func.dbCons.FIELD_DESIGNATION], orgNameMap, env, function (error, response) {
      if (error) return reject(error)
      else {
        body[func.dbCons.FIELD_DEPARTMENT] = response[0][func.dbCons.FIELD_ATTRIBUTE_VALUE]
        return resolve(body);
      }
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getDepartmentfromDesignation()', func.logCons.LOG_EXIT)
  })
}

function generateLetterJsonforConsultancy(body, referenceBody, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateLetterJson()', func.logCons.LOG_ENTER)
  var referenceNumbers = func.getValuesArrayFromJson(func.dbCons.FIELD_REFERENCE_NUMBER, referenceBody)
  var projection = []
  var finalArr = []
  var count = 0;

  for (let candidate of body) {
    var finalJson = {}
    var name = (candidate[func.dbCons.FIELD_FIRST_NAME].charAt(0).toUpperCase() + candidate[func.dbCons.FIELD_FIRST_NAME].slice(1).toLowerCase() + ' ' + candidate[func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME].charAt(0).toUpperCase() + candidate[func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME].slice(1).toLowerCase() + ' ' + candidate[func.dbCons.FILED_LAST_NAME].charAt(0).toUpperCase() + candidate[func.dbCons.FILED_LAST_NAME].slice(1).toLowerCase())
    finalJson[func.dbCons.FIELD_NAME_CANDIDATE] = name
    finalJson[func.dbCons.FIELD_DESIGNATION] = candidate[func.dbCons.FIELD_DESIGNATION]
    finalJson[func.dbCons.FIELD_DEPARTMENT] = candidate[func.dbCons.FIELD_DEPARTMENT]
    finalJson[func.dbCons.FIELD_CANDIDATE_ID] = candidate[func.dbCons.FIELD_CANDIDATE_ID]
    finalJson[func.dbCons.FIELD_OFFICE_LOCATION] = candidate[func.dbCons.FIELD_APPOINTED_LOCATION]
    finalJson[func.dbCons.FIELD_HEAD_DETAILS] = candidate[func.dbCons.FIELD_HEAD_DETAILS]
    finalJson[func.dbCons.FEILD_COMPANY_DETAILS] = candidate[func.dbCons.FEILD_COMPANY_DETAILS]
    finalJson[func.dbCons.FIELD_PROBATION_PERIOD] = candidate[func.dbCons.FIELD_PROBATION_PERIOD]
    finalJson[func.dbCons.FIELD_SALUTATION] = convertGenderNumberToString(candidate[func.dbCons.FIELD_GENDER])
    var headDetails = JSON.parse(candidate[func.dbCons.FIELD_HEAD_DETAILS])
    finalJson['head_name'] = headDetails['name']
    finalJson['head_url'] = headDetails['signature_url']
    finalJson['head_designation'] = headDetails['designation']
    finalJson['today_date'] = now.format("DD/MM/YYYY");
    var companyDetails = JSON.parse(candidate[func.dbCons.FEILD_COMPANY_DETAILS])
    finalJson['letter_pad'] = companyDetails['letter_pad']
    finalJson['owner_sign']=companyDetails['owner_sign']
    finalJson['owner_name']=companyDetails['owner_name']
    finalJson['letter_sign']=companyDetails['letter_sign']
    finalJson['designation']=companyDetails['designation']
    if (candidate[func.dbCons.FIELD_REFERENCE_NUMBER] == undefined || candidate[func.dbCons.FIELD_REFERENCE_NUMBER].endsWith("NaN") || candidate[func.dbCons.FIELD_REFERENCE_NUMBER].endsWith("Infinity")) {
      finalJson[func.dbCons.FIELD_REFERENCE_NUMBER] = generateRefNumber(candidate, count, body, referenceNumbers)
      count++;
    } else {
      finalJson[func.dbCons.FIELD_REFERENCE_NUMBER] = candidate[func.dbCons.FIELD_REFERENCE_NUMBER]
    }
    // finalJson[func.dbCons.FIELD_DATE_OF_JOINING] = moment(candidate[func.dbCons.FIELD_DATE_OF_JOINING],'DD-MM-YYYY').format("DD MMM YYYY")
    finalJson[func.dbCons.FIELD_DATE_OF_JOINING] = candidate[func.dbCons.FIELD_DATE_OF_JOINING]
    finalArr.push(finalJson)
  }
  return finalArr
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateLetterJson()', func.logCons.LOG_EXIT)
}

function generateLetterJson(body, referenceBody, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateLetterJson()', func.logCons.LOG_ENTER)
  var referenceNumbers = func.getValuesArrayFromJson(func.dbCons.FIELD_REFERENCE_NUMBER, referenceBody)
  var projection = []
  var finalArr = []
  var count = 0;
  for (let candidate of body) {
    var finalJson = {}
    var name = (candidate[func.dbCons.FIELD_FIRST_NAME].charAt(0).toUpperCase() + candidate[func.dbCons.FIELD_FIRST_NAME].slice(1).toLowerCase() + ' ' + candidate[func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME].charAt(0).toUpperCase() + candidate[func.dbCons.CANDIDATE_FIELD_MIDDLE_NAME].slice(1).toLowerCase() + ' ' + candidate[func.dbCons.FILED_LAST_NAME].charAt(0).toUpperCase() + candidate[func.dbCons.FILED_LAST_NAME].slice(1).toLowerCase())
    finalJson[func.dbCons.FIELD_NAME_CANDIDATE] = name
    finalJson[func.dbCons.FIELD_DESIGNATION] = candidate[func.dbCons.FIELD_DESIGNATION]
    finalJson[func.dbCons.FIELD_DEPARTMENT] = candidate[func.dbCons.FIELD_DEPARTMENT]
    finalJson[func.dbCons.FIELD_CANDIDATE_ID] = candidate[func.dbCons.FIELD_CANDIDATE_ID]
    finalJson[func.dbCons.FIELD_OFFICE_LOCATION] = candidate[func.dbCons.FIELD_APPOINTED_LOCATION]
    finalJson[func.dbCons.FIELD_HEAD_DETAILS] = candidate[func.dbCons.FIELD_HEAD_DETAILS]
    finalJson[func.dbCons.FEILD_COMPANY_DETAILS] = candidate[func.dbCons.FEILD_COMPANY_DETAILS]
    finalJson[func.dbCons.FIELD_PROBATION_PERIOD] = candidate[func.dbCons.FIELD_PROBATION_PERIOD]
    finalJson[func.dbCons.FIELD_SALUTATION] = convertGenderNumberToString(candidate[func.dbCons.FIELD_GENDER])
    var headDetails = JSON.parse(candidate[func.dbCons.FIELD_HEAD_DETAILS])
    finalJson['head_name'] = headDetails['name']
    finalJson['head_url'] = headDetails['signature_url']
    finalJson['head_designation'] = headDetails['designation']
    finalJson['today_date'] = now.format("DD/MM/YYYY");
    var companyDetails = JSON.parse(candidate[func.dbCons.FEILD_COMPANY_DETAILS])
    finalJson['letter_pad'] = companyDetails['letter_pad']
    finalJson['owner_sign']=companyDetails['owner_sign']
    finalJson['owner_name']=companyDetails['owner_name']
    finalJson['letter_sign']=companyDetails['letter_sign']
    finalJson['designation']=companyDetails['designation']
    if (candidate[func.dbCons.FIELD_REFERENCE_NUMBER] == undefined || candidate[func.dbCons.FIELD_REFERENCE_NUMBER].endsWith("NaN") || candidate[func.dbCons.FIELD_REFERENCE_NUMBER].endsWith("Infinity")) {
      finalJson[func.dbCons.FIELD_REFERENCE_NUMBER] = generateRefNumber(candidate, count, body, referenceNumbers)
      count++;
    } else {
      finalJson[func.dbCons.FIELD_REFERENCE_NUMBER] = candidate[func.dbCons.FIELD_REFERENCE_NUMBER]
    }
    // finalJson[func.dbCons.FIELD_DATE_OF_JOINING] = moment(candidate[func.dbCons.FIELD_DATE_OF_JOINING],'DD-MM-YYYY').format("DD MMM YYYY")
    finalJson[func.dbCons.FIELD_DATE_OF_JOINING] = candidate[func.dbCons.FIELD_DATE_OF_JOINING]
    finalArr.push(finalJson)
  }
  return finalArr
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateLetterJson()', func.logCons.LOG_EXIT)
}

function generateOfferLetterJson(body) {
  var finalOffer = {}
  finalOffer = body
  finalOffer[func.dbCons.FIELD_OFFICE_LOCATION] = JSON.parse(finalOffer[func.dbCons.FIELD_OFFICE_LOCATION])['name']
  return finalOffer
}
async function generateLetterByteStream(body) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateLetterByteStream()', func.logCons.LOG_ENTER)
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'letterJSON:' + JSON.stringify(body))
    var finalBody = generateOfferLetterJson(JSON.parse(JSON.stringify(body)));
    func.printLog(func.logCons.LOG_LEVEL_INFO, 'letterJSON:' + JSON.stringify(finalBody))
    nunjucks.configure(configJson[func.configCons.FIELD_CAMPUS_DRIVE_DETAILS])
    nunjucks.render(configJson[func.configCons.FILE_OFFER_LETTER_INTIMATION], finalBody, function (error, htmlfile) {
      func.printLog(func.logCons.LOG_LEVEL_INFO, 'letterJSON in nunjucks:' + JSON.stringify(finalBody))
      if (error) {
        return reject(error)
      } else {
        var options = {
          'height': '279mm', // allowed units: mm, cm, in, px
          'width': '216mm',
          'timeout': 700000
        }
        pdf.create(htmlfile, options)

          .toFile('./tmp.pdf',
            function (error, byteStream) {
              if (error) {
                func.printLog(func.logCons.LOG_LEVEL_INFO, 'generateLetterByteStream() byteStream create:' + error)
                return reject(error)
              }
              var context = {}
              context['title'] = 'Offer Letter Created'
              func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateLetterByteStream()', func.logCons.LOG_EXIT)
              cloudinary.v2.uploader.upload('./tmp.pdf', function (error, result) {
                if (error) {
                  func.printLog(func.logCons.LOG_LEVEL_INFO, 'cloudinary generateLetterByteStream() upload:' + error)
                  return reject(error)
                }
                body[func.dbCons.FIELD_UNSIGNED_OFFER_LETTER_URL] = result['secure_url']
                return resolve(body)
              });
            })
      }
    })
  })
}

function generateRefNumber(candidate, count, body, referenceNumbers) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateRefNumber()', func.logCons.LOG_ENTER)
  referenceArray = []
  idArr = []
  let idCount = 0
  for (item of referenceNumbers) {
    if (item != undefined) {
      idCount++;
      var id = item.split('B')
      var num = parseInt(id[1])
      idArr.push(num)
      referenceArray.push(item)
    }
  }
  var maxNum = Math.max.apply(Math, idArr)
  var nowYear = now.format("YYYY")
  var nowMonth = now.format("MM")
  var ctc = candidate[func.dbCons.FIELD_CTC]
  var type = 'B'
  if (ctc >= 6) {
    type = 'A'
  }
  if (maxNum == undefined) {
    var nextNum = 1
  } else if (isNaN(maxNum)) {
    var nextNum = idCount + 1
  } else var nextNum = maxNum + 1
  return nowYear + nowMonth + type + nextNum
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'generateRefNumber()', func.logCons.LOG_EXIT)
}

function mappingJson(sourceJson, destinationJson, sourceField, destSourceField, destinationField, callback) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'mappingJson()', func.logCons.LOG_ENTER)
  async.forEachOf(sourceJson, function (sourceItem, key, sourceCallbackinner) {
    async.forEachOf(destinationJson, function (destinationItem, key, destinationCallbackinner) {
      if (sourceItem[sourceField] == destinationItem[destSourceField]) {
        for (let destObj of destinationField) {
          sourceItem[destObj] = destinationItem[destObj]
        }
        destinationCallbackinner()
      } else {
        destinationCallbackinner()
      }
    }, function (error) {
      if (error) {
        func.printLog(func.logCons.LOG_LEVEL_ERROR, 'mappingJson async call = ' + error)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'mappingJson()', func.logCons.LOG_EXIT)
        return sourceCallbackinner(new Error().stack, sourceJson)
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'mappingJson()', func.logCons.LOG_EXIT)
        sourceCallbackinner(null, sourceJson)
      }
    })
  }, function (error) {
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


exports.PublishOfferLetter = PublishOfferLetter