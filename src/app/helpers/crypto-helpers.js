var crypto = require('crypto'),
	algorithm = 'aes-256-ctr';
var func = require('../utils/functions');
var _key = '06f3gk1185gzc70f6ucee1jua1714t7d78gplufaxz4ff0qw';
////////////////constructor/////////////
function CryptoHelpers() {
	func.printLog(func.logCons.LOG_LEVEL_INFO, 'obj created of crypto helpers');
	DbOperation = require('./db-operations')
		.DbOperation;
	dbOp = new DbOperation();
}
/** This method is used for generate encrypt text using plain text and key
 * @param {String} text plain text
 * @param {Key} key key using key we can encrypt plain text
 *
 * @return {String} crypted return crypted text
 */
CryptoHelpers.prototype.encrypt = function encrypt(text, key) {
	func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'encrypt()', func.logCons.LOG_ENTER);
	var cipher = crypto.createCipher(algorithm, key);
	var crypted = cipher.update(text, 'utf8', 'hex');
	crypted += cipher.final('hex');
	func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'encrypt()', func.logCons.LOG_EXIT);
	return crypted;
};
/** This method is used for generate decrypt text using cipher text and key
 * @param {String} text plain text
 * @param {Key} key key using key we can encrypt plain text
 *
 * @return {String} dec  return decrypted text
 */
CryptoHelpers.prototype.decrypt = function decrypt(text, key) {
	func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'decrypt()', func.logCons.LOG_ENTER);
	var decipher = crypto.createCipher(algorithm, key);
	var dec = decipher.update(text, 'hex', 'utf8');
	dec += decipher.final('utf8');
	func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'decrypt()', func.logCons.LOG_ENTER);
	return dec;
};
/** This method will return unique key
 *  @return {string} _key return key for encryption and decryption
 **/
CryptoHelpers.prototype.getKey = function getKey() {
	return _key;
};
/** This method used for insert encrption key with usercode in app encryption detail collection
 * @param {Array} encryptionDetails
 * @param {String} orgName name of the organization
 * @function {function} calllbackInsertAppEncryptionDetails
 *
 * @return {function} calllbackInsertAppEncryptionDetails
 */
CryptoHelpers.prototype.insertAppEncryptionDetails = function (encryptionDetails, urlMap, calllbackInsertAppEncryptionDetails) {
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertAppEncryptionDetails()', func.logCons.LOG_ENTER)
  encryptionDetails[func.dbCons.FIELD_ENTITY_NAME] = 'USER_PROFILE'
  encryptionDetails[func.dbCons.COMMON_CREATED_BY] = func.dbCons.FIELD_ADMIN
  encryptionDetails[func.dbCons.COMMON_UPDATED_BY] = func.dbCons.FIELD_ADMIN
  func.printLog(func.logCons.LOG_LEVEL_INFO, 'encryptionDetails:' + JSON.stringify(encryptionDetails))
  dbOp.insert(urlMap, func.dbCons.COLLECTION_APP_ENCRYPTION_DETAILS, encryptionDetails, function callback (error, returndata) {
    if (error) {
      return calllbackInsertAppEncryptionDetails(error, null)
    }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'insertAppEncryptionDetails()', func.logCons.LOG_EXIT)
    calllbackInsertAppEncryptionDetails(null, 'ok')
  })
}

exports.CryptoHelpers = CryptoHelpers;
