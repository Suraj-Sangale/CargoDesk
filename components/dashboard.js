import React, { useEffect, useState, useRef } from "react";
import CommonModal from "./common/commonModal";
import DocumentsSection from "./layouts/documentsSection";
import EmiSection from "./layouts/emiSection";
import { postApiData } from "@/utilities/services/apiService";
import AddDocumentForm from "./common/molecules/addDocumentForm";
import DocumentTabs from "./dashboard/documentTabs";
import PageHeader from "./common/pageHeader";

const Dashboard = ({ pageData }) => {
  const { responseData } = pageData;
  const [reminderModal, setReminderModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [tableLoading, setTableLoading] = useState(false);
  const [reminderData, setReminderData] = useState("");
  const [focusField, setFocusField] = useState(null);
  const [documentTableData, setDocumentTableData] = useState(
    responseData?.data || [],
  );
  const [pagination, setPagination] = useState(responseData?.pagination || {});
  const [selectedTab, setSelectedTab] = useState("document");

  // In-memory page cache to avoid duplicate/redundant API calls
  const pageCacheRef = useRef(new Map());

  // Seed cache with initial SSR data
  useEffect(() => {
    if (responseData?.data && responseData?.pagination) {
      const p = responseData.pagination.page || 1;
      const l = responseData.pagination.limit || 10;
      pageCacheRef.current.set(`${p}_${l}`, {
        data: responseData.data,
        pagination: responseData.pagination,
      });
    }
  }, [responseData]);

  const fetchVehicleDocuments = async (
    page = 1,
    limit = pagination.limit || 10,
    force = false,
  ) => {
    const cacheKey = `${page}_${limit}`;

    // 1. If not forcing a refresh, skip if already on this page and limit
    if (
      !force &&
      page === pagination.page &&
      limit === pagination.limit &&
      documentTableData.length > 0
    ) {
      return;
    }

    // 2. If data is already in cache, use cached data immediately with 0 API calls
    if (!force && pageCacheRef.current.has(cacheKey)) {
      const cached = pageCacheRef.current.get(cacheKey);
      setDocumentTableData(cached.data);
      if (cached.pagination) {
        setPagination(cached.pagination);
      }
      return;
    }

    // 3. Otherwise fetch from API and cache it
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
    } catch (error) {
      console.error("Error occurred during fetching vehicle documents:", error);
    } finally {
      setTableLoading(false);
    }
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
      if (response.status) {
        pageCacheRef.current.clear(); // Invalidate cache so newly added document shows
        await fetchVehicleDocuments(1, pagination.limit || 10, true);
        setReminderModal(false);
      }
    } catch (error) {
      console.error("Error occurred during form submission:", error);
      setAddLoading(false);
    }
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
            item.id === updatedData.id ? { ...item, ...updatedData } : item,
          ),
        );
        // Also update any page in cache containing this item
        pageCacheRef.current.forEach((cachedVal, key) => {
          const updatedList = cachedVal.data.map((item) =>
            item.id === updatedData.id ? { ...item, ...updatedData } : item,
          );
          pageCacheRef.current.set(key, { ...cachedVal, data: updatedList });
        });
      }
      setReminderModal(false);
      setIsEdit(false);
    } catch (error) {
      console.error("Error occurred during form submission:", error);
    }
    setUpdateLoading(false);
  };

  const onClickAddReminder = () => {
    setIsEdit(false);
    setReminderData("");
    setFocusField(null);
    setReminderModal(true);
  };

  // const getAllVehicleDocuments = async () => {
  //   setTableLoading(true);
  //   try {
  //     const response = await postApiData("GET_ALL_VEHICALE_DOCUMENTS");
  //     if (response.status && response.data.length > 0) {
  //       setDocumentTableData(response.data);
  //     } else {
  //       setDocumentTableData([]);
  //     }
  //   } catch (error) {
  //     console.error("Error occurred during fetching vehicle documents:", error);
  //   } finally {
  //     setTableLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   getAllVehicleDocuments();
  // }, []);

  return (
    <div className="w-full">
      {/* Page Header (Eyebrow, Title, Subtitle, Vector Illustration) */}
      <PageHeader
        eyebrow=""
        title="Dashboard"
        subtitle="Track and manage all your vehicle documents in one place."
      />

      {/* Tabs (Documents vs EMI) */}
      <DocumentTabs selectedTab={selectedTab} setSelectedTab={setSelectedTab} />

      {/* Main Tab Content */}
      <div className="w-full">
        {selectedTab === "document" ? (
          <DocumentsSection
            setReminderData={setReminderData}
            setReminderModal={setReminderModal}
            setIsEdit={setIsEdit}
            setFocusField={setFocusField}
            tableData={documentTableData}
            setTableData={setDocumentTableData}
            onClickAddDocument={onClickAddReminder}
            isLoading={tableLoading}
            pagination={pagination}
            onPageChange={fetchVehicleDocuments}
            onDeleteSuccess={() => {
              pageCacheRef.current.clear();
              fetchVehicleDocuments(pagination.page || 1, pagination.limit || 10, true);
            }}
            rowsPerPageOptions={[2, 5, 10, 25]}
          />
        ) : selectedTab === "emi" ? (
          <EmiSection />
        ) : null}
      </div>

      {/* Add / Edit Document Modal */}
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
};

export default Dashboard;
