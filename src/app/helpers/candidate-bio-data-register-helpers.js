const func = require('../utils/functions')
const async = require('async')
const DbOperation = require('./db-operations').DbOperation
const dbOp = new DbOperation()
const HELPER_CONS = 'HI_CBDR_'
var _ = require('lodash')

function CandidateBioDataHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created when registering data for bio data of candidate')
}
CandidateBioDataHelpers.prototype.updateBioDataDetails = async function (reqBody, userCode, orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateBioDataDetails()', func.logCons.LOG_ENTER)
  try {
    let data = {}
    let errors = {}
    let bioDataId = reqBody[func.dbCons.BIO_DATA_DETAILS_ID]
    let candidateId = reqBody[func.dbCons.FIELD_CANDIDATE_ID]
    if (bioDataId == undefined) {
      for (let obj of reqBody[func.dbCons.FIELD_UPDATE_DETAILS]) {
        let idJSON = {}
        let updatedDetails = await insertBioDatafromUpdate(obj, userCode, orgNameMap);
        idJSON[func.dbCons.FIELD_CANDIDATE_ID] = candidateId
        idJSON[func.dbCons.FIELD_BIO_DATA_DETAILS_ID] = updatedDetails[0][func.dbCons.FIELD_ID]
        candidateDetailsJSON = await updateDataintoCandidateDetails(idJSON, orgNameMap);

        finalJSON = await updateDataintoPersonDetails(candidateDetailsJSON, orgNameMap)
      }
      data = reqBody
    } else {
      for (let obj of reqBody[func.dbCons.FIELD_UPDATE_DETAILS]) {
        let updatedDetails = await updateBioData(obj, bioDataId, orgNameMap);
      }
      data = reqBody
    }
    return {
      data: data,
      errors: errors
    }
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `Error while updating Biodata Detail. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateBioDataDetails()', func.logCons.LOG_EXIT)
    throw err
  }
}
CandidateBioDataHelpers.prototype.getBioDataDetails = async function (userCode, orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getBioDataDetails()', func.logCons.LOG_ENTER)
  try {
    let data = {}
    let errors = []
    let candidateDetails = await getPersonIdFromCandidateDetails(userCode, orgNameMap)
    if (!existingBioDataDetailsId(candidateDetails)) {
      let bioDataDetails = await getBioDataDetailsfromID(candidateDetails, orgNameMap)
      data[func.dbCons.BIODATA_DETAILS] = bioDataDetails
    }
    return {
      data: data,
      errors: errors
    }
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `Error while getting Biodata Detail. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getBioDataDetails()', func.logCons.LOG_EXIT)
    throw err
  }
}
CandidateBioDataHelpers.prototype.registerCandidate = async function (body, userCode, orgNameMap, env) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'registerCandidate()', func.logCons.LOG_ENTER)
  try {
    let bioDataBody = body[func.dbCons.COLLECTION_BIO_DATA_DETAILS]
    let candidateId = body[func.dbCons.FIELD_CANDIDATE_ID]
    let bioDataJson = {}
    let idJSON = {}
    let existingStatus = false
    let candidateDetailsJSON = {}
    existingStatus = await findExistingEmailIds(encryptData(bioDataBody), orgNameMap)
    if (!existingStatus) {
      bioDataJson = await insertDataIntoBioData(encryptData(bioDataBody), userCode, orgNameMap)
      idJSON[func.dbCons.FIELD_CANDIDATE_ID] = candidateId
      idJSON[func.dbCons.FIELD_BIO_DATA_DETAILS_ID] = bioDataJson[0][func.dbCons.FIELD_ID]
      candidateDetailsJSON = await updateDataintoCandidateDetails(idJSON, orgNameMap)
      finalJSON = await updateDataintoPersonDetails(candidateDetailsJSON, orgNameMap)
    }
    return getReturnJson(candidateDetailsJSON)
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `Error while bio data. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'registerCandidate()', func.logCons.LOG_EXIT)
    throw err
  }
}
async function updateBioData(updateBody, bioDataId, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateBioData()', func.logCons.LOG_ENTER)
    let keys = Object.keys(updateBody)
    for (let keyObject of keys) {
      var query = []
      query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, bioDataId))
      var setBody = {}
      setBody[keyObject] = encryptFields(keyObject, updateBody[keyObject])
      dbOp.update(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, func.dbCons.COLLECTION_BIO_DATA_DETAILS, dbOp.getOperationJson(func.lightBlueCons.OP_SET, setBody), dbOp.getCommonProjection(), function (err, updatedDetail) {
        if (err) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `Error while fetching person id(bioDataId). ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateBioData()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!updatedDetail || updatedDetail.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `biodata id not found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateBioData()', func.logCons.LOG_EXIT)
          return reject(func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.NO_BIO_DATA_DETAILS_NOT_FOUND, err))
        }
        return resolve(updateBioData)
      })
    }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateBioData()', func.logCons.LOG_EXIT)
  })
}
async function insertBioDatafromUpdate(updateBody, userCode, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertBioDatafromUpdate()', func.logCons.LOG_ENTER)
    let keys = Object.keys(updateBody)
    for (let keyObject of keys) {
      let setBody = {}
      setBody[keyObject] = encryptFields(keyObject, updateBody[keyObject])
      setBody[func.dbCons.COMMON_CREATED_BY] = userCode
      setBody[func.dbCons.CANDIDATE_FIELD_UPDATED_BY] = userCode
      dbOp.insert(orgNameMap, func.dbCons.COLLECTION_BIO_DATA_DETAILS, setBody, dbOp.getCommonProjection(), function (err, insertBioData) {
        if (err) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `Error while adding bio data ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertBioDatafromUpdate()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!insertBioData || insertBioData.length == 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `data not inserted`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertBioDatafromUpdate()', func.logCons.LOG_EXIT)
          return reject(insertBioData)
        }
        return resolve(insertBioData)
      })
    }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertBioDatafromUpdate()', func.logCons.LOG_EXIT)
  })
}

