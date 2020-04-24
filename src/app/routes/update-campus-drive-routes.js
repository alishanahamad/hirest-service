var func = require('../utils/functions');
UpdateCampusDriveData = require('../helpers/update-campus-drive-data-helpers').UpdateCampusDriveData;
var updateCampusDriveData = new UpdateCampusDriveData();
const ROUTE_CONS = 'HI_UCDD_';

module.exports = function (app) {
    app.post(func.urlCons.URL_UPDATE_CAMPUS_DRIVE_DETAILS, async function (req, res, next) {
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_UPDATE_CAMPUS_DRIVE_DETAILS, func.logCons.LOG_ENTER)
        const orgNameMap = func.getUrlMap(req)
        const campusDriveId = req.params.id
        const body = req.body.data
        try {
            func.printLog(func.logCons.LOG_LEVEL_INFO, `update campus drive details`)
            const results = await updateCampusDriveData.updateCampusDrive(campusDriveId, body, orgNameMap)
            res.status(func.httpStatusCode.OK).send(func.responseGenerator(results.data, ROUTE_CONS + func.msgCons.CODE_SERVER_OK, results.message, results.errors))
            next()
        } catch (err) {
            res.status(func.httpStatusCode.INTERNAL_SERVER_ERROR).send(err)
            next()
        }
        func.printLog(func.logCons.LOG_LEVEL_INFO, func.urlCons.URL_UPDATE_CAMPUS_DRIVE_DETAILS, func.logCons.LOG_EXIT)
    })
}