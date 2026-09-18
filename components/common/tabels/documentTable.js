import React, { useState, useMemo, useEffect, useRef } from "react";
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

export default function DocumentTable({
  rows = [],
  headCells = [],
  title = "",
  onClickDelete,
  onClickEdit,
  onClickDocuments,
  selected = [],
  setSelected = () => {},
  searchTerm = "",
  rowsPerPageOptions = [5, 10, 25],
  isLoading = false,
  loading = false,
}) {
  const isTableLoading = isLoading || loading;
  const [order, setOrder] = useState("asc");
  const [orderBy, setOrderBy] = useState(headCells[0]?.id || "id");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(rowsPerPageOptions[0] || 5);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const actionMenuRef = useRef(null);

  // Close 3-dots action menu on click outside
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target)) {
        setActiveMenuId(null);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // Sorting handlers
  const handleRequestSort = (property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  // Select all handler
  const handleSelectAllClick = (event) => {
    if (event.target.checked) {
      const newSelected = rows.map((n) => n.id);
      setSelected(newSelected);
      return;
    }
    setSelected([]);
  };

  // Single row checkbox toggle
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

  // Comparator
  const comparator = (a, b) => {
    let aVal = a[orderBy] ?? "";
    let bVal = b[orderBy] ?? "";
    if (typeof aVal === "string") aVal = aVal.toLowerCase();
    if (typeof bVal === "string") bVal = bVal.toLowerCase();

    if (bVal < aVal) {
      return order === "desc" ? -1 : 1;
    }
    if (bVal > aVal) {
      return order === "desc" ? 1 : -1;
    }
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
      {!isTableLoading && selected.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 mb-3 bg-blue-50/90 border border-blue-200 rounded-xl text-blue-900 transition-all">
          <div className="text-xs md:text-sm font-semibold">
            {selected.length} {selected.length === 1 ? "record" : "records"}{" "}
            selected
          </div>
          <div className="flex items-center gap-2">
            {selected.length === 1 && (
              <button
                onClick={() => onClickEdit(selected[0])}
                className="px-3 py-1.5 text-xs font-semibold bg-white border border-blue-200 hover:bg-blue-50 text-blue-700 rounded-lg shadow-2xs transition-colors"
              >
                Edit
              </button>
            )}
            <button
              onClick={() => onClickDelete(selected)}
              className="px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-2xs transition-colors flex items-center gap-1.5"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto rounded-xl border border-slate-100 shadow-2xs">
        <table className="w-full text-left border-collapse min-w-[760px]">
          {/* Table Header */}
          <thead>
            <tr className="bg-slate-50/90 border-b border-slate-200/80 text-[11px] md:text-xs font-bold text-slate-600 uppercase tracking-wider">
              {/* Checkbox Column */}
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

              {/* Dynamic Columns */}
              {headCells.map((headCell) => (
                <th
                  key={headCell.id}
                  className={`py-3.5 px-4 select-none ${
                    headCell.id === "action" ? "text-center w-24" : ""
                  }`}
                >
                  {headCell.id !== "action" ? (
                    <button
                      type="button"
                      disabled={isTableLoading}
                      onClick={() => handleRequestSort(headCell.id)}
                      className="inline-flex items-center gap-1 hover:text-slate-900 focus:outline-none font-bold uppercase disabled:cursor-default"
                    >
                      <span>{headCell.label}</span>
                      {orderBy === headCell.id ? (
                        order === "desc" ? (
                          <FiArrowDown className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <FiArrowUp className="w-3.5 h-3.5 text-blue-600" />
                        )
                      ) : null}
                    </button>
                  ) : (
                    <span>{headCell.label}</span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          {/* Table Body */}
          <tbody className="divide-y divide-slate-100 text-xs md:text-sm bg-white">
            {isTableLoading ? (
              Array.from({ length: 5 }).map((_, rowIndex) => (
                <tr
                  key={`table-skeleton-${rowIndex}`}
                  className="animate-pulse"
                >
                  {/* Checkbox Skeleton */}
                  <td className="py-4 px-4 text-center">
                    <div className="w-4 h-4 bg-slate-200/80 rounded mx-auto" />
                  </td>

                  {/* Dynamic Column Skeletons */}
                  {headCells.map((headCell) => {
                    if (headCell.id === "id") {
                      return (
                        <td key={headCell.id} className="py-4 px-4">
                          <div className="w-6 h-4 bg-slate-200/80 rounded" />
                        </td>
                      );
                    }

                    if (
                      headCell.id === "profile_photo" ||
                      headCell.id === "photo"
                    ) {
                      return (
                        <td key={headCell.id} className="py-4 px-4">
                          <div className="w-9 h-9 bg-slate-200/80 rounded-xl" />
                        </td>
                      );
                    }

                    if (
                      headCell.id === "vehicleNo" ||
                      headCell.id === "vehicle_number"
                    ) {
                      return (
                        <td key={headCell.id} className="py-4 px-4">
                          <div className="w-28 h-4 bg-slate-200/80 rounded-md" />
                        </td>
                      );
                    }

                    if (headCell.id === "documentType") {
                      return (
                        <td key={headCell.id} className="py-4 px-4">
                          <div className="w-20 h-6 bg-slate-200/80 rounded-full" />
                        </td>
                      );
                    }

                    if (
                      headCell.id === "expiryDate" ||
                      headCell.id === "due_date" ||
                      headCell.id === "start_date" ||
                      headCell.id === "alertDate"
                    ) {
                      return (
                        <td key={headCell.id} className="py-4 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-3.5 h-3.5 bg-slate-200/80 rounded-full" />
                            <div className="w-24 h-4 bg-slate-200/80 rounded-md" />
                          </div>
                        </td>
                      );
                    }

                    if (
                      headCell.id === "note" ||
                      headCell.id === "description"
                    ) {
                      return (
                        <td key={headCell.id} className="py-4 px-4">
                          <div className="w-40 h-4 bg-slate-200/80 rounded-md" />
                        </td>
                      );
                    }

                    if (
                      headCell.id === "name" ||
                      headCell.id === "loan_name" ||
                      headCell.id === "groupName"
                    ) {
                      return (
                        <td key={headCell.id} className="py-4 px-4">
                          <div className="w-32 h-4 bg-slate-200/80 rounded-md" />
                        </td>
                      );
                    }

                    if (
                      headCell.id === "contactNo" ||
                      headCell.id === "loan_amount" ||
                      headCell.id === "emi_amount"
                    ) {
                      return (
                        <td key={headCell.id} className="py-4 px-4">
                          <div className="w-24 h-4 bg-slate-200/80 rounded-md" />
                        </td>
                      );
                    }

                    if (
                      headCell.id === "supporting_documents" ||
                      headCell.id === "documents"
                    ) {
                      return (
                        <td key={headCell.id} className="py-4 px-4">
                          <div className="w-16 h-6 bg-slate-200/80 rounded-lg" />
                        </td>
                      );
                    }

                    if (headCell.id === "status") {
                      return (
                        <td key={headCell.id} className="py-4 px-4">
                          <div className="w-16 h-6 bg-slate-200/80 rounded-full" />
                        </td>
                      );
                    }

                    if (headCell.id === "action") {
                      return (
                        <td key={headCell.id} className="py-4 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <div className="w-7 h-7 bg-slate-200/80 rounded-lg" />
                            <div className="w-7 h-7 bg-slate-200/80 rounded-lg" />
                          </div>
                        </td>
                      );
                    }

                    return (
                      <td key={headCell.id} className="py-4 px-4">
                        <div className="w-20 h-4 bg-slate-200/80 rounded-md" />
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : visibleRows.length === 0 ? (
              <tr>
                <td
                  colSpan={headCells.length + 1}
                  className="py-12 text-center text-slate-400 font-medium"
                >
                  No records found.
                </td>
              </tr>
            ) : (
              visibleRows.map((row, index) => {
                const isSelected = selected.includes(row.id);

                return (
                  <tr
                    key={row.id || index}
                    onClick={(e) => handleClickRow(e, row.id)}
                    className={`transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/50 hover:bg-blue-50/80"
                        : "hover:bg-slate-50/80"
                    }`}
                  >
                    {/* Checkbox Cell */}
                    <td className="py-3.5 px-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => handleClickRow(e, row.id)}
                        className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
                        aria-label={`Select row ${row.id}`}
                      />
                    </td>

                    {/* Column Cells */}
                    {headCells.map((headCell) => {
                      let cellValue = row[headCell.id];

                      // Vehicle No.
                      if (
                        headCell.id === "vehicleNo" ||
                        headCell.id === "vehicle_number"
                      ) {
                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 font-semibold text-slate-800 tracking-tight whitespace-nowrap"
                          >
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase tracking-wider">
                              {formatVehicleNumber(cellValue) ||
                                cellValue ||
                                "-"}
                            </span>
                          </td>
                        );
                      }

                      // Loan & Financier
                      if (headCell.id === "loan_name") {
                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 whitespace-nowrap"
                          >
                            <div className="font-semibold text-slate-800 text-sm">
                              {cellValue || "-"}
                            </div>
                            {row.bank_name && (
                              <div className="text-[11px] font-medium text-blue-600 flex items-center gap-1">
                                <span>🏦</span>
                                <span>{row.bank_name}</span>
                              </div>
                            )}
                          </td>
                        );
                      }

                      // Tenure / EMIs Paid
                      if (headCell.id === "tenure_months") {
                        const paid =
                          row.emis_paid !== undefined && row.emis_paid !== null
                            ? parseInt(row.emis_paid, 10)
                            : 0;
                        const total = cellValue ? parseInt(cellValue, 10) : 0;
                        const pct =
                          total > 0
                            ? Math.min(100, Math.round((paid / total) * 100))
                            : 0;

                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 whitespace-nowrap"
                          >
                            <div className="text-xs font-semibold text-slate-700">
                              {paid} / {total}{" "}
                              <span className="text-[11px] font-normal text-slate-400">
                                Mo
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
                          </td>
                        );
                      }

                      // Driver Profile Photo Column (for Drivers Table)
                      if (
                        headCell.id === "profile_photo" ||
                        headCell.id === "photo"
                      ) {
                        const driverInitials = (row.driver_name || row.name || "D")
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .substring(0, 2)
                          .toUpperCase();

                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 whitespace-nowrap"
                          >
                            <div className="relative shrink-0 w-9 h-9">
                              {cellValue || row.profile_photo ? (
                                <img
                                  src={cellValue || row.profile_photo}
                                  alt={row.driver_name || row.name || "Driver"}
                                  className="w-9 h-9 rounded-xl object-cover border border-slate-200 shadow-2xs"
                                />
                              ) : (
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-2xs">
                                  {driverInitials}
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      }

                      // Driver Name (No driver avatar/photo in fleet table or driver_name column)
                      if (headCell.id === "driver_name") {
                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 whitespace-nowrap"
                          >
                            <div>
                              <div
                                className={
                                  cellValue
                                    ? "font-semibold text-slate-900 text-sm"
                                    : "text-xs text-slate-400 italic"
                                }
                              >
                                {cellValue || "Unassigned"}
                              </div>
                              {row.driver_contact ? (
                                <div className="text-[11px] font-medium text-slate-500">
                                  📞 {row.driver_contact}
                                </div>
                              ) : row.contact_number ? (
                                <div className="text-[11px] font-medium text-slate-500">
                                  📞 {row.contact_number}
                                </div>
                              ) : null}
                            </div>
                          </td>
                        );
                      }

                      // Vehicle Model
                      if (headCell.id === "vehicle_model") {
                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 whitespace-nowrap"
                          >
                            <div className="font-semibold text-slate-800 text-sm">
                              {cellValue || "-"}
                            </div>
                            {row.manufacturing_year && (
                              <div className="text-[11px] font-medium text-slate-400">
                                Model: {row.manufacturing_year}
                              </div>
                            )}
                          </td>
                        );
                      }

                      // Vehicle Type Badge
                      if (headCell.id === "vehicle_type") {
                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 whitespace-nowrap"
                          >
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200/80">
                              {cellValue || "-"}
                            </span>
                          </td>
                        );
                      }

                      // Fuel Type Badge
                      if (headCell.id === "fuel_type") {
                        const isEv =
                          cellValue === "Electric (EV)" || cellValue === "EV";
                        const isCng = cellValue === "CNG";
                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 whitespace-nowrap"
                          >
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${
                                isEv
                                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                  : isCng
                                    ? "bg-teal-50 text-teal-700 border-teal-200"
                                    : "bg-slate-100 text-slate-700 border-slate-200"
                              }`}
                            >
                              {cellValue || "-"}
                            </span>
                          </td>
                        );
                      }

                      // Capacity
                      if (headCell.id === "capacity") {
                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700"
                          >
                            {cellValue ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                                <span>⚖️</span>
                                <span>{cellValue}</span>
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                        );
                      }

                      // Ownership Type
                      if (headCell.id === "ownership_type") {
                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 whitespace-nowrap"
                          >
                            <span className="text-xs font-medium text-slate-600 bg-slate-50 px-2 py-1 rounded-md border border-slate-200/80">
                              {cellValue || "-"}
                            </span>
                          </td>
                        );
                      }

                      // Contact Number (Drivers)
                      if (headCell.id === "contact_number") {
                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 whitespace-nowrap"
                          >
                            <div className="font-semibold text-slate-800 text-xs sm:text-sm">
                              {cellValue || "-"}
                            </div>
                            {row.alt_contact_number && (
                              <div className="text-[11px] font-medium text-slate-400">
                                Alt: {row.alt_contact_number}
                              </div>
                            )}
                          </td>
                        );
                      }

                      // License Number
                      if (headCell.id === "license_number") {
                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 whitespace-nowrap"
                          >
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-bold bg-slate-100 text-slate-800 border border-slate-200 uppercase tracking-wide">
                              {cellValue || "-"}
                            </span>
                          </td>
                        );
                      }

                      // License Type / Category
                      if (headCell.id === "license_type") {
                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 whitespace-nowrap"
                          >
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200/80">
                              {cellValue || "-"}
                            </span>
                          </td>
                        );
                      }

                      // Assigned Vehicle
                      if (headCell.id === "assigned_vehicle") {
                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 whitespace-nowrap"
                          >
                            {cellValue ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 uppercase tracking-wider">
                                {formatVehicleNumber(cellValue) || cellValue}
                              </span>
                            ) : (
                              <span className="text-xs text-slate-400 italic">
                                Unassigned
                              </span>
                            )}
                          </td>
                        );
                      }

                      // Experience
                      if (headCell.id === "experience_years") {
                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 whitespace-nowrap font-medium text-slate-700 text-xs sm:text-sm"
                          >
                            {cellValue ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-slate-800">
                                <span>⭐</span>
                                <span>{cellValue}</span>
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                        );
                      }

                      // License Expiry
                      if (headCell.id === "license_expiry") {
                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 text-slate-700 whitespace-nowrap"
                          >
                            <div className="flex items-center gap-2">
                              <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatDate(cellValue)}</span>
                            </div>
                          </td>
                        );
                      }

                      // Supporting Documents Column
                      if (
                        headCell.id === "supporting_documents" ||
                        headCell.id === "documents"
                      ) {
                        let docs = [];
                        if (cellValue) {
                          if (Array.isArray(cellValue)) {
                            docs = cellValue;
                          } else if (typeof cellValue === "string") {
                            try {
                              const parsed = JSON.parse(cellValue);
                              docs = Array.isArray(parsed)
                                ? parsed
                                : [cellValue];
                            } catch (_) {
                              docs = [{ name: "Document", dataUrl: cellValue }];
                            }
                          }
                        }

                        const count = docs.length;

                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 whitespace-nowrap"
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
                                  if (onClickDocuments) {
                                    onClickDocuments(row, docs);
                                  }
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
                                  if (onClickDocuments) {
                                    onClickDocuments(row, []);
                                  }
                                }}
                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                                title="No documents attached - Click to view or manage"
                              >
                                <span className="text-slate-300">—</span>
                                <span>0 docs</span>
                              </button>
                            )}
                          </td>
                        );
                      }

                      // Status Badge
                      if (headCell.id === "status") {
                        const normalized = (cellValue || "")
                          .toString()
                          .toLowerCase();
                        const isActive =
                          cellValue === 1 ||
                          cellValue === "1" ||
                          normalized === "active";
                        const isOnDuty =
                          normalized === "on duty" || normalized === "on_duty";
                        const isOnLeave =
                          normalized === "on leave" ||
                          normalized === "on_leave";
                        const isInTransit =
                          normalized === "in transit" ||
                          normalized === "in_transit";
                        const isMaintenance =
                          normalized === "maintenance" ||
                          normalized === "in maintenance";

                        let badgeClasses =
                          "bg-slate-100 text-slate-600 border-slate-200";
                        let dotClass = "bg-slate-400";
                        let displayLabel = cellValue || "Inactive";

                        if (isActive) {
                          badgeClasses =
                            "bg-emerald-50 text-emerald-700 border-emerald-200";
                          dotClass = "bg-emerald-500";
                          displayLabel = "Active";
                        } else if (isOnDuty) {
                          badgeClasses =
                            "bg-blue-50 text-blue-700 border-blue-200";
                          dotClass = "bg-blue-500 animate-pulse";
                          displayLabel = "On Duty";
                        } else if (isInTransit) {
                          badgeClasses =
                            "bg-blue-50 text-blue-700 border-blue-200";
                          dotClass = "bg-blue-500 animate-pulse";
                          displayLabel = "In Transit";
                        } else if (isOnLeave) {
                          badgeClasses =
                            "bg-amber-50 text-amber-700 border-amber-200";
                          dotClass = "bg-amber-500";
                          displayLabel = "On Leave";
                        } else if (isMaintenance) {
                          badgeClasses =
                            "bg-amber-50 text-amber-700 border-amber-200";
                          dotClass = "bg-amber-500";
                          displayLabel = "Maintenance";
                        } else if (
                          cellValue === 0 ||
                          cellValue === "0" ||
                          normalized === "closed" ||
                          normalized === "inactive"
                        ) {
                          badgeClasses =
                            "bg-slate-100 text-slate-600 border-slate-200";
                          dotClass = "bg-slate-400";
                          displayLabel =
                            cellValue === "Closed" ? "Closed" : "Inactive";
                        }

                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 whitespace-nowrap"
                          >
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${badgeClasses}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full mr-1.5 ${dotClass}`}
                              />
                              {displayLabel}
                            </span>
                          </td>
                        );
                      }

                      // Note
                      if (headCell.id === "note" || headCell.id === "notes") {
                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 text-slate-600 max-w-xs truncate"
                            title={cellValue}
                          >
                            {truncateString(cellValue, 25) || "-"}
                          </td>
                        );
                      }

                      // Document Type Badge
                      if (headCell.id === "documentType") {
                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 whitespace-nowrap"
                          >
                            <StatusBadge type={cellValue} />
                          </td>
                        );
                      }

                      // Expiry Date (Calendar Icon)
                      if (
                        headCell.id === "expiryDate" ||
                        headCell.id === "due_date" ||
                        headCell.id === "start_date"
                      ) {
                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 text-slate-700 whitespace-nowrap"
                          >
                            <div className="flex items-center gap-2">
                              <FiCalendar className="w-3.5 h-3.5 text-slate-400" />
                              <span>{formatDate(cellValue)}</span>
                            </div>
                          </td>
                        );
                      }

                      // Alert Date (Bell Icon)
                      if (headCell.id === "alertDate") {
                        const alertDateVal = getDateBeforeDays(
                          row.expiryDate,
                          getConstant("DAYS_BEFORE_ALERT"),
                        );
                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 text-slate-700 whitespace-nowrap"
                          >
                            <div className="flex items-center gap-2">
                              <FiBell className="w-3.5 h-3.5 text-slate-400" />
                              <span>{alertDateVal}</span>
                            </div>
                          </td>
                        );
                      }

                      // Price formatting
                      if (headCell.formatPrice) {
                        cellValue = formatPrice(cellValue);
                      }

                      // Uppercase formatting
                      if (headCell.upperCase && cellValue) {
                        cellValue = convertToUpperCase(cellValue);
                      }

                      // Action Column
                      if (headCell.id === "action") {
                        const isMenuOpen = activeMenuId === row.id;

                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 text-center whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="relative inline-flex items-center justify-center gap-1.5">
                              {/* Amber Edit Pencil Icon */}
                              <button
                                type="button"
                                onClick={() => onClickEdit(row.id)}
                                title="Edit Document"
                                className="p-1.5 text-amber-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              >
                                <FiEdit className="w-4 h-4" />
                              </button>

                              {/* 3-dots Menu Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setActiveMenuId(isMenuOpen ? null : row.id)
                                }
                                title="More options"
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <FiMoreVertical className="w-4 h-4" />
                              </button>

                              {/* Dropdown Menu Popup */}
                              {isMenuOpen && (
                                <div
                                  ref={actionMenuRef}
                                  className="absolute right-0 top-8 w-36 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-40 animate-dropdown text-left"
                                >
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onClickEdit(row.id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50"
                                  >
                                    <FiEdit className="w-3.5 h-3.5 text-amber-500" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onClickDelete([row.id]);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50"
                                  >
                                    <FiTrash2 className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              )}
                            </div>
                          </td>
                        );
                      }

                      // Default Cell Render
                      return (
                        <td
                          key={headCell.id}
                          className="py-3.5 px-4 text-slate-700 whitespace-nowrap"
                        >
                          {cellValue || "-"}
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-5 text-xs md:text-sm text-slate-500">
        {/* Left: Records summary */}
        {isTableLoading ? (
          <div className="h-4 w-44 bg-slate-200/80 rounded-md animate-pulse" />
        ) : (
          <div>
            Showing {startRecord} to {endRecord} of {rows.length} records
          </div>
        )}

        {/* Right: Previous, Page Number Pills, Next */}
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
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
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
                  className={`min-w-[32px] h-8 px-2.5 rounded-lg text-xs font-bold transition-all ${
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
              className="p-2 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none transition-colors"
              aria-label="Next page"
            >
              <FiChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
