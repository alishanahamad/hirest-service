const func = require('../utils/functions')
const dbOperation  = require('./db-operations').DbOperation
const dbOp = new DbOperation()
var HELPER_CONS = 'CS_CRLCH'

 function CandidateRegisterLinkCloseHelpers(){
   func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'obj created of fetching candidate register link close ')

 }
 CandidateRegisterLinkCloseHelpers.prototype.candidateRegisterInfo = async function(campusDriveId, orgNameMap){
   func.printLog(func.logCons.LOG_LEVEL_INFO, 'candidateRegisterInfo()', func.logCons.LOG_ENTER)
   try{
     const campusDetails = await getCampusDriveDetails(campusDriveId, orgNameMap)
     for(let item of campusDetails){
     if(item['status'] === func.dbCons.ENUM_DEACTIVATED || item['status'] === func.dbCons.ENUM_CAMPUS_DRIVE_CLOSED){
       return func.responseGenerator(false, HELPER_CONS + func.msgCons.CODE_SERVER_OK, 'Campus drive not available', [])
     }else{
       return func.responseGenerator(true, HELPER_CONS + func.msgCons.CODE_SERVER_OK, 'Campus Drive available', [])
     }
   }
   }catch(err){
     func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while candidate register link close info. ${err}`)
     func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'candidateRegisterInfo()', func.logCons.LOG_EXIT)
   }
 }
 async function getCampusDriveDetails(campusDriveId, orgNameMap){
    return new Promise((resolve, reject) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDetails()', func.logCons.LOG_ENTER)
    dbOp.findByQuery(dbOp.getQueryJsonForOp(func.dbCons.FIELD_ID, func.lightBlueCons.OP_EQUAL, campusDriveId), orgNameMap, func.dbCons.COLLECTION_CAMPUS_DRIVE_DETAILS, dbOp.getCommonProjection(), function(error, response) {
      if(error){
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `Error while campus drive Id. ${err}`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDetails()', func.logCons.LOG_EXIT)
        return reject(error)
      }else if(!response || response.length === 0){
        func.printLog(func.logCons.LOG_LEVEL_ERROR, `campus drive id not found`)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDetails()', func.logCons.LOG_EXIT)
        return resolve(response)
      }else{
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCampusDriveDetails()', func.logCons.LOG_EXIT)
        return resolve(response)
      }
    })
    })
 }
 exports.CandidateRegisterLinkCloseHelpers = CandidateRegisterLinkCloseHelpers
