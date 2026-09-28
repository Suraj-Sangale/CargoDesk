import React, { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import {
  FiEdit,
  FiCalendar,
  FiBell,
  FiMoreVertical,
  FiTrash2,
  FiChevronLeft,
  FiChevronRight,
  FiArrowUp,
  FiArrowDown,
  FiFileText,
  FiEye,
  FiPaperclip,
  FiPhone,
  FiUser,
  FiExternalLink,
  FiCheck,
} from "react-icons/fi";
import StatusBadge from "../statusBadge";
import {
  convertToUpperCase,
  formatDate,
  formatPrice,
  formatVehicleNumber,
  getConstant,
  getDateBeforeDays,
  truncateString,
} from "@/utilities/utils";

/**
 * ============================================================================
 * Built-in Cell Renderer Helpers
 * ============================================================================
 */

// 1. Vehicle Plate Pill
const renderVehicleCell = (value, row, tableName = "") => {
  const formatted = formatVehicleNumber(value) || value || "-";
  
  // 1. Check for explicit fleet ID on row
  let fleetId = row?.fleet_id || row?.fleetId || row?.assigned_fleet_id;

  // 2. Direct fleet record if row is from fleets table or contains vehicle fields (not document/EMI/driver item)
  if (!fleetId && row?.id) {
    if (
      tableName === "fleets" ||
      row?.vehicle_model ||
      row?.chassis_number ||
      row?.engine_number ||
      row?.ownership_type ||
      row?.vehicle_type ||
      row?.seating_capacity ||
      row?.fuel_type ||
      (row?.vehicle_number && !row?.documentType && !row?.loan_amount && !row?.document_id && !row?.license_number)
    ) {
      fleetId = row.id;
    }
  }

  if (fleetId) {
    return (
      <Link
        href={`/fleet/${fleetId}`}
        onClick={(e) => e.stopPropagation()}
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-800 hover:bg-blue-600 hover:text-white border border-slate-200 hover:border-blue-600 uppercase tracking-wider transition-all cursor-pointer shadow-2xs group"
        title="View Fleet Details & Activity History"
      >
        <span>{formatted}</span>
        <FiExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100 transition-opacity" />
      </Link>
    );
  }

  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
      {formatted}
    </span>
  );
};

// 1b. Vehicle Model & Make / Description
const renderVehicleModelCell = (value, row, tableName = "") => {
  let fleetId = row?.fleet_id || row?.fleetId || row?.assigned_fleet_id;

  if (!fleetId && row?.id) {
    if (
      tableName === "fleets" ||
      row?.vehicle_model ||
      row?.chassis_number ||
      row?.engine_number ||
      row?.ownership_type ||
      row?.vehicle_type ||
      row?.seating_capacity ||
      row?.fuel_type ||
      (row?.vehicle_number && !row?.documentType && !row?.loan_amount && !row?.document_id && !row?.license_number)
    ) {
      fleetId = row.id;
    }
  }

  if (fleetId) {
    return (
      <Link
        href={`/fleet/${fleetId}`}
        onClick={(e) => e.stopPropagation()}
        className="font-semibold text-slate-800 hover:text-blue-600 hover:underline inline-flex items-center gap-1.5 transition-colors cursor-pointer group"
        title="View Fleet Details & Activity History"
      >
        <span>{value || "-"}</span>
        <FiExternalLink className="w-3 h-3 opacity-0 group-hover:opacity-100 text-blue-500 transition-opacity" />
      </Link>
    );
  }

  return <span className="font-medium text-slate-800">{value || "-"}</span>;
};

// 2. Avatar / Profile Photo
const renderAvatarCell = (value, row) => {
  const name = row?.driver_name || row?.name || row?.title || "U";
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .substring(0, 2)
    .toUpperCase();

  const photoUrl = value || row?.profile_photo || row?.photo || row?.avatar;

  return (
    <div className="relative shrink-0 w-9 h-9">
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name}
          className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-2xs"
        />
      ) : (
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
          {initials}
        </div>
      )}
    </div>
  );
};

