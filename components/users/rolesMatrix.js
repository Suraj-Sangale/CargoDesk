import React from "react";
import {
  FiShield,
  FiCheck,
  FiX,
  FiUsers,
  FiPlus,
  FiBriefcase,
  FiTool,
} from "react-icons/fi";
import { ROLE_DEFINITIONS, AVAILABLE_PERMISSIONS } from "./userFormModal";

export default function RolesMatrix({ users = [], onAddUserWithRole, onSelectRoleFilter }) {
  // Count users per role
  const roleCounts = users.reduce((acc, u) => {
    let r = (u.role || "office_staff").toLowerCase();
    if (r === "manager" || r === "dispatcher") r = "office_staff";
    if (r === "viewer") r = "maintenance_supervisor";
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  const getRoleIcon = (key) => {
    switch (key) {
      case "super_admin":
        return <FiShield className="w-5 h-5 text-purple-600" />;
      case "admin":
        return <FiBriefcase className="w-5 h-5 text-blue-600" />;
      case "office_staff":
        return <FiUsers className="w-5 h-5 text-sky-600" />;
      case "maintenance_supervisor":
        return <FiTool className="w-5 h-5 text-amber-600" />;
      default:
        return <FiShield className="w-5 h-5 text-slate-600" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Intro notice banner */}
      <div className="bg-gradient-to-r from-purple-900/10 via-blue-900/5 to-transparent border border-purple-200/60 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-purple-500/20">
            <FiShield className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800">
              Multi-Tenant Role Architecture & Permission Hierarchy
            </h4>
            <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
              Structured into 4 designated roles: <strong>Super Admin</strong> (global multi-tenant authority), <strong>Organization Admin</strong> (company management), <strong>Operations Coordinator</strong> (office staff handling dispatch & billing), and <strong>Fleet Maintenance Supervisor</strong> (vehicle upkeep & inspections).
            </p>
          </div>
        </div>
      </div>

      {/* Role Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {ROLE_DEFINITIONS.map((r) => {
          const userCount = roleCounts[r.key] || 0;
          return (
            <div
              key={r.key}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-xl ${r.iconColor}`}>
                    {getRoleIcon(r.key)}
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${r.badgeColor}`}
                  >
                    {r.level}
                  </span>
                </div>

                <h4 className="text-base font-bold text-slate-800 tracking-tight">{r.name}</h4>
                <p className="text-xs text-slate-500 mt-1 min-h-[48px] leading-relaxed">
                  {r.description}
                </p>

                {/* Users Count Pill */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
                    <FiUsers className="w-3.5 h-3.5 text-slate-400" />
                    Assigned Users
                  </span>
                  <button
                    onClick={() => onSelectRoleFilter && onSelectRoleFilter(r.key)}
                    className="text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-2.5 py-1 rounded-lg hover:bg-blue-100 transition-colors"
                    title="View members with this role"
                  >
                    {userCount} {userCount === 1 ? "User" : "Users"}
                  </button>
                </div>

                {/* Capabilities Checklist Preview */}
                <div className="mt-3 space-y-1.5">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    Module Access:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {AVAILABLE_PERMISSIONS.map((perm) => {
                      const hasAccess = r.defaultPermissions.includes(perm.id);
                      if (!hasAccess) return null;
                      return (
                        <span
                          key={perm.id}
                          className="text-[10px] font-medium bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1"
                        >
                          <FiCheck className="w-2.5 h-2.5 text-emerald-600 stroke-[3]" />
                          {perm.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Card Footer Action */}
              <div className="mt-5 pt-3 border-t border-slate-100">
                <button
                  onClick={() => onAddUserWithRole && onAddUserWithRole(r.key)}
                  className="w-full py-2 px-3 text-xs font-semibold text-slate-700 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 rounded-xl border border-slate-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <FiPlus className="w-3.5 h-3.5" />
                  Add as {r.name}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Permissions Matrix Comparison Table (Desktop view) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/60">
          <h4 className="text-sm font-bold text-slate-800">Complete Permissions Matrix</h4>
          <p className="text-xs text-slate-500 mt-0.5">
            Default module access for each role. Custom permissions can also be fine-tuned per user.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/70 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 min-w-[200px]">Module / Feature</th>
                {ROLE_DEFINITIONS.map((r) => (
                  <th key={r.key} className="py-3 px-3 text-center min-w-[120px]">
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {AVAILABLE_PERMISSIONS.map((perm) => (
                <tr key={perm.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4">
                    <p className="font-semibold text-slate-800">{perm.label}</p>
                    <p className="text-[11px] text-slate-400 font-normal">{perm.desc}</p>
                  </td>
                  {ROLE_DEFINITIONS.map((r) => {
                    const hasAccess = r.defaultPermissions.includes(perm.id);
                    return (
                      <td key={r.key} className="py-3 px-3 text-center">
                        {hasAccess ? (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700">
                            <FiCheck className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        ) : (
                          <div className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-300">
                            <FiX className="w-3.5 h-3.5" />
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
