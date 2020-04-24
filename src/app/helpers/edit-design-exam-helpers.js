'use strict'
/**
 * This function is useful for editing design exam
 * @author Ekta Kakadia
 */
const func = require('../utils/functions')
const DbOperation = require('./db-operations').DbOperation
const dbOp = new DbOperation()
var _ = require('lodash')
const HELPER_CONS = 'HI_UCDH_'

function EditDesignExamHelpers() {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of editing design exam details')
}

EditDesignExamHelpers.prototype.editDesignExam = async function (body, orgNameMap) {
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'addCandidateAssessment()', func.logCons.LOG_ENTER)
  try {
    const examDetails = await updateExamDetails(body, orgNameMap)
    return examDetails
  } catch (err) {
    func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while editing exam details. ${err}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'addCandidateAssessment()', func.logCons.LOG_EXIT)
    throw err
  }
}

async function updateExamDetails (body, orgNameMap) {
  return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateExamDetails()', func.logCons.LOG_ENTER)
    const updateJson = getUpdateJson(body)
    dbOp.update(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, body.id),
      orgNameMap,
      dbOp.setCollectionJson(func.dbCons.COLLECTION_EXAM_DETAILS, func.dbCons.COMMON_VERSION_1_0_0),
      dbOp.getOperationJson(func.lightBlueCons.OP_SET, updateJson),
      dbOp.getCommonProjection(), (err, response) => {
        if (err) {
          func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while editing exam details. ${err}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateExamDetails()', func.logCons.LOG_EXIT)
          return reject(err)
        } else if (!response || response.length === 0) {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `candidate detail not found`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'updateExamDetails()', func.logCons.LOG_EXIT)
          return resolve(response)
        }
        return resolve(response)
      })
  })
}

function getUpdateJson (body){
  let json = {}
  json['exam_cover_image'] = body.exam_cover_image
  json['exam_instructions'] = body.exam_instructions
  json['exam_purpose'] = body.exam_purpose
  json['exam_duration'] = body.exam_duration
  json['target_department'] = body.target_department
  return json
}

exports.EditDesignExamHelpers = EditDesignExamHelpers