// 3. Status Badge with multi-state colors
const renderStatusBadge = (value, colorOverride) => {
  if (value === null || value === undefined || value === "") {
    return <span className="text-slate-400">-</span>;
  }

  const normalized = value.toString().toLowerCase().trim();

  // Color preset mapping
  const COLOR_MAP = {
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-200",
    green: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blue: "bg-blue-50 text-blue-700 border-blue-200",
    amber: "bg-amber-50 text-amber-700 border-amber-200",
    yellow: "bg-amber-50 text-amber-700 border-amber-200",
    rose: "bg-rose-50 text-rose-700 border-rose-200",
    red: "bg-rose-50 text-rose-700 border-rose-200",
    purple: "bg-purple-50 text-purple-700 border-purple-200",
    indigo: "bg-indigo-50 text-indigo-700 border-indigo-200",
    teal: "bg-teal-50 text-teal-700 border-teal-200",
    slate: "bg-slate-100 text-slate-600 border-slate-200",
    gray: "bg-slate-100 text-slate-600 border-slate-200",
  };

  const DOT_MAP = {
    emerald: "bg-emerald-500",
    green: "bg-emerald-500",
    blue: "bg-blue-500",
    amber: "bg-amber-500",
    yellow: "bg-amber-500",
    rose: "bg-rose-500",
    red: "bg-rose-500",
    purple: "bg-purple-500",
    indigo: "bg-indigo-500",
    teal: "bg-teal-500",
    slate: "bg-slate-400",
    gray: "bg-slate-400",
  };

  let color = colorOverride;
  let displayLabel = value;
  let isPulse = false;

  if (!color) {
    if (
      value === 1 ||
      value === "1" ||
      normalized === "active" ||
      normalized === "paid" ||
      normalized === "completed" ||
      normalized === "verified"
    ) {
      color = "emerald";
      displayLabel = value === 1 || value === "1" ? "Active" : value;
    } else if (
      normalized === "on duty" ||
      normalized === "on_duty" ||
      normalized === "in transit" ||
      normalized === "in_transit" ||
      normalized === "processing"
    ) {
      color = "blue";
      isPulse = true;
      displayLabel =
        normalized === "on_duty"
          ? "On Duty"
          : normalized === "in_transit"
            ? "In Transit"
            : value;
    } else if (
      normalized === "on leave" ||
      normalized === "on_leave" ||
      normalized === "maintenance" ||
      normalized === "in maintenance" ||
      normalized === "pending" ||
      normalized === "due"
    ) {
      color = "amber";
      displayLabel =
        normalized === "on_leave"
          ? "On Leave"
          : normalized === "in maintenance"
            ? "Maintenance"
            : value;
    } else if (
      value === 0 ||
      value === "0" ||
      normalized === "closed" ||
      normalized === "inactive" ||
      normalized === "cancelled" ||
      normalized === "failed"
    ) {
      color = "slate";
      displayLabel = value === 0 || value === "0" ? "Inactive" : value;
    } else {
      color = "slate";
    }
  }

  const badgeClass = COLOR_MAP[color] || COLOR_MAP.slate;
  const dotClass = DOT_MAP[color] || DOT_MAP.slate;

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClass}`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotClass} ${
          isPulse ? "animate-pulse" : ""
        }`}
      />
      {displayLabel}
    </span>
  );
};

// 4. Date Cell with Icon
const renderDateCell = (value) => (
  <div className="flex items-center gap-2">
    <FiCalendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
    <span>{formatDate(value)}</span>
  </div>
);

// 5. Supporting Documents Button
const renderDocumentsCell = (value, row, onClickDocuments) => {
  let docs = [];
  if (value) {
    if (Array.isArray(value)) {
      docs = value;
    } else if (typeof value === "string") {
      try {
        const parsed = JSON.parse(value);
        docs = Array.isArray(parsed) ? parsed : [value];
      } catch (_) {
        docs = [{ name: "Document", dataUrl: value }];
      }
    }
  }

  const count = docs.length;

  return (
    <div
      onClick={(e) => {
        if (onClickDocuments) {
          e.stopPropagation();
          onClickDocuments(row, docs);
        }
      }}
    >
      {count > 0 ? (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onClickDocuments) onClickDocuments(row, docs);
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/90 hover:bg-amber-100 hover:border-amber-300 hover:shadow-2xs active:scale-95 transition-all cursor-pointer group"
          title={`Click to view ${count} attached document${count > 1 ? "s" : ""}`}
        >
          <FiFileText className="w-3.5 h-3.5 text-amber-600" />
          <span>
            {count} {count === 1 ? "Doc" : "Docs"}
          </span>
          <FiEye className="w-3 h-3 text-amber-600/80 group-hover:text-amber-800 ml-0.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (onClickDocuments) onClickDocuments(row, []);
          }}
          className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
          title="No documents attached - Click to view or manage"
        >
          <span className="text-slate-300">—</span>
          <span>0 docs</span>
        </button>
      )}
    </div>
  );
};

