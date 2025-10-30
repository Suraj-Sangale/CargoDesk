import {
  getContactListController,
  getUserCntactGroups,
} from "@/backend/controllers/contactController";
import { getUserMessageTemplates } from "@/backend/controllers/messagerController";
import MessageWrapper from "@/components/message/messageWrapper";
import { requireValidUser } from "@/utilities/authServer";
import React from "react";

export default function Messager({
  pageData,
  contacts,
  groups,
  savedTemplates,
}) {
  return (
    <>
      <MessageWrapper
        pageData={pageData}
        contacts={contacts}
        groups={groups}
        savedTemplates={savedTemplates}
      />
    </>
  );
}
export async function getServerSideProps(context) {
  const { user, redirect } = await requireValidUser(context);
  if (redirect) return { redirect };

  const pageData = {};
  let contacts = [];
  let groups = [];
  let savedTemplates = [];

  const [contactsData, groupsData, savedTemplatesData] = await Promise.all([
    getContactListController(user.userId),
    getUserCntactGroups(user.userId),
    getUserMessageTemplates(user.userId),
  ]);

  if (contactsData?.status) contacts = contactsData.data;
  if (groupsData?.status) groups = groupsData.data;
  if (savedTemplatesData?.status) savedTemplates = savedTemplatesData.data;

  pageData.user = user;

  return {
    props: {
      pageData,
      contacts,
      groups,
      savedTemplates,
    },
  };
}
