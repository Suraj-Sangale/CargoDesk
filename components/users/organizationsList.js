import React from "react";
import {
  FiBriefcase,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiUsers,
  FiShield,
  FiMail,
  FiPhone,
  FiMapPin,
  FiUserPlus,
  FiLayers,
} from "react-icons/fi";

export default function OrganizationsList({
  organizations = [],
  onOpenCreate,
  onOpenEdit,
  onDelete,
  onAddAdminToOrg,
}) {
  return (
    <div className="space-y-5">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-purple-900/10 via-indigo-900/5 to-transparent border border-purple-200/60 rounded-2xl p-4 sm:p-5">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/20">
            <FiBriefcase className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              Tenant Organizations & Administrator Allocation
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Super Admin can create distinct Organizations (companies/depots). Each organization has its own designated Administrators, Operations Staff, and Fleet Maintenance Personnel.
            </p>
          </div>
        </div>

        <button
          onClick={onOpenCreate}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-semibold rounded-xl shadow-md shadow-purple-600/25 transition-all flex items-center gap-1.5 shrink-0"
        >
          <FiPlus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>New Organization</span>
        </button>
      </div>

      {/* Organizations Grid */}
      {organizations.length === 0 ? (
        <div className="py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
          <FiBriefcase className="w-8 h-8 text-slate-400 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-700">No organizations registered yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Click &quot;New Organization&quot; above to create your first company or depot.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {organizations.map((org) => {
            const adminCount = Number(org.adminCount) || 0;
            const memberCount = Number(org.memberCount) || 0;
            const isActive = org.status !== "Inactive";

            return (
              <div
                key={org.orgId}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Top: Icon + Code + Status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
                        {org.orgCode ? org.orgCode.substring(0, 2) : "CD"}
                      </div>
                      <div>
                        <span className="text-[10px] font-bold font-mono bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                          {org.orgCode || "ORG"}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isActive
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                          : "bg-rose-50 text-rose-700 border-rose-200"
                      }`}
                    >
                      {isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Title & Address */}
                  <h4 className="text-base font-bold text-slate-800 tracking-tight">
                    {org.orgName}
                  </h4>
                  {org.address && (
                    <p className="text-xs text-slate-500 mt-1 flex items-start gap-1.5 leading-relaxed">
                      <FiMapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{org.address}</span>
                    </p>
                  )}

                  {/* Contact info */}
                  <div className="mt-3 pt-3 border-t border-slate-100 space-y-1 text-xs text-slate-600">
                    {org.contactEmail && (
                      <p className="flex items-center gap-2 truncate text-slate-500">
                        <FiMail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{org.contactEmail}</span>
                      </p>
                    )}
                    {org.contactPhone && (
                      <p className="flex items-center gap-2 text-slate-500">
                        <FiPhone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{org.contactPhone}</span>
                      </p>
                    )}
                  </div>

                  {/* Metrics Badge */}
                  <div className="mt-4 grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                    <div>
                      <p className="text-[10px] font-bold text-purple-700 uppercase flex items-center justify-center gap-1">
                        <FiShield className="w-3 h-3" />
                        Admins
                      </p>
                      <p className="text-base font-bold text-slate-800 mt-0.5">{adminCount}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-blue-700 uppercase flex items-center justify-center gap-1">
                        <FiUsers className="w-3 h-3" />
                        Staff / Total
                      </p>
                      <p className="text-base font-bold text-slate-800 mt-0.5">{memberCount}</p>
                    </div>
                  </div>

                  {/* Module Access Provisioning Indicator */}
                  <div className="mt-2.5 flex items-center justify-between text-[11px] bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                    <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                      <FiLayers className="w-3.5 h-3.5 text-purple-600" />
                      Module Access:
                    </span>
                    {Array.isArray(org.allowedModules) && org.allowedModules.length < 9 ? (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        {org.allowedModules.length}/9 Active (Blocked {9 - org.allowedModules.length})
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        All 9 Modules Active
                      </span>
                    )}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <button
                    onClick={() => onAddAdminToOrg && onAddAdminToOrg(org.orgId)}
                    className="flex-1 py-1.5 px-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1"
                    title="Add an administrator for this organization"
                  >
                    <FiUserPlus className="w-3.5 h-3.5" />
                    <span>Assign Admin</span>
                  </button>
                  <button
                    onClick={() => onOpenEdit && onOpenEdit(org)}
                    className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    title="Edit Organization"
                  >
                    <FiEdit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDelete && onDelete(org)}
                    className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Organization"
                  >
                    <FiTrash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
