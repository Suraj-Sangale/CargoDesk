import {
  getContactListController,
  getUserCntactGroups,
} from "@/backend/controllers/contactController";
import ManageContactsWrapper from "@/components/message/manageContactsWrapper";
import { requireValidUser } from "@/utilities/authServer";
import React from "react";

export default function ManageContacts({ pageData, contacts, groups }) {
  return (
    <>
      <ManageContactsWrapper
        pageData={pageData}
        contacts={contacts}
        groups={groups}
      />
    </>
  );
}
export async function getServerSideProps(context) {
  const { tab = "" } = context.query;
  const { user, redirect } = await requireValidUser(context);
  if (redirect) return { redirect };

  const pageData = {};
  let contacts = [];
  let groups = [];

  const [contactsData, groupsList] = await Promise.all([
    getContactListController(user.userId),
    getUserCntactGroups(user.userId),
  ]);

  if (contactsData?.status) {
    contacts = contactsData.data;
  }

  if (groupsList?.status) {
    groups = groupsList.data;
  }

  pageData.user = user;
  pageData.tab = tab;

  return {
    props: {
      pageData,
      contacts,
      groups,
    },
  };
}
