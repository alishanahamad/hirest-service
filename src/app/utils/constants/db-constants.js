module.exports = {
  FIELD_JSON: '_json',
  FIELD_DATA: 'data',
  FIELD_CONSULTANCY_USER_EMAIL: 'email',
  // / ////////////////////////

  // ///////////////////////
  // COMMONS
  // //////////////////////
  COMMON_CREATED_BY: 'created_by',
  COMMON_UPDATED_BY: 'updated_by',
  COMMON_CREATED_ON: 'created_on',
  COMMON_UPDATED_ON: 'updated_on',
  PARAM_ATTACHMENTS: 'attachments',
  COMMON_IS_DELETED: 'is_deleted',
  VALUE_DEFAULT_IS_DELETED: 'false',
  FIELD__ID: '_id',
  COLLECTION_SEQUENCE_DETAIL: 'sequence_detail',
  FIELD_TOKEN: 'token',
  COMMON_VERSION_1_0_0: '1.0.0',
  COMMON_VERSION_1_1_0: '1.1.0',
  FIELD_SISTER_DETAILS: 'sister_details#',
  FIELD_UNCLE_DETAILS: 'uncle_details#',
  FIELD_ADDITIONAL_ATTRIBUTES: 'additional_attributes#',
  FIELD_RELATIVE_DETAILS: 'relative_details#',
  FIELD_CHILDREN_DETAILS: 'children_details#',
  HOBBIES: 'hobbies#',
  FIELD_BROTHER_DETAILS: 'brother_details#',
  FIELD_PREFFERED_LOCATION: 'prefered_location#',
  FIELD_MALE: 'Male',
  FIELD_FEMALE: 'Female',
  ENUM_MALE: 0,
  ENUM_FEMALE: 1,
  FIELD_ABBREVIATION: 'abbreviation',
  // ///////////////////////
  // PARAMS
  // //////////////////////
  PARAM_ERROR: 'error',
  PARAM_STATUS: 'status',
  PARAM_ERRORS: 'errors',
  PARAM_TIMEOUT: 'timeout',
  // ////////////////////
  // USER ROLE DETAILS
  // ////////////////////
  COLLECTION_USER_ROLE_DETAILS: 'user_role_details',
  FIELD_OBJECT_TYPE: 'objectType',
  FIELD_ENTITY_DETAILS: 'entity_details',
  FIELD_ROLE_NAME: 'role_name',
  FIELD_USER_ROLE_DETAILS_ID: 'user_role_details_id',
  FIELD_CANDIDATE_ROLE_NAME: 3,
  FIELD_ENTITY_DETAILS_ID: 'id',
  FIELD_ENTITY_DETAILS_TYPE: 'type',
  // ///////////////
  // VALUES OF RBAC
  // //////////////
  VALUE_APP_USER: 'APP_USER',
  VALUE_ACCOUNT_ADMIN: 'ACCOUNT_ADMIN',
  VALUE_CONSULTANT_USER: 'CONSULTANT_USER',
  VALUE_APPLICATION_ADMIN: 'SYSTEM_ADMIN',
  VALUE_ANONYMOUS_USER: 'ANONYMOUS_USER',
  VALUE_TPO_USER: 'TPO_USER',
  VALUE_CANDIDATE_USER: 'CANDIDATE_USER',
  VALUE_ASSESSOR_USER: 'ASSESSOR_USER',
  // ///////////////
  // RBAC USER ENUMs
  // //////////////
  ENUM_APP_USER: 0,
  ENUM_ACCOUNT_ADMIN: 1,
  ENUM_CONSULTANT_USER: 2,
  ENUM_APPLICATION_ADMIN: 3,
  ENUM_ANONYMOUS_USER: 4,
  ENUM_ACTIVE: 1,
  ENUM_TPO_USER: 2,
  ENUM_CANDIDATE_USER: 3,
  ENUM_ASSESSOR_USER: 4,

  /////////////////////////////
  /// history candidate
  ////////////////////////////////
  COLLECTION_CANDIDATE_HISTORY_DETAILS: 'candidate_history_details',
  FIELD_ASSESSMENT: 'assessment',
  FIELD_ROUND: 'round',
  FIELD_PROCESS_TYPE: 'process_type',
  FIELD_HEAD_ROLE: 'head_role',
  // ///////////////////////////////////////////
  // rbac_rule_details
  // ///////////////////////////////////////////
  COLLECTION_RBAC_RULE_DETAILS: 'rbac_rule_details',

  // ///////////////////////////////////////////
  // survey_elements_details
  // ///////////////////////////////////////////
  COLLECTION_SURVEY_RESPONSES_DETAILS: 'survey_responses_details',
  FIELD_SURVEY_RESPONSES_DETAILS_ID: 'survey_responses_details_id',
  FIELD_COMPLETED_PAGE_NO: 'completed_page_number',
  FIELD_RESPONSE_ADDITIONAL_DETAILS: 'response_additional_details',
  FIELD_PROGRESS_STATUS: 'progress_status',
  FIELD_SURVEY_RESPONSES_JSON: 'survey_responses_json',
  FIELD_ATTRIBUTE_NAME: 'attribute_name',
  FIELD_ATTRIBUTE_VALUE: 'attribute_value',
  FEILD_COMPANY_DETAILS: 'company_master',

  // ///////////////////////////////////////////
  // SURVEY COLLECTION
  // ///////////////////////////////////////////
  COLLECTION_SURVEY_DETAILS: 'survey_details',
  FIELD_SURVEY_ID: 'survey_id',
  FIELD_TITLE: 'title',
  FIELD_SURVEY_MODE: 'survey_publish_mode',
  FIELD_TYPE: 'type',
  FIELD_EFFECTIVE_DATE_FROM: 'effective_date_from',
  FIELD_EFFECTIVE_DATE_TO: 'effective_date_to',
  FIELD_LIGHTBLUE_DATE_FORMAT: 'yyyy-mm-dd\'T\'HH:MM:ss.lo',
  FIELD_START_TIME: 'start_time',
  FIELD_END_TIME: 'end_time',
  FIELD_TARGET_ENTITY_ID: 'target_entity_id',
  FIELD_SURVEY_STATUS: 'survey_status',
  FIELD_SELECTED_OPTIONS: 'selected_options',
  FIELD_SURVEY_URL: 'survey_url',
  FIELD_SURVEY_GROUP_ID: 'survey_group_id',

  // ////////////////////////
  // role details
  // ///////////////////////
  COLLECTION_ROLE_DETAILS: 'role_details',
  FIELD_ROLE_IDENTIFIER: 'role_identifier',
  FIELD_IS_DEFAULT: 'is_default',

  // ////////////////////////
  // Institute details
  // ///////////////////////
  COLLECTION_INSTITUTE_DETAILS: 'institute_details',
  FIELD_INSTITUTE_ID: 'institute_id',
  FIELD_INSTITUTE_STATUS: 'status',
  FIELD_INSTITUTE_DETAILS_NAME: 'name',

  // ///////////encryption-decryption////
  COLLECTION_APP_ENCRYPTION_DETAILS: 'app_encryption_details',
  FIELD_ENTITY_FIELD_NAME: 'entity_field_name',
  FIELD_ENTITY_NAME: 'entity_name',
  FIELD_ENTITY_UNIQUE_ID: 'entity_unique_id',
  FIELD_ADMIN: 'admin',
  FIELD_KEY_ID: 'key_id',
  FIELD_CRYPTO_ALGO: 'field_crypto_algo',
  // ////////////////////////
  // campus_source_details
  // ///////////////////////
  COLLECTION_CAMPUS_SOURCE_DETAILS: 'candidate_source_details',
  CAMPUS_SOURCE_DETAILS_ID: 'id',
  BATCH_SIZE: 'batch_size',
  CAMPUS_SOURCE_DETAILS_SOURCE_TYPE: 'source_type',
  CAMPUS_SOURCE_DETAILS_CAMPUS_ID: 'campus_drive_id',
  CAMPUS_SOURCE_DETAILS_WEB_URL: 'web_url',
  CAMPUS_SOURCE_DETAILS_STAFFING_REF_ID: 'staffing_ref_id',
  // ////////////////////////
  // campus_drive_details
  // ///////////////////////
  CAMPUS_DRIVE_DETAILS_ID: 'id',
  CAMPUS_DRIVE_DETAILS_INSTITUTE_ID: 'institute_id',
  CAMPUS_DRIVE_DETAILS_INVITE_YEAR: 'campus_invite_year',
  CAMPUS_DRIVE_DETAILS_START_DATE: 'campus_start_date',
  CAMPUS_DRIVE_DETAILS_SIGNUP_URL: 'candidate_signup_url',
  CAMPUS_DRIVE_DETAILS_COURSE: 'course',
  CAMPUS_DRIVE_DETAILS_STREAM: 'stream',
  CAMPUS_DRIVE_DETAILS_STATUS: 'status',
  // ///////////////////////////////////////////
  // global_json
  // ///////////////////////////////////////////
  COLLECTION_JSON_USER_ID: 'user_id',
  COLLECTION_JSON_PERSON_ID: 'person_id',
  COLLECTION_JSON_CANDIDATE_SOURCE_ID: 'candidate_source_id',
  COLLECTION_JSON_COURSE: 'course',
  COLLECTION_JSON_STREAM: 'stream',
  COLLECTION_JSON_STATUS: 'status',
  COLLECTION_JSON_STAGE: 'stage',
  FIELD_ROUND_TYPE: 'round_type',
  VALUE_ROUND_TYPE_ON_CAMPUS: 'ON_CAMPUS',
  VALUE_ROUND_TYPE_ON_SITE: 'ON_SITE',
  ENUM_ROUND_TYPE_ON_CAMPUS: 0,
  ENUM_ROUND_TYPE_ON_SITE: 1,
  // ///////////////////////////////////////////
  // user_details
  // ///////////////////////////////////////////
  COLLECTION_USER_DETAILS: 'user_details',
  FIELD_USER_ID: 'user_id',
  FIELD_USER_STATUS: 'user_status',

  // / ////////////////////
  // COLLECTION_RESOURCE
  // / ////////////////////
  COLLECTION_RESOURCE: 'resources',
  FIELD_RESOURCE_ID: 'resource_id',
  FIELD_FIRST_NAME: 'first_name',
  FIELD_LAST_NAME: 'last_name',
  FIELD_EMAIL: 'email',
  FIELD_CONTACT_NUMBER: 'contact_number',
  FIELD_AGE_GROUP: 'age_group',
  FIELD_COMPENTENCIES: 'competencies',
  FIELD_EXPERIENCES: 'experiences',
  FIELD_DESIGNATION_ID: 'designation_id',
  FIELD_HIERARCHY_ID: 'hierarchy_id',
  FIELD_ROLE_ID: 'role_id',
  FIELD_PRODUCT_ID: 'product_id',
  FIELD_TEAM_IDS: 'team_ids',
  FIELD_RESOURCE_IDS: 'resource_ids',
  FIELD_EMP_CODE: 'emp_code',
  FIELD_ACTIVATED_BY: 'activated_by',
  FIELD_IS_ACTIVE: 'is_active',
  COLLECTION_ROLE: 'role',
  COLLECTION_HIERARCHY: 'hierarchy',
  COLLECTION_LOCATION: 'location',
  COLLECTION_DESIGNATION: 'designation',
  FIELD_RESOURCE_ROLE_ID: 'role_id',
  FIELD_RESOURCE_HIERARCHY_ID: 'hierarchy_id',
  FIELD_RESOURCE_LOCATION_ID: 'location_id',
  FIELD_RESOURCE_DESIGNATION_ID: 'designation_id',
  FIELD_RESOURCE_HIERARCHY_NAME: 'hierarchy_name',
  FIELD_RESOURCE_LOCATION_NAME: 'location_name',
  FIELD_RESOURCE_LOCATION_CITY: 'location_city',
  FIELD_RESOURCE_ROLE_NAME: 'role_name',
  FIELD_RESOURCE_DESIGNATION_NAME: 'designation_name',
  // /////////////////////////

  COLLECTION_SHORTEN_URL_DETAILS: 'shorten_url_details',
  FIELD_URL_DETAIL_KEY: 'url_key',
  FIELD_URL_DETAIL_VALUE: 'url_value',
  // //////////////////////////////
  FIELD_GD_PINCODE: 'gd_pincode',
  FIELD_PINCODE: 'pincode',
  FIELD_PASSWORD: 'password',
  FIELD_PROFILE: 'profile_data',
  FIELD_PROFILE_DATA: 'profile_data',
  FIELD_NAME: 'name',
  FIELD_USER_NAME: 'name',
  FIELD_USER_EMAIL: 'email',
  FIELD_NICK_NAME: 'nickname',
  FIELD_GIVEN_NAME: 'given_name',
  FIELD_FAMILY_NAME: 'family_name',
  FIELD_GIVENNAME: 'givenName',
  FIELD_FAMILYNAME: 'familyName',
  FIELD_LANGUAGE: 'language',
  FIELD_GENDER: 'gender',
  FIELD_AGERANGE: 'ageRange',
  FIELD_DISPLAYNAME: 'displayName',
  FIELD_PICTURE: 'picture',
  FIELD_PICTURE_LARGE: 'picture_large',
  FIELD_AGE_RANGE: 'age_range',
  FIELD_MIN: 'min',
  FIELD_MAX: 'max',
  FIELD_LOCALE: 'locale',
  FIELD_TIME_ZONE: 'timezone',
  FIELD_EMAIL_VERIFIED: 'email_verified',
  FIELD_USER_PASSWORD: 'userPassword',
  FIELD_CONTACT: 'contact',
  FIELD_CONTACT_NO: 'contact',
  FIELD_IMAGE: 'image',
  FIELD_URL: 'url',
  FIELD_EMAILS: 'emails',
  FIELD_FATHER_NAME: 'father_name',
  FIELD_VALUE: 'value',
  FIELD_LARGESIZE: '400',
  FIELD_BASE64: 'base64',
  FIELD_EMAILID: 'emailId',
  // ///////////////////////////////////////
  FIELD_IDENTITIES: 'identities',
  FIELD_PROVIDER: 'provider',
  FIELD_CONNECTION: 'connection',
  FIELD_IS_SOCIAL: 'isSocial',

  FIELD_USER_CODE: 'user_code',
  FIELD_USER_DATA: 'profile_data',
  COMMON_ADMIN: 'ADMIN',
  FIELD_ID: 'id',
  // ///////////////////////////////////////////
  // candidate_details
  // ///////////////////////////////////////////
  COLLECTION_CANDIDATE_PERSON_DETAILS: 'person_details',
  CANDIDATE_FIELD_FIRST_NAME: 'first_name',
  CANDIDATE_FIELD_MIDDLE_NAME: 'middle_name',
  CANDIDATE_FIELD_LAST_NAME: 'last_name',
  CANDIDATE_FIELD_DOB: 'date_of_birth',
  CANDIDATE_FIELD_GENDER: 'gender',
  CANDIDATE_FIELD_BLOOD_GROUP: 'blood_group',
  CANDIDATE_FIELD_MARITAL_STATUS: 'marital_status',
  CANDIDATE_FIELD_UID_NO: 'uid_number',
  CANDIDATE_FIELD_EMAIL_ADDRESS: 'email_address',
  CANDIDATE_FIELD_ALT_EMAIL_ADDRESS: 'alternate_email_address',
  CANDIDATE_FIELD_MOBILE_NO: 'mobile_number',
  CANDIDATE_FIELD_ALT_MOBILE_NO: 'alternate_mobile_number',
  CANDIDATE_FIELD_PROFILE_IMAGE: 'profile_image',
  CANDIDATE_FIELD_ADDRESS_TYPE: 'address_type',
  CANDIDATE_FIELD_ADDRESS: 'address',
  CANDIDATE_FIELD_CITY: 'city',
  CANDIDATE_FIELD_STATE: 'state',
  CANDIDATE_FIELD_COUNTRY: 'country',
  CANDIDATE_FIELD_ZIPCODE: 'zipcode',
  CANDIDATE_FIELD_QUALIFICATION: 'qualification',
  CANDIDATE_FIELD_QUALIFICATION_COMPLETED_AT: 'qualification_completed_at',
  CANDIDATE_FIELD_QUALIFICATION_AWARDER: 'qualification_awarder',
  CANDIDATE_FIELD_QUALIFICATION_START_YEAR: 'qualification_start_year',
  CANDIDATE_FIELD_PASSING_GRADE: 'passing_grade',
  CANDIDATE_FIELD_PASSING_PERCENTAGE: 'passing_percentage',
  CANDIDATE_FIELD_PASSING_YEAR: 'passing_year',
  CANDIDATE_FIELD_UPDATED_BY: 'updated_by',
  CANDIDATE_FIELD_CREATED_BY: 'created_by',
  CANDIDATE_FIELD_PASSWORD: 'userPassword',
  CANDIDATE_FIELD_CAMPUS_ID: 'campus_id',
  FIELD_CANDIDATE_ID: 'candidate_id',
  FIELD_UNIVERSITY_NAME: 'university',
  FIELD_LANGUAGES: 'languages',
  FIELD_HOBBIES: 'hobbies',
  FIELD_PREFERED_LOCATION: 'prefered_location',
  FIELD_JOB_PROFILE: 'job_profile',
  // ///////////////////////////
  // TPO USER DETAILS
  // //////////////////
  COLLECTION_TPO_DETAILS: 'tpo_user_details',
  FIELD_UNIVERSITYS_NAME: 'university_name',
  FIELD_TPO_USERS: 'tpo_users',
  // ///////////////
  // EXAM DETAILS
  // /////////////
  FIELD_DURING: 'during',
  COLLECTION_EXAM_DETAILS: 'exam_details',
  FIELD_EXAM_ID: 'exam_id',
  EXAM_ID: 'id',
  FIELD_QUESTIONNAIRE_LINK: 'questionnaire_link',
  FIELD_CANDIDATE_SURVEY_LINK: 'candidate_survey_link',
  FIELD_EXAM_QUESTIONNAIRE_LINK: 'exam_questionnaire_link',
  FIELD_TEMPLATE_NAME: 'template_name',
  FIELD_TARGET_DEPARTMENT: 'target_department',
  FIELD_EXAM_TARGET: 'designation',
  // / ////////////////////
  // COLLECTION_ACTIVATION_CODE_DETAILS_UA
  // / ////////////////////
  COLLECTION_ACTIVATION_CODE_DETAILS: 'activation_code_details',
  FIELD_ACTIVATION_CODE: 'activation_code',
  FIELD_AC_EXPIRY_TIME: 'activation_code_expiry_time',
  FIELD_WEIGHTAGE: 'weightage',

  // ///////////////////////
  // for shorten url key
  // ///////////////////////
  FIELD_SHORTEN_URL_KEY: 'shorten_url_key',

  // ////////////////////////
  // EXAM SCORE DETAILS
  // ///////////////////////
  COLLECTION_EXAM_SCORE_DETAILS: 'exam_score_details',
  FIELD_EMAIL_ADDRESS: 'email_address',
  FIELD_INSTITUTE_DETAILS: 'institute_details',
  FILE_ASSESSMENT_REPORT: 'Assessment_Report',
  FIELD_USERNAME: 'userName',
  FIELD_ALTERNATE_EMAIL_ADDRESS: 'alternate_email_address',
  FIELD_MOBILE_NUMBER: 'mobile_number',
  FIELD_ALTERNATE_MOBILE_NUMBER: 'alternate_mobile_number',
  FIELD_INSTITUTE_NAME: 'institute_name',
  FIELD_ASSIGNED_INSTITUTE_ID: 'institute_id',
  FIELD_DESIGNATION: 'designation',
  FIELD_CAMPUS_YEAR: 'campus_year',
  FIELD_COURSE: 'course',
  FIELD_STREAM: 'stream',
  FIELD_CALCULATED_SCORE_DETAILS: 'calculated_score_details',
  FIELD_NO_OF_QUESTIONS: 'number_of_questions',
  ENUM_EXAM_NOT_GIVEN: 0,
  ENUM_EXAM_GIVEN: 1,

  // ////////////////////////
  // SURVEY RECIPIENT DETAILS
  // ///////////////////////
  COLLECTION_SURVEY_RECIPIENT_DETAILS: 'survey_recipient_details',
  FIELD_SURVEY_ACCESS_DETAILS: 'survey_access_details',
  FIELD_SURVEY_DISPATCH_DETAILS: 'survey_dispatch_details',
  FIELD_ADDRESS: 'address',
  FIELD_CHANNEL: 'channel',
  FIELD_RECIPIENT_PERSONAL_DETAILS: 'recipient_personal_details',
  ENUM_PRIVATE: 0,
  FIELD_SURVEY_RECIPIENT_DETAILS_ID: 'survey_recipient_details_id',

  // ////////////////////////
  // CAMPUS DRIVE DETAILS COLLECTION
  // ///////////////////////
  COLLECTION_CAMPUS_DRIVE_DETAILS: 'campus_drive_details',
  FIELD_CAMPUS_INVITE_YEAR: 'campus_invite_year',
  FIELD_CAMPUS_START_DATE: 'campus_start_date',
  FIELD_USER_DETAILS: 'user_details',
  FILED_CAMPUS_PROPOSED_DATE: 'campus_proposed_date',
  FIELD_CANDIDATE_SIGNUP_URL: 'candidate_signup_url',
  FIELD_CAMPUS_STATUS: 'status',
  FIELD_CAMPUS_ID: 'id',
  FIELD_CAMPUS_CANDIDATE_SIGNUP_URL: 'candidate_signup_url',
  FIELD_GD_PROPOSED_DATES: 'gd_proposed_dates',
  FIELD_CAMPUS_DRIVE_DESIGNATION: 'designation',

  // ////////////////////////
  // CANDIDATE SOURCE DETAILS COLLECTION
  // ///////////////////////
  COLLECTION_CANDIDATE_SOURCE_DETAILS: 'candidate_source_details',
  FIELD_CAMPUS_DRIVE_ID: 'campus_drive_id',
  FIELD_SOURCE_TYPE: 'source_type',

  // ///////////////////////////////////////////
  // CANDIDATE DETAILS COLLECTION
  // ///////////////////////////////////////////
  COLLECTION_CANDIDATE_DETAILS: 'candidate_details',
  FIELD_CANDIDATE_SOURCE_ID: 'candidate_source_id',
  FIELD_PERSON_ID: 'person_id',
  FIELD_REASON: 'reason_for_not_appearing',
  FIELD_REFERENCE_NUMBER: 'reference_no',
  FIELD_HEAD_DETAILS: 'head_details',
  FIELD_DATE_OF_JOINING: 'date_of_joining',
  FIELD_UNSIGNED_OFFER_LETTER_URL: 'unsigned_offer_letter_url',
  FIELD_PROBATION_PERIOD: 'probation_period',
  FIELD_OFFICE_LOCATION: 'office_location',
  FIELD_APPOINTED_LOCATION: 'appointed_location',
  FIELD_NAME_CANDIDATE: 'candidate_name',
  FIELD_CTC: 'ctc',
  // ///////////////////////////////////////////
  // PERSON DETAILS COLLECTION
  // ///////////////////////////////////////////
  COLLECTION_PERSON_DETAILS: 'person_details',
  COLLECTION_PERSON_DETAILS_JSON_ID: 'id',
  FIELD_RESUME_FILE: 'resume_file',

  FILED_PERSON_ID: 'person_id',
  // ////////////////////////
  // TPO
  // ///////////////////////

  COLLECTION_TPO_USER_DETAILS: 'tpo_user_details',
  FIELD_WEBSITE_URL: 'website_url',
  FIELD_STATUS: 'status',
  FIELD_STATE: 'state',
  FIELD_CITY: 'city',
  FILED_LAST_NAME: 'last_name',
  FILED_FIRST_NAME: 'first_name',
  FIELD_LANDLINE_NUMBER: 'landline_number',
  FIELD_ZIPCODE: 'zipcode',
  FIELD_COURSES: 'courses',
  FIELD_STREAMS: 'streams',
  FILED_CONTACT_NUMBER: 'contact_number',
  FILED_EMAIL_ADDRESS: 'email_address',
  FILED_ID: 'id',
  COLLECTION_CANDIDATE_DETAILS_ID: 'id',

  COLLECTION_CANDIDATE_EXAM_DETAILS_CANDIDATE_ID: 'candidate_id',
  COLLECTION_CANDIDATE_EXAM_DETAILS: 'candidate_exam_details',
  COLLECTION_CANDIDATE_EXAM_DETAILS_FIELD_EXAM_ID: 'id',
  CANDIDATE_EXAM_DETAILS_STATUS: 'status',
  CANDIDATE_EXAM_STATUS_VALUE_PUBLISHED: 'PUBLISHED',
  CANDIDATE_EXAM_STATUS_VALUE_AVAILABLE: 'AVAILABLE',
  CANDIDATE_EXAM_STATUS_VALUE_IN_PROGRESS: 'IN_PROGRESS',
  CANDIDATE_EXAM_STATUS_VALUE_COMPLETED: 'COMPLETED',
  CANDIDATE_EXAM_STATUS_VALUE_SYSTEM_CLOSED: 'SYSTEM_CLOSED',
  CANDIDATE_EXAM_STATUS_VALUE_CLOSED: 'CLOSED',
  CANDIDATE_EXAM_STATUS_ENUM_PUBLISHED: 0,
  CANDIDATE_EXAM_STATUS_ENUM_AVAILABLE: 1,
  CANDIDATE_EXAM_STATUS_ENUM_IN_PROGRESS: 2,
  CANDIDATE_EXAM_STATUS_ENUM_COMPLETED: 3,
  CANDIDATE_EXAM_STATUS_ENUM_SYSTEM_CLOSED: 4,
  CANDIDATE_EXAM_STATUS_ENUM_CLOSED: 5,
  FIELD_EXAM_DURATION: 'exam_duration',

  // ///////////////////////////////////////////
  // LOOKUP DETAILS COLLECTION
  // ///////////////////////////////////////////
  COLLECTION_LOOKUP_DETAILS: 'lookup_details',
  FIELD_ATTRIBUTE_TYPE: 'attribute_type',
  FIELD_PARENT_ATTRIBUTE_ID: 'parent_attribute_id',
  FIELD_LOOKUP_DETAILS_ID: 'id',

  // ///////////////////////////////////////////
  // ENUM STATUS CONSTANTS
  // ///////////////////////////////////////////
  ENUM_PENDING_FOR_APPROVAL: 0,
  ENUM_ACTIVATED: 1,
  ENUM_REJECTED: 2,
  ENUM_DEACTIVATED: 3,
  ENUM_APPROVED: 4,
  ENUM_PUBLISHED: 5,
  ENUM_INDRAFT: 6,
  ENUM_COMPLETED: 7,
  ENUM_CAMPUS_DRIVE_CLOSED: 7,

  // ///////////////////////////////////////////
  // CANDIDATE ENUM STATUS CONSTANTS
  // ///////////////////////////////////////////
  ENUM_CANDIDATE_ACTIVATED: 1,
  ENUM_CANDIDATE_DEACTIVATED: 0,
  ENUM_CANDIDATE_EXAM_PUBLISHED: 2,

  // ///////////////////////////////////////////
  // CANDIDATE ENUM STAGE CONSTANTS
  // ///////////////////////////////////////////
  ENUM_CANDIDATE_STAGE_ACTIVATED: 0,
  ENUM_CANDIDATE_STAGE_DEACTIVATED: 0,

  // ///////////////////////
  // USER DETAILS
  // ////////////////////

  ENUM_USER_GENDER_MALE: 1,
  ENUM_USER_GENDER_FEMALE: 2,
  ENUM_USER_GENDER_OTHER: 3,

  // ///////////////////////////////
  // // COLLECTION GD SCORE DETAILS
  // //////////////////////////////
  COLLECTION_GD_SCORE_DETAILS: 'gd_score_details',
  GD_GROUP_DETAILS_ID: 'gd_group_details_id',
  ASSESSOR_ID: 'assessor_id',
  UNIVERSITY_GROUP_NAME: 'university_group_name',
  FIELD_GD_CANDIDATE_SEQUENCE: 'gd_candidate_sequence',
  SCORE_DETAIL_JSON: 'score_detail_json',
  GD_GROUP_DETAILS_BODY_FIELD_ID: 'gd_group_details_id',
  GD_SCORE_DETAILS_ID: 'gd_score_details_id',
  ENUM_GD_SCORE_IN_DRAFT: 0,
  ENUM_GD_SCORE_COMPLETED: 1,
  VALUE_GD_SCORE_IN_DRAFT: 'IN_DRAFT',
  VALUE_GD_SCORE_COMPLETED: 'COMPLETED',
  FIELD_GD_SCORE_STATUS: 'status',
  FIELD_DRAFT_SCORE_DETAILS_JSON: 'draft_score_detail_json',

  // ///////////////////////
  // GD
  // ////////////////////
  ENUM_STAGE_FOR_PI: 'SELECTED_FOR_PI',
  ENUM_STAGE_FOR_GD: 'SELECTED_FOR_GD',
  ENUM_STAGE_IN_PI: 'SELECTED_IN_PI',
  VALUE_STAGE_IN_PI_HR: 'SELECTED_IN_PI_BY_HR',
  VALUE_SELECTED_IN_PI_FOR_ONSITE: 'SELECTED_IN_PI_FOR_ONSITE',
  VALUE_SELECTED_IN_GD_FOR_ONSITE: 'SELECTED_IN_GD_FOR_ONSITE',
  VALUE_SELECTED_IN_PI_BY_ASSESSOR_FROM_ONSITE: 'SELECTED_IN_PI_BY_ASSESSOR_FROM_ONSITE',
  VALUE_SELECTED_IN_PI_BY_ADMIN_FROM_ONSITE: 'SELECTED_IN_PI_BY_ADMIN_FROM_ONSITE',
  VALUE_TPO_REJECTED_CANDIDATE_OFFER_LETTER: 'TPO_REJECTED_CANDIDATE_OFFER_LETTER',
  VALUE_TPO_APPROVED_CANDIDATE_OFFER_LETTER: 'TPO_APPROVED_CANDIDATE_OFFER_LETTER',
  VALUE_ADMIN_APPROVED_CANDIDATE_OFFER_LETTER: 'ADMIN_APPROVED_CANDIDATE_OFFER_LETTER',
  VALUE_ADMIN_REJECTED_CANDIDATE_OFFER_LETTER: 'ADMIN_REJECTED_CANDIDATE_OFFER_LETTER',
  VALUE_DOWNLOAD_CANDIDATE_OFFER_LETTER: 'DOWNLOAD_OFFER_LETTER',
  VALUE_UPLOAD_CANDIDATE_OFFER_LETTER: 'UPLOAD_OFFER_LETTER',

  ENUM_SELECTED_FOR_GD: 2,
  ENUM_SELECTED_FOR_PI: 3,
  ENUM_SELECTED_IN_PI: 4,
  ENUM_STAGE_SELECTED_IN_GD_FOR_ONSITE: 5,
  ENUM_STAGE_SELECTED_IN_PI_FOR_ONSITE: 6,
  ENUM_SELECTED_IN_PI_BY_ASSESSOR_FROM_ONSITE: 7,
  ENUM_SELECTED_IN_PI_BY_ADMIN_FROM_ONSITE: 8,
  ENUM_STAGE_TPO_REJECTED_CANDIDATE_OFFER_LETTER: 9,
  ENUM_STAGE_TPO_APPROVED_CANDIDATE_OFFER_LETTER: 10,
  ENUM_STAGE_ADMIN_APPROVED_CANDIDATE_OFFER_LETTER: 11,
  ENUM_STAGE_ADMIN_REJECTED_CANDIDATE_OFFER_LETTER: 12,
  ENUM_STAGE_UPLOAD_CANDIDATE_OFFER_LETTER: 13,
  ENUM_STAGE_DOWNLOAD_CANDIDATE_OFFER_LETTER: 14,

  // ///////////////////////
  // GD GROUP DETAILS
  // ////////////////////

  COLLECTION_GD_GROUP_DETAILS: 'gd_group_details',
  FIELD_ACCOMODATION: 'accommodation',
  FIELD_PICKUP_DROP: 'pickup_drop',
  FIELD_GD_LOCATION: 'gd_location',
  FIELD_GD_DATE: 'gd_date',
  FIELD_UNIVERSITIES: 'universities_of_candidates',
  FIELD_GD_GROUP_DETAILS_ID: 'gd_group_details_id',
  FIELD_GROUP_SEQUENCE_NUMBER: 'group_sequence_number',
  FIELD_GD_DISCUSSION_LEVEL: 'gd_discussion_level',
  FIELD_ACCESSOR_DETAILS: 'assessor_details',
  FIELD_FOOD_HABITS: 'food_habits',
  FIELD_GD_GROUP_DISPLAY_NAME: 'gd_group_display_name',
  FIELD_GD_TOPIC: 'gd_topics',
  FIELD_GD_STATUS: 'status',
  ENUM_INSTITUTE_LEVEL_DISCUSSION: 0,
  ENUM_ACROSS_INSTITUTE_LEVEL_DISCUSSION: 1,
  ENUM_STATUS_GROUP_CREATED: 3,
  ENUM_STATUS_GD_GROUP_IN_DRAFT: 1,
  ENUM_STATUS_GROUP_EVALUATION_DONE: 2,
  ENUM_STATUS_CANDIDATE_NOT_APPEARED_IN_GD: 4,
  ENUM_STATUS_CANDIDATE_APPEARED_IN_GD: 6,
  ENUM_STATUS_SELECTED_FOR_ONSITE_GD: 5,
  VALUE_STATUS_SELECTED_FOR_ONSITE_GD: 'SELECTED_FOR_ONSITE_GD',
  VALUE_GD_GROUP_CANDIDATE_IN_DRAFT: 'IN_DRAFT',
  VALUE_GD_GROUP_CANDIDATE_COMPLETED: 'COMPLETED',
  VALUE_GD_GROUP_CANDIDATE_NOT_APPEARED: 'CANDIDATE_NOT_APPEARED',

  ENUM_FIRST_ROUND_FOR_PI: 0,
  ENUM_FINAL_ROUND_FOR_PI: 1,
  // ///////////////////
  // SHORTLIST CAMPUS DRIVE DETAILS
  // //////////////////
  FIELD_STAGE_ID: 'stage_id',
  FIELD_GD_PI_DATE: 'gd_pi_date',

  // //////////////////////////
  // ASSESSMENT Details
  // /////////////////////////

  FIELD_ASSESSMENT_CATEGORY: 'assessment_category',
  COLLECTION_ASSESSMENT_PARAM_DETAILS: 'assessment_param_details',
  FIELD_ASSESSMENT_PARAM_ID: 'id',
  FIELD_ASSESSMENT_PARAM_NAME: 'param_name',
  FIELD_ASSESSMENT_PARAM_DISPLAY_NAME: 'param_display_name',
  FIELD_ASSESSMENT_PARAM_TYPE: 'param_type',
  FIELD_ASSESSMENT_POSSIBLE_VALUES: 'possible_values',
  FIELD_ASSESSMENT_RESPONSE_REQUIRE: 'response_require',
  FIELD_ASSESSMENT_PARAM_URL: 'param_url',

  // ///////////////////////
  // PI Assessment Details
  // ////////////////////

  COLLECTION_PI_ASSESSMENT_DETAILS: 'pi_assessment_details',
  FIELD_PI_LOCATION: 'pi_location',
  FIELD_PI_ASSESSMENT_TYPE: 'pi_assessment_type',
  FIELD_PI_INSTITUTE_LEVEL: 'pi_institute_level',
  FIELD_IS_CHIEF_ASSESSOR: 'is_chief_assessor',
  FIELD_PI_DATE: 'pi_date',
  FIELD_PI_CANDIDATE_SEQUENCE: 'pi_candidate_sequence',
  ENUM_ASSESSMNET_CATEGORY_TYPE_GD: 0,
  ENUM_ASSESSMNET_CATEGORY_TYPE_PI: 1,
  VALUE_ASSESSMENT_CATEGORY_TYPE_GD: 'GD',
  VALUE_ASSESSMENT_CATEGORY_TYPE_PI: 'PI',
  FIELD_PI_ASSESSMENT_DETAIS_ID: 'pi_assessment_details_id',
  FIELD_FEEDBACK_JSON: 'feedback_details_json',
  FIELD_DRAFT_FEEDBACK_JSON: 'draft_feedback_details_json',
  FIELD_ASSESSMENT_TYPE: 'assessment_type',
  ENUM_PI_ASSESSMENT_CREATED: 4,
  ENUM_PI_ASSESSMENT_IN_DRAFT: 0,
  ENUM_PI_ASSESSMENT_COMPLETED: 1,
  ENUM_PI_ASSESSMENT_SELECTED_FOR_PI: 2,
  ENUM_PI_ASSESSMENT_SELECTED_BY_HR: 3,
  ENUM_PI_ASSESSMENT_APPEARED_IN_PI: 5,
  ENUM_PI_ASSESSMENT_CANDIDATE_NOT_APPEARED: 6,
  ENUM_PI_ASSESSMENT_CANDIDATE_APPEARED: 8,
  ENUM_PI_ASSESSMENT_SELECTED_FOR_ONSITE_PI: 7,
  VALUE_PI_ASSESSMENT_IN_DRAFT: 'IN_DRAFT',
  VALUE_PI_ASSESSMENT_COMPLETED: 'COMPLETED',
  VALUE_PI_ASSESSMENT_SELECTED_FOR_PI: 'SELECTED_FOR_PI',
  VALUE_PI_ASSESSMENT_SELECTED_BY_HR: 'SELECTED_BY_HR',
  VALUE_PI_ASSESSMENT_SELECTED_FOR_ONSITE: 'SELECTED_FOR_ONSITE_PI',
  VALUE_PI_ASSESSMENT_CREATED: 'CREATED',
  VALUE_PI_CANDIDATE_NOT_APPEARED: 'CANDIDATE_NOT_APPEARED',
  FIELD_EXAM_SCORE: 'exam_score',
  FIELD_PI_ASSESSMENT_DETAILS_ID_ARRAY: 'pi_assessment_details_ids',
  ENUM_IS_CHIEF_ASSESSOR: 1,

  // ///////////////////////
  // //ASSESSOR DETAILS
  // ///////////////////////
  COLLECTION_ASSESSOR_DETAILS: 'assessor_details',
  FIELD_DEPARTMENT: 'department',
  FIELD_UNIT: 'unit',
  FIELD_LOCATION: 'location',
  FIELD_IS_GD_VALUE_TRUE: 1,
  FIELD_IS_GD_VALUE_FALSE: 0,
  FIELD_IS_PI_VALUE_FALSE: 0,
  FIELD_IS_PI_VALUE_TRUE: 1,
  FIELD_IS_GD: 'is_gd',
  FIELD_IS_PI: 'is_pi',
  // ///////////////////////////////////////////
  // LOOKUP_DETAILS STATUS CONSTANTS
  // ///////////////////////////////////////////
  FIELD_STATUS_ACTIVE: 1,
  FIELD_STATUS_INACTIVE: 0,
  FIELD_SIGNED_OFFER_LETTER_URL: 'signed_offer_letter_url',
  FIELD_ACCEPTED: 'accepted',
  FIELD_REJECTED: 'rejected',
  FIELD_SEND: 'send',
  FIELD_RESEND: 'resend',
  FIELD_ACTION: 'action',
  FIELD_APPROVE: 'approve',
  FIELD_ADMIN_NAME: 'admin_name',
  FIELD_EXPIRE_DATE: 'expire_date',
  JOINING_DETAILS: 'Joining_Details',
  // //////////////////////////////////////////
  // ///// BIO DATA Details
  // /////////////////////////////////////////
  COLLECTION_BIO_DATA_DETAILS: 'bio_data_details',
  FIELD_BIO_DATA_DETAILS_ID: 'bio_details_id',
  BIO_DATA_DETAILS_ID: 'bio_data_details_id',
  BIO_DATA_CONTACTS_NO: 'contact_no',

  // ////////////////////
  // BIO DATA DETAILS
  // ///////////////////

  BIODATA_DETAILS: 'biodata_details',
  RESIDENCE_CONTACT_NO: 'residence_contact_no',
  REFERENCE_DETAILS: 'reference_details',
  PERMANENT_ADDRESS: 'permanent_address',
  BROTHER_DETAILS: 'brother_details',
  RELATIVE_MOBILE_NO: 'mobile_no',
  VEHICLE_NO: 'vehicle_no',
  LICENCE_NO: 'licence_no',
  VOTING_ID_NO: 'voting_id_no',
  UID_NO: 'uid_no',
  PASSPORT_NO: 'passport_no',
  LEAVING_CERTIFICATE: 'leaving_certificate',
  RELATIVE_DETAILS: 'relative_details',
  UAN_NO: 'uan_no',
  ESIC_NO: 'esic_no',
  FIELD_FROM_NO_REPLY_SRKAY: '<no-reply@srkay.com>',
  FIELD_APP: 'app',
  FIELD_SALUTATION: 'salutation',
  FIELD_UPDATE_DETAILS: 'update_details',

  // / ////////////////////////
  // // / ///////////////
  // / Lightblue Operations
  // / //////////////
  PARAM_URL: 'url',
  PARAM_HTTP_METHOD: 'http_method',
  PARAM_HEADERS: 'headers',
  PARAM_CONTENT_TYPE: 'Content-Type',
  PARAM_ORG_NAME: 'orgName',
  PARAM_REQUEST_BODY: 'request_body',
  PARAM_RESPONSE: 'response',

  // /////////////////////////
  // Config Mgmt
  // ////////////////////////
  FIELD_IMPACT_LEVEL: 'impact_level',
  COLLECTION_PROPERTIES_CONFIG_MASTER: 'properties_config_master',
  FIELD_PROPERTY_NAME: 'property_name',
  FIELD_PROPERTY_GROUP_OWNER: 'property_group_owner',
  FIELD_PROPERTY_VALUES: 'property_values',
  PARAM_ENTITY_ID: 'entity_id',
  FIELD_PROPERTY_GROUP_IDENTIFIER: 'property_group_identifier'
}
