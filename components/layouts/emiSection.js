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
  const [loading, setLoading] = useState(true);
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
    setLoading(true);
    try {
      const response = await postApiData("GET_ALL_EMI", {});
      if (response.status && response.data) {
        setEmiList(response.data);
      } else {
        setEmiList([]);
      }
    } catch (error) {
      console.error("Error fetching EMI list:", error);
    } finally {
      setLoading(false);
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

  // Calculate summary metrics
  const activeLoans = emiList.filter(
    (item) => item.status === 1 || item.status === "1" || item.status === "Active"
  );
  const totalPrincipal = activeLoans.reduce(
    (acc, curr) => acc + (parseFloat(curr.loan_amount) || 0),
    0
  );
  const monthlyOutflow = activeLoans.reduce(
    (acc, curr) => acc + (parseFloat(curr.emi_amount) || 0),
    0
  );
  const remainingOutflowTotal = activeLoans.reduce((acc, curr) => {
    const tenure = parseInt(curr.tenure_months, 10) || 0;
    const paid = parseInt(curr.emis_paid, 10) || 0;
    const emi = parseFloat(curr.emi_amount) || 0;
    return acc + Math.max(0, tenure - paid) * emi;
  }, 0);

  return (
    <div className="space-y-5">
      {/* Top KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Active Loans */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Active Loans
            </p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {loading ? (
                <span className="inline-block w-8 h-6 bg-slate-200/80 rounded animate-pulse" />
              ) : (
                `${activeLoans.length} / ${emiList.length}`
              )}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-base">
            📋
          </div>
        </div>

        {/* Monthly EMI Outflow */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Monthly Outflow
            </p>
            <p className="text-xl font-bold text-blue-600 mt-1">
              {loading ? (
                <span className="inline-block w-16 h-6 bg-slate-200/80 rounded animate-pulse" />
              ) : (
                `₹${monthlyOutflow.toLocaleString("en-IN")}`
              )}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-base">
            💳
          </div>
        </div>

        {/* Total Financed Principal */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Financed Principal
            </p>
            <p className="text-xl font-bold text-slate-900 mt-1">
              {loading ? (
                <span className="inline-block w-20 h-6 bg-slate-200/80 rounded animate-pulse" />
              ) : (
                `₹${totalPrincipal.toLocaleString("en-IN")}`
              )}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 font-bold text-base">
            🏦
          </div>
        </div>

        {/* Remaining Outflow */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Pending Balance
            </p>
            <p className="text-xl font-bold text-amber-700 mt-1">
              {loading ? (
                <span className="inline-block w-20 h-6 bg-slate-200/80 rounded animate-pulse" />
              ) : (
                `₹${remainingOutflowTotal.toLocaleString("en-IN")}`
              )}
            </p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600 font-bold text-base">
            ⏳
          </div>
        </div>
      </div>

      {/* Main EMI Table Container */}
      <div className="bg-white rounded-2xl shadow-xs border border-slate-200/80 p-5 md:p-6 space-y-5">
        {/* Header Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
              EMI Records
            </h2>
            {loading ? (
              <span className="inline-flex items-center justify-center bg-blue-100/70 w-8 h-5 rounded-full animate-pulse" />
            ) : (
              <span className="inline-flex items-center justify-center bg-blue-100 text-blue-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
                {emiList.length}
              </span>
            )}
          </div>

          <button
            onClick={onClickAddDocument}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs md:text-sm font-semibold rounded-xl shadow-sm shadow-blue-600/20 hover:shadow-md transition-all cursor-pointer"
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
          isLoading={loading}
          onClickDelete={(ids) => {
            setSelected(Array.isArray(ids) ? ids : [ids]);
            setDeletePopup(true);
          }}
        />

        <CommonModal
          modalTitle={isEdit ? "Edit EMI Record" : "Add New EMI Record"}
          modalOpen={emiModal}
          setModalOpen={setEmiModal}
          modalSize="w-11/12 md:w-8/12 lg:w-7/12"
        >
          <EmiForm
            setEmiList={setEmiList}
            modalData={modalData}
            isEdit={isEdit}
            onClose={() => setEmiModal(false)}
          />
        </CommonModal>
      </div>

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