function decryptDetails(body) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'decryptDetails()', func.logCons.LOG_ENTER)
  if (body[func.dbCons.BIO_DATA_CONTACTS_NO] != undefined) {
    body[func.dbCons.BIO_DATA_CONTACTS_NO] = body[func.dbCons.BIO_DATA_CONTACTS_NO]
  }
  if (body[func.dbCons.VEHICLE_NO] != undefined) {
    body[func.dbCons.VEHICLE_NO] = body[func.dbCons.VEHICLE_NO]
  }
  if (body[func.dbCons.LICENCE_NO] != undefined) {
    body[func.dbCons.LICENCE_NO] = body[func.dbCons.LICENCE_NO]
  }
  if (body[func.dbCons.VOTING_ID_NO] != undefined) {
    body[func.dbCons.VOTING_ID_NO] = body[func.dbCons.VOTING_ID_NO]
  }
  if (body[func.dbCons.UID_NO] != undefined) {
    body[func.dbCons.UID_NO] = body[func.dbCons.UID_NO]
  }
  if (body[func.dbCons.UAN_NO] != undefined) {
    body[func.dbCons.UAN_NO] = body[func.dbCons.UAN_NO]
  }
  if (body[func.dbCons.ESIC_NO] != undefined) {
    body[func.dbCons.ESIC_NO] = body[func.dbCons.ESIC_NO]
  }
  if (body[func.dbCons.PASSPORT_NO] != undefined) {
    body[func.dbCons.PASSPORT_NO] = body[func.dbCons.PASSPORT_NO]
  }
  if (body[func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS] != undefined) {
    body[func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS] = body[func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS]
  }
  if (body[func.dbCons.CANDIDATE_FIELD_ADDRESS] != undefined) {
    body[func.dbCons.CANDIDATE_FIELD_ADDRESS][func.dbCons.RELATIVE_MOBILE_NO] = body[func.dbCons.CANDIDATE_FIELD_ADDRESS][func.dbCons.RELATIVE_MOBILE_NO]
    body[func.dbCons.CANDIDATE_FIELD_ADDRESS][func.dbCons.RESIDENCE_CONTACT_NO] = body[func.dbCons.CANDIDATE_FIELD_ADDRESS][func.dbCons.RESIDENCE_CONTACT_NO]
  }
  if (body[func.dbCons.PERMANENT_ADDRESS] != undefined) {
    body[func.dbCons.PERMANENT_ADDRESS][func.dbCons.RELATIVE_MOBILE_NO] = body[func.dbCons.PERMANENT_ADDRESS][func.dbCons.RELATIVE_MOBILE_NO]
    body[func.dbCons.PERMANENT_ADDRESS][func.dbCons.RESIDENCE_CONTACT_NO] = body[func.dbCons.PERMANENT_ADDRESS][func.dbCons.RESIDENCE_CONTACT_NO]
  }
  if (body[func.dbCons.REFERENCE_DETAILS] != undefined) {
    body[func.dbCons.REFERENCE_DETAILS][func.dbCons.BIO_DATA_CONTACTS_NO] = body[func.dbCons.REFERENCE_DETAILS][func.dbCons.BIO_DATA_CONTACTS_NO]
  }
  if (body[func.dbCons.BROTHER_DETAILS] != undefined) {
    body[func.dbCons.BROTHER_DETAILS][func.dbCons.BIO_DATA_CONTACTS_NO] = body[func.dbCons.BROTHER_DETAILS][func.dbCons.BIO_DATA_CONTACTS_NO]
  }
  if (body[func.dbCons.RELATIVE_DETAILS] != undefined) {
    for (relatives of body[func.dbCons.RELATIVE_DETAILS]) {
      relatives[func.dbCons.RELATIVE_MOBILE_NO] = relatives[func.dbCons.RELATIVE_MOBILE_NO]
    }
  }
  return body
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'decryptDetails()', func.logCons.LOG_EXIT)
}

