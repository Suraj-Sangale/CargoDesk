import React, { useState } from "react";
import { LuCopy, LuCopyCheck } from "react-icons/lu";
import { BsPlusCircle } from "react-icons/bs";
import { MdOutlineDeleteOutline } from "react-icons/md";
import { FiEdit } from "react-icons/fi";

export default function PrevMessageCard({
  handleChange,
  item,
  copied,
  handleCopy,
  handleDelete,
  deleteMsgLoading,
  toDelete,
  isConfirm,
  setIsConfirm,
}) {
  const handleConfirm = (toDelete = false) => {
    if (!toDelete) {
      setIsConfirm({});
    }
  };

  const onClickDelete = (item) => {
    setIsConfirm(item);
  };

  return (
    <div
      className={`contact-card relative w-full lg:w-[48%] border overflow-hidden border-gray-300 rounded-md shadow-sm transition-all duration-300 ${isConfirm.id == item.id && "confirmContactDelete  "
        }`}
    >
      {isConfirm.id != item.id ? (
        <>
          <div className="absolute top-2 right-2 flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                handleChange("message", item.message);
                handleConfirm(false);
              }}
              className="flex items-center gap-1 text-xs bg-green-200 text-green-900 px-2 py-1 rounded-md hover:bg-green-300 transition"
              type="button"
            >
              <BsPlusCircle size={14} />
              Use
            </button>

            {/* Copy */}
            <button
              onClick={() => {
                handleCopy(item);
                handleConfirm(false);
              }}
              className="flex items-center gap-1 text-xs bg-blue-200 text-blue-900 px-2 py-1 rounded-md hover:bg-blue-300 transition"
              type="button"
            >
              {copied == item.id ? (
                <LuCopyCheck
                  className="text-green-700"
                  size={14}
                />
              ) : (
                <LuCopy
                  className="text-blue-800"
                  size={14}
                />
              )}
              {copied == item.id ? "Copied" : "Copy"}
            </button>

            <button
              onClick={() => onClickDelete(item)}
              className="flex items-center gap-1 text-xs bg-red-200 text-red-900 px-2 py-1 rounded-md hover:bg-red-300 transition"
              type="button"
            >
              <MdOutlineDeleteOutline size={14} />
              {deleteMsgLoading && toDelete == item.id
                ? "Deleting..."
                : "Delete"}
            </button>
          </div>
          {/* Message Content */}
          <p className="text-gray-800 text-sm m-3 mt-12 break-words whitespace-pre-wrap">
            {item.message}
          </p>{" "}
        </>
      ) : (
        <div className="flex justify-between items-center relative z-10 text-white m-3">
          <span className="font-semibold text-sm">
            Are you sure want delete this template?
          </span>
          <div className="flex gap-2 ml-4">
            <button
              className="bg-white text-red-600 px-3 py-1 rounded text-sm font-semibold"
              onClick={() => handleDelete(item)}
            >
              Yes
            </button>
            <button
              className="bg-white text-gray-600 px-3 py-1 rounded text-sm font-semibold"
              onClick={() => handleConfirm(false)}
            >
              No
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
