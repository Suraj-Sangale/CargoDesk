import React, { useEffect, useState, useMemo, useRef } from "react";
import { checkExpiryCounts, getConstant } from "@/utilities/utils";
import DocumentTable from "../common/tabels/documentTable";
import { docTableHeadCells } from "@/utilities/masterData";
import CommonModal from "../common/commonModal";
import modalStyle from "@/styles/modal.module.scss";
import { postApiData } from "@/utilities/services/apiService";
import DocumentsFilterCard from "../common/items/documentsFilterCard";
import RecordsToolbar from "../dashboard/recordsToolbar";

export default function DocumentsSection({
  setReminderData,
  setReminderModal,
  setIsEdit,
  setFocusField,
  tableData = [],
  setTableData,
  onClickAddDocument = () => {},
  rowsPerPageOptions = [2, 10, 25],
  isLoading = false,
  pagination = {},
  onPageChange = null,
  onRowsPerPageChange = null,
  onDeleteSuccess = null,
}) {
  const [documentsTypeList, setDocumentsTypeList] = useState([]);
  const [deletePopup, setDeletePopup] = useState(false);
  const [deleteLoad, setDeleteLoad] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [selected, setSelected] = useState([]);
  const [appliedFilter, setAppliedFilter] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  const onClickEdit = (id, row, targetField) => {
    const selectedItem =
      (typeof row === "object" && row !== null && row.id ? row : null) ||
      tableData.find((item) => item.id == id);
    if (selectedItem) {
      setReminderData(selectedItem);
      if (setFocusField) {
        setFocusField(targetField || null);
      }
      setIsEdit(true);
      setReminderModal(true);
    }
  };

  const onClickDelete = async (ids) => {
    const targetIds = Array.isArray(ids) ? ids : [ids];
    const payload = { ids: targetIds };
    setDeleteLoad(true);
    setDeleteError("");
    try {
      const response = await postApiData("DELETE_VEHICALE_DOCUMENTS", payload);
      if (response.status) {
        setTableData((prev) =>
          prev.filter((item) => !targetIds.includes(item.id)),
        );
        setDeletePopup(false);
        setSelected([]);
        if (onDeleteSuccess) {
          onDeleteSuccess(targetIds);
        }
      }
    } catch (error) {
      console.error("Error occurred during document deletion:", error);
      setDeleteError(
        "Error occurred while deleting record. Please try again later.",
      );
    }
    setDeleteLoad(false);
  };

  useEffect(() => {
    setDocumentsTypeList(checkExpiryCounts(tableData));
  }, [tableData]);

  // Filter toggle on card click
  const onFilterClick = (value) => {
    setAppliedFilter((prev) =>
      prev.includes(value)
        ? prev.filter((val) => val !== value)
        : [...prev, value],
    );
  };

  const handleRemoveFilter = (value) => {
    setAppliedFilter((prev) => prev.filter((val) => val !== value));
  };

  // Compute filtered & searched data
  const finalDisplayData = useMemo(() => {
    let result = tableData;

    // Filter by document type
    if (appliedFilter.length > 0) {
      result = result.filter((item) =>
        appliedFilter.includes((item.documentType || "").toLowerCase()),
      );
    }

    // Filter by search query
    if (searchTerm.trim()) {
      const query = searchTerm.toLowerCase().trim();
      result = result.filter((item) => {
        const vehicleNo = (item.vehicleNo || "").toLowerCase();
        const note = (item.note || "").toLowerCase();
        const docType = (item.documentType || "").toLowerCase();
        return (
          vehicleNo.includes(query) ||
          note.includes(query) ||
          docType.includes(query)
        );
      });
    }

    return result;
  }, [tableData, appliedFilter, searchTerm]);

  const { page, limit, totalRecords, totalPages, hasNextPage, hasPrevPage } =
    pagination;

  const fallbackCacheRef = useRef(new Map());

  const handlePageChange = (newPage, newLimit) => {
    if (onPageChange) {
      onPageChange(newPage, newLimit || limit);
      return;
    }

    const targetLimit = newLimit || limit || 10;
    const cacheKey = `${newPage}_${targetLimit}_${searchTerm.trim()}_${appliedFilter.join(",")}`;

    if (fallbackCacheRef.current.has(cacheKey)) {
      const cached = fallbackCacheRef.current.get(cacheKey);
      if (setTableData) setTableData(cached);
      return;
    }

    postApiData("GET_ALL_VEHICALE_DOCUMENTS", {
      page: newPage,
      limit: targetLimit,
      search: searchTerm.trim() || undefined,
      documentType: appliedFilter[0] || undefined,
    })
      .then((res) => {
        if (res?.status && Array.isArray(res.data)) {
          fallbackCacheRef.current.set(cacheKey, res.data);
          if (setTableData) setTableData(res.data);
        }
      })
      .catch((err) => {
        console.error("Error fetching vehicle documents:", err);
      });
  };

  return (
    <div className="space-y-6">
      {/* 5 Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {documentsTypeList.map((item) => (
          <DocumentsFilterCard
            key={item.id}
            item={item}
            isSelected={appliedFilter.includes(item.value)}
            onFilterClick={onFilterClick}
            isLoading={isLoading}
          />
        ))}
      </div>

      {/* All Records White Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 md:p-6 space-y-5">
        {/* Header Toolbar: Search, Filter, + Add Document */}
        <RecordsToolbar
          totalCount={totalRecords || finalDisplayData.length}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onAddDocument={onClickAddDocument}
          appliedFilters={appliedFilter}
          onRemoveFilter={handleRemoveFilter}
          documentsTypeList={documentsTypeList}
          onFilterClick={onFilterClick}
          isLoading={isLoading}
          />

        {/* Modern Document Data Table */}
        <DocumentTable
          rows={finalDisplayData}
          headCells={docTableHeadCells}
          onClickEdit={onClickEdit}
          selected={selected}
          setSelected={setSelected}
          onClickDelete={(ids) => {
            setSelected(Array.isArray(ids) ? ids : [ids]);
            setDeletePopup(true);
          }}
          searchTerm={searchTerm}
          rowsPerPageOptions={rowsPerPageOptions}
          isLoading={isLoading}
          pagination={pagination}
          onPageChange={handlePageChange}
          onRowsPerPageChange={onRowsPerPageChange}
        />
      </div>

      {/* Delete Confirmation Modal */}
      <CommonModal
        modalTitle="Delete Document"
        modalOpen={deletePopup}
        setModalOpen={setDeletePopup}
        modalSize="w-11/12 md:w-96"
      >
        <div className="px-5 text-center space-y-4">
          <p className="text-sm font-medium text-slate-700">
            Are you sure you want to delete{" "}
            {selected.length > 1
              ? `these ${selected.length} records`
              : "this document"}
            ?
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              className="px-4 py-2 text-xs md:text-sm font-semibold rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={() => setDeletePopup(false)}
            >
              Cancel
            </button>
            <button
              className="px-4 py-2 text-xs md:text-sm font-semibold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors"
              onClick={() => onClickDelete(selected)}
            >
              {deleteLoad ? getConstant("LOADING_TEXT") : "Yes, Delete"}
            </button>
          </div>
          {deleteError && (
            <p className="text-xs text-rose-600 font-medium">{deleteError}</p>
          )}
        </div>
      </CommonModal>
    </div>
  );
}