// 6. Action Menu Cell
const renderActionCell = ({
  row,
  rowId,
  activeMenuId,
  setActiveMenuId,
  actionMenuRef,
  onClickEdit,
  onClickDelete,
  customActions,
}) => {
  const currentId = rowId !== undefined ? rowId : row.id;
  const isMenuOpen = activeMenuId === currentId;

  return (
    <div
      className="relative inline-flex items-center justify-center gap-1.5"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Primary Edit Icon */}
      {onClickEdit && (
        <button
          type="button"
          onClick={() => onClickEdit(row.id, row)}
          title="Edit Record"
          className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
        >
          <FiEdit className="w-4 h-4" />
        </button>
      )}

      {/* 3-dots Menu Button */}
      {(onClickDelete || customActions || onClickEdit) && (
        <button
          type="button"
          onClick={() => setActiveMenuId(isMenuOpen ? null : currentId)}
          title="More options"
          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
        >
          <FiMoreVertical className="w-4 h-4" />
        </button>
      )}

      {/* Dropdown Menu Popup */}
      {isMenuOpen && (
        <div
          ref={actionMenuRef}
          className="absolute right-0 top-8 w-40 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-40 animate-dropdown text-left"
        >
          {onClickEdit && (
            <button
              onClick={() => {
                setActiveMenuId(null);
                onClickEdit(row.id, row);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              <FiEdit className="w-3.5 h-3.5 text-amber-500" />
              <span>Edit</span>
            </button>
          )}

          {/* Custom Actions */}
          {customActions &&
            (typeof customActions === "function"
              ? customActions(row, () => setActiveMenuId(null))
              : customActions.map((action, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setActiveMenuId(null);
                      action.onClick && action.onClick(row);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                      action.className || "text-slate-700"
                    }`}
                  >
                    {action.icon && (
                      <span className="w-3.5 h-3.5">{action.icon}</span>
                    )}
                    <span>{action.label}</span>
                  </button>
                )))}

          {/* Delete Action */}
          {onClickDelete && (
            <button
              onClick={() => {
                setActiveMenuId(null);
                onClickDelete([row.id], row);
              }}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
            >
              <FiTrash2 className="w-3.5 h-3.5 text-rose-500" />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * ============================================================================
 * Dynamic Cell Value Resolver
 * ============================================================================
 */
const resolveCellValue = (headCell, row, index, onClickDocuments, tableName) => {
  const rawValue = row[headCell.id];

  // 1. HIGHEST PRIORITY: Custom render function
  if (typeof headCell.render === "function") {
    return headCell.render(rawValue, row, index);
  }

  // 2. Custom formatter function
  if (typeof headCell.formatter === "function") {
    return headCell.formatter(rawValue, row, index);
  }

  // 3. Explicit or Inferred Column Type
  const typeMap = {
    vehicle: ["vehicleNo", "vehicle_number", "assigned_vehicle", "vehicle", "vehicle_no"],
    vehicleModel: ["vehicle_model", "assigned_vehicle_model", "vehicle_description", "model"],
    avatar: ["profile_photo", "photo"],
    documentType: ["documentType"],
    status: ["status"],
    documents: ["supporting_documents", "documents"],
    date: ["expiryDate", "due_date", "start_date", "license_expiry"],
    alertDate: ["alertDate"],
  };

  const type =
    headCell.type ||
    Object.entries(typeMap).find(([, ids]) => ids.includes(headCell.id))?.[0] ||
    (headCell.formatPrice
      ? "price"
      : headCell.upperCase
        ? "uppercase"
        : "text");

  // Handle explicitly / inferred types
  switch (type) {
    case "vehicle":
      return renderVehicleCell(rawValue, row, tableName);

    case "vehicleModel":
      return renderVehicleModelCell(rawValue, row, tableName);

    case "avatar":
      return renderAvatarCell(rawValue, row);

    case "status": {
      const colorOverride =
        typeof headCell.badgeColor === "function"
          ? headCell.badgeColor(rawValue, row)
          : headCell.badgeColors?.[rawValue] || headCell.badgeColor;
      return renderStatusBadge(rawValue, colorOverride);
    }

    case "badge":
    case "pill": {
      const color =
        typeof headCell.badgeColor === "function"
          ? headCell.badgeColor(rawValue, row)
          : headCell.badgeColors?.[rawValue] || headCell.badgeColor || "indigo";
      return (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-${color}-50 text-${color}-700 border border-${color}-200/80`}
        >
          {rawValue || "-"}
        </span>
      );
    }

    case "date":
      return renderDateCell(rawValue);

    case "alertDate": {
      const alertDateVal = getDateBeforeDays(
        row.expiryDate,
        getConstant("DAYS_BEFORE_ALERT"),
      );
      return (
        <div className="flex items-center gap-2">
          <FiBell className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>{alertDateVal}</span>
        </div>
      );
    }

    case "price":
    case "currency":
      return (
        <span className="font-semibold text-slate-800">
          {formatPrice(rawValue)}
        </span>
      );

    case "uppercase":
      return convertToUpperCase(rawValue) || "-";

    case "documentType":
      return <StatusBadge type={rawValue} />;

    case "documents":
      return renderDocumentsCell(rawValue, row, onClickDocuments);

    case "phone":
      return (
        <div>
          <div className="font-semibold text-slate-800 text-xs sm:text-sm">
            {rawValue || "-"}
          </div>
          {headCell.subtitleKey && row[headCell.subtitleKey] && (
            <div className="text-[11px] font-medium text-slate-400">
              Alt: {row[headCell.subtitleKey]}
            </div>
          )}
        </div>
      );

    case "progress": {
      const paid = parseInt(row.emis_paid || row[headCell.paidKey] || 0, 10);
      const total = parseInt(rawValue || row[headCell.totalKey] || 0, 10);
      const pct =
        total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
      return (
        <div>
          <div className="text-xs font-semibold text-slate-700">
            {paid} / {total}{" "}
            <span className="text-[11px] font-normal text-slate-400">
              {headCell.suffix || "Mo"}
            </span>
          </div>
          {total > 0 && (
            <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all"
                style={{ width: `${pct}%` }}
              />
            </div>
          )}
        </div>
      );
    }

    default:
      break;
  }

  // 4. Legacy Specific Entity Handlers (Guarantees 100% Backward Compatibility)
  if (headCell.id === "loan_name") {
    return (
      <div>
        <div className="font-semibold text-slate-800 text-sm">
          {rawValue || "-"}
        </div>
        {row.bank_name && (
          <div className="text-[11px] font-medium text-blue-600 flex items-center gap-1">
            <span>🏦</span>
            <span>{row.bank_name}</span>
          </div>
        )}
      </div>
    );
  }

  if (headCell.id === "tenure_months") {
    const paid =
      row.emis_paid !== undefined && row.emis_paid !== null
        ? parseInt(row.emis_paid, 10)
        : 0;
    const total = rawValue ? parseInt(rawValue, 10) : 0;
    const pct = total > 0 ? Math.min(100, Math.round((paid / total) * 100)) : 0;
    return (
      <div>
        <div className="text-xs font-semibold text-slate-700">
          {paid} / {total}{" "}
          <span className="text-[11px] font-normal text-slate-400">Mo</span>
        </div>
        {total > 0 && (
          <div className="w-20 bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  if (headCell.id === "driver_name") {
    return (
      <div>
        <div
          className={
            rawValue
              ? "font-semibold text-slate-900 text-sm"
              : "text-xs text-slate-400 italic"
          }
        >
          {rawValue || "Unassigned"}
        </div>
        {(row.driver_contact || row.contact_number) &&
          tableName != "drivers" && (
            <div className="text-[11px] font-medium text-slate-500">
              📞 {row.driver_contact || row.contact_number}
            </div>
          )}
      </div>
    );
  }

  if (headCell.id === "vehicle_model") {
    return (
      <div>
        <div className="font-semibold text-slate-800 text-sm">
          {rawValue || "-"}
        </div>
        {row.manufacturing_year && (
          <div className="text-[11px] font-medium text-slate-400">
            Model: {row.manufacturing_year}
          </div>
        )}
      </div>
    );
  }

  if (headCell.id === "vehicle_type") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
        {rawValue || "-"}
      </span>
    );
  }

  if (headCell.id === "fuel_type") {
    const isEv = rawValue === "Electric (EV)" || rawValue === "EV";
    const isCng = rawValue === "CNG";
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
          isEv
            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
            : isCng
              ? "bg-teal-50 text-teal-700 border-teal-200"
              : "bg-slate-100 text-slate-700 border-slate-200"
        }`}
      >
        {rawValue || "-"}
      </span>
    );
  }

  if (headCell.id === "capacity") {
    return rawValue ? (
      <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
        <span>⚖️</span>
        <span>{rawValue}</span>
      </span>
    ) : (
      "-"
    );
  }

  if (headCell.id === "ownership_type") {
    return (
      <span className="text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/80">
        {rawValue || "-"}
      </span>
    );
  }

  if (headCell.id === "contact_number") {
    return (
      <div>
        <div className="font-semibold text-slate-800 text-xs sm:text-sm">
          {rawValue || "-"}
        </div>
        {row.alt_contact_number && (
          <div className="text-[11px] font-medium text-slate-400">
            Alt: {row.alt_contact_number}
          </div>
        )}
      </div>
    );
  }

  if (headCell.id === "license_number") {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200 uppercase tracking-wide">
        {rawValue || "-"}
      </span>
    );
  }

  if (headCell.id === "license_type") {
    return (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
        {rawValue || "-"}
      </span>
    );
  }

  if (headCell.id === "assigned_vehicle") {
    return rawValue ? (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
        {formatVehicleNumber(rawValue) || rawValue}
      </span>
    ) : (
      <span className="text-xs text-slate-400 italic">Unassigned</span>
    );
  }

  if (headCell.id === "experience_years") {
    return rawValue ? (
      <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
        <span>⭐</span>
        <span>{rawValue}</span>
      </span>
    ) : (
      "-"
    );
  }

  if (headCell.id === "note" || headCell.id === "notes") {
    return (
      <span title={rawValue}>
        {truncateString(rawValue, headCell.truncate || 25) || "-"}
      </span>
    );
  }

  // 5. Generic Dual-line subtitle support (via subtitleKey or subtitle function)
  if (headCell.subtitle || headCell.subtitleKey) {
    const subVal =
      typeof headCell.subtitle === "function"
        ? headCell.subtitle(row)
        : row[headCell.subtitleKey];

    return (
      <div>
        <div className="font-semibold text-slate-800 text-sm">
          {headCell.prefix || ""}
          {rawValue || "-"}
          {headCell.suffix || ""}
        </div>
        {subVal && (
          <div className="text-[11px] font-medium text-slate-400 mt-0.5">
            {subVal}
          </div>
        )}
      </div>
    );
  }

  // 6. Generic Text / Icon / Prefix / Suffix Fallback
  if (headCell.icon) {
    return (
      <span className="inline-flex items-center gap-1.5 font-medium text-slate-800">
        {typeof headCell.icon === "string" ? (
          <span>{headCell.icon}</span>
        ) : (
          <headCell.icon className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        )}
        <span>
          {headCell.prefix || ""}
          {rawValue || "-"}
          {headCell.suffix || ""}
        </span>
      </span>
    );
  }

  if (headCell.truncate && typeof rawValue === "string") {
    return (
      <span title={rawValue}>
        {truncateString(rawValue, headCell.truncate)}
      </span>
    );
  }

  if (rawValue === null || rawValue === undefined || rawValue === "") {
    return "-";
  }

  return `${headCell.prefix || ""}${rawValue}${headCell.suffix || ""}`;
};

/**
 * ============================================================================
 * Dynamic Skeleton Cell Generator
 * ============================================================================
 */
const renderSkeletonCell = (headCell) => {
  if (headCell.skeleton) return headCell.skeleton;

  if (headCell.id === "id") {
    return <div className="w-6 h-4 bg-slate-200/80 rounded" />;
  }

  if (
    headCell.type === "avatar" ||
    headCell.id === "profile_photo" ||
    headCell.id === "photo"
  ) {
    return <div className="w-9 h-9 bg-slate-200/80 rounded-xl" />;
  }

  if (
    headCell.type === "vehicle" ||
    headCell.id === "vehicleNo" ||
    headCell.id === "vehicle_number"
  ) {
    return <div className="w-28 h-4 bg-slate-200/80 rounded-md" />;
  }

  if (
    headCell.type === "badge" ||
    headCell.type === "status" ||
    headCell.id === "documentType" ||
    headCell.id === "status" ||
    headCell.id === "vehicle_type"
  ) {
    return <div className="w-20 h-6 bg-slate-200/80 rounded-full" />;
  }

  if (
    headCell.type === "date" ||
    headCell.id === "expiryDate" ||
    headCell.id === "due_date" ||
    headCell.id === "start_date" ||
    headCell.id === "alertDate" ||
    headCell.id === "license_expiry"
  ) {
    return (
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 bg-slate-200/80 rounded-full" />
        <div className="w-24 h-4 bg-slate-200/80 rounded-md" />
      </div>
    );
  }

  if (
    headCell.type === "documents" ||
    headCell.id === "supporting_documents" ||
    headCell.id === "documents"
  ) {
    return <div className="w-16 h-6 bg-slate-200/80 rounded-lg" />;
  }

  if (headCell.id === "action" || headCell.type === "action") {
    return (
      <div className="flex items-center justify-center gap-1.5">
        <div className="w-7 h-7 bg-slate-200/80 rounded-lg" />
        <div className="w-7 h-7 bg-slate-200/80 rounded-lg" />
      </div>
    );
  }

  return <div className="w-24 h-4 bg-slate-200/80 rounded-md" />;
};

/**
 * ============================================================================
 * Main DocumentTable Component
 * ============================================================================
 */
export default function DocumentTable({
  rows = [],
  headCells = [],
  title = "",
  onClickDelete,
  onClickEdit,
  onClickDocuments,
  onRowClick,
  onRowContextMenu,
  selected = [],
  setSelected = () => {},
  selectable = true,
  searchTerm = "",
  rowsPerPageOptions = [5, 10, 25, 50],
  initialRowsPerPage,
  isLoading = false,
  loading = false,
  skeletonRowsCount = 5,
  emptyMessage = "No records found.",
  emptyIcon,
  customActions,
  hidePagination = false,
  minTableWidth = "min-w-[760px]",
  rowClassName,
  defaultSortBy,
  defaultSortOrder = "asc",
  tableName = "",
}) {
  const isTableLoading = isLoading || loading;
  const [order, setOrder] = useState(defaultSortOrder);
  const [orderBy, setOrderBy] = useState(
    defaultSortBy || headCells[0]?.id || "id",
  );
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(
    initialRowsPerPage || rowsPerPageOptions[0] || 5,
  );
  const [activeMenuId, setActiveMenuId] = useState(null);
  const actionMenuRef = useRef(null);
  const [contextMenu, setContextMenu] = useState(null);
  const contextMenuRef = useRef(null);

  // Close menus on outside click / escape / scroll
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setActiveMenuId(null);
        setContextMenu(null);
      }
    };
    const handleScroll = () => {
      setContextMenu(null);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleKeyDown);
    window.addEventListener("scroll", handleScroll, true);
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, []);

  // Sorting handlers
  const handleRequestSort = (property, headCell) => {
    if (headCell?.sortable === false || property === "action") return;
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // Select all rows
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = rows.map((n, i) => n.id ?? i);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  // Single row checkbox selection
  const handleClickRow = (event, id) => {
    event.stopPropagation();
    const selectedIndex = selected.indexOf(id);
    let newSelected = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selected, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selected.slice(1));
    } else if (selectedIndex === selected.length - 1) {
      newSelected = newSelected.concat(selected.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selected.slice(0, selectedIndex),
        selected.slice(selectedIndex + 1),
      );
    }
    setSelected(newSelected);
  };

  // Generic Comparator with custom sortValue support
  const activeSortCell = useMemo(
    () => headCells.find((c) => c.id === orderBy),
    [headCells, orderBy],
  );

  const comparator = (a, b) => {
    let aVal = a[orderBy] ?? "";
    let bVal = b[orderBy] ?? "";

    if (
      activeSortCell?.sortValue &&
      typeof activeSortCell.sortValue === "function"
    ) {
      aVal = activeSortCell.sortValue(a);
      bVal = activeSortCell.sortValue(b);
    } else {
      if (typeof aVal === "string") aVal = aVal.toLowerCase();
      if (typeof bVal === "string") bVal = bVal.toLowerCase();
    }

    if (bVal < aVal) return order === "desc" ? -1 : 1;
    if (bVal > aVal) return order === "desc" ? 1 : -1;
    return 0;
  };

  const visibleRows = useMemo(() => {
    return [...rows]
      .sort(comparator)
      .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);
  }, [rows, order, orderBy, page, rowsPerPage]);

  const totalPages = Math.max(1, Math.ceil(rows.length / rowsPerPage));
  const isAllSelected = rows.length > 0 && selected.length === rows.length;
  const isPartiallySelected =
    selected.length > 0 && selected.length < rows.length;

  const startRecord = rows.length === 0 ? 0 : page * rowsPerPage + 1;
  const endRecord = Math.min((page + 1) * rowsPerPage, rows.length);

  return (
    <div className="w-full">
      {/* Selected Items Bulk Action Bar */}
      {selectable && !isTableLoading && selected.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 mb-3 bg-blue-50/90 border border-blue-200 rounded-xl text-blue-900 transition-all shadow-2xs">
          <div className="text-xs md:text-sm font-semibold">
            {selected.length} {selected.length === 1 ? "record" : "records"}{" "}
            selected
          </div>
          <div className="flex items-center gap-2">
            {selected.length === 1 && onClickEdit && (
              <button
                onClick={() => {
                  const targetRow = rows.find((r) => r.id === selected[0]);
                  onClickEdit(selected[0], targetRow);
                }}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => {
                setSelected([]);
              }}
              className="px-3 py-1.5 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-2xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            {onClickDelete && (
              <button
                onClick={() => onClickDelete(selected)}
                className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <FiTrash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-2xs bg-white">
        <table className={`w-full text-left border-collapse ${minTableWidth}`}>
          {/* Table Header */}
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] md:text-xs font-bold text-slate-600 uppercase tracking-wider">
              {/* Checkbox Column */}
              {selectable && (
                <th className="py-3.5 px-4 w-12 text-center">
                  <input
                    type="checkbox"
                    checked={isAllSelected}
                    disabled={isTableLoading || rows.length === 0}
                    ref={(input) => {
                      if (input) input.indeterminate = isPartiallySelected;
                    }}
                    onChange={handleSelectAllClick}
                    className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                    aria-label="Select all rows"
                  />
                </th>
              )}

              {/* Dynamic Column Headers */}
              {headCells.map((headCell) => {
                const isAction =
                  headCell.id === "action" || headCell.type === "action";
                const isSortable = !isAction && headCell.sortable !== false;
                const alignClass =
                  headCell.align === "center" || isAction
                    ? "text-center"
                    : headCell.align === "right"
                      ? "text-right"
                      : "text-left";

                return (
                  <th
                    key={headCell.id}
                    className={`py-3.5 px-4 select-none ${alignClass} ${
                      headCell.headerClassName || ""
                    } ${isAction ? "w-24 text-center" : ""}`}
                    style={
                      headCell.width ? { width: headCell.width } : undefined
                    }
                  >
                    {isSortable ? (
                      <button
                        type="button"
                        disabled={isTableLoading}
                        onClick={() => handleRequestSort(headCell.id, headCell)}
                        className={`inline-flex items-center gap-1 hover:text-slate-900 focus:outline-none font-bold uppercase disabled:cursor-default ${
                          alignClass === "text-center"
                            ? "justify-center"
                            : alignClass === "text-right"
                              ? "justify-end"
                              : ""
                        }`}
                      >
                        <span>{headCell.label}</span>
                        {orderBy === headCell.id &&
                          (order === "desc" ? (
                            <FiArrowDown className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          ) : (
                            <FiArrowUp className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          ))}
                      </button>
                    ) : (
                      <span>{headCell.label}</span>
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 text-xs md:text-sm bg-white">
            {isTableLoading ? (
              Array.from({ length: skeletonRowsCount }).map((_, rowIndex) => (
                <tr
                  key={`table-skeleton-${rowIndex}`}
                  className="animate-pulse"
                >
                  {selectable && (
                    <td className="py-4 px-4 text-center">
                      <div className="w-4 h-4 bg-slate-200/80 rounded mx-auto" />
                    </td>
                  )}

                  {headCells.map((headCell) => (
                    <td
                      key={headCell.id}
                      className={`py-4 px-4 ${
                        headCell.align === "center" ||
                        headCell.id === "action" ||
                        headCell.type === "action"
                          ? "text-center"
                          : headCell.align === "right"
                            ? "text-right"
                            : "text-left"
                      }`}
                    >
                      {renderSkeletonCell(headCell)}
                    </td>
                  ))}
                </tr>
              ))
            ) : visibleRows.length === 0 ? (
              <tr>
                <td
                  colSpan={headCells.length + (selectable ? 1 : 0)}
                  className="py-14 text-center text-slate-400 font-medium"
                >
                  {emptyIcon && (
                    <div className="mb-2 flex justify-center">{emptyIcon}</div>
                  )}
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              visibleRows.map((row, index) => {
                const rowId = row.id ?? index;
                const isSelected = selected.includes(rowId);

                const dynamicClass = rowClassName
                  ? rowClassName(row, index, isSelected)
                  : "";

                return (
                  <tr
                    key={rowId}
                    onClick={(e) => {
                      if (onRowClick) {
                        onRowClick(row, e);
                      } else if (selectable) {
                        handleClickRow(e, rowId);
                      }
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (onRowContextMenu) {
                        onRowContextMenu(row, e);
                      } else {
                        const clickX = e.clientX;
                        const clickY = e.clientY;
                        const menuWidth = 175;
                        const menuHeight = 180;

                        const posX =
                          clickX + menuWidth > window.innerWidth
                            ? Math.max(10, clickX - menuWidth)
                            : clickX;
                        const posY =
                          clickY + menuHeight > window.innerHeight
                            ? Math.max(10, clickY - menuHeight)
                            : clickY;

                        setContextMenu({
                          x: posX,
                          y: posY,
                          row,
                          rowId,
                        });
                        setActiveMenuId(null);
                      }
                    }}
                    className={`transition-colors ${
                      onRowClick || selectable ? "cursor-pointer" : ""
                    } ${
                      isSelected
                        ? "bg-blue-50/50 hover:bg-blue-50/80"
                        : "hover:bg-slate-50/80"
                    } ${dynamicClass}`}
                  >
                    {/* Checkbox Cell */}
                    {selectable && (
                      <td className="py-3.5 px-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={(e) => handleClickRow(e, rowId)}
                          className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                          aria-label={`Select row ${rowId}`}
                        />
                      </td>
                    )}

                    {/* Dynamic Column Cells */}
                    {headCells.map((headCell) => {
                      const isAction =
                        headCell.id === "action" || headCell.type === "action";
                      const alignClass =
                        headCell.align === "center" || isAction
                          ? "text-center"
                          : headCell.align === "right"
                            ? "text-right"
                            : "text-left";

                      if (isAction) {
                        return (
                          <td
                            key={headCell.id}
                            className={`py-3.5 px-4 text-center whitespace-nowrap ${
                              headCell.className || ""
                            }`}
                          >
                            {renderActionCell({
                              row,
                              rowId,
                              activeMenuId,
                              setActiveMenuId,
                              actionMenuRef,
                              onClickEdit,
                              onClickDelete,
                              customActions,
                            })}
                          </td>
                        );
                      }

                      return (
                        <td
                          key={headCell.id}
                          onContextMenu={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            if (onRowContextMenu) {
                              onRowContextMenu(row, e, headCell.id);
                            } else {
                              const clickX = e.clientX;
                              const clickY = e.clientY;
                              const menuWidth = 175;
                              const menuHeight = 180;

                              const posX =
                                clickX + menuWidth > window.innerWidth
                                  ? Math.max(10, clickX - menuWidth)
                                  : clickX;
                              const posY =
                                clickY + menuHeight > window.innerHeight
                                  ? Math.max(10, clickY - menuHeight)
                                  : clickY;

                              setContextMenu({
                                x: posX,
                                y: posY,
                                row,
                                rowId,
                                field: headCell.id,
                                label: headCell.label,
                              });
                              setActiveMenuId(null);
                            }
                          }}
                          className={`py-3.5 px-4 text-slate-700 whitespace-nowrap ${alignClass} ${
                            headCell.className || ""
                          }`}
                        >
                          {resolveCellValue(
                            headCell,
                            row,
                            index,
                            onClickDocuments,
                            tableName,
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer Bar */}
      {!hidePagination && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-5 text-xs md:text-sm text-slate-500">
          {/* Left: Records summary */}
          {isTableLoading ? (
            <div className="h-4 w-44 bg-slate-200/80 rounded-md animate-pulse" />
          ) : (
            <div>
              Showing {startRecord} to {endRecord} of {rows.length} records
            </div>
          )}

          {/* Right: Previous, Page Numbers, Next */}
          {isTableLoading ? (
            <div className="flex items-center gap-1.5 animate-pulse">
              <div className="w-8 h-8 rounded-lg bg-slate-200/80" />
              <div className="w-8 h-8 rounded-lg bg-slate-200/80" />
              <div className="w-8 h-8 rounded-lg bg-slate-200/80" />
            </div>
          ) : (
            <div className="flex items-center gap-1.5">
              {/* Previous Button */}
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                aria-label="Previous page"
              >
                <FiChevronLeft className="w-4 h-4" />
              </button>

              {/* Page Numbers */}
              {Array.from({ length: totalPages }, (_, i) => i).map((pgNum) => {
                const isCurrent = pgNum === page;
                return (
                  <button
                    key={pgNum}
                    onClick={() => setPage(pgNum)}
                    className={`min-w-[32px] h-8 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      isCurrent
                        ? "bg-blue-100 text-blue-700 shadow-2xs"
                        : "border border-slate-200 text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {pgNum + 1}
                  </button>
                );
              })}

              {/* Next Button */}
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors cursor-pointer"
                aria-label="Next page"
              >
                <FiChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Positioned Right-Click Context Menu Popup */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            top: `${contextMenu.y}px`,
            left: `${contextMenu.x}px`,
          }}
          className="fixed w-48 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl border border-slate-200 py-1.5 z-[9999] animate-dropdown text-left divide-y divide-slate-100"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="px-3 py-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/70 flex items-center justify-between">
            <span>Actions</span>
            <span className="text-[10px] text-slate-400 font-normal">
              #{contextMenu.rowId}
            </span>
          </div>

          <div className="py-1">
            {onClickEdit && (
              <button
                type="button"
                onClick={() => {
                  const targetRow = contextMenu.row;
                  const targetField = contextMenu.field;
                  setContextMenu(null);
                  onClickEdit(targetRow.id, targetRow, targetField);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-700 hover:bg-amber-50 hover:text-amber-800 transition-colors cursor-pointer"
              >
                <FiEdit className="w-3.5 h-3.5 text-amber-500" />
                <span className="font-medium">
                  {contextMenu.label &&
                  contextMenu.field !== "action" &&
                  contextMenu.field !== "id"
                    ? `Edit (${contextMenu.label})`
                    : "Edit Record"}
                </span>
              </button>
            )}

            {onClickDocuments && (
              <button
                type="button"
                onClick={() => {
                  const targetRow = contextMenu.row;
                  const docs =
                    targetRow.supporting_documents ||
                    targetRow.documents ||
                    [];
                  setContextMenu(null);
                  onClickDocuments(targetRow, docs);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-800 transition-colors cursor-pointer"
              >
                <FiFileText className="w-3.5 h-3.5 text-blue-500" />
                <span className="font-medium">View Documents</span>
              </button>
            )}

            {/* Custom Actions */}
            {customActions &&
              (typeof customActions === "function"
                ? customActions(contextMenu.row, () => setContextMenu(null))
                : customActions.map((action, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        const targetRow = contextMenu.row;
                        setContextMenu(null);
                        action.onClick && action.onClick(targetRow);
                      }}
                      className={`w-full flex items-center gap-2.5 px-3 py-1.5 text-xs hover:bg-slate-50 transition-colors cursor-pointer ${
                        action.className || "text-slate-700"
                      }`}
                    >
                      {action.icon && (
                        <span className="w-3.5 h-3.5">{action.icon}</span>
                      )}
                      <span className="font-medium">{action.label}</span>
                    </button>
                  )))}

            {/* Delete Action */}
            {onClickDelete && (
              <button
                type="button"
                onClick={() => {
                  const targetRow = contextMenu.row;
                  setContextMenu(null);
                  onClickDelete([targetRow.id], targetRow);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors cursor-pointer"
              >
                <FiTrash2 className="w-3.5 h-3.5 text-rose-500" />
                <span className="font-medium">Delete</span>
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
