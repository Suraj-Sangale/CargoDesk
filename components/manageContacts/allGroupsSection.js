import React, { useState } from "react";
import { FiUsers, FiPlus, FiTrash2, FiAlertCircle } from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";
import DocumentTable from "../common/tabels/documentTable";
import CommonModal from "../common/commonModal";
import { allContactsGroupsTableHeadCells } from "@/utilities/masterData";
import { postApiData } from "@/utilities/services/apiService";
import GroupForm from "../message/groups/groupForm";
import { showToast } from "@/utilities/toastService";

export default function AllGroupsSection({
  pageData,
  contactsList = [],
  setContactsList,
  searchTerm = "",
  groupsList = [],
  setGroupsList,
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
      groupIds: selected,
    };
    setDeleteLoad(true);
    try {
      const response = await postApiData("DELETE_BULK_GROUPS", payload);
      if (response.status) {
        setGroupsList((prev) =>
          prev.filter((item) => !selected.includes(item.id))
        );
        setDeletePopup(false);
        setSelected([]);
        showToast({
          message: "Groups deleted successfully!",
          type: "success",
        });
      } else {
        showToast({
          message: response.message || "Failed to delete groups",
          type: "error",
        });
      }
    } catch (error) {
      console.error("Error occurred during deletion:", error);
      showToast({
        message: "Error occurred while deleting groups, Please try again later",
        type: "error",
      });
    }
    setDeleteLoad(false);
  };

  const onClickEdit = (id) => {
    const selectedItem = groupsList.find((item) => item.id == id);
    if (selectedItem) {
      setModalData({
        id: selectedItem.id,
        groupName: selectedItem.groupName,
        description: selectedItem.description || "",
        contactIds: selectedItem.contactIds || [],
      });
      setContactModal(true);
      setIsEdit(true);
    }
  };

  return (
    <div className="space-y-4">
      {groupsList.length > 0 ? (
        <DocumentTable
          rows={groupsList}
          headCells={allContactsGroupsTableHeadCells}
          onClickEdit={onClickEdit}
          selected={selected}
          setSelected={setSelected}
          onClickDelete={() => setDeletePopup(true)}
          isFilterApplied={false}
          searchTerm={searchTerm}
        />
      ) : (
        <div className="py-14 text-center space-y-4 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-[#9333EA] flex items-center justify-center mx-auto shadow-2xs">
            <FiUsers className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {searchTerm ? "No matching groups found" : "No Groups Created Yet"}
            </h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {searchTerm
                ? "Try searching with a different group name."
                : "Create contact groups to broadcast messages to teams instantly."}
            </p>
          </div>
          {!searchTerm && (
            <button
              type="button"
              onClick={() => setSelectedTab("createGroup")}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#2563EB] hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
            >
              <FiPlus className="w-4 h-4" />
              <span>Create New Group</span>
            </button>
          )}
        </div>
      )}

      {/* Delete Group Modal */}
      <CommonModal
        modalTitle="Delete Groups"
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
              Delete Selected Groups?
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Are you sure you want to delete {selected.length} selected group{selected.length > 1 ? "s" : ""}? Contacts will remain in your address book.
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

      {/* Edit Group Modal */}
      <CommonModal
        modalTitle={isEdit ? "Edit Group" : "Create New Group"}
        modalOpen={contactModal}
        setModalOpen={setContactModal}
        modalSize="w-11/12 md:w-5/6 max-w-3xl"
      >
        <GroupForm
          isEdit={isEdit}
          modalData={modalData}
          pageData={pageData}
          setGroupModal={setContactModal}
          setGroupsList={setGroupsList}
          contactsList={contactsList}
        />
      </CommonModal>
    </div>
  );
}
