import React, { useState } from "react";
import { FiUser, FiPlus, FiTrash2, FiAlertCircle } from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";
import DocumentTable from "../common/tabels/documentTable";
import CommonModal from "../common/commonModal";
import { getConstant } from "@/utilities/utils";
import { allContactsTableHeadCells } from "@/utilities/masterData";
import ManualAddForm from "../message/import/manualAddForm";
import { postApiData } from "@/utilities/services/apiService";
import { showToast } from "@/utilities/toastService";

export default function AllContactsTab({
  pageData,
  contactsList = [],
  setContactsList,
  searchTerm = "",
  setSelectedTab,
}) {
  const [selected, setSelected] = useState([]);
  const [deletePopup, setDeletePopup] = useState(false);
  const [deleteLoad, setDeleteLoad] = useState(false);
  const [contactModal, setContactModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [modalData, setModalData] = useState({});

  const onClickDelete = async () => {
    const payload = {
      contacts: selected,
    };
    setDeleteLoad(true);
    try {
      const response = await postApiData("DELETE_BULK_CONTACTS", payload);
      if (response.status) {
        setContactsList((prev) =>
          prev.filter((item) => !selected.includes(item.id))
        );
        setDeletePopup(false);
        setSelected([]);
        showToast({
          message: "Contacts deleted successfully!",
          type: "success",
        });
      } else {
        showToast({
          message: response.message || "Failed to delete contacts",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error occurred during deletion:", error);
      showToast({
        message: "Error occurred while deleting contacts, Please try again later",
        type: "error",
      });
    }
    setDeleteLoad(false);
  };

  const onClickEdit = (id) => {
    const selectedItem = contactsList.find((item) => item.id == id);
    if (selectedItem) {
      setModalData({
        id: selectedItem.id,
        name: selectedItem.name,
        phone: selectedItem.contactNo,
        note: selectedItem.note || "",
      });
      setContactModal(true);
      setIsEdit(true);
    }
  };

  return (
    <div className="space-y-4">
      {contactsList.length > 0 ? (
        <DocumentTable
          rows={contactsList}
          headCells={allContactsTableHeadCells}
          onClickEdit={onClickEdit}
          selected={selected}
          setSelected={setSelected}
          onClickDelete={() => setDeletePopup(true)}
          isFilterApplied={false}
          searchTerm={searchTerm}
        />
      ) : (
        <div className="py-14 text-center space-y-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#2563EB] flex items-center justify-center mx-auto shadow-2xs">
            <FiUser className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {searchTerm ? "No matching contacts found" : "No Contacts Added Yet"}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {searchTerm
                ? "Try searching with a different name or number."
                : "Import your contacts from Google, CSV, vCard, or add them manually."}
            </p>
          </div>
          {!searchTerm && (
            <button
              type="button"
              onClick={() => setSelectedTab("import")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <FiPlus className="w-4 h-4" />
              <span>Import Contacts</span>
            </button>
          )}
        </div>
      )}

      {/* Delete Contacts Modal */}
      <CommonModal
        modalTitle="Delete Contacts"
        modalOpen={deletePopup}
        setModalOpen={setDeletePopup}
        modalSize="w-11/12 sm:w-96"
      >
        <div className="p-5 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto border border-rose-100">
            <FiAlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">
              Delete Selected Contacts?
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to permanently delete {selected.length} selected contact{selected.length > 1 ? "s" : ""}? This action cannot be undone.
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={() => setDeletePopup(false)}
              className="px-4 py-2 text-xs font-semibold bg-white text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onClickDelete}
              disabled={deleteLoad}
              className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              {deleteLoad ? (
                <>
                  <ImSpinner9 className="w-3.5 h-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <FiTrash2 className="w-3.5 h-3.5" />
                  <span>Yes, Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      </CommonModal>

      {/* Edit Contact Modal */}
      <CommonModal
        modalTitle={isEdit ? "Edit Contact" : "Add New Contact"}
        modalOpen={contactModal}
        setModalOpen={setContactModal}
        modalSize="w-11/12 md:w-3/6"
      >
        <ManualAddForm
          isEdit={isEdit}
          modalData={modalData}
          pageData={pageData}
          setContactModal={setContactModal}
          setContactsList={setContactsList}
        />
      </CommonModal>
    </div>
  );
}
