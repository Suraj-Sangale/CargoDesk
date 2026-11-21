import Papa from "papaparse";
import moment from "moment";

/**
 * Trigger browser file download from a Blob
 */
function downloadBlob(blob, filename) {
  if (typeof window === "undefined") return;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}

/**
 * Export data array to CSV using PapaParse with UTF-8 BOM
 */
export function exportToCsv(filename, data) {
  try {
    const csvString = Papa.unparse(data, {
      quotes: true,
      header: true,
    });
    // \uFEFF BOM ensures Microsoft Excel on Windows/Mac opens UTF-8 (and ₹ symbols) cleanly
    const blob = new Blob(["\uFEFF" + csvString], {
      type: "text/csv;charset=utf-8;",
    });
    downloadBlob(blob, filename);
    return true;
  } catch (err) {
    console.error("Error exporting to CSV:", err);
    throw err;
  }
}

/**
 * Open a clean, styled printable document in a new window that triggers Save as PDF / Print
 */
export function openPrintPdfWindow(title, bodyHtml) {
  if (typeof window === "undefined") return;

  const printWindow = window.open(
    "",
    "_blank",
    "width=960,height=800,menubar=no,toolbar=no",
  );
  if (!printWindow) {
    alert(
      "Popup was blocked by your browser. Please allow popups for CargoDesk to export PDF.",
    );
    return;
  }

  const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #0f172a;
      background: #f8fafc;
      font-size: 12px;
      line-height: 1.5;
      padding: 24px;
    }
    .no-print-bar {
      position: sticky;
      top: 0;
      background: #1e293b;
      color: #ffffff;
      padding: 12px 20px;
      margin: -24px -24px 24px -24px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      z-index: 1000;
    }
    .no-print-bar h3 {
      font-size: 14px;
      font-weight: 600;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .btn-group {
      display: flex;
      gap: 8px;
    }
    .btn {
      padding: 7px 16px;
      font-size: 12px;
      font-weight: 600;
      border-radius: 8px;
      border: none;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
    }
    .btn-primary {
      background: #2563eb;
      color: #ffffff;
    }
    .btn-primary:hover {
      background: #1d4ed8;
    }
    .btn-secondary {
      background: #475569;
      color: #ffffff;
    }
    .btn-secondary:hover {
      background: #334155;
    }
    .report-sheet {
      background: #ffffff;
      max-width: 900px;
      margin: 0 auto;
      padding: 32px;
      border-radius: 12px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
    }
    .header-banner {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      border-bottom: 2px solid #2563eb;
      padding-bottom: 16px;
      margin-bottom: 20px;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #1e293b;
      letter-spacing: -0.5px;
    }
    .brand-subtitle {
      font-size: 11px;
      color: #64748b;
      margin-top: 2px;
    }
    .meta-box {
      text-align: right;
      font-size: 11px;
      color: #475569;
    }
    .meta-box strong {
      color: #0f172a;
    }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 9999px;
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border: 1px solid transparent;
    }
    .badge-active { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
    .badge-maintenance { background: #fffbeb; color: #b45309; border-color: #fde68a; }
    .badge-transit { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
    .badge-completed { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
    .badge-inprogress { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
    .badge-reported { background: #fffbeb; color: #b45309; border-color: #fde68a; }
    .badge-cancelled { background: #f1f5f9; color: #475569; border-color: #cbd5e1; }

    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .summary-card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 12px;
    }
    .summary-card-title {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 700;
      color: #64748b;
      letter-spacing: 0.5px;
    }
    .summary-card-val {
      font-size: 16px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 4px;
    }
    .summary-card-sub {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 2px;
    }

    .section-title {
      font-size: 13px;
      font-weight: 700;
      color: #1e293b;
      border-left: 3px solid #2563eb;
      padding-left: 8px;
      margin: 20px 0 10px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table.data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 20px;
    }
    table.data-table th, table.data-table td {
      border: 1px solid #e2e8f0;
      padding: 8px 10px;
      text-align: left;
    }
    table.data-table th {
      background: #f1f5f9;
      color: #334155;
      font-weight: 700;
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    table.data-table tr:nth-child(even) td {
      background: #fafafa;
    }
    table.kv-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-bottom: 16px;
    }
    table.kv-table td {
      border: 1px solid #e2e8f0;
      padding: 7px 12px;
    }
    table.kv-table td.kv-key {
      background: #f8fafc;
      font-weight: 600;
      color: #475569;
      width: 25%;
    }
    table.kv-table td.kv-val {
      color: #0f172a;
      font-weight: 500;
      width: 25%;
    }

    .footer-note {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px dashed #cbd5e1;
      display: flex;
      justify-content: space-between;
      color: #94a3b8;
      font-size: 10px;
    }

    @media print {
      body {
        background: #ffffff !important;
        padding: 0 !important;
        font-size: 10.5pt;
      }
      .no-print-bar {
        display: none !important;
      }
      .report-sheet {
        border: none !important;
        box-shadow: none !important;
        padding: 0 !important;
        max-width: 100% !important;
      }
      @page {
        size: A4 portrait;
        margin: 12mm 15mm 15mm 15mm;
      }
      table.data-table tr {
        page-break-inside: avoid;
      }
      .badge {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
      .summary-card {
        -webkit-print-color-adjust: exact !important;
        print-color-adjust: exact !important;
      }
    }
  </style>
</head>
<body>
  <div class="no-print-bar">
    <h3>
      <span>📄</span> CargoDesk Report Preview
    </h3>
    <div class="btn-group">
      <button class="btn btn-primary" onclick="window.print()">
        🖨️ Save as PDF / Print
      </button>
      <button class="btn btn-secondary" onclick="window.close()">
        ✕ Close
      </button>
    </div>
  </div>

  <div class="report-sheet">
    ${bodyHtml}
  </div>

  <script>
    // Prompt print dialog after a slight delay for styles to settle
    window.onload = function() {
      setTimeout(function() {
        window.print();
      }, 350);
    };
  </script>
</body>
</html>`;

  printWindow.document.open();
  printWindow.document.write(fullHtml);
  printWindow.document.close();
}

/**
 * ============================================================================
 * 1. VEHICLE OVERVIEW EXPORT (CSV & PDF)
 * ============================================================================
 */

export function buildVehicleOverviewRows(fleet, summary = {}) {
  const vNo = fleet?.vehicle_number || "MH 03 CD 5678";
  const status = (fleet?.status || "Active").trim();
  const fleetId = fleet?.id ? `FL-${String(fleet.id).padStart(6, "0")}` : "N/A";

  const totalExpense =
    summary.total_expenditure !== undefined
      ? Number(summary.total_expenditure || 0).toFixed(2)
      : "0.00";
  const totalServices =
    summary.total_records !== undefined
      ? summary.total_records
      : fleet?.counts?.maintenance || 0;
  const lastService = summary.last_maintenance_date
    ? moment(summary.last_maintenance_date).format("YYYY-MM-DD")
    : "None Recorded";

  return [
    {
      "Vehicle ID": fleetId,
      "Vehicle Number": vNo,
      "Model & Make": fleet?.vehicle_model || "",
      "Vehicle Type": fleet?.vehicle_type || "",
      "Operational Status": status,
      "Ownership Type": fleet?.ownership_type || "Owned",
      "Manufacturing Year": fleet?.manufacturing_year || "",
      "Chassis / VIN Number": fleet?.chassis_number || "",
      "Engine Number": fleet?.engine_number || "",
      "Fuel Type": fleet?.fuel_type || "Diesel",
      "Payload Capacity": fleet?.capacity || "",
      "GPS Tracking ID": fleet?.gps_tracking_id || "",
      "Assigned Driver Name": fleet?.driver_name || "Unassigned",
      "Driver Contact Number":
        fleet?.driver_contact || fleet?.contact_number || "",
      "Driver License Number": fleet?.driver_license_number || "",
      "Driver Status": fleet?.driver_status || "",
      "RC Expiry Date": fleet?.rc_expiry
        ? moment(fleet.rc_expiry).format("YYYY-MM-DD")
        : "",
      "Total Registered Documents":
        fleet?.counts?.documents ||
        (Array.isArray(fleet?.documents) ? fleet.documents.length : 0),
      "Active EMI Loans":
        fleet?.counts?.emi ||
        (Array.isArray(fleet?.emi) ? fleet.emi.length : 0),
      "Total Maintenance Logged": totalServices,
      "Total Maintenance Cost (INR)": totalExpense,
      "Last Service Date": lastService,
      "Organization Name":
        fleet?.organization_name || fleet?.orgName || fleet?.orgCode || "",
      "Operational Notes": (fleet?.notes || "").replace(/\r?\n/g, " "),
      "Created On": fleet?.created_at
        ? moment(fleet.created_at).format("YYYY-MM-DD HH:mm")
        : "",
    },
  ];
}

export function exportVehicleOverviewCsv(fleet, summary = {}) {
  const vNo = (fleet?.vehicle_number || "vehicle").replace(/\s+/g, "_");
  const dateStr = moment().format("YYYY-MM-DD");
  const filename = `Vehicle_Overview_${vNo}_${dateStr}.csv`;
  const rows = buildVehicleOverviewRows(fleet, summary);
  return exportToCsv(filename, rows);
}

/**
 * Helper to determine logged-in user or fleet's organization title for report branding
 */
export function getOrganizationTitle(fleet = null, summary = {}) {
  if (summary?.orgName) return String(summary.orgName).toUpperCase();
  if (summary?.organization_name)
    return String(summary.organization_name).toUpperCase();

  if (typeof window !== "undefined") {
    const pageUser = window.__NEXT_DATA__?.props?.pageData?.user;
    if (pageUser?.orgName) return String(pageUser.orgName).toUpperCase();
    if (pageUser?.organization_name)
      return String(pageUser.organization_name).toUpperCase();
  }

  if (fleet?.organization_name)
    return String(fleet.organization_name).toUpperCase();
  if (fleet?.orgName) return String(fleet.orgName).toUpperCase();
  if (fleet?.orgCode) return String(fleet.orgCode).toUpperCase();

  return "CARGODESK FLEET MANAGEMENT";
}

export function exportVehicleOverviewPdf(fleet, summary = {}) {
  const vNo = fleet?.vehicle_number || "MH 03 CD 5678";
  const fleetId = fleet?.id ? `FL-${String(fleet.id).padStart(6, "0")}` : "N/A";
  const status = (fleet?.status || "Active").trim();
  const dateStr = moment().format("DD MMM YYYY, hh:mm A");
  const orgTitle = getOrganizationTitle(fleet, summary);

  const totalExpense =
    summary.total_expenditure !== undefined
      ? Number(summary.total_expenditure || 0).toLocaleString("en-IN")
      : "0";
  const totalServices =
    summary.total_records !== undefined
      ? summary.total_records
      : fleet?.counts?.maintenance || 0;
  const lastService = summary.last_maintenance_date
    ? moment(summary.last_maintenance_date).format("DD MMM YYYY")
    : "None Recorded";

  const statusBadgeClass =
    status.toLowerCase() === "active"
      ? "badge-active"
      : status.toLowerCase() === "maintenance"
        ? "badge-maintenance"
        : "badge-transit";

  const bodyHtml = `
    <div class="header-banner">
      <div>
        <h1 class="brand-title">${orgTitle}</h1>
        <p class="brand-subtitle">Vehicle Master Profile & Executive Compliance Overview &bull; By CargoDesk</p>
      </div>
      <div class="meta-box">
        <div><strong>Vehicle:</strong> ${vNo}</div>
        <div><strong>Vehicle ID:</strong> ${fleetId}</div>
        <div><strong>Generated:</strong> ${dateStr}</div>
      </div>
    </div>

    <!-- Vehicle Headline -->
    <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 20px; background: #f8fafc; padding: 14px 18px; border-radius: 10px; border: 1px solid #e2e8f0;">
      <div>
        <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.5px;">${vNo}</div>
        <div style="font-size: 12px; color: #64748b; font-weight: 600; margin-top: 2px;">
          ${fleet?.vehicle_model || "Commercial Truck"} &bull; ${fleet?.vehicle_type || "Goods Carrier"} &bull; ${fleet?.ownership_type || "Owned"}
        </div>
      </div>
      <div>
        <span class="badge ${statusBadgeClass}">${status}</span>
      </div>
    </div>

    <!-- KPI Summary Grid -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-card-title">Operational State</div>
        <div class="summary-card-val">${status}</div>
        <div class="summary-card-sub">Vehicle status</div>
      </div>
      <div class="summary-card">
        <div class="summary-card-title">Assigned Driver</div>
        <div class="summary-card-val" style="font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;" title="${fleet?.driver_name || "Unassigned"}">
          ${fleet?.driver_name || "Unassigned"}
        </div>
        <div class="summary-card-sub">${fleet?.driver_contact || "No Phone"}</div>
      </div>
      <div class="summary-card">
        <div class="summary-card-title">Maintenance Records</div>
        <div class="summary-card-val">${totalServices} Services</div>
        <div class="summary-card-sub">Last: ${lastService}</div>
      </div>
      <div class="summary-card">
        <div class="summary-card-title">Lifetime Expense</div>
        <div class="summary-card-val">₹${totalExpense}</div>
        <div class="summary-card-sub">Logged expenditure</div>
      </div>
    </div>

    <!-- 1. Technical Specifications -->
    <div class="section-title">1. Technical & Registration Specifications</div>
    <table class="kv-table">
      <tr>
        <td class="kv-key">Vehicle Identifier</td>
        <td class="kv-val"><strong>${fleetId}</strong></td>
        <td class="kv-key">Registration Number</td>
        <td class="kv-val"><strong>${vNo}</strong></td>
      </tr>
      <tr>
        <td class="kv-key">Make & Model</td>
        <td class="kv-val">${fleet?.vehicle_model || "N/A"}</td>
        <td class="kv-key">Vehicle Type</td>
        <td class="kv-val">${fleet?.vehicle_type || "N/A"}</td>
      </tr>
      <tr>
        <td class="kv-key">Chassis / VIN Number</td>
        <td class="kv-val" style="font-family: monospace;">${fleet?.chassis_number || "N/A"}</td>
        <td class="kv-key">Engine Number</td>
        <td class="kv-val" style="font-family: monospace;">${fleet?.engine_number || "N/A"}</td>
      </tr>
      <tr>
        <td class="kv-key">Fuel Type</td>
        <td class="kv-val">${fleet?.fuel_type || "Diesel"}</td>
        <td class="kv-key">Carrying Capacity</td>
        <td class="kv-val">${fleet?.capacity || "N/A"}</td>
      </tr>
      <tr>
        <td class="kv-key">Manufacturing Year</td>
        <td class="kv-val">${fleet?.manufacturing_year || "N/A"}</td>
        <td class="kv-key">GPS Tracker ID</td>
        <td class="kv-val">${fleet?.gps_tracking_id || "Not Configured"}</td>
      </tr>
      <tr>
        <td class="kv-key">Ownership Model</td>
        <td class="kv-val">${fleet?.ownership_type || "Owned"}</td>
        <td class="kv-key">RC Expiry Date</td>
        <td class="kv-val">${fleet?.rc_expiry ? moment(fleet.rc_expiry).format("DD MMM YYYY") : "N/A"}</td>
      </tr>
    </table>

    <!-- 2. Operations & Assigned Driver -->
    <div class="section-title">2. Driver & Operational Assignment</div>
    <table class="kv-table">
      <tr>
        <td class="kv-key">Assigned Driver</td>
        <td class="kv-val"><strong>${fleet?.driver_name || "Unassigned"}</strong></td>
        <td class="kv-key">Driver Contact</td>
        <td class="kv-val">${fleet?.driver_contact || fleet?.contact_number || "N/A"}</td>
      </tr>
      <tr>
        <td class="kv-key">License Number</td>
        <td class="kv-val">${fleet?.driver_license_number || "N/A"}</td>
        <td class="kv-key">License Type / Status</td>
        <td class="kv-val">${fleet?.driver_license_type || "Commercial"} / ${fleet?.driver_status || "Active"}</td>
      </tr>
      <tr>
        <td class="kv-key">Branch / Organization</td>
        <td class="kv-val" colspan="3">${fleet?.organization_name || fleet?.orgName || fleet?.orgCode || "Headquarters"}</td>
      </tr>
    </table>

    <!-- 3. Compliance & Financing -->
    <div class="section-title">3. Compliance, Documents & Financing</div>
    <table class="kv-table">
      <tr>
        <td class="kv-key">Total Registered Documents</td>
        <td class="kv-val">${fleet?.counts?.documents || (Array.isArray(fleet?.documents) ? fleet.documents.length : 0)} Documents</td>
        <td class="kv-key">Active EMI Loan Accounts</td>
        <td class="kv-val">${fleet?.counts?.emi || (Array.isArray(fleet?.emi) ? fleet.emi.length : 0)} Active Loans</td>
      </tr>
    </table>

    <!-- 4. Notes & Operational Remarks -->
    ${
  fleet?.notes?.trim()
    ? `
      <div class="section-title">4. Operational Notes & Remarks</div>
      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; font-size: 11px; color: #334155; line-height: 1.6;">
        ${fleet.notes}
      </div>
    `
    : ""
}

    <div class="footer-note">
      <span>CargoDesk Logistics Management &bull; Vehicle Master Profile Report</span>
      <span>Confidential &bull; Generated on ${dateStr}</span>
    </div>
  `;

  openPrintPdfWindow(`Vehicle_Overview_${vNo}`, bodyHtml);
}

/**
 * ============================================================================
 * 2. VEHICLE MAINTENANCE HISTORY EXPORT (CSV & PDF)
 * ============================================================================
 */

export function buildMaintenanceHistoryRows(records = [], fleet = {}) {
  const vNo = fleet?.vehicle_number || "";
  const vModel = fleet?.vehicle_model || "";

  return (records || []).map((r) => {
    const recId = r.id ? `MNT-${String(r.id).padStart(6, "0")}` : "N/A";
    const serviceDate = r.maintenance_date
      ? moment(r.maintenance_date).format("YYYY-MM-DD")
      : "";
    const createdTimestamp = r.created_at
      ? moment(r.created_at).format("YYYY-MM-DD HH:mm")
      : "";
    const costFormatted = Number(r.cost || 0).toFixed(2);
    const mediaCount =
      r.media_count || (Array.isArray(r.media) ? r.media.length : 0);

    return {
      "Record ID": recId,
      "Vehicle Number": r.vehicle_number || vNo,
      "Vehicle Model": r.vehicle_model || vModel,
      "Service Date": serviceDate,
      "Maintenance Category": r.maintenance_type || "Regular Service",
      Status: r.status || "Reported",
      "Total Cost (INR)": costFormatted,
      "Odometer Reading (KM)": r.odometer_reading
        ? Number(r.odometer_reading)
        : "",
      "Garage / Workshop": r.garage_name || "Self / Workshop",
      "Invoice Number": r.invoice_number || "",
      "Problem & Work Description": (r.description || "").replace(
        /\r?\n/g,
        " ",
      ),
      "Mechanic Remarks": (r.additional_notes || "").replace(/\r?\n/g, " "),
      "Evidence Attachments Count": mediaCount,
      "Logged By": r.created_by_name || "System",
      "Logged Timestamp": createdTimestamp,
    };
  });
}

export function exportMaintenanceHistoryCsv(records, fleet, summary = {}) {
  const vNo = (fleet?.vehicle_number || "vehicle").replace(/\s+/g, "_");
  const dateStr = moment().format("YYYY-MM-DD");
  const filename = `Maintenance_History_${vNo}_${dateStr}.csv`;
  const rows = buildMaintenanceHistoryRows(records, fleet);
  return exportToCsv(filename, rows);
}

export function exportMaintenanceHistoryPdf(records, fleet, summary = {}) {
  const vNo = fleet?.vehicle_number || "MH 03 CD 5678";
  const vModel = fleet?.vehicle_model || "Commercial Vehicle";
  const dateStr = moment().format("DD MMM YYYY, hh:mm A");
  const orgTitle = getOrganizationTitle(fleet, summary);

  const totalExpense =
    summary.total_expenditure !== undefined
      ? Number(summary.total_expenditure || 0).toLocaleString("en-IN")
      : "0";
  const totalServices = records?.length || summary.total_records || 0;
  const lastService = summary.last_maintenance_date
    ? moment(summary.last_maintenance_date).format("DD MMM YYYY")
    : "None Recorded";

  const getBadgeClass = (st) => {
    switch (st) {
      case "Completed":
        return "badge-completed";
      case "In Progress":
        return "badge-inprogress";
      case "Cancelled":
        return "badge-cancelled";
      default:
        return "badge-reported";
    }
  };

  const rowsHtml = (records || [])
    .map((r, idx) => {
      const recId = r.id
        ? `MNT-${String(r.id).padStart(6, "0")}`
        : `#${idx + 1}`;
      const sDate = r.maintenance_date
        ? moment(r.maintenance_date).format("DD MMM YYYY")
        : "N/A";
      const cost = Number(r.cost || 0).toLocaleString("en-IN");
      const odo = r.odometer_reading
        ? `${Number(r.odometer_reading).toLocaleString("en-IN")} KM`
        : "-";
      const garage = r.garage_name || "Self / Workshop";
      const inv = r.invoice_number
        ? `<span style="font-family: monospace;">${r.invoice_number}</span>`
        : "-";
      const desc = r.description || "No description provided";
      const notes = r.additional_notes
        ? `<div style="font-size: 10px; color: #b45309; margin-top: 3px;"><em>Note: ${r.additional_notes}</em></div>`
        : "";
      const badgeCls = getBadgeClass(r.status);

      return `
      <tr>
        <td style="font-weight: 600; white-space: nowrap;">${sDate}</td>
        <td style="font-family: monospace; font-size: 10px; font-weight: 600;">${recId}</td>
        <td><strong>${r.maintenance_type || "Service"}</strong></td>
        <td><span class="badge ${badgeCls}">${r.status || "Reported"}</span></td>
        <td style="font-weight: 700; text-align: right; white-space: nowrap;">₹${cost}</td>
        <td style="text-align: right; white-space: nowrap;">${odo}</td>
        <td>${garage}</td>
        <td>${inv}</td>
        <td style="max-width: 220px;">
          <div>${desc}</div>
          ${notes}
        </td>
      </tr>
    `;
    })
    .join("");

  const bodyHtml = `
    <div class="header-banner">
      <div>
        <h1 class="brand-title">${orgTitle}</h1>
        <p class="brand-subtitle">Vehicle Maintenance Ledger & Service History Report &bull; By CargoDesk</p>
      </div>
      <div class="meta-box">
        <div><strong>Vehicle:</strong> ${vNo} (${vModel})</div>
        <div><strong>Total Records:</strong> ${totalServices}</div>
        <div><strong>Generated:</strong> ${dateStr}</div>
      </div>
    </div>

    <!-- Summary KPI Cards -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-card-title">Vehicle Registration</div>
        <div class="summary-card-val" style="font-size: 15px;">${vNo}</div>
        <div class="summary-card-sub">${vModel}</div>
      </div>
      <div class="summary-card">
        <div class="summary-card-title">Total Maintenance Logged</div>
        <div class="summary-card-val">${totalServices} Services</div>
        <div class="summary-card-sub">All logged entries</div>
      </div>
      <div class="summary-card">
        <div class="summary-card-title">Cumulative Expenditure</div>
        <div class="summary-card-val">₹${totalExpense}</div>
        <div class="summary-card-sub">Total recorded costs</div>
      </div>
      <div class="summary-card">
        <div class="summary-card-title">Most Recent Service</div>
        <div class="summary-card-val" style="font-size: 14px;">${lastService}</div>
        <div class="summary-card-sub">${summary.latest_status || "Latest state"}</div>
      </div>
    </div>

    <div class="section-title">Complete Chronological Service Ledger</div>

    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 10%;">Date</th>
          <th style="width: 10%;">Ref ID</th>
          <th style="width: 13%;">Category</th>
          <th style="width: 10%;">Status</th>
          <th style="width: 10%; text-align: right;">Cost</th>
          <th style="width: 9%; text-align: right;">Odometer</th>
          <th style="width: 12%;">Workshop / Garage</th>
          <th style="width: 9%;">Invoice</th>
          <th style="width: 17%;">Description & Remarks</th>
        </tr>
      </thead>
      <tbody>
        ${
          rowsHtml.length > 0
            ? rowsHtml
            : `
          <tr>
            <td colspan="9" style="text-align: center; padding: 24px; color: #94a3b8;">
              No maintenance records found for this vehicle.
            </td>
          </tr>
        `
        }
      </tbody>
      ${
        records && records.length > 0
          ? `
        <tfoot>
          <tr style="background: #f1f5f9; font-weight: 800;">
            <td colspan="4" style="text-align: right; padding: 10px; font-size: 11px;">
              TOTAL EXPENDITURE (${records.length} Records):
            </td>
            <td style="text-align: right; padding: 10px; font-size: 12px; color: #047857;">
              ₹${totalExpense}
            </td>
            <td colspan="4"></td>
          </tr>
        </tfoot>
      `
          : ""
      }
    </table>

    <div class="footer-note">
      <span>CargoDesk Logistics Management &bull; Vehicle Maintenance Ledger</span>
      <span>Confidential &bull; Generated on ${dateStr}</span>
    </div>
  `;

  openPrintPdfWindow(`CargoDesk_Maintenance_History_${vNo}`, bodyHtml);
}
