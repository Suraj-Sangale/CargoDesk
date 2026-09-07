import React from "react";
import GroupForm from "../message/groups/groupForm";

export default function CreateGroupTab({
  pageData,
  setGroupsList,
  contactsList = [],
}) {
  return (
    <div className="w-full">
      <GroupForm
        pageData={pageData}
        setGroupsList={setGroupsList}
        contactsList={contactsList}
      />
    </div>
  );
}
