import React, { useState, useEffect } from "react";
import CommonModal from "../common/commonModal";
import {
  FiUser,
  FiMail,
  FiPhone,
  FiLock,
  FiShield,
  FiCheck,
  FiX,
  FiEye,
  FiEyeOff,
  FiRefreshCw,
  FiBriefcase,
} from "react-icons/fi";
import { ImSpinner9 } from "react-icons/im";

export const AVAILABLE_PERMISSIONS = [
  {
    id: "dashboard",
    label: "Dashboard & Analytics",
    desc: "View system metrics, fleet summaries, and statistics",
  },
  {
    id: "documents",
    label: "Vehicle Documents",
    desc: "Upload and track PUC, insurance, fitness, and permits",
  },
  {
    id: "fleets",
    label: "Fleets & Vehicles",
    desc: "View, create, and manage vehicles and maintenance logs",
  },
  {
    id: "drivers",
    label: "Driver Management",
    desc: "Register drivers, assign vehicles, and review licenses",
  },
  {
    id: "invoice",
    label: "Invoices & Billing",
    desc: "Create, download, and send invoices and track EMI",
  },
  {
    id: "dailyorders",
    label: "Daily Orders",
    desc: "Create, schedule, and track day-to-day transport orders",
  },
  {
    id: "users",
    label: "Sub-Users & Roles",
    desc: "Invite team members, assign roles, and manage permissions",
  },
  {
    id: "organizations",
    label: "Organization Management",
    desc: "Create organizations and assign administrators",
  },
];

export const ROLE_DEFINITIONS = [
  {
    key: "super_admin",
    name: "Super Admin",
    badgeColor: "bg-purple-100 text-purple-700 border-purple-200",
    iconColor: "text-purple-600 bg-purple-50",
    description:
      "Global system control across all organizations. Can create/manage organizations and assign Admins.",
    level: "Global Access",
    defaultPermissions: [
      "dashboard",
      "documents",
      "fleets",
      "drivers",
      "invoice",
      "dailyorders",
      "users",
      "organizations",
    ],
  },
  {
    key: "admin",
    name: "Organization Admin",
    badgeColor: "bg-blue-100 text-blue-700 border-blue-200",
    iconColor: "text-blue-600 bg-blue-50",
    description:
      "Full administration for a company organization (fleets, drivers, billing, and staff management).",
    level: "Organization Full Access",
    defaultPermissions: [
      "dashboard",
      "documents",
      "fleets",
      "drivers",
      "invoice",
      "dailyorders",
      "users",
    ],
  },
  {
    key: "office_staff",
    name: "Operations Coordinator",
    badgeColor: "bg-sky-100 text-sky-700 border-sky-200",
    iconColor: "text-sky-600 bg-sky-50",
    description:
      "Office staff handling daily orders, customer dispatches, vehicle document verification, and billing.",
    level: "Operations Access",
    defaultPermissions: ["dashboard", "documents", "invoice", "dailyorders"],
  },
  {
    key: "maintenance_supervisor",
    name: "Fleet Maintenance Supervisor",
    badgeColor: "bg-amber-100 text-amber-700 border-amber-200",
    iconColor: "text-amber-600 bg-amber-50",
    description:
      "Vehicle maintenance handling person in charge of servicing, fitness/PUC renewals, repairs, and inspections.",
    level: "Maintenance Access",
    defaultPermissions: ["dashboard", "fleets", "documents"],
  },
];

