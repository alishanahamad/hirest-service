module.exports = {

  // //////////////////////////////////////////////////////
  // METHOD constants
  // //////////////////////////////////////////////////////

  METHOD_POST: 'POST',
  METHOD_GET: 'GET',
  METHOD_PUT: 'PUT',
  METHOD_DELETE: 'DELETE',
  METHOD_OPTIONS: 'OPTIONS',

  PARAM_VERSION: 'version',
  PARAM_NAME: 'name',

  FIELD_ERROR: 'error',
  FIELD_PROCESSED: 'processed',
  FIELD_ALL: '*',
  FIELD_OBJECT_TYPE: 'objectType',
  FIELD_VERSION: 'version',
  FIELD_FIELD: 'field',
  FIELD_DATA: 'data',
  FIELD_RESPONSE: 'response',
  FIELD_ARRAY: 'array',
  FIELD_QUERY: 'query',
  FIELD_OP: 'op',
  FIELD_RVALUE: 'rvalue',
  FIELD_RFIELD: 'rfield',
  FIELD_REGEX: 'regex',
  FIELD_VALUES: 'values',
  FIELD_INCLUDE: 'include',
  FIELD_RECURSIVE: 'recursive',
  FIELD_ELEM_MATCH: 'elemMatch',
  FIELD_PROJECTION: 'projection',
  FIELD_UPDATE: 'update',
  FIELD_UPSERT: 'upsert',
  FIELD_MODIFIED_COUNT: 'modifiedCount',
  FIELD_MATCH_COUNT: 'matchCount',
  FIELD_PROJECT: 'project',
  FIELD_STATUS: 'status',
  FIELD_CONTAINS: 'contains',
  PARAM_VERSION: 'version',
  PARAM_NAME: 'name',
  /////////////////////////
  STATUS_ERROR: 'ERROR',
  STATUS_COMPLETE: 'COMPLETE',
  STATUS_PARTIAL: 'PARTIAL',
  /// //////////////////////
  FIELD_DATA_ERRORS: 'dataErrors',
  FIELD_ERRORS: 'errors',
  FIELD_CONTEXT: 'context',
  FIELD_ERROR_CODE: 'errorCode',
  FIELD_MSG: 'msg',

  FIELD_RANGE: 'range',
  FIELD_RANGE_DEFAULT: [0, 999999999999],
  ///////////////////////
  //URL
  //////////////////////
  URL_REST_DATA: '/rest/data/',

  /// ////////////////////
  // CRUD OPERATIONz
  /// ///////////////////
  CRUD_FIND: 'find',
  CRUD_INSERT: 'insert',
  CRUD_SAVE: 'save',
  CRUD_DELETE: 'delete',
  CRUD_UPDATE: 'update',
  CRUD_BULK: 'bulk',
  CRUD_GENERATE: 'generate',

  /// ////////////////////
  // OPERATIONz op
  /// ///////////////////
  OP_EQUAL: '$eq',
  OP_NOT_EQUAL: '$neq',
  OP_LESS_THAN: '$lt',
  OP_GREATER_THAN: '$gt',
  OP_LESS_EQUAL: '$lte',
  OP_GREATER_EQUAL: '$gte',
  OP_IN: '$in',
  OP_N_IN: '$nin',
  OP_AND: '$and',
  OP_OR: '$or',
  OP_NOT: '$not',
  OP_NONE: '$none',
  OP_ALL: '$all',
  OP_ANY: '$any',
  OP_SET: '$set',
  OP_UPSET: '$upset',
  OP_APPEND: '$append',

  ///////////////////////
  //VERSIONz
  //////////////////////
  VERSION_1_0_0: '1.0.0'
};
