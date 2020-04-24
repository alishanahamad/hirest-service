module.exports = {
  // ///////////////////////////
  // ERROR RESPONSE GENERATOR
  // //.////////////////////////
  PARAM_ERROR_STATUS: 'error_status',
  PARAM_ERROR_CODE: 'error_code',
  PARAM_ERROR_MSG: 'error_message',
  PARAM_ERROR_DESC: 'error_description',
  PARAM_ERROR: 'error',
  PARAM_TIMEOUT: 'timeout',

  // ///////////////////////////
  // RESPONSE GENERATOR
  // ///////////////////////////
  RESPONSE_DATA: 'data',
  RESPONSE_STATUS_CODE: 'status_code',
  RESPONSE_STATUS_MSG: 'status_message',
  RESPONSE_ERRORS: 'errors',
  RESPONSE_CREATED: 'created',
  RESPONSE_UPDATED: 'Data updated',
  RESPONSE_NOTIFICATION: 'notification',
  SUCCESS_RESPONSE: 'response_data',

  // ///////////////////////////
  // COMMON SERVER MSG
  // ///////////////////////////
  MSG_ERROR_SERVER_ERROR: 'server error',
  MSG_ERROR_PLZ_TRY_AFTER: 'please try after sometime',
  MSG_ERROR_INVALID_REQUEST: 'invalid request',
  MSG_ERROR_IN_LIGHTBLUE: 'error in lightblue call',
  MSG_ERROR_IN_STORING_DATA: 'error in storing the data',
  MSG_ERROR_NO_DATA: 'No data available',
  MSG_SUCCESS_FETCHED_DATA: 'data fetched successfully',
  MSG_PLEASE_PROVIDE: 'Please provide ',
  MSG_ERROR_JOI_VALIDATION: 'Invalid request body',

  // ///////////////////////////
  // COMMON SERVER CODE
  // ///////////////////////////
  CODE_SERVER_OK: '200',
  CODE_INTERNAL_ERROR: '500',
  CODE_NOT_FOUND: '404',
  CODE_BAD_REQUEST: '400',
  CODE_FORBIDDEN: '403',

  // /////////////////////
  MSG_TOKEN_INVALID: 'Access Denied, Invalid Token',
  MSG_TOKEN_NOT_AVAILABLE: 'Access Denied, Invalid Token',
  MSG_TOKEN_VALIDATED: 'Token validated',
  CODE_TOKEN_VERIFY: 'A18200',
  CODE_AUTH_ACCESS_DENIED: 'A18403',
  CODE_AUTHENTICATED: 'A18108',

  // / /////////////////////
  // LDAP messages
  // / ////////////////////
  MSG_ORG_ALREADY_EXISTS: 'Organization Already Exists',
  MSG_ORG_ADDED_SUCCESSFULLY: ' successfully added to LDAP',
  MSG_ORG_ALREADY_REGISTERED: ' is already registered as an organization',
  MSG_USER_ALREADY_EXISTS: 'User Already Exists',
  MSG_USER_ALREADY_REGISTERED: ' is already registered',
  MSG_LDAP_USER_REMOVED_SUCCESSFULLY: 'User deleted successfully',
  MSG_USER_ADDED_SUCCESSFULLY: ' successfully added to LDAP',
  MSG_ATTRIBUTE_ADDED_SUCCESSFULLY: ' successfully added to entry',
  MSG_ATTRIBUTE_ALREADY_EXISTS: 'Attribute Already Exists',
  MSG_INVALID_ATTRIBUTE: 'Invalid attribute',
  MSG_LDAP_AUTHENTICATION_SUCCESS: 'LDAP authentication successful ',
  MSG_LDAP_SEARCH_ERROR: 'Error occured while LDAP search',
  MSG_ERROR_LDAP_AUTHENTICATION: 'Error while direct-ldap authentication ',
  MSG_ERROR_LDAP_BIND: 'Error occured during LDAP bind operation',
  MSG_ERROR_LDAP_REMOVE: 'Error occured during LDAP remove operation',
  MSG_ERROR_LDAP: 'Error while adding in LDAP',
  MSG_NOT_UNIQUE_USERNAME: 'Account already exist with this email Id!!',
  DATA_IS_NOT_AVAILABLE: 'Data is not available',
  DATA_CAN_NOT_WRITE_FILE: 'Data can not write to file',
  // / ////////////////////
  MSG_LIGHTBLUE_DOWN: 'Lightblue is not responding',

  // / ////////////////////////
  // Email texts
  // / /////////////////////
  SUB_INVITATION: 'Invitation email from ',
  SUB_RESET_PASS: 'Reset your password',

  // /////////////////////
  // ERROR CODE
  // /////////////////////
  CODE_INVALID_PARAM: 'A15400',
  CODE_OK: 'A15200',
  CODE_INTERNAL_SERVER: 'A15500',
  CODE_LIGHBLUE_PARTIAL_ERROR: 'A15900',
  CODE_ATTEMPTED_ALL_SURVEY: 'A15001',
  CODE_SOCIAL_DENY: 'A154E4',

  // / ///////////////////
  // / /RBAC
  // / //////////////////
  MSG_UNAUTHORIZED_USER: 'Unauthorized user',
  MSG_NOT_ALLOWED_TO_DO_ACTION: 'You are not allowed to do this action',
  MSG_NO_ACTION_FOUND: 'No action found',
  MSG_NO_ACTION_DEFINED: 'This action is not defined',
  CODE_UNDEFINED_ACTION: 's17404',
  MSG_MORE_THAN_ONE_RULE_FOUND: 'more than one rule found',

  // / ///////////////////
  // / /UserRoleDetails
  // / //////////////////
  MSG_ROLE_NOT_INSERTED: 'role data are not inserted',
  MSG_ROLE_INSERTED: 'role data are inserted',
  SUCCESS_MSG_USER_ROLE_DETAILS: 'successfully received user role details',
  // /////////////////////
  // // Institute details
  // /////////////////////
  SUCCESS_MSG_INSTITUTE_DETAILS_RETRIVED: 'Institute details fetched successfully!',
  INSTITUTE_DETAILS: 'institute details',
  ERROR_MSG_NO_INSTITUTE_DETAILS_UPDATED: 'Institute details not updated',
  SUCCESS_MSG_INSTITUTE_DETAILS_UPDATED: 'Institute details successfully updated',
  ERROR_MSG_NO_INSTITUTE_DETAILS_DETAILS: 'Not able to get institute details',
  MSG_ERROR_NO_INSTITUE_DATA: 'NO institute details available ',
  FIELD_TPO_DETAILS_ARRAY: 'tpo_details',
  FIELD_INSTITUTE_DETAILS_ARRAY: 'institute_details',
  ERROR_MSG_NO_EXAM_DETAILS: 'Not able to get exam details',
  ERROR_MSG_NO_EXAM_DETAILS_DATA: 'No exam details available',
  LOGIN_CREDENTIALS: 'Login Credentials',

  // /////////////////////
  // // TPO details
  // /////////////////////
  CANDIDATE_REGISTRATION_SUCCESS: 'Candidate registration successful and mail sent successfully. Please contact your TPO.',
  SUCCESS_MSG_TPO_DETAILS_RETRIVED: 'TPO details fetched successfully!',
  MSG_ERROR_NO_TPO_DATA: 'NO TPO details available ',

  // ///////////////////////
  // Create Exam
  // ////////////////////
  SUCCESS_MSG_CREATE_EXAM_INSERTED: 'Exam details inserted successfully',
  RESPONSE_EXAM_DETAIL: 'Exam Details',
  ERROR_MSG_NO_EXAM_DETAILS_INSERTED: 'Exam Details not interested',
  SUCCESS_MSG_EXAM_DETAIL_RETRIVED: 'exam details fetched successfully!',

  // / //////////////////
  // Resource
  // / //////////////////
  MSG_RESOURCE_ADDED_SUCCESSFULLY: 'Resource added successfully',
  MSG_DATA_REMOVED: 'N/A',

  // ////////////////////
  // //EXAM SCORE DETAILS
  // ///////////////////
  MSG_MORE_THAN_ONE_EXAM_REPORT_DATA_FOUND: 'You have already appeared for this exam in current year',
  SUCCESS_MSG_INSERT: 'Data inserted successfully',
  SUCCESS_MSG_DATA_FETCH: 'Data fetched successfully',
  ERROR_MSG_NO_PROPER_DATA: 'No proper data found',

  // /////////////TPO

  CODE_UAM_SUCCESS: 'SS_ATR_200',
  MSG_UAM_MEMBER_INSERTED: 'TPO added successfully',
  ERROR_REGISTER_DETAILS_IS_NOT_INSERTED: 'register details is not inserted',
  FIELD_DATE_FORMAT_BACKEND: 'yyyy-mm-dd HH:MM:ss',
  CODE_INSTITUTE_NAME_ALREADY_IN_DATASOURCE: '400_1',
  MSG_INSTITUTE_ALREADY_EXIST: 'institute name is already exits',
  MSG_TPO_USER_RETRIEVED: 'TPO User retrieved successfully',

  // ///////CAMPUS DETALS
  MSG_CAMPUS_DRIVES_INSERTED: 'campus drives added successfully',
  MSG_CAMPUS_DRIVES_RETRIEVED: 'campus drives retrieved successfully',
  ERROR_CAMPUS_DRIVES_DETAILS_IS_NOT_INSERTED: 'campus drives details is not inserted',
  MSG_CANDIDATE_DETAILS_RETRIEVED: 'candidate details retrieved successfully',
  ERROR_MSG_NO_CANDIDATE_DETAILS_RETRIEVED: 'candidate exam details not inserted',
  ERROR_MSG_NO_SUCH_CAMPUS_DRIVE_FOUND: 'No such campus drive entry found!',
  // ////////////////
  // Email messages
  // ///////////////
  MSG_CANDIDATE_INSERTED: 'Candidate Registered Successfully!',
  CAMPUS_INTIMATION_SUB_INVITATION: 'Campus Drive Intimation',
  CANDIDATE_REGISTRATION_ACKNOWLEDGE: 'Candidate Registration for Campus Drive',
  CANDIDATE_INTIMATION_SUB_INVITATION: 'Registered for the Entrance of SRK’s Campus Drive',
  CAMPUS_INTIMATION_SUB_ENTRANCE_TEST: 'Intimation of Conducting Entrance Test',
  INTIMATION_FOR_CAMPUS_DRIVE: 'Intimation for Campus Drive Interview',

  // ///////////////
  // /TPO
  // ///////////////
  TPO_REGISTRATION_SUCCESS: 'Tpo added successfully',
  MSG_EXAM_DETAILS: 'exam_details',
  MSG_EXAM_LIST: 'exam_list',

  // / //////////////////
  // Campus Drive List
  // / //////////////////

  FIELD_CAMPUS_DRIVE_LIST_ARRAY: 'campus_drive_list',
  FIELD_OTHER_ARRAY: 'other_field',
  SUCCESS_MSG_CAMPUS_DRIVE_DETAILS_UPDATED: 'Campus Drive details successfully updated',
  ERROR_MSG_NO_CAMPUS_DRIVE_DETAILS_UPDATED: 'Campus Drive details not updated',
  FIELD_CANDIDATE_ALREADY_EXIST: 'You are already registered for this campus',
  SUCCESS_MSG_UPDATE_GD_PROPOSED_DATES: 'Successfully updated Gd proposed Dates',
  MSG_PROPOSED_DATES_NOT_VALID: 'The dates are not valid',
  MSG_PROPOSED_DATES_EMPTY: 'The dates cannot be empty',
  SUCCESS_MSG_GET_CAMPUS_DRIVE_DETAILS: 'Successfully retrieved Campus Drive Details',
  SUCCESS_MSG_GET_GD_DATES_FOR_PI: 'Successfully retrieved gd Dates for PI Assessment',
  MSG_INSTITITE_ID_DESIGNATION_DATA_NOT_VALID: 'Institute id or Designation not valid',
  MSG_INSTITITE_ID_DESIGNATION_DATA_CANNOT_BE_EMPTY: 'Institute id or Designation cannot be empty',

  // /////////////
  // GET CAMPUS CANDIDATE  DETAILS
  // ////////////
  SUCCESS_MSG_USER_DETAILS_RETRIVED: 'User details retrieved successfully',
  ERROR_MSG_NO_CANDIDATE_SOURCE_DETAILS_NOT_RETRIEVED: 'Candidate source detail not found',
  SUCCESS_MSG_USER_DETAILS_NOT_FOUND: 'Candidate details not found',
  SUCCESS_MAIL_SEND_TO_TPO_SUCCESFULLY: 'Mail sent successfully ',
  TITLE_MSG_FOR_ENTRANCE_TEST: ' Intimation of registered Students for the Entrance Test ',
  ERROR_MSG_CANDIDATE_DETAILS_NOT_FOUND: 'Candidate Details not found',
  ERROR_MSG_NO_CANDIDATE_DETAILS_UPDATED: 'There was some problem in updating the reason for not giving the exam for candidate details',
  SUCCESS_MSG_UPDATE_CANDIDATE_DETAILS: 'Reason for not giving the exam for candidate successfully updated',
  // /////////////////////////
  // //CANDIDATE EXAM DETAILS
  // ////////////////////////
  SUCCESS_MSG_CANDIDATE_EXAM_INSERTED: 'Candidate exam details inserted successfully',
  RESPONSE_CANDIDATE_EXAM_DETAIL: 'Candidate exam details',
  ERROR_MSG_NO_CANIDATE_EXAM_DETAILS_INSERTED: 'Candidate exam details not inserted',
  SUCCESS_MSG_UPDATE_DATA: 'Data updated successfully',
  ERROR_MSG_UPDATE_DATA: 'Error while updating data',
  ERROR_MSG_ASYNC_LOOP: 'Error while performing operation in loop',
  SUCCESS_MSG_GET_EXAM_DETAIL: 'Candidate exam details fetched successfully',
  PLACEMENT_OFFER_MAIL_SUB: 'Placement Offer-SRK',
  CODE_BAD_REQUEST_FOR_BYTESTREAM: '400_2',
  PLACEMENT_SUMMARY_OF_THE_ASSESSMENT_SUB: 'Summary of the Assessment',
  INTIMATION_FOR_SELECTED_CANDIDATE_WITH_JOINING_INSTRUCTIONS_SUB: 'Intimation for the Selected Candidates/Candidate with Joining Instructions',
  FEEDBACK_PERTAINING_TO_OFFER_LETTER_SUB: 'Feedback Pertaining to Offer Letter',
  LEARNING_INTIMATION_SUB: 'Learning Intimation',
  // ///////////////
  // User detail
  // ////////////
  UPDATE_USER_DETAIL: 'Successfully updated user detail',

  MSG_REASON_PARAM_NOT_CORRECT: 'Reason param not correct',
  MSG_YOU_HAVE_ENTERED_INVALID_REASON: 'Please enter a correct reason param',
  MSG_REASON_NOT_CORRECT: 'Reason cannot be empty',
  MSG_YOU_HAVE_NOT_ENTERED_ANY_REASON: 'Please enter a reason',

  RESPONSE_EMAIL_SENT: 'Email sent successfully',

  // //////////////////////////////
  // / GD SCORE DETAILS COLLECTION
  // /////////////////////////////
  SUCCESS_MSG_GET_GD_SCORE_DETAILS: 'Successfully received the data',
  TITLE_MSG_FOR_SECOND_ROUND: ' Name of Selected Students for 2nd Round',
  SUCCESS_MSG_GD_SCORE_DETAILS_INTERESTED: 'Candidate Gd score details inserted successfully',
  MSG_CANDIDATE_LIST_NOT_FOUND: 'No Data Found ',
  MSG_CANDIDATE_LIST_RETRIVED: 'candidate list retrived successfully',
  RESPONSE_EMAIL_SENT: 'Email sent successfully',

  // //////////////////////////////
  // / GD SCORE DETAILS COLLECTION
  // /////////////////////////////
  SUCCESS_MSG_GET_GD_SCORE_DETAILS: 'Successfully received the data',
  SUCCESS_MSG_GD_SCORE_DETAILS_UPDATED: 'Candidate Gd score details updated successfully',
  MSG_CANDIDATE_LIST_NOT_FOUND: 'No Data Found ',
  MSG_CANDIDATE_LIST_RETRIVED: 'candidate list retrived successfully',
  MSG_GROUP_DETAILS_NOT_FOUND: 'No Details Found',
  MSG_GROUP_DETAILS_ID_CANNOT_BE_EMPTY: 'Group Details Ids Cannot Be Empty',
  MSG_GROUP_DETAILS_INVALID: 'Group Details is not valid',

  // /////////////////////////
  // // GD GROUP DETAILS
  // ////////////////////////
  SUCCESS_MSG_DATA_INSERTED_SUCESSFULLY: 'GD group details inserted',
  NO_INSTITUE_FOUND_FOR_GD: 'No institue found for GD process',
  MSG_CANDIDATE_LIST_UPDATED: 'candidate list Updated successfully',
  MSG_GD_DETAILS_FETCHED: 'GD Details fetched successfully',
  MSG_GD_PI_STATUS_UPDATED:'Successfully updated' ,
  MSG_GD_PI_STATUS_NOT_UPDATED:'status not updated successfully',

  // ///////////////////
  // /USER ROLE DETAILS
  // //////////////////
  MSG_ROLE_DETAILS_INVALID: 'Role details not valid',
  MSG_ROLE_DETAILS_EMPTY: 'Role details cannot be empty',
  MSG_INVALID_USER_ID: 'Invalid User Code',
  MSG_NO_USER_FOUND: 'No User Found',
  ////////////////////////////
  ///ASSESSMENT PARAM Details
  ///////////////////////////
  MSG_ASSESSMENT_DETAILS: 'Assessment Param Details',

  // ////////////////
  // GET LOCATION FOR GD AND PI
  // ////////////
  SUCCESS_LOCATION_FETCHED: 'Location retrived successfully',
  NO_LOCATION_FOUND_FOR_GD: 'No location found for GD',
  SUCCESS_LIST_OF_GD_UNIVERSITY_AND_GROUP_FETCHED: 'Successfully fetched all group details',
  NO_GD_GROUPS_FOUND: 'No GD group detail found',
  ERROR_MSG_FOR_BAD_REQUEST: 'Please Provide the Proper Stage Name',
  NO_LOCATION_FOUND: 'No Location Found',
  NO_DATA_FOUND_FOR_PARTICULAR_LOCATION: 'No Data Found',
  // //////////////////////////
  // /PI Assessment Details
  // /////////////////////////
  NO_INSTITUE_FOUND_FOR_PI: 'No institue found for PI process',
  SUCCESS_MSG_PI_ASSESSMENT_DETAILS_UPDATED: 'Successfully updated candidate PI details',

  SUCCESS_MSG_DATA_RETRIEVED: 'Data successfully retrieved',
  SUCCESS_MSG_UPDATE_PI_STATUS: 'Successfully updated candidate PI status',
  ERROR_MSG_UPDATE_CANDIDATE_ID: 'Error while updating status for candidate Id',
  MSG_INVALID_USER_ID:'No such user_code',
  SUCCESS_MSG_CAMPUS_YEAR_RETRIEVED : 'Successfully retreived campus years',
  NO_CAMPUS_YEAR_FOUND:'No campus year found',
  LOOKUP_DATA_INSERTED_SUCEESFULLY:"data successfully inserted",
  NO_GROUP_NAME_FOUND: 'No group name found',
  GROUP_NAME_EXISTS: 'Group name exists',
  MSG_CANDIDATE_REMOVED_SUCCESSFULLY: 'Candidate deleted successfully',
  ERROR_MSG_FOR_REMOVING_CANDIDATE: 'Candidate not removed from Gd',
  SUCCESS_MSG_CANDIDATE_INSERTED_SUCESSFULLY: 'Candidate in GD inserted Successfully',
  ERROR_MSG_FOR_REMOVING_CANDIDATE_FROM_PI: 'Candidate not removed from Pi',
  FIELD_INTIMATION_TO_VERIFY_OFFER_LETTER_SUB:'Intimation to verify offer letter',
  JOINING_DETAILS_NOT_FOUND : 'Joining Details Not Found',
  JOINING_DETAILS_FETCHED:'Joining Details Fetched Successfully',
  PERSON_DETAILS_NOT_FOUND :'person details not found',
  PERSON_DETAILS_FETCHED:'person details fetched',
  PERSON_ID_NOT_FOUND:'person id not found',
  MSG_BIO_DATA_INSERTED_SUCCESSFULLY:'Bio Data Details inserted successfully',
  NO_BIO_DATA_DETAILS_NOT_FOUND: 'No Bio Data Details found',
  BIO_DATA_DETAILS_FOUND:'Bio Data Details found',
  LOOKUP_DETAIL_FOUND: 'Lookup Details Found',
  LOOKUP_DETAILS_NOT_FOUND: 'Lookup Details Not Found',
  BIO_DATA_UPDATED_SUCCESSFULLY: 'Bio Data Details Updated Successfully',
  MSG_CANDIDATE_DETAILS_NOT_FOUND:'Candidate details not found'
}
