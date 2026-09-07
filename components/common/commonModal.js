import React, { useEffect } from "react";
import { FiX, FiArrowLeft } from "react-icons/fi";

export default function CommonModal({
  modalOpen,
  setModalOpen,
  modalTitle = "",
  children,
  backDrop = false,
  handleBackButtonClick,
  showBackButton,
  modalSize = "w-11/12 md:w-[480px]",
}) {
  const toggleModal = () => {
    setModalOpen(!modalOpen);
  };

  const handleBackdropClick = (e) => {
    if (e.target.id === "backdrop" && !backDrop) {
      toggleModal();
    }
  };

  // Lock scroll when modal is open
  useEffect(() => {
    if (modalOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [modalOpen]);

  return (
    <>
      {modalOpen && (
        <div
          id="backdrop"
          className="fixed inset-0 z-[101] flex items-center justify-center backdrop-blur-xs bg-slate-950/40 p-4 transition-all"
          onClick={handleBackdropClick}
        >
          <div
            className={`bg-white rounded-2xl shadow-2xl border border-slate-100 ${modalSize} mx-auto overflow-hidden animate-slide-down`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            {modalTitle && (
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
                <div className="text-base md:text-lg font-bold text-slate-900">
                  {modalTitle}
                </div>
                <div className="flex items-center gap-2">
                  {showBackButton && handleBackButtonClick && (
                    <button
                      onClick={handleBackButtonClick}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      aria-label="Back"
                    >
                      <FiArrowLeft className="w-5 h-5" />
                    </button>
                  )}
                  {!backDrop && (
                    <button
                      onClick={toggleModal}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                      aria-label="Close"
                    >
                      <FiX className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Modal Body */}
            <div className="flex-1 overflow-auto max-h-[80vh]">
              {React.cloneElement(children, { toggleModal })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
