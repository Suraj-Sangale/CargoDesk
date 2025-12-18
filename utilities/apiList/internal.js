export const internalList = {
  GET_ALL_VEHICALE_DOCUMENTS: "/api/vehicale-document/get-all",
  ADD_NEW_VEHICALE_DOCUMENTS: "/api/vehicale-document/add-new",
  DELETE_VEHICALE_DOCUMENTS: "/api/vehicale-document/delete",
  UPDATE_VEHICALE_DOCUMENTS: "/api/vehicale-document/update",

  // node api
  SEND_SMS: "/api/sendSms", // cms node Api

  // Message API
  SEND_MESSAGE: "/api/sendMessage",
  ADD_MSG_TEMPLATE: "/api/message/add-template",
  DELETE_MSG_TEMPLATE: "/api/message/delete-template",

  // login api
  VERIFY_USER: "/api/user/verify-user",
  LOGOUT_USER: "/api/user/logout",
  GET_USER_PROFILE: "/api/user/get-user-profile",

  // add new user
  ADD_NEW_USER: "/api/user/add-new-user",
  VERIFY_USER_LOGIN: "/api/user/verify-user",

  // contacts
  ADD_NEW_CONTACT: "/api/contact/add-new",
  GET_CONTACT_LIST: "/api/contact/get-list",
  UPDATE_CONTACT: "/api/contact/update",
  DELETE_CONTACT: "/api/contact/delete",
  DELETE_BULK_CONTACTS: "/api/contact/bulk-delete",
  IMPORT_CONTACTS_IN_BLUK: "/api/contact/import-contacts-in-bluk",

  // contact group
  CREATE_NEW_GROUP_OF_CONTACTS: "/api/contact/create-new-group",
  GET_GROUP_MEMBERS: "/api/contact/get-group-members",
  UPDATE_USERS_GROUP_DETAILS: "/api/contact/update-users-group-details",
  DELETE_BULK_GROUPS: "/api/contact/bulk-delete-groups",

  // emi
  ADD_NEW_EMI: "/api/emi/add-new",
  GET_ALL_EMI: "/api/emi/get-all",
  UPDATE_EMI_DETAILS: "/api/emi/update-emi-details",
  DELETE_EMI_RECORD: "/api/emi/delete",
};
