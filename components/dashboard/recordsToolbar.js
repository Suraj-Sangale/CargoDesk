import React, { useState } from "react";
import { FiSearch, FiFilter, FiPlus, FiX } from "react-icons/fi";

export default function RecordsToolbar({
  totalCount = 0,
  searchTerm = "",
  setSearchTerm,
  onAddDocument,
  appliedFilters = [],
  onRemoveFilter,
  documentsTypeList = [],
  onFilterClick,
}) {
  const [filterMenuOpen, setFilterMenuOpen] = useState(false);

  return (
    <div className="space-y-4">
      {/* Top Header Row */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Title + Count Badge */}
        <div className="flex items-center gap-3">
          <h2 className="text-lg md:text-xl font-bold text-slate-900 tracking-tight">
            All Records
          </h2>
          <span className="inline-flex items-center justify-center bg-blue-100 text-blue-600 text-xs font-bold px-2.5 py-0.5 rounded-full">
            {totalCount}
          </span>
        </div>

        {/* Right Toolbar: Search, Filter, + Add Document */}
        <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
          {/* Search Input */}
          <div className="relative flex-1 sm:w-72 md:w-80">
            <FiSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by vehicle number, note, or type..."
              className="w-full pl-10 pr-4 py-2 text-xs md:text-sm bg-white border border-slate-200 hover:border-slate-300 text-slate-800 placeholder-slate-400 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all outline-none"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                title="Clear search"
              >
                <FiX className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Dropdown Button */}
          <div className="relative">
            <button
              onClick={() => setFilterMenuOpen(!filterMenuOpen)}
              className={`flex items-center gap-2 px-3.5 py-2 text-xs md:text-sm font-medium rounded-xl border transition-all ${
                appliedFilters.length > 0 || filterMenuOpen
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <FiFilter className="w-4 h-4" />
              <span>Filter</span>
              {appliedFilters.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-blue-600" />
              )}
            </button>

            {/* Filter Menu Popup */}
            {filterMenuOpen && (
              <div className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 p-3 z-30 animate-dropdown">
                <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-2 py-1 mb-1">
                  Filter by Type
                </div>
                <div className="space-y-1">
                  {documentsTypeList.map((type) => {
                    const isSelected = appliedFilters.includes(type.value);
                    return (
                      <button
                        key={type.id}
                        onClick={() => onFilterClick(type.value)}
                        className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          isSelected
                            ? "bg-blue-100 text-blue-700 font-semibold"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        <span>{type.label}</span>
                        {isSelected && <span>✓</span>}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* + Add Document Button */}
          <button
            onClick={onAddDocument}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs md:text-sm font-semibold rounded-xl shadow-sm shadow-blue-600/20 hover:shadow-md transition-all cursor-pointer"
          >
            <FiPlus className="w-4 h-4" />
            <span>Add Document</span>
          </button>
        </div>
      </div>

      {/* Applied Filters Chips */}
      {appliedFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs font-medium text-slate-400">Active filters:</span>
          {appliedFilters.map((filterVal) => {
            const match = documentsTypeList.find((t) => t.value === filterVal);
            return (
              <span
                key={filterVal}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs"
              >
                <span>{match ? match.label : filterVal}</span>
                <button
                  onClick={() => onRemoveFilter(filterVal)}
                  className="text-blue-500 hover:text-blue-800 focus:outline-none"
                  title="Remove filter"
                >
                  <FiX className="w-3 h-3" />
                </button>
              </span>
            );
          })}
          <button
            onClick={() => appliedFilters.forEach(onRemoveFilter)}
            className="text-xs text-slate-400 hover:text-slate-700 underline font-medium ml-1"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