function existingBioDataDetailsId(candidateDetails) {
  for (let obj of candidateDetails) {
    if (obj[func.dbCons.FIELD_BIO_DATA_DETAILS_ID] != undefined) {
      return false
    }
  }
  return true
}
async function getPersonIdFromCandidateDetails(user_code, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonIdFromCandidateDetails()', func.logCons.LOG_ENTER)
    let projection = []
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_PERSON_ID, true, true))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_BIO_DATA_DETAILS_ID, true, true))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_SIGNED_OFFER_LETTER_URL, true, true))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_OFFICE_LOCATION, true, true))
    projection.push(dbOp.getProjectionJson(func.dbCons.FIELD_DATE_OF_JOINING, true, true))
    dbOp.findByKey(func.dbCons.FIELD_USER_ID, func.lightBlueCons.OP_EQUAL, user_code, orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), projection, function (err, candidateDetails) {
      if (err) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, `Error while fetching person id(personId). ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonIdFromCandidateDetails()', func.logCons.LOG_EXIT)
        return reject(err)
      } else if (!candidateDetails || candidateDetails.length === 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, `person id not found`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonIdFromCandidateDetails()', func.logCons.LOG_EXIT)
        return reject(func.errorsArrayGenrator(func.generateErrorArrayObject(func.msgCons.MSG_ERROR_SERVER_ERROR, func.msgCons.MSG_ERROR_PLZ_TRY_AFTER), HELPER_CONS + func.msgCons.CODE_INTERNAL_ERROR, func.msgCons.PERSON_ID_NOT_FOUND, err))
      }
      return resolve(candidateDetails)
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getPersonIdFromCandidateDetails()', func.logCons.LOG_EXIT)
  })
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
async function getBioDataDetailsfromID(candidateDetails, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getBioDataDetailsfromID()', func.logCons.LOG_ENTER)
    let query = []
    query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, candidateDetails[0][func.dbCons.FIELD_BIO_DATA_DETAILS_ID], true, true))
    dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, func.dbCons.COLLECTION_BIO_DATA_DETAILS, dbOp.getCommonProjection(), function (error, existingDetails) {
      if (error) return reject(error)
      else if (!existingDetails || existingDetails.length === 0) {
        return reject(existingDetails)
      } else {
        let sourceField = func.dbCons.FIELD_BIO_DATA_DETAILS_ID
        let destSourceField = func.dbCons.FIELD_ID
        let destinationFields = []
        destinationFields.push(func.dbCons.FIELD_SIGNED_OFFER_LETTER_URL)
        destinationFields.push(func.dbCons.FIELD_DATE_OF_JOINING)
        destinationFields.push(func.dbCons.FIELD_OFFICE_LOCATION)
        mappingJson(existingDetails, candidateDetails, sourceField, destSourceField, destinationFields, function(error, jsonResponse) {
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
        // return resolve(existingDetails)
      }
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getBioDataDetailsfromID()', func.logCons.LOG_EXIT)
  })
}
async function findExistingEmailIds(body, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findExistingEmailIds()', func.logCons.LOG_ENTER)
    let query = []
    query.push(dbOp.getQueryJsonForOp(func.dbCons.FILED_EMAIL_ADDRESS, func.lightBlueCons.OP_EQUAL, body[func.dbCons.FILED_EMAIL_ADDRESS], true, true))
    dbOp.findByQuery(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, func.dbCons.COLLECTION_BIO_DATA_DETAILS, dbOp.getCommonProjection(), function (error, existingEmailsIds) {
      if (error) return reject(error)
      else if (!existingEmailsIds || existingEmailsIds.length === 0) {
        return resolve(false)
      } else {
        return resolve(true)
      }
    })
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'findExistingEmailIds()', func.logCons.LOG_EXIT)
}
async function updateDataintoPersonDetails(body, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateDataintoPersonDetails()', func.logCons.LOG_ENTER)
    let jsonToUpdate = {}
    jsonToUpdate[func.dbCons.BIO_DATA_DETAILS_ID] = body[func.dbCons.FIELD_BIO_DATA_DETAILS_ID]
    let query = []
    query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, body[func.dbCons.FIELD_PERSON_ID]))
    dbOp.update(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_PERSON_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getOperationJson(func.lightBlueCons.OP_SET, jsonToUpdate), dbOp.getCommonProjection(), function (error, updatePersonDetails) {
      if (error) return reject(error)
      else if (!updatePersonDetails || updatePersonDetails.length === 0) {
        var updatePersonDetails = []
        return reject(updatePersonDetails)
      } else {
        return resolve(updatePersonDetails)
      }
    })
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateDataintoPersonDetails()', func.logCons.LOG_EXIT)
}
async function updateDataintoCandidateDetails(body, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateDetailsforCandidate()', func.logCons.LOG_ENTER)
    let jsonToUpdate = {}
    jsonToUpdate[func.dbCons.FIELD_BIO_DATA_DETAILS_ID] = body[func.dbCons.FIELD_BIO_DATA_DETAILS_ID]
    let query = []
    query.push(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, body[func.dbCons.FIELD_CANDIDATE_ID]))
    dbOp.update(dbOp.getOperationJson(func.lightBlueCons.OP_AND, query), orgNameMap, dbOp.setCollectionJson(func.dbCons.COLLECTION_CANDIDATE_DETAILS, func.dbCons.COMMON_VERSION_1_0_0), dbOp.getOperationJson(func.lightBlueCons.OP_SET, jsonToUpdate), dbOp.getCommonProjection(), function (error, updateCandidate) {
      if (error) return reject(error)
      else if (!updateCandidate || updateCandidate.length === 0) {
        var updateCandidate = []
        return reject(updateCandidate)
      } else {
        body[func.dbCons.FIELD_PERSON_ID] = updateCandidate[0][func.dbCons.COLLECTION_JSON_PERSON_ID]

        return resolve(body)
      }
    })
  })
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateDataintoCandidateDetails()', func.logCons.LOG_EXIT)
}
async function insertDataIntoBioData(body, userCode, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertDataIntoBioData()', func.logCons.LOG_ENTER)
    body[func.dbCons.COMMON_CREATED_BY] = userCode
    body[func.dbCons.CANDIDATE_FIELD_UPDATED_BY] = userCode
    dbOp.insert(orgNameMap, func.dbCons.COLLECTION_BIO_DATA_DETAILS, body, dbOp.getCommonProjection(), function (err, insertBioData) {
      if (err) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, `Error while adding bio data ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertDataIntoBioData()', func.logCons.LOG_EXIT)
        return reject(err)
      } else if (!insertBioData || insertBioData.length == 0) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, `data not inserted`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertDataIntoBioData()', func.logCons.LOG_EXIT)
        return reject(insertBioData)
      }
      return resolve(insertBioData)
    })
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertDataIntoBioData()', func.logCons.LOG_EXIT)
  })
}

