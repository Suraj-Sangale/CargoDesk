import React, { useState } from "react";
import TabComponent from "../common/tabComponent";
import dashboardStyle from "@/styles/dashBoard.module.scss";
import GoogleContacts from "./googleContacts";
import AllContactsSection from "../manageContacts/allContactsSection";
import ImportContactsTab from "./import/importContactsTab";

export default function ManageContactsWrapper() {
  const contactsTabs = [
    { id: "02", label: "Import", value: "import" },
    {
      id: "01",
      label: "All Contacts",
      value: "allContacts",
    },
  ];

  const [selectedTab, setSelectedTab] = useState(contactsTabs[0].value);

  console.log("selectedTab", selectedTab);

  return (
    <>
      <div className={dashboardStyle.dashboardContainer}>
        <div className="m-5">
          <div className="flex flex-col shadow-lg rounded-lg">
            <div className="card-header flex justify-between items-center p-2">
              <h2 className="text-white my-1.5">Manage Contacts</h2>
            </div>
            <div className={dashboardStyle["mainTabel"]}>
              <TabComponent
                tabsData={contactsTabs}
                setSelectedTab={setSelectedTab}
                selectedTab={selectedTab}
              />
            </div>
          </div>
          {selectedTab == "allContacts" ? (
            <>
              <AllContactsSection />{" "}
            </>
          ) : selectedTab == "import" ? (
            <>
              {/* <GoogleContacts /> */}
              <ImportContactsTab />
            </>
          ) : null}
        </div>
      </div>
    </>
  );
}
