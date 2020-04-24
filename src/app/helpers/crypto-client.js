'use strict'
/**
 * The <code>index.js</code> is wrapper module of crypto-service
 * @author Dipak Savaliya, Bipin Thite
 */
const set = require('set-value')
const R = require('ramda')
const rp = require('request-promise')
const func = require('../utils/functions')
const _ = require('lodash')
const configHelper = require('@scikey/config-helper-module')
const cryptoUriConfig = func.config.get('crypto')
const ENUM_ENC = 'enc'
const ENUM_DEC = 'dec'
const binnaryOperators = [func.lightBlueCons.OP_EQUAL, func.lightBlueCons.OP_NOT_EQUAL, func.lightBlueCons.OP_LESS_THAN, func.lightBlueCons.OP_GREATER_THAN, func.lightBlueCons.OP_LESS_EQUAL, func.lightBlueCons.OP_GREATER_EQUAL]
// module to expose
const self = module.exports = {
  /**
   * [encrypt description]
   * @param  {[type]} data       [description]
   * @param  {[type]} orgnameMap [description]
   * @param  {[type]} env        [description]
   * @return {[type]}            [description]
   */
  encrypt: async (data, orgnameMap, env) => {
    env = (env === undefined || env === null || env === '-1') ? '' : env
    let queyparams = await getQueryParams(orgnameMap, env)
    return new Promise((resolve, reject) => {
      const options = {
        method: cryptoUriConfig.method,
        uri: cryptoUriConfig.encryptUri + queyparams,
        header: {
          'content-type': 'application/json',
          'orgname': env + orgnameMap[func.urlCons.PARAM_ORG_NAME],
          'domain_name': orgnameMap[func.urlCons.PARAM_DOMAIN_NAME]
        },
        body: data,
        json: true // Automatically stringifies the body to JSON
      }
      rp(options)
        .then((parsedBody) => {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `encrypted data = ${JSON.stringify(parsedBody)}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `crypto encrypt process completed successfully!`)
          resolve(parsedBody)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },
  /**
   * [decrypt description]
   * @param  {[type]}  data       [description]
   * @param  {[type]}  orgnameMap [description]
   * @param  {[type]}  env        [description]
   * @return {Promise}            [description]
   */
  decrypt: async (data, orgnameMap, env) => {
    env = (env === undefined || env === null || env === '-1') ? '' : env
    let queyparams = await getQueryParams(orgnameMap, env)
    return new Promise((resolve, reject) => {
      const options = {
        method: cryptoUriConfig.method,
        uri: cryptoUriConfig.decryptUri + queyparams,
        header: {
          'orgname': env + orgnameMap[func.urlCons.PARAM_ORG_NAME],
          'domain_name': orgnameMap[func.urlCons.PARAM_DOMAIN_NAME]
        },
        body: data,
        json: true // Automatically stringifies the body to JSON
      }
      rp(options)
        .then((parsedBody) => {
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `decrypted data = ${JSON.stringify(parsedBody)}`)
          func.printLog(func.logCons.LOG_LEVEL_DEBUG, `crypto decrypt process completed successfully!`)
          resolve(parsedBody)
        })
        .catch((err) => {
          reject(err)
        })
    })
  },
  /**
   * [getDataConfig description]
   * @param  {[type]}  data       [description]
   * @param  {[type]}  orgnameMap [description]
   * @param  {[type]}  env        [description]
   * @return {Promise}            [description]
   */
  getConfig: async (data, orgnameMap, env) => {
    try {
      // TODO: req object is not defined need to take care of it
      const configJson = await configHelper.getConfigProperties({}, env, orgnameMap)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, `configJson = ${JSON.stringify(configJson)}`)
      const cryptoConfigValues = await processConfigValues(data, configJson)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, `final data that needs to enc = ${JSON.stringify(cryptoConfigValues)}`)
      return cryptoConfigValues
    } catch (e) {
      func.printLog(func.logCons.LOG_LEVEL_ERRO, `error while processing config = ${e}`)
      return e
    }
  },
  /**
   * [generateInputPayloadForEnc description]
   * @param  {[type]}  data           [description]
   * @param  {[type]}  collectionName [description]
   * @return {Promise}                [description]
   */
  generateInputPayloadForCryptoService: async (data, collectionName) => {
    let cryptoInputPayload = []
    for (let dataObj of data) {
      let json = {}
      json[collectionName] = dataObj
      cryptoInputPayload.push(json)
    }
    return cryptoInputPayload
  },
  /**
   * [generateOriginalPayloadForCryptoService description]
   * @param  {[type]}  cipherData           [description]
   * @param  {[type]}  collectionName [description]
   * @return {Promise}                [description]
   */
  generateOriginalPayloadFromCryptoService: async (cipherData, collectionName) => {
    let cryptoOrignalPayload = []
    for (let cipherdataObj of cipherData) {
      let json = cipherdataObj[collectionName]
      cryptoOrignalPayload.push(json)
    }
    return cryptoOrignalPayload
  },

  /**
   * [generateOriginalPayloadFromCryptoData description]
   * @param  {[type]}  data       [description]
   * @param  {[type]}  cipherData [description]
   * @param  {[type]}  fields     [description]
   * @return {Promise}            [description]
   */
  generateOriginalPayloadFromCryptoData: async (dataz, cipherdataz, fields) => {
    for (let i = 0; i < dataz.length; i++) {
      let data = dataz[i]
      let cipherdata = cipherdataz[i]
      if (fields && fields.length > 0) {
        for (let field of fields) {
          // split field value by dot (.) &
          // get value at given field
          if (Array.isArray(data[field])) {
            let decryptValues = []
            for (let cipherData in cipherdata[field]) {
              decryptValues.push(cipherdata[field][cipherData])
            }
            data[field] = decryptValues
          } else {
            const valueToReplace = R.path(field.split('.'), cipherdata)
            // if value present in cipherdata
            if (valueToReplace) {
              // set value to the object property
              set(data, field, valueToReplace)
            } else {
              data[field] = cipherdata[field]
            }
          }
        }
      }
    }
    return dataz
  },

  /**
   * [filteredInputBasedOnConfig description]
   * @param  {[type]}  data             [description]
   * @param  {[type]}  collectionName   [description]
   * @param  {[type]}  encryptionFields [description]
   * @return {Promise}                  [description]
   */
  filteredInputBasedOnConfig: async (data, collectionName, encryptionFields) => {
    let cryptoReduceInput = []
    for (let collectionObj of data) {
      let collectionJson = {}
      collectionJson[collectionName] = _.pick(collectionObj, encryptionFields)
      cryptoReduceInput.push(collectionJson)
    }
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `cryptoReduceInput = ${JSON.stringify(cryptoReduceInput)}`)
    return cryptoReduceInput
  },

  /**
   * [generateOriginalDataForOutput description]
   * @param  {[type]}  insertedData [description]
   * @param  {[type]}  data         [description]
   * @param  {[type]}  fields       [description]
   * @return {Promise}              [description]
   */
  generateOriginalDataForOutput: async (insertedData, data, fields) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `inserted data = ${JSON.stringify(insertedData)}`)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `original data = ${JSON.stringify(data)}`)
    insertedData = func.convertIntoArray(insertedData)
    data = func.convertIntoArray(data)
    let outPutPayload = []
    let counter = 0
    for (let dataObj of insertedData) {
      for (let key in dataObj) {
        if (fields.indexOf(key) > -1) {
          dataObj[key] = data[counter][key]
        } else {
          func.printLog(func.logCons.LOG_LEVEL_SILLY, `${key} is not cipher field`)
        }
      }
      outPutPayload.push(dataObj)
      counter++
    }
    return outPutPayload
  },
  /**
   * [getCryptoPayload description]
   * @param  {[type]}  cryptoType     [description]
   * @param  {[type]}  data           [description]
   * @param  {[type]}  orgnameMap         [description]
   * @param  {[type]}  collectionName [description]
   * @return {Promise}                [description]
   */
  getCryptoPayload: async (cryptoType, data, orgnameMap, collectionName) => {
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCryptoPayload()', func.logCons.LOG_ENTER)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `cryptoType = ${JSON.stringify(cryptoType)}`)
    data = func.convertIntoArray(data)
    try {
      const cryptoPayload = await self.generateInputPayloadForCryptoService(data, collectionName)
      const dataConfigutation = await self.getConfig(cryptoPayload, orgnameMap, orgnameMap[func.urlCons.PARAM_ENV])
      // if (dataConfigutation === undefined || dataConfigutation == null || Object.keys(dataConfigutation).length === 0) {
      if (func.checkValidJson(dataConfigutation)) {
        const cipherFields = dataConfigutation[collectionName][func.msCons.PARAM_FIELDS]
        const cryptoFinalPayload = await self.filteredInputBasedOnConfig(data, collectionName, cipherFields)
        const cryptoPayloadJson = (cryptoType === ENUM_ENC) ? await self.encrypt(cryptoFinalPayload, orgnameMap, orgnameMap[func.urlCons.PARAM_ENV]) : await self.decrypt(cryptoFinalPayload, orgnameMap, orgnameMap[func.urlCons.PARAM_ENV])
        const cryptoOriginalPayload = await self.generateOriginalPayloadFromCryptoService(cryptoPayloadJson.data, collectionName)
        const cryptoDBPayload = await self.generateOriginalPayloadFromCryptoData(data, cryptoOriginalPayload, cipherFields)
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCryptoPayload()', func.logCons.LOG_EXIT)
        return {
          isCryptoRequired: true,
          data: cryptoDBPayload,
          fields: cipherFields
        }
      } else {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, 'getCryptoPayload()', func.logCons.LOG_EXIT)
        return {
          isCryptoRequired: false
        }
      }
    } catch (e) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, `error while processing crypto payload = ${e}`)
      return {
        isCryptoRequired: false
      }
    }
  },
  /**
   * [getCryptoQuery description]
   * @param  {[type]}  query         [description]
   * @param  {[type]}  urlMap        [description]
   * @param  {[type]}  collectionMap [description]
   * @return {Promise}               [description]
   */
  getCryptoQuery: async (query, orgNameMap, collectionMap) => {
    try {
      const configJson = await configHelper.getConfigProperties({}, orgNameMap[func.urlCons.PARAM_ENV], orgNameMap)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, `configJson = ${JSON.stringify(configJson)}`)
      let collectionConfig = await configHelper.getConfigValue(collectionMap[func.lightBlueCons.PARAM_NAME], func.configCons.PARAM_ORG_LEVEL_CONFIGS, configJson)
      if (collectionConfig === 'NA' || !collectionConfig) {
        return query
      } else {
        let fields = collectionConfig[func.msCons.PARAM_ENTITY_VALUE].replace('[', '').replace(']', '').split(',').map(String)
        let cryptoQuery = await generateCryptoQuery(query, fields, orgNameMap, collectionMap[func.lightBlueCons.PARAM_NAME])
        return cryptoQuery
      }
    } catch (e) {
      func.printLog(func.logCons.LOG_LEVEL_ERROR, `error generating crypto query = ${e}`)
      return query
    }
  }
}
/**
 * [processConfigValues description]
 * @param  {[type]}  data       [description]
 * @param  {[type]}  configJson [description]
 * @return {Promise}            [description]
 */
const processConfigValues = async (data, configJson) => {
  let cryptoConfigValues = {}
  for (let payload of data) {
    for (let key in payload) {
      let dataObj = payload[key]
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, `checking configuration for = ${JSON.stringify(dataObj)}`)
      const isEnc = await configHelper.getConfigValue(key, func.configCons.PARAM_ORG_LEVEL_CONFIGS, configJson)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, `isEnc = ${JSON.stringify(isEnc)}`)
      if (isEnc === 'NA' || !isEnc) {
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, `no need to encrypt = ${JSON.stringify(key)}`)
      } else {
        let keyDataJson = {}
        const values = isEnc[func.msCons.PARAM_ENTITY_VALUE].replace('[', '').replace(']', '').split(',').map(String)
        const keyType = isEnc[func.msCons.PARAM_ELEMENT_TYPE]
        keyDataJson[func.msCons.PARAM_FIELDS] = values
        keyDataJson[func.msCons.PARAM_KEY_TYPE] = keyType
        cryptoConfigValues[key] = keyDataJson
        func.printLog(func.logCons.LOG_LEVEL_DEBUG, `data that needs to enc = ${JSON.stringify(cryptoConfigValues)}`)
      }
    }
  }
  return cryptoConfigValues
}

const generateCryptoQuery = async (query, fields, orgNameMap, collectionName) => {
  let queryJson = {}
  if (query.hasOwnProperty(func.lightBlueCons.OP_AND) || query.hasOwnProperty(func.lightBlueCons.OP_OR)) {
    let arrayOpration = (query.hasOwnProperty(func.lightBlueCons.OP_AND)) ? func.lightBlueCons.OP_AND : func.lightBlueCons.OP_OR
    queryJson[arrayOpration] = []
    for (let q of (query[func.lightBlueCons.OP_AND] || query[func.lightBlueCons.OP_OR])) {
      const queryJsonValue = await generateCryptoQuery(q, fields, orgNameMap, collectionName)
      queryJson[arrayOpration].push(queryJsonValue)
    }
  } else {
    queryJson = await getSingleQueryJson(query, fields, orgNameMap, collectionName)
  }
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `final crypto query json = ${JSON.stringify(queryJson)}`)
  return queryJson
}

const getSingleQueryJson = async (query, fields, orgNameMap, collectionName) => {
  let queryWithCryptoValue = {}
  const field = query[func.lightBlueCons.FIELD_FIELD]
  let op
  if (query.hasOwnProperty(func.lightBlueCons.FIELD_OP)) {
    op = query[func.lightBlueCons.FIELD_OP]
  } else if (query.hasOwnProperty(func.lightBlueCons.FIELD_REGEX)) {
    op = func.lightBlueCons.FIELD_REGEX
  }
  if (binnaryOperators.indexOf(op) > -1) {
    const value = query[func.lightBlueCons.FIELD_RVALUE]
    if (fields.indexOf(field) > -1) {
      let jsonToEnc = {}
      jsonToEnc[field] = value
      let decryptValueJson = await self.getCryptoPayload(ENUM_ENC, [jsonToEnc], orgNameMap, collectionName)
      let decryptValue = decryptValueJson.data[0][field]
      queryWithCryptoValue = await getQueryJsonWithOp(field, op, decryptValue)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, `queryWithCryptoValue = ${JSON.stringify(queryWithCryptoValue)}`)
    } else {
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, `${field} is not marked for encryption`)
      queryWithCryptoValue = await getQueryJsonWithOp(field, op, value)
      func.printLog(func.logCons.LOG_LEVEL_DEBUG, `queryWithCryptoValue = ${JSON.stringify(queryWithCryptoValue)}`)
    }
    return queryWithCryptoValue
  } else if (op === func.lightBlueCons.OP_IN && fields.indexOf(field) > -1) {
    const values = query[func.lightBlueCons.FIELD_VALUES]
    let jsonToEnc = {}
    jsonToEnc[field] = values
    let decryptValueJson = await self.getCryptoPayload(ENUM_ENC, [jsonToEnc], orgNameMap, collectionName)
    let decryptValues = []
    let cryptodata = decryptValueJson.data[0][field]
    for (let encData in cryptodata) {
      decryptValues.push(cryptodata[encData])
    }
    queryWithCryptoValue = await getQueryJsonWithOp(field, op, decryptValues)
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `queryWithCryptoValue = ${JSON.stringify(queryWithCryptoValue)}`)
    return queryWithCryptoValue
  } else if (op === func.lightBlueCons.FIELD_REGEX && fields.indexOf(field) > -1) {
    const value = query[func.lightBlueCons.FIELD_REGEX]
    let jsonToEnc = {}
    jsonToEnc[field] = value
    let decryptValueJson = await self.getCryptoPayload(ENUM_ENC, [jsonToEnc], orgNameMap, collectionName)
    let decryptValue = decryptValueJson.data[0][field]
    queryWithCryptoValue = await getQueryJsonWithRegexOp(field, decryptValue, query[func.lightBlueCons.FIELD_CASE_INSENSETIVE])
    func.printLog(func.logCons.LOG_LEVEL_DEBUG, `queryWithCryptoValue = ${JSON.stringify(queryWithCryptoValue)}`)
    return queryWithCryptoValue
  } else {
    func.printLog(func.logCons.LOG_LEVEL_INFO, `we are working on to give support for the requested operation`)
    return query
  }
}

const getQueryJsonWithOp = async (field, op, value) => {
  let json = {}
  json[func.lightBlueCons.FIELD_FIELD] = field
  json[func.lightBlueCons.FIELD_OP] = op
  if (Array.isArray(value)) {
    json[func.lightBlueCons.FIELD_VALUES] = value
  } else {
    json[func.lightBlueCons.FIELD_RVALUE] = value
  }
  return json
}

const getQueryJsonWithRegexOp = async (field, value, isCaseInsensitive) => {
  let json = {}
  json[func.lightBlueCons.FIELD_FIELD] = field
  json[func.lightBlueCons.FIELD_REGEX] = value
  if (isCaseInsensitive) {
    json[func.lightBlueCons.FIELD_CASE_INSENSETIVE] = isCaseInsensitive
  } else {
    json[func.lightBlueCons.FIELD_CASE_INSENSETIVE] = false
  }
  return json
}

const getQueryParams = async (orgnameMap, env) => {
  let queryString = `?env=${env}&&orgname=${orgnameMap[func.urlCons.PARAM_ORG_NAME]}&&domain_name=${orgnameMap[func.urlCons.PARAM_DOMAIN_NAME]}`
  func.printLog(func.logCons.LOG_LEVEL_DEBUG, `query string = ${JSON.stringify(queryString)}`)
  return queryString
}
