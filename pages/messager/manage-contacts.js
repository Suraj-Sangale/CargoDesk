import {
  getContactListController,
  getUserCntactGroups,
} from "@/backend/controllers/contactController";
import ManageContactsWrapper from "@/components/message/manageContactsWrapper";
import { withUserSsr } from "@/utilities/withUserSsr";
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

export const getServerSideProps = withUserSsr(async (context, { user }) => {
  const { tab = "" } = context.query;
  let contacts = [];
  let groups = [];

  const [contactsData, groupsList] = await Promise.all([
    getContactListController(user.userId),
    getUserCntactGroups(user.userId),
  ]);

  if (contactsData?.status) contacts = contactsData.data;
  if (groupsList?.status) groups = groupsList.data;

  return {
    props: {
      pageData: { tab },
      contacts,
      groups,
    },
  };
});
