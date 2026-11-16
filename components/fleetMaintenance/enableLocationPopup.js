import React from "react";
import CommonModal from "../common/commonModal";
import {
  FiMapPin,
  FiNavigation,
  FiAlertCircle,
  FiCheck,
  FiSlash,
  FiCompass,
} from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";

export default function EnableLocationPopup({
  isOpen,
  onClose,
  onEnable,
  onSkip,
  isLoading = false,
  isPermissionDenied = false,
  errorMessage = null,
  onUseOfficeLocation,
}) {
  return (
    <CommonModal
      modalOpen={isOpen}
      setModalOpen={onClose}
      modalTitle="Device Location"
      modalSize="w-11/12 sm:max-w-md"
      noScroll={false}
    >
      <div className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
        {/* Visual Icon & Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center shadow-inner">
            <FiMapPin className="w-7 h-7 text-amber-600 animate-bounce" />
          </div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
            Enable Location for Photo Verification
          </h3>
          {/* <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mx-auto">
            Device location is used to stamp accurate date, time, and GPS coordinates onto fleet maintenance photos.
          </p> */}
        </div>

        {/* Feature comparison / Info Box */}
        {/* <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-3.5 space-y-2.5 text-xs text-slate-700">
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
              <FiCheck className="w-3.5 h-3.5" />
            </div>
            <p className="leading-snug">
              <strong>Enable:</strong> GPS coordinates, address, and live timestamp will be stamped on captured photos.
            </p>
          </div>
          <div className="flex items-start gap-2.5">
            <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center shrink-0 mt-0.5">
              <FiSlash className="w-3 h-3" />
            </div>
            <p className="leading-snug">
              <strong>Skip:</strong> You can upload photos immediately without any GPS watermark.
            </p>
          </div>
        </div> */}

        {/* If permission is denied or blocked */}
        {isPermissionDenied && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl space-y-1.5 text-xs text-rose-900">
            <div className="flex items-center gap-1.5 font-bold text-rose-800">
              <FiAlertCircle className="w-4 h-4 shrink-0" />
              <span>Location Permission Blocked</span>
            </div>
            <p className="text-[11px] text-rose-700 leading-relaxed">
              Your browser has blocked location access. Tap the <strong>🔒 lock icon</strong> in your browser URL bar, set Location to <strong>Allow</strong>, then tap <strong>Enable</strong>.
            </p>
          </div>
        )}

        {/* Error message if any other error */}
        {!isPermissionDenied && errorMessage && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2 text-xs text-amber-900">
            <FiAlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-[11px] leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* CTAs */}
        <div className="space-y-2.5 pt-2">
          {/* Primary CTA: Enable */}
          <button
            type="button"
            onClick={onEnable}
            disabled={isLoading}
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.99] text-white text-xs sm:text-sm font-bold shadow-md shadow-blue-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <ImSpinner9 className="w-4 h-4 animate-spin" />
                <span>Enabling Device Location...</span>
              </>
            ) : (
              <>
                <FiNavigation className="w-4 h-4" />
                <span>Enable</span>
              </>
            )}
          </button>

          {/* Secondary CTA: Skip */}
          <button
            type="button"
            onClick={onSkip}
            disabled={isLoading}
            className="w-full py-2.5 px-4 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 active:scale-[0.99] text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-60"
          >
            <span>Skip</span>
          </button>

          {/* Fallback option: Chembur Office */}
          {/* {onUseOfficeLocation && (
            <button
              type="button"
              onClick={onUseOfficeLocation}
              disabled={isLoading}
              className="w-full py-1.5 text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 transition-colors text-center cursor-pointer flex items-center justify-center gap-1"
            >
              <FiCompass className="w-3.5 h-3.5" />
              <span>Use Chembur Office (19.0596° N, 72.8895° E)</span>
            </button>
          )} */}
        </div>
      </div>
    </CommonModal>
  );
}
