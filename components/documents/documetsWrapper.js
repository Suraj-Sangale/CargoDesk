import React, { useState, useEffect, useRef } from "react";
import CommonModal from "../common/commonModal";
import { postApiData } from "@/utilities/services/apiService";
import DocumentsSection from "../layouts/documentsSection";
import AddDocumentForm from "../common/molecules/addDocumentForm";
import PageHeader from "../common/pageHeader";

export default function DocumetsWrapper({ pageData }) {
  const [reminderModal, setReminderModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [reminderData, setReminderData] = useState("");
  const [focusField, setFocusField] = useState(null);
  const [documentTableData, setDocumentTableData] = useState(
    pageData?.documents || []
  );
  const [pagination, setPagination] = useState(pageData?.pagination || {});
  const [tableLoading, setTableLoading] = useState(false);

  const pageCacheRef = useRef(new Map());

  useEffect(() => {
    if (pageData?.documents && pageData?.pagination) {
      const p = pageData.pagination.page || 1;
      const l = pageData.pagination.limit || 10;
      pageCacheRef.current.set(`${p}_${l}`, {
        data: pageData.documents,
        pagination: pageData.pagination,
      });
    }
  }, [pageData]);

  const fetchDocuments = async (
    page = 1,
    limit = pagination.limit || 10,
    force = false,
  ) => {
    const cacheKey = `${page}_${limit}`;

    if (
      !force &&
      page === pagination.page &&
      limit === pagination.limit &&
      documentTableData.length > 0
    ) {
      return;
    }

    if (!force && pageCacheRef.current.has(cacheKey)) {
      const cached = pageCacheRef.current.get(cacheKey);
      setDocumentTableData(cached.data);
      if (cached.pagination) {
        setPagination(cached.pagination);
      }
      return;
    }

    setTableLoading(true);
    try {
      const response = await postApiData("GET_ALL_VEHICALE_DOCUMENTS", {
        page,
        limit,
      });
      if (response?.status && Array.isArray(response.data)) {
        pageCacheRef.current.set(cacheKey, {
          data: response.data,
          pagination: response.pagination,
        });
        setDocumentTableData(response.data);
        if (response.pagination) {
          setPagination(response.pagination);
        }
      }
    } catch (err) {
      console.error("Error fetching vehicle documents:", err);
    } finally {
      setTableLoading(false);
    }
  };

  const onClickAddReminder = () => {
    setIsEdit(false);
    setReminderData("");
    setFocusField(null);
    setReminderModal(true);
  };

  const addReminderData = async (data) => {
    const payload = {
      fleet_id: data.fleet_id || data.fleetId || null,
      fleetId: data.fleet_id || data.fleetId || null,
      vehicleNo: data.vehicleNo || null,
      documentType: data.documentType,
      expiryDate: data.expiryDate,
      note: data.note,
    };
    setAddLoading(true);
    try {
      const response = await postApiData("ADD_NEW_VEHICALE_DOCUMENTS", payload);
      if (response.status || response.success) {
        pageCacheRef.current.clear();
        await fetchDocuments(1, pagination.limit || 10, true);
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
      fleet_id: updatedData.fleet_id || updatedData.fleetId || null,
      fleetId: updatedData.fleet_id || updatedData.fleetId || null,
      vehicleNo: updatedData.vehicleNo || null,
      documentType: updatedData.documentType,
      expiryDate: updatedData.expiryDate,
      note: updatedData.note,
    };
    setUpdateLoading(true);
    try {
      const response = await postApiData("UPDATE_VEHICALE_DOCUMENTS", payload);
      if (response.status || response.success) {
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
        eyebrow=""
        title="Vehicle Documents"
        subtitle="Track and manage all your vehicle documents in one place."
      />

      <DocumentsSection
        setReminderData={setReminderData}
        setReminderModal={setReminderModal}
        setIsEdit={setIsEdit}
        setFocusField={setFocusField}
        tableData={documentTableData}
        setTableData={setDocumentTableData}
        onClickAddDocument={onClickAddReminder}
        rowsPerPageOptions={[5, 10, 25, 50]}
        isLoading={tableLoading}
        pagination={pagination}
        onPageChange={fetchDocuments}
        onDeleteSuccess={() => {
          pageCacheRef.current.clear();
          fetchDocuments(pagination.page || 1, pagination.limit || 10, true);
        }}
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
          focusField={focusField}
          isLoading={isEdit ? updateLoading : addLoading}
          updateReminderData={updateReminderData}
        />
      </CommonModal>
    </div>
  );
}
