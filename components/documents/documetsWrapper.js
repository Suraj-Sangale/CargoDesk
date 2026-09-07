import React, { useState } from "react";
import CommonModal from "../common/commonModal";
import { postApiData } from "@/utilities/services/apiService";
import DocumentsSection from "../layouts/documentsSection";
import AddDocumentForm from "../common/molecules/addDocumentForm";
import PageHeader from "../dashboard/pageHeader";

export default function DocumetsWrapper({ pageData }) {
  const [reminderModal, setReminderModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [reminderData, setReminderData] = useState("");
  const [documentTableData, setDocumentTableData] = useState(
    pageData?.documents || []
  );

  const onClickAddReminder = () => {
    setIsEdit(false);
    setReminderData("");
    setReminderModal(true);
  };

  const addReminderData = async (data) => {
    const payload = {
      vehicleNo: data.vehicleNo,
      documentType: data.documentType,
      expiryDate: data.expiryDate,
      note: data.note,
    };
    setAddLoading(true);
    try {
      const response = await postApiData("ADD_NEW_VEHICALE_DOCUMENTS", payload);
      if (response.status) {
        const LatestData = [...documentTableData, { id: response.id, ...data }];
        setDocumentTableData(LatestData);
        setReminderModal(false);
      }
    } catch (error) {
      console.error("Error occurred during form submission:", error);
    }
    setAddLoading(false);
  };

  const updateReminderData = async (updatedData) => {
    const payload = {
      id: updatedData.id,
      vehicleNo: updatedData.vehicleNo,
      documentType: updatedData.documentType,
      expiryDate: updatedData.expiryDate,
      note: updatedData.note,
    };
    setUpdateLoading(true);
    try {
      const response = await postApiData("UPDATE_VEHICALE_DOCUMENTS", payload);
      if (response.status) {
        setDocumentTableData((prevData) =>
          prevData.map((item) =>
            item.id === updatedData.id ? { ...item, ...updatedData } : item
          )
        );
      }
      setReminderModal(false);
      setIsEdit(false);
    } catch (error) {
      console.error("Error occurred during form submission:", error);
    }
    setUpdateLoading(false);
  };

  return (
    <div className="w-full">
      <PageHeader
        eyebrow="DOCUMENTS"
        title="Vehicle Documents"
        subtitle="Track and manage all your vehicle documents in one place."
      />

      <DocumentsSection
        setReminderData={setReminderData}
        setReminderModal={setReminderModal}
        setIsEdit={setIsEdit}
        tableData={documentTableData}
        setTableData={setDocumentTableData}
        onClickAddDocument={onClickAddReminder}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />

      <CommonModal
        modalTitle={isEdit ? "Edit Document" : "Add New Document"}
        modalOpen={reminderModal}
        setModalOpen={setReminderModal}
        modalSize="w-11/12 md:w-[500px]"
      >
        <AddDocumentForm
          setReminderModal={setReminderModal}
          addReminderData={addReminderData}
          reminderData={reminderData}
          isEdit={isEdit}
          setIsEdit={setIsEdit}
          isLoading={isEdit ? updateLoading : addLoading}
          updateReminderData={updateReminderData}
        />
      </CommonModal>
    </div>
  );
}