function getReturnJson(response) {
  let data = {}
  let errors = []
  return {
    data: (response === undefined || response.length == 0) ? data : response,
    errors: errors,
    message: (response === undefined || response.length == 0) ? func.msgCons.MSG_BIO_DATA_INSERTED_SUCCESSFULLY : func.msgCons.MSG_USER_ALREADY_EXISTS
  }
}

function encryptData(body) {
  body[func.dbCons.BIO_DATA_CONTACTS_NO] = body[func.dbCons.BIO_DATA_CONTACTS_NO]
  body[func.dbCons.VEHICLE_NO] = body[func.dbCons.VEHICLE_NO]
  body[func.dbCons.LICENCE_NO] = body[func.dbCons.LICENCE_NO]
  body[func.dbCons.VOTING_ID_NO] = body[func.dbCons.VOTING_ID_NO]
  body[func.dbCons.UID_NO] = body[func.dbCons.UID_NO]
  body[func.dbCons.UAN_NO] = body[func.dbCons.UAN_NO]
  body[func.dbCons.ESIC_NO] = body[func.dbCons.ESIC_NO]
  body[func.dbCons.PASSPORT_NO] = body[func.dbCons.PASSPORT_NO]
  body[func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS] = body[func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS]
  body[func.dbCons.CANDIDATE_FIELD_ADDRESS][func.dbCons.RELATIVE_MOBILE_NO] = body[func.dbCons.CANDIDATE_FIELD_ADDRESS][func.dbCons.RELATIVE_MOBILE_NO]
  body[func.dbCons.CANDIDATE_FIELD_ADDRESS][func.dbCons.RESIDENCE_CONTACT_NO] = body[func.dbCons.CANDIDATE_FIELD_ADDRESS][func.dbCons.RESIDENCE_CONTACT_NO]
  body[func.dbCons.PERMANENT_ADDRESS][func.dbCons.RELATIVE_MOBILE_NO] = body[func.dbCons.CANDIDATE_FIELD_ADDRESS][func.dbCons.RELATIVE_MOBILE_NO]
  body[func.dbCons.PERMANENT_ADDRESS][func.dbCons.RESIDENCE_CONTACT_NO] = body[func.dbCons.CANDIDATE_FIELD_ADDRESS][func.dbCons.RESIDENCE_CONTACT_NO]
  body[func.dbCons.REFERENCE_DETAILS][func.dbCons.BIO_DATA_CONTACTS_NO] = body[func.dbCons.REFERENCE_DETAILS][func.dbCons.BIO_DATA_CONTACTS_NO]
  body[func.dbCons.BROTHER_DETAILS][func.dbCons.BIO_DATA_CONTACTS_NO] = body[func.dbCons.BROTHER_DETAILS][func.dbCons.BIO_DATA_CONTACTS_NO]
  for (relatives of body[func.dbCons.RELATIVE_DETAILS]) {
    relatives[func.dbCons.RELATIVE_MOBILE_NO] = relatives[func.dbCons.RELATIVE_MOBILE_NO]
  }
  return body
}

