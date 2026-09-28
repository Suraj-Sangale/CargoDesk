import React, { useEffect, useState, useRef } from "react";
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
  const [isRendered, setIsRendered] = useState(Boolean(modalOpen));
  const [isClosing, setIsClosing] = useState(false);
  const closeTimerRef = useRef(null);

  const closeModal = () => {
    if (setModalOpen) {
      setModalOpen(false);
    }
  };

  const toggleModal = () => {
    if (modalOpen) {
      closeModal();
    } else if (setModalOpen) {
      setModalOpen(true);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target.id === "backdrop" && !backDrop) {
      closeModal();
    }
  };

  useEffect(() => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }

    if (modalOpen) {
      setIsRendered(true);
      setIsClosing(false);
      document.body.style.overflow = "hidden";
    } else if (isRendered) {
      setIsClosing(true);
      closeTimerRef.current = setTimeout(() => {
        setIsRendered(false);
        setIsClosing(false);
        document.body.style.overflow = "";
      }, 450); // Matches closing animation duration
    }

    return () => {
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, [modalOpen, isRendered]);

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
      if (closeTimerRef.current) {
        clearTimeout(closeTimerRef.current);
      }
    };
  }, []);

  if (!isRendered) return null;

  return (
    <div
      id="backdrop"
      className={`fixed inset-0 z-[101] flex items-end sm:items-center justify-center p-0 sm:p-4 overflow-x-hidden overflow-y-auto ${
        isClosing ? "animate-backdrop-out pointer-events-none" : "animate-backdrop-in"
      }`}
      onClick={handleBackdropClick}
      aria-modal="true"
      role="dialog"
    >
      {/* Dark Blur Overlay Background */}
      <div className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs pointer-events-none" />

      {/* Modal / Bottom Sheet Card */}
      <div
        className={`relative bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl border-t sm:border border-slate-200/80 w-full sm:w-auto ${modalSize} mx-0 sm:mx-auto overflow-hidden flex flex-col max-h-[92vh] sm:max-h-[86vh] z-10 will-change-transform ${
          isClosing ? "animate-modal-out" : "animate-modal-in"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Mobile Drag Indicator Handle */}
        <div className="sm:hidden pt-2.5 pb-0.5 flex justify-center shrink-0 bg-slate-50">
          <div className="w-10 h-1 rounded-full bg-slate-300" />
        </div>

        {/* Modal Header */}
        {modalTitle && (
          <div className="flex justify-between items-center px-5 sm:px-6 pt-3 sm:pt-4 pb-2 shrink-0 bg-slate-50">
            <div className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate pr-2">
              {modalTitle}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {showBackButton && handleBackButtonClick && (
                <button
                  type="button"
                  onClick={handleBackButtonClick}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  aria-label="Back"
                >
                  <FiArrowLeft className="w-5 h-5" />
                </button>
              )}
              {!backDrop && (
                <button
                  type="button"
                  onClick={closeModal}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                  aria-label="Close"
                >
                  <FiX className="w-5 h-5" />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {React.isValidElement(children)
            ? React.cloneElement(children, { toggleModal, onClose: closeModal })
            : children}
        </div>
      </div>
    </div>
  );
}