export default function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  isEdit = false,
  userData = null,
  organizations = [],
  currentUser = null,
  isSubmitting = false,
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("office_staff");
  const [orgId, setOrgId] = useState("");
  const [status, setStatus] = useState("Active");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [errors, setErrors] = useState({});

  const isSuperAdmin =
    currentUser?.role === "super_admin" ||
    currentUser?.email === "suraj@agnibyte.com";

  useEffect(() => {
    if (userData && isEdit) {
      setFirstName(userData.firstName || "");
      setLastName(userData.lastName || "");
      setEmail(userData.email || "");
      setPhone(userData.phone || "");

      // Normalize legacy roles
      let normalizedRole = (userData.role || "office_staff").toLowerCase();
      if (normalizedRole === "manager" || normalizedRole === "dispatcher")
        normalizedRole = "office_staff";
      if (normalizedRole === "viewer")
        normalizedRole = "maintenance_supervisor";
      setRole(normalizedRole);

      setOrgId(userData.orgId || "");
      setStatus(
        userData.status === "Inactive" || userData.status === "0"
          ? "Inactive"
          : "Active",
      );
      setPassword("");

      let userPerms = [];
      if (
        Array.isArray(userData.permissions) &&
        userData.permissions.length > 0
      ) {
        userPerms = userData.permissions;
      } else {
        const matchingRole = ROLE_DEFINITIONS.find(
          (r) => r.key === normalizedRole,
        );
        userPerms = matchingRole
          ? matchingRole.defaultPermissions
          : ["dashboard"];
      }
      setSelectedPermissions(userPerms);
    } else {
      // Default new sub-user
      setFirstName("");
      setLastName("");
      setEmail("");
      setPhone("");
      // Super Admin can choose; other roles are strictly locked to their own organization
      const defaultOrgId = isSuperAdmin
        ? (userData?.orgId || organizations?.[0]?.orgId || "")
        : (currentUser?.orgId || "");
      setOrgId(defaultOrgId);
      setStatus("Active");
      setPassword("");
      const defaultRole = ROLE_DEFINITIONS.find(
        (r) => r.key === (userData?.role || "office_staff"),
      );
      setSelectedPermissions(defaultRole ? defaultRole.defaultPermissions : []);
    }
    setErrors({});
  }, [userData, isEdit, isOpen, organizations, currentUser]);

  const currentOrg = organizations.find(
    (o) => Number(o.orgId) === Number(currentUser?.orgId)
  );

  const handleRoleChange = (newRole) => {
    setRole(newRole);
    const matched = ROLE_DEFINITIONS.find((r) => r.key === newRole);
    if (matched) {
      setSelectedPermissions(matched.defaultPermissions);
    }
  };

  const togglePermission = (permId) => {
    setSelectedPermissions((prev) =>
      prev.includes(permId)
        ? prev.filter((p) => p !== permId)
        : [...prev, permId],
    );
  };

  const handleSelectAllPermissions = () => {
    if (selectedPermissions.length === AVAILABLE_PERMISSIONS.length) {
      setSelectedPermissions([]);
    } else {
      setSelectedPermissions(AVAILABLE_PERMISSIONS.map((p) => p.id));
    }
  };

  const generatePassword = () => {
    const chars =
      "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
    let generated = "";
    for (let i = 0; i < 10; i++) {
      generated += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPassword(generated);
    setShowPassword(true);
  };

  const validate = () => {
    const newErrors = {};
    if (!firstName.trim()) newErrors.firstName = "First name is required";
    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      newErrors.email = "Please enter a valid email address";
    }
    if (!isEdit && !password.trim()) {
      newErrors.password = "Password is required for new sub-user";
    } else if (password && password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    // Strict org security: non-super-admins cannot set or change orgId to another organization
    const effectiveOrgId = isSuperAdmin
      ? (orgId ? Number(orgId) : null)
      : (currentUser?.orgId ? Number(currentUser.orgId) : (orgId ? Number(orgId) : null));

    const payload = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      role: role.toLowerCase(),
      orgId: effectiveOrgId,
      status: status === "Active" ? "1" : "0",
      permissions: selectedPermissions,
    };

    if (password.trim()) {
      payload.password = password.trim();
    }

    if (isEdit && userData?.userId) {
      payload.userId = userData.userId;
    }

    onSubmit(payload);
  };

  // Filter selectable roles: Only Super Admin can assign Super Admin role
  const selectableRoles = ROLE_DEFINITIONS.filter((r) => {
    if (r.key === "super_admin" && !isSuperAdmin) return false;
    return true;
  });

  return (
    <CommonModal
      noScroll={true}
      modalOpen={isOpen}
      setModalOpen={onClose}
      backDrop={false}
      modalSize="w-11/12 sm:max-w-2xl"
    >
      <div className="w-full flex flex-col h-full min-h-0 overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <FiUser className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight">
                {isEdit ? "Edit Sub-User & Role" : "Add New Sub-User"}
              </h3>
              <p className="text-xs text-slate-300">
                {isEdit
                  ? "Update credentials, assign company organization, and modify permissions."
                  : "Invite a team member, select their organization, and assign their operational role."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            aria-label="Close modal"
          >
            <FiX className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-5 flex-1 min-h-0"
        >
          {/* Section 1: User Profile Details */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              Personal & Contact Information
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* First Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  First Name <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FiUser className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="e.g. Rahul"
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border ${
                      errors.firstName
                        ? "border-rose-400 bg-rose-50/30"
                        : "border-slate-200"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                  />
                </div>
                {errors.firstName && (
                  <p className="text-xs text-rose-500 mt-1">
                    {errors.firstName}
                  </p>
                )}
              </div>

              {/* Last Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Last Name
                </label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="e.g. Sharma"
                  className="w-full px-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FiMail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@cargodesk.com"
                    className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border ${
                      errors.email
                        ? "border-rose-400 bg-rose-50/30"
                        : "border-slate-200"
                    } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-rose-500 mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <FiPhone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Section 2: Organization & Role Assignment */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-indigo-600" />
              Organization & Role Assignment
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Organization Selector */}
              {isSuperAdmin ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assign Organization
                  </label>
                  <div className="relative">
                    <FiBriefcase className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <select
                      value={orgId}
                      onChange={(e) => setOrgId(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800"
                    >
                      <option value="">No Organization (Global / HQ)</option>
                      {organizations.map((org) => (
                        <option key={org.orgId} value={org.orgId}>
                          {org.orgName} ({org.orgCode || "ORG"})
                        </option>
                      ))}
                    </select>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Super Admin: Choose which company or branch this user belongs to.
                  </p>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Organization
                  </label>
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                      <FiBriefcase className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-slate-800 truncate">
                        {currentOrg?.orgName || "Your Organization"}
                      </p>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 font-medium">
                        <FiLock className="w-3 h-3 text-slate-400" />
                        Locked to your organization
                      </p>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Users you create are strictly provisioned for your company organization.
                  </p>
                </div>
              )}

              {/* Role Select */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Designated Role <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <FiShield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <select
                    value={role}
                    onChange={(e) => handleRoleChange(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium text-slate-800"
                  >
                    {selectableRoles.map((r) => (
                      <option key={r.key} value={r.key}>
                        {r.name}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="text-[11px] text-slate-500 mt-1">
                  {ROLE_DEFINITIONS.find((r) => r.key === role)?.description}
                </p>
              </div>

              {/* Account Status */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Account Status
                </label>
                <div className="flex items-center gap-3 max-w-xs">
                  <button
                    type="button"
                    onClick={() => setStatus("Active")}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                      status === "Active"
                        ? "bg-emerald-50 text-emerald-700 border-emerald-300 ring-2 ring-emerald-500/20"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Active
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("Inactive")}
                    className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold border transition-all flex items-center justify-center gap-1.5 ${
                      status === "Inactive"
                        ? "bg-rose-50 text-rose-700 border-rose-300 ring-2 ring-rose-500/20"
                        : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
                    }`}
                  >
                    <span className="w-2 h-2 rounded-full bg-rose-500" />
                    Inactive
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Password */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-600" />
                {isEdit ? "Change Password (Optional)" : "Security & Password"}
              </h4>
              <button
                type="button"
                onClick={generatePassword}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 hover:underline"
              >
                <FiRefreshCw className="w-3 h-3" />
                Generate Password
              </button>
            </div>
            <div className="relative">
              <FiLock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={
                  isEdit
                    ? "Leave blank to keep existing password"
                    : "Min. 6 characters"
                }
                className={`w-full pl-9 pr-20 py-2 text-sm rounded-xl border ${
                  errors.password
                    ? "border-rose-400 bg-rose-50/30"
                    : "border-slate-200"
                } focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-mono`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 text-xs"
              >
                {showPassword ? (
                  <FiEyeOff className="w-4 h-4" />
                ) : (
                  <FiEye className="w-4 h-4" />
                )}
              </button>
            </div>
            {errors.password && (
              <p className="text-xs text-rose-500 mt-1">{errors.password}</p>
            )}
          </div>

          {/* Section 4: Granular Permissions Checklist */}
          <div className="pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2.5">
              <div>
                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  Module Access Permissions
                </h4>
                <p className="text-[11px] text-slate-500">
                  Preset automatically based on role; fine-tune permissions as
                  required.
                </p>
              </div>
              <button
                type="button"
                onClick={handleSelectAllPermissions}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
              >
                {selectedPermissions.length === AVAILABLE_PERMISSIONS.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {AVAILABLE_PERMISSIONS.map((perm) => {
                const checked = selectedPermissions.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    onClick={() => togglePermission(perm.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border cursor-pointer select-none transition-all ${
                      checked
                        ? "bg-blue-50/60 border-blue-300 ring-1 ring-blue-500/20"
                        : "bg-slate-50/50 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                    }`}
                  >
                    <div
                      className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center shrink-0 transition-colors ${
                        checked
                          ? "bg-blue-600 text-white"
                          : "border border-slate-300 bg-white"
                      }`}
                    >
                      {checked && <FiCheck className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-slate-800 leading-tight truncate">
                        {perm.label}
                      </p>
                      <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                        {perm.desc}
                      </p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>
        </form>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200/70 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 active:scale-98 rounded-xl shadow-md shadow-blue-600/25 transition-all flex items-center gap-1.5"
          >
            {isSubmitting ? (
              <>
                <ImSpinner9 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>{isEdit ? "Update Member" : "Create Member"}</span>
            )}
          </button>
        </div>
      </div>
    </CommonModal>
  );
}