function encryptFields(field, value) {
  if (field === func.dbCons.BIO_DATA_CONTACTS_NO || field === func.dbCons.VEHICLE_NO ||
    field === func.dbCons.LICENCE_NO || field === func.dbCons.VOTING_ID_NO || field === func.dbCons.UID_NO || field === func.dbCons.UAN_NO ||
    field === func.dbCons.ESIC_NO || field === func.dbCons.PASSPORT_NO || field === func.dbCons.CANDIDATE_FIELD_EMAIL_ADDRESS) {
    value = value
  } else if (field === func.dbCons.CANDIDATE_FIELD_ADDRESS) {
    value[func.dbCons.RELATIVE_MOBILE_NO] = value[func.dbCons.RELATIVE_MOBILE_NO]
    value[func.dbCons.RESIDENCE_CONTACT_NO] = value[func.dbCons.RESIDENCE_CONTACT_NO]
  } else if (field === func.dbCons.PERMANENT_ADDRESS) {
    value[func.dbCons.RELATIVE_MOBILE_NO] = value[func.dbCons.RELATIVE_MOBILE_NO]
    value[func.dbCons.RESIDENCE_CONTACT_NO] = value[func.dbCons.RESIDENCE_CONTACT_NO]
  } else if (field === func.dbCons.REFERENCE_DETAILS) {
    value[func.dbCons.BIO_DATA_CONTACTS_NO] = value[func.dbCons.BIO_DATA_CONTACTS_NO]
  } else if (field === func.dbCons.BROTHER_DETAILS) {
    value[func.dbCons.BIO_DATA_CONTACTS_NO] = value[func.dbCons.BIO_DATA_CONTACTS_NO]
  } else if (field === func.dbCons.RELATIVE_DETAILS) {
    for (relatives of value) {
      relatives[func.dbCons.RELATIVE_MOBILE_NO] = relatives[func.dbCons.RELATIVE_MOBILE_NO]
    }
  } else {
    value = value
  }
  return value;
}

exports.CandidateBioDataHelpers = CandidateBioDataHelpers