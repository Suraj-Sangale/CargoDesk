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
  selected = [],
  setSelected = () => {},
  searchTerm = "",
  rowsPerPageOptions = [5, 10, 25],
}) {
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
        selected.slice(selectedIndex + 1)
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
  const isPartiallySelected = selected.length > 0 && selected.length < rows.length;

  const startRecord = rows.length === 0 ? 0 : page * rowsPerPage + 1;
  const endRecord = Math.min((page + 1) * rowsPerPage, rows.length);

  return (
    <div className="w-full">
      {/* Selected Items Bulk Action Bar */}
      {selected.length > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 mb-3 bg-blue-50/90 border border-blue-200 rounded-xl text-blue-900 transition-all">
          <div className="text-xs md:text-sm font-semibold">
            {selected.length} {selected.length === 1 ? "record" : "records"} selected
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
                  ref={(input) => {
                    if (input) input.indeterminate = isPartiallySelected;
                  }}
                  onChange={handleSelectAllClick}
                  className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500 cursor-pointer"
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
                      onClick={() => handleRequestSort(headCell.id)}
                      className="inline-flex items-center gap-1 hover:text-slate-900 focus:outline-none font-bold uppercase"
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
            {visibleRows.length === 0 ? (
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
                      if (headCell.id === "vehicleNo") {
                        return (
                          <td
                            key={headCell.id}
                            className="py-3.5 px-4 font-semibold text-slate-800 tracking-tight whitespace-nowrap"
                          >
                            {formatVehicleNumber(cellValue) || "-"}
                          </td>
                        );
                      }

                      // Note
                      if (headCell.id === "note") {
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
                          <td key={headCell.id} className="py-3.5 px-4 whitespace-nowrap">
                            <StatusBadge type={cellValue} />
                          </td>
                        );
                      }

                      // Expiry Date (Calendar Icon)
                      if (headCell.id === "expiryDate" || headCell.id === "due_date") {
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
                          getConstant("DAYS_BEFORE_ALERT")
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
        <div>
          Showing {startRecord} to {endRecord} of {rows.length} records
        </div>

        {/* Right: Previous, Page Number Pills, Next */}
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
      </div>
    </div>
  );
}
