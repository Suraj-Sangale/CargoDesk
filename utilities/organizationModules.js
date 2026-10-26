/**
 * Organization Modules Definition
 * Used for Super Admin multi-tenant feature provisioning & organization access blocking
 */

export const ORGANIZATION_MODULES = [
  {
    id: "dashboard",
    name: "Dashboard",
    path: "/",
    desc: "Overview metrics, fleet summary & statistics",
  },
  {
    id: "documents",
    name: "Documents",
    path: "/documents",
    desc: "Vehicle RC, PUC, Fitness, Insurance & Permits",
  },
  {
    id: "messager",
    name: "Messenger",
    path: "/messager",
    desc: "WhatsApp & SMS customer messaging and groups",
  },
  {
    id: "invoice",
    name: "Invoice & Billing",
    path: "/invoice",
    desc: "Invoices, billing generation, and payment records",
  },
  {
    id: "dailyorders",
    name: "Daily Orders",
    path: "/dailyorders",
    desc: "Day-to-day transportation order dispatch and scheduling",
  },
  {
    id: "fleets",
    name: "Fleets & Vehicles",
    path: "/fleets",
    desc: "Vehicle profiles, odometer, and maintenance logs",
  },
  {
    id: "drivers",
    name: "Drivers",
    path: "/drivers",
    desc: "Driver registry, licenses, and assigned fleets",
  },
  {
    id: "users",
    name: "Sub Users",
    path: "/users",
    desc: "Organization sub-users, team accounts, and role assignment",
  },
  {
    id: "apps",
    name: "Apps & Tools",
    path: "/apps",
    desc: "Connected ecosystem, GPS, FASTag, and integrations",
  },
];

export const ALL_MODULE_IDS = ORGANIZATION_MODULES.map((m) => m.id);

/**
 * Returns which module ID corresponds to a given pathname.
 * e.g. "/messager" -> "messager"
 * e.g. "/messager/manage-contacts" -> "messager"
 * e.g. "/invoice/new" -> "invoice"
 * e.g. "/fleet/123" -> "fleets"
 * e.g. "/" -> "dashboard"
 */
export function getModuleIdFromPath(pathname = "") {
  if (!pathname || pathname === "/") return "dashboard";
  const cleanPath = pathname.split("?")[0].toLowerCase();

  if (cleanPath.startsWith("/messager")) return "messager";
  if (cleanPath.startsWith("/invoice")) return "invoice";
  if (cleanPath.startsWith("/dailyorder")) return "dailyorders";
  if (cleanPath.startsWith("/fleet")) return "fleets";
  if (cleanPath.startsWith("/driver")) return "drivers";
  if (cleanPath.startsWith("/document")) return "documents";
  if (cleanPath.startsWith("/user")) return "users";
  if (cleanPath.startsWith("/app")) return "apps";

  return null;
}
