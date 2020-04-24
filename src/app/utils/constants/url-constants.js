module.exports = {

  PARAM_ENV: 'env',
  PARAM_ORG_NAME: 'orgname',
  PARAM_DOMAIN_NAME: 'domain_name',
  PARAM_IS_RESOURCE: 'is_resource',
  PARAM_USER_CODE: 'user_code',
  PARAM_ID: 'user_code',
  PARAM_ACCESS_TOKEN: 'token',
  PARAM_ENC: 'enc',
  PARAM_ON: 'on',
  PARAM_DN: 'dn',
  PARAM_IS_RESET_PWD: 'is_reset_pwd',
  // / //////////////////////////////
  PARAM_URL: 'url',
  PARAM_PROTOCOLS: 'protocols',
  PARAM_REQUIRE_PROTOCOL: 'require_protocol',
  PARAM_PROTOCOL: 'protocol',
  PARAM_HOST: 'host',
  PARAM_PORT: 'port',
  PARAM_KEY_LENGTH: 'key_length',

  // //////////////////////////////////////////////////////
  // URL constants
  // //////////////////////////////////////////////////////
  PARAM_STATUS: 'status',
  PARAM_ERROR_STATUS: 'error_status',
  PARAM_DATA: 'data',

  // ////////////////////////////////////
  // create-exam
  // /////////////////////////////////////
  URL_POST_INSERT_EXAM_TEMPLATE: '/hirest/v1/designExamTemplate',
  URL_GET_EXAM_TEMPLATE_LIST: '/hirest/v1/getExamTemplateList',
  URL_POST_DELETE_EXAM_DETAILS: '/hirest/v1/update/exam/data/:id',
  URL_POST_EDIT_EXAM_DETAILS: '/hirest/v1/edit/design/exam',
  // //////////////////////////////////
  // ADMIN FLOW
  // /////////////////////////////////
  URL_GET_INSTITUTE_DETAILS: '/hirest/v1/getInstituteDetails',
  URL_POST_UPDATE_INSTITUTE_DETAILS: '/hirest/v1/updateInstituteDetails/:institute_id',
  URL_POST_UPDATE_CAMPUS_DRIVE_DETAILS: '/hirest/v1/updateCampusDriveDetails/:campus_drive_id',
  URL_GET_CAMPUS_CANDIDATE_SEND_MAIL_DETAILS: '/hirest/v1/getCampusCandidateDetailsSendMail',
  URL_GET_CAMPUS_CANDIDATE_DETAILS: '/hirest/v1/getCampusCandidateDetails/:campus_drive_id',
  URL_UPDATE_SINGUP_CANDIDATE_URL: '/hirest/v1/updateSignupCandidateUrl',
  URL_SEND_JOINING_INSTRUCTION_MAIL_TO_TPO: '/hirest/v1/sendJoiningInstructionMail',
  // //////////////////////////////////
  // CANDIDATE FLOW
  // /////////////////////////////////
  URL_CANDIDATE_REGISTRATION: '/hirest/v1/candidateregistration',
  URL_VERIFY_RESOURCE_ACTIVATION_CODE: '/auth/v2/verify/:activation_code/:orgname',
  URL_VERIFY_ACTIVATION_CODE: '/auth/v1/verify/:activation_code/:orgname',
  URL_VERIFY_UNIQUE_EMAIL: '/auth/v1/check_email',
  URL_FORGOT_PASSWORD: '/auth/v1/forgot_password',
  URL_RESET_PASSWORD: '/auth/v1/reset_password',
  URL_RESEND_EMAIL: '/auth/v1/resend_email',
  URL_LDAP_LOGIN: '/auth/v1/ldap-login',
  URL_UTILITY_LDAP_SEARCH_USER: '/auth/v1/ldap/search/user',
  URL_UTILITY_LDAP_DELETE_USER: '/auth/v1/ldap/remove/user',
  URL_UTILITY_LDAP_SEARCH_DIT: '/auth/v1/ldap/search/dit',
  URL_UTILITY_LDAP_DELETE_ALL_USERS: '/auth/v1/ldap/remove/all/users',
  URL_UTILITY_LDAP_DELETE_ORG: '/auth/v1/ldap/remove/org',
  URL_UTILITY_LDAP_ADD_ORG: '/auth/v1/ldap/add/org',
  URL_UTILITY_LDAP_ADD_USER: '/auth/v1/ldap/add/user',
  URL_UTILITY_LDAP_ADD_ATTRIBUTE: '/auth/v1/ldap/add/attribute',
  URL_UTILITY_LDAP_DELETE_MULTIPLE_USERS: '/auth/v1/remove/multiple/users',
  URL_LDAP_ADD_ORG_PAGE: '/auth/v1/addOrgPage',

  // ////////////////////////////
  // Exam DETAILS
  // ///////////////////////////
  URL_GET_EXAM_DETAILS_DATA: '/hirest/v1/particularexamdetails/:exam_id/:candidate_exam_details_id',
  URL_SHORT_URL: '/auth/v1/shorturl',
  URL_LONG_URL: '/auth/v1/l/:code',
  URL_LONG_URL_S: '/s/:survey_id',
  URL_L: '/auth/v1/l',
  URL_S: '/s',
  URL_INVITE: '/auth/v1/i',
  URL_RESOURCE_LOGIN: '/auth/v1/login/resources',
  PAGE_PASS_RESET: 'steerhigh/html/Forgotpassword/passwordreset.html?ac=',
  URL_TEST_CRASH: '/test/v1/crash',
  URL_TEST_CHECK_SERVICE_STATUS: '/test/v1/check/service/status',
  URL_TEST_SERVICE: 'test/service',
  GET_CAMPUS_DRIVE_LIST: '/hirest/v1/getCampusDriveList',
  UPDATE_CAMPUS_DRIVE_LIST_STATUS: '/hirest/v1/updateCampusDriveListStatus/:id',

  // //////////////////////////////////
  // EXAM-SCORE-CALCULATION
  // /////////////////////////////////
  URL_POST_RECIPIENT_SURVEY_URL: '/hirest/v1/recipientSurveyUrl',
  URL_GET_EXAM_REPORT_DETAILS: '/hirest/v1/exam/report/details',
  URL_POST_EXAM_REPORT_DETAILS: '/hirest/v1/add/exam/report/details',
  URL_GET_SCORE_STATISTICS: '/hirest/v1/scorestatistics',
  URL_POST_SEND_EXAM_REPORT: '/hirest/v1/sendExamReport',

  // ///////////TPO URL///////////
  URL_POST_ADD_TPO_REGISTER_DETAILS: '/hirest/v1/addTpoRegisterDetails',
  URL_POST_ADD_CAMPUS_DRIVES_DETAILS: '/hirest/v1/addCampusDrivesDetails',
  URL_GET_CAMPUS_DRIVE_DETAILS_DETAILS: '/hirest/v1/getCampusDetails/:user_code',
  URL_GET_CANDIDATE_DETAILS_DETAILS: '/hirest/v1/getCandidateDetails',
  URL_GET_TPO_USER_DETAILS_DETAILS: '/hirest/v1/getTPODetails/:user_code',
  URL_UPDATE_TPO_DETAILS: '/hirest/v1/update/tpo/details/:institute_id/:user_id',
  URL_UPDATE_CAMPUS_DRIVE_DETAILS: '/hirest/v1/update/campus/drive/data/:id',
  // /////////////////////
  // // Exam list Details
  // ////////////////////
  URL_GET_EXAM_LIST_DATA: '/hirest/v1/getExamListData/:user_id',
  URL_UPDATE_EXAM_STATUS: '/hirest/v1/exam/status',
  // /////////////////////////
  // LOOKUP-DETAILS
  // /////////////////////////
  URL_GET_ATTRIBUTE_DETAILS: '/hirest/v1/attribute/details',
  URL_GET_PARENT_ATTRIBUTE_DETAILS: '/hirest/v1/parent/attribute/details',
  URL_GET_INSTITUTE_LIST_FROM_DESIGNATION: '/hirest/v1/institute/list',
  URL_POST_INSERT_LOOKUP_DETAILS: '/hirest/v1/addLookupData',
  URL_GET_DELETE_LOOKUP_DETAILS: '/hirest/v1/inactive/lookup/data/:id',
  URL_POST_UPDATE_LOOKUP_DETAILS: '/hirest/v1/update/lookup/data/:id',
  URL_CHECK_LOOKUP_DETAILS_EXISTENCE:'/hirest/v1/check/existence/lookup/details',

  // /////////////////////////
  // CANDIDATE EXAM DETAILS
  // /////////////////////////
  URL_POST_UPDATE_EXAM_STATUS: '/hirest/v1/candidateExamStatus/:campus_drive_id',
  URL_POST_CHANGE_EXAM_STATUS: '/hirest/v1/updateCandidateExamStatus/:campus_drive_id',
  URL_GET_LIST_URL_IDS: '/hirest/v1/exam/url/list',
  URL_POST_CANDIDATE_EXAM_DETAILS: '/hirest/v1/campus/exam/details',
  URL_UPDATE_CANDIDATE_EXAM_STATUS: '/hirest/v1/campus/exam/status',

  // /////////////////////
  // UPDATE USER PROFILE
  // ////////////////////
  URL_UPDATE_PROFILE: '/hirest/v1/update/admin/profile/:user_code',

  // //////////////////////////////
  // CANDIDATE INFO UPDATE BY TPO
  // /////////////////////////////
  URL_POST_REASON_FOR_UNAVAIBILITY_OF_CANDIDATE_DETAILS: '/hirest/v1/addReasonForUnavability/:person_id',

  // ///////////////////////////////
  // // GD SCORE DETAILS COLLECTION
  // //////////////////////////////
  URL_GET_GD_SCORE_DETAILS: '/hirest/v1/getGdScoreDetails',
  URL_POST_UPDATE_GD_SCORE_DETAILS: '/hirest/v1/update/candidate/gd/details',
  URL_GET_CANDIDATE_LIST_FOR_GD: '/hirest/v1/getCandidateListForGd',
  URL_POST_GD_SCORE_DETAILS: '/hirest/v1/getScoreDetailsForGroupIds',
  URL_GET_CANDIDATE_LIST_OF_ASSESSOR: '/hirest/v1/candidatelist/:gd_group_details_id/assessor/:assessor_id',
  URL_POST_SEND_GD_REPORT_MAIL: '/hirest/v1/sendGdReportMail',

  // //////////////////////////////
  // GROUP DISCUSSION DETAILS
  // /////////////////////////////
  URL_POST_INSERT_GD_GROUP_DETAILS: '/hirest/v1/addGdGroup',
  URL_GET_INSTITUTE_LIST_FROM_DESIGNATION_WITHOUT_GD: '/hirest/v1/gd/institute/list',
  URL_POST_CANDIDATE_LIST_FOR_GD: '/hirest/v1/getCandidateListForGdPI',
  URL_POST_UPDATE_GD_GROUP_DETAILS: '/hirest/v1/updateGdGroup',
  URL_GET_PARTICULAR_LOCATION_LIST: '/hirest/v1/getLocationList/:stage',
  URL_GET_PARTICULAR_LOCATION_DETAILS: '/hirest/v1/university/detail',
  URL_POST_CHANAGE_STAGE_FOR_CANDIDATE: '/hirest/v1/changeStageForCandidate',
  URL_GET_CAMPUS_YEAR: '/hirest/v1/getCampusYear',
  URL_GET_DEFAULT_CAMPUS_YEARS: '/hirest/v1/getDefaultCampusYears',

  // ////////////////////////////
  // Shortlist Campus Drive details
  // ///////////////////////////
  URL_GET_SHORTLISTED_CAMPUS_DRIVES_DETAILS: '/hirest/v1/shortlistedCampusDriveList/:stage_id',

  URL_POST_CANDIDATE_LIST_FOR_ASSESSOR: '/hirest/v1/getCandidateListForAssessor',

  // ////////////////////////////
  // // USER ROLE DETAILS
  // ///////////////////////////
  URL_POST_USER_ROLE_DETAILS: '/hirest/v1/getUserRoleDetails',

  // //////////////////////////////
  // ////Assessment Param Details
  // //////////////////////////////
  URL_GET_ASSESSMENT_DETAILS: '/hirest/v1/getAssessmentDetails/:assessment_category',

  // /////////////////////////////
  // ///// UPDATE GD DATES
  // ////////////////////////////
  URL_UPDATE_GD_PROPOSED_DATE: '/hirest/v1/updateGdProposedDate/:campus_drive_id',
  URL_POST_GET_CAMPUS_DRIVE_DETAILS: '/hirest/v1/getCampusDriveDetailsForGdDates',

  // /////////////////////////////
  // ///// PI ASSESSMENT
  // ////////////////////////////
  URL_POST_UPDATE_PI_ASSESSMENT_DETAILS: '/hirest/v1/update/candidate/pi/details',
  URL_POST_INSERT_PI_DETAILS: '/hirest/v1/addPIDetails',
  URL_POST_CANDIDATE_LIST_FOR_PI: '/hirest/v1/candidateListPI',

  // ////////////////////////////////////////////
  // / GET LOCATION BASED ON CANDIATE stage_id
  // ///////////////////////////////////////////
  URL_GET_LOCATION_CANDIDATE_STAGE: '/hirest/v1/getLocationListOnCandidateStage',
  URL_POST_UPDATE_PI_ASSESSMENT_STATUS: '/hirest/v1/updateCandidatePiStatus',

  URL_POST_FINAL_CANDIDATE_DETAILS: '/hirest/v1/getFinalCandidateList',

  // ////////////////////////////////////////////
  // / CANDIDATE DETAILS
  // ///////////////////////////////////////////
  URL_GET_CANDIDATES_FROM_CAMPUS_ID: '/hirest/v1/candidate/campus/:campus_drive_id',
  URL_GET_PERSON_DETAIL_FROM_CANDIDATE_ID: '/hirest/v1/person/detail/:candidate_id',
  URL_POST_ADD_CANDIDATE_ASSESSMENT: '/hirest/v1/add/candidate/assessment',
  URL_GET_ASSESSMENT_CANDIDATE_DETAILS: '/hirest/v1/candidate/assessment',
  URL_POST_UPDATE_CANDIDATE_DETAILS: '/update/candidate/details',
  URL_POST_EDIT_ASSESSMENT_CANDIDATE_DETAILS: '/hirest/v1/edit/candidate/assessment',
  URL_POST_DELETE_ASSESSMENT_CANDIDATE_DETAILS: '/hirest/v1/delete/candidate/assessment/:candidate_history_id',
  // ////////////////////////////////////////////
  // GET SELECTED GD DATE
  // ///////////////////////////////////////////
  URL_GET_SELECTED_GD_DATE_FOR_PI: '/hirest/v1/getSelectedGdDateforPI',

  /////////////////////////////
  /////// ASSESSOR DETAILS
  ////////////////////////////
  URL_GET_ASSESSOR_DETAILS: '/hirest/v1/assessor/profile/detail/:user_code',
  URL_POST_GET_CAMPUS_DETAILS: '/hirest/v1/getUniversityDetailsFromCampusYear',
  URL_POST_UPDATE_PI_CANDIDATE_DETAILS: '/hirest/v1/updateCandidatePiStatusAbsents',

  ///////////////////
  // OFF CAMPUS
  ///////////////////
  URL_UPDATE_CANDIDATE_STAGE_GD_PI_STATUS: '/hirest/v1/candidateGdPiStageUpdate/:stage',
  URL_POST_GROUP_ASSIGNED_NAME: '/hirest/v1/getGroupDate',
  URL_POST_GROUP_NAME: '/hirest/v1/findGroupName',
  URL_POST_GET_GROUPNAME_FROM_DATE_AND_DESIGNATION: '/hirest/v1/getGroupNameFromDateAndDesignation',
  URL_POST_ADD_GD_CANDIDATE: '/hirest/v1/addGdCandidate',
  ////////////////////
  // SWITCH CANDIDATE FROM GD_TO_PI OR PI_TO_GD
  ///////////////////
  URL_POST_SWITCH_CANDIDATES: '/hirest/v1/switchCandidate',
  URL_POST_UNIVERSAL_CANDIDATE_LIST: '/hirest/v1/getUniversalCandidateList',
  URL_POST_GET_CUSTOM_GD_PI_INSTITUTE_LIST: '/hirest/v1/getGdPIInstituteList',
  URL_POST_ADD_PI_CANDIDATE: '/hirest/v1/addPiCandidate',
  URL_PUBLISH_OFFER_LETTER: '/hirest/v1/publishOfferLetter',
  URL_GET_FINALIZED_CANDIDATE_DETAILS: '/hirest/v1/getFinalizeCandidate',
  URL_POST_SEND_EMAIL_TO_ADMIN_FOR_HIRE_CANDIDATE: '/hirest/v1/sendEmailtoAdminForHireCandidateList',

  /////////////////////
  //Candidate Joining Details
  //////////////////////
  URL_GET_CANDIDATE_JOINING_DETAILS: '/hirest/v1/candidateJoinningDetails/:user_code',
  URL_GET_PERSON_DETAILS: '/hirest/v1/getPersonDetails/:user_code',

  //////////////////////
  // BIO DATA CANDIDATE REGISTER
  /////////////////////
  URL_POST_CANDIDATE_BIO_DATA_REGISTER: '/hirest/v1/bioDataforCandidate',
  URL_GET_BIO_DETAILS: '/hirest/v1/getBioDataDetails/:user_code',
  URL_GET_PARENT_CHILD_ATTRIBUTE_DETAILS: '/hirest/v1/getParentAttributeDetails',
  URL_UPDATE_BIO_DATA_FORM: '/hirest/v1/update/biodata',
  URL_CANDIATE_REGISTRATION_DEACTIVATE_LINK: '/hirest/v1/candidate/register/link/close/:campus_drive_id',
  METHOD_POST: 'POST'
}
