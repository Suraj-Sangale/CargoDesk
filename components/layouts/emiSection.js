import React, { useState, useEffect } from "react";
import moment from "moment";
import EmiForm from "../emi/emiForm";
import CommonModal from "../common/commonModal";
import { postApiData } from "@/utilities/services/apiService";
import { emiTableHeadCells } from "@/utilities/masterData";
import DocumentTable from "../common/tabels/documentTable";
import { getConstant } from "@/utilities/utils";
import { showToast } from "@/utilities/toastService";
import { FiPlus } from "react-icons/fi";

export default function EmiSection() {
  const [emiModal, setEmiModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [emiList, setEmiList] = useState([]);
  const [selected, setSelected] = useState([]);
  const [deletePopup, setDeletePopup] = useState(false);
  const [deleteLoad, setDeleteLoad] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [modalData, setModalData] = useState({});

  const onClickAddDocument = () => {
    setIsEdit(false);
    setModalData({});
    setEmiModal(true);
  };

  const fetchEmiList = async () => {
    try {
      const response = await postApiData("GET_ALL_EMI", {});
      if (response.status && response.data) {
        setEmiList(response.data);
      } else {
        setEmiList([]);
      }
    } catch (error) {
      console.error("Error fetching EMI list:", error);
    }
  };

  useEffect(() => {
    fetchEmiList();
  }, []);

  const onClickEdit = (id) => {
    const selectedItem = emiList.find((item) => item.id == id);
    if (selectedItem) {
      setModalData(selectedItem);
      setIsEdit(true);
      setEmiModal(true);
    }
  };

  const onClickDelete = async (ids) => {
    const targetIds = Array.isArray(ids) ? ids : [ids];
    const payload = { ids: targetIds };
    setDeleteLoad(true);
    setDeleteError("");
    try {
      const response = await postApiData("DELETE_EMI_RECORD", payload);
      if (response.status) {
        const updatedEmiList = emiList.filter((item) => !targetIds.includes(item.id));
        setEmiList(updatedEmiList);
        setDeletePopup(false);
        setSelected([]);
        showToast("EMI record deleted successfully", "success");
      } else {
        showToast(
          response.message || "Error occurred while deleting record",
          "error"
        );
      }
    } catch (error) {
      console.error("Error occurred during EMI deletion:", error);
      setDeleteError(
        "Error occurred while deleting record. Please try again later."
      );
    }
    setDeleteLoad(false);
  };

  return (
    <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 md:p-6 space-y-5">
      {/* Header Row */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
            EMI Records
          </h2>
          <span className="inline-flex items-center justify-center bg-blue-100 text-blue-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {emiList.length}
          </span>
        </div>

        <button
          onClick={onClickAddDocument}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-semibold rounded-xl shadow-sm shadow-blue-600/20 hover:shadow-md transition-all cursor-pointer"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add EMI</span>
        </button>
      </div>

      <DocumentTable
        rows={emiList}
        headCells={emiTableHeadCells}
        onClickEdit={onClickEdit}
        selected={selected}
        setSelected={setSelected}
        onClickDelete={(ids) => {
          setSelected(Array.isArray(ids) ? ids : [ids]);
          setDeletePopup(true);
        }}
      />

      <CommonModal
        modalTitle={isEdit ? "Edit EMI Data" : "Add New EMI Data"}
        modalOpen={emiModal}
        setModalOpen={setEmiModal}
        modalSize="w-11/12 md:w-3/6"
      >
        <EmiForm
          setEmiList={setEmiList}
          modalData={modalData}
          isEdit={isEdit}
          onClose={() => setEmiModal(false)}
        />
      </CommonModal>

      <CommonModal
        modalTitle="Delete EMI Record"
        modalOpen={deletePopup}
        setModalOpen={setDeletePopup}
        modalSize="w-11/12 md:w-96"
      >
        <div className="p-5 text-center space-y-4">
          <p className="text-sm font-medium text-slate-700">
            Are you sure you want to delete {selected.length > 1 ? `these ${selected.length} records` : "this EMI record"}?
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
