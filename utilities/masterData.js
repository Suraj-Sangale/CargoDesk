import { formatPrice } from "./utils";

export const docTableHeadCells = [
  // {
  //   id: "masterNo",
  //   numeric: false,
  //   disablePadding: false,
  //   label: "Master No.",
  // },
  {
    id: "id",
    numeric: false,
    disablePadding: false,
    label: "Sr. No.",
  },
  {
    id: "vehicleNo",
    numeric: false,
    disablePadding: false,
    label: "Vehicle No.",
    format: true,
  },
  {
    id: "note",
    numeric: false,
    disablePadding: false,
    label: "Note",
    format: true,
  },
  {
    id: "documentType",
    numeric: false,
    disablePadding: false,
    label: "Document Type",
    format: true,
    upperCase: true,
  },
  {
    id: "expiryDate",
    numeric: false,
    disablePadding: false,
    label: "Expiry Date",
  },
  {
    id: "alertDate",
    numeric: false,
    disablePadding: false,
    label: "Alert Date",
  },
  { id: "action", numeric: false, disablePadding: false, label: "Action" },
];
export const emiTableHeadCells = [
  {
    id: "id",
    numeric: false,
    disablePadding: false,
    label: "Sr. No.",
  },
  {
    id: "vehicle_number",
    numeric: false,
    disablePadding: false,
    label: "Vehicle No.",
  },
  {
    id: "loan_name",
    numeric: false,
    disablePadding: false,
    label: "Loan & Financier",
    format: true,
  },
  {
    id: "loan_account_no",
    numeric: false,
    disablePadding: false,
    label: "Loan A/C No.",
  },
  {
    id: "loan_amount",
    numeric: false,
    disablePadding: false,
    label: "Loan Amount",
    formatPrice: true,
  },
  {
    id: "emi_amount",
    numeric: false,
    disablePadding: false,
    label: "Monthly EMI",
    formatPrice: true,
  },
  {
    id: "tenure_months",
    numeric: false,
    disablePadding: false,
    label: "Tenure / Paid",
  },
  {
    id: "due_date",
    numeric: false,
    disablePadding: false,
    label: "Due Date",
  },
  {
    id: "payment_mode",
    numeric: false,
    disablePadding: false,
    label: "Payment Mode",
  },
  {
    id: "status",
    numeric: false,
    disablePadding: false,
    label: "Status",
  },
  { id: "action", numeric: false, disablePadding: false, label: "Action" },
];

export const fleetTableHeadCells = [
  {
    id: "id",
    numeric: false,
    disablePadding: false,
    label: "Sr. No.",
  },
  {
    id: "vehicle_number",
    numeric: false,
    disablePadding: false,
    label: "Vehicle No.",
  },
  {
    id: "vehicle_model",
    numeric: false,
    disablePadding: false,
    label: "Model & Make",
  },
  {
    id: "vehicle_type",
    numeric: false,
    disablePadding: false,
    label: "Type",
  },
  {
    id: "capacity",
    numeric: false,
    disablePadding: false,
    label: "Capacity",
  },
  {
    id: "driver_name",
    numeric: false,
    disablePadding: false,
    label: "Assigned Driver",
  },
  {
    id: "fuel_type",
    numeric: false,
    disablePadding: false,
    label: "Fuel",
  },
  {
    id: "ownership_type",
    numeric: false,
    disablePadding: false,
    label: "Ownership",
  },
  {
    id: "status",
    numeric: false,
    disablePadding: false,
    label: "Status",
  },
  { id: "action", numeric: false, disablePadding: false, label: "Action" },
];

export const FLEET_VEHICLE_TYPES = [
  "Heavy Truck (16-25T)",
  "Multi-Axle Trailer (28-40T)",
  "Container Body (20-32 FT)",
  "Tanker (Chemical/Oil)",
  "Tipper / Dumper",
  "Flatbed Trailer",
  "Medium Goods Vehicle (7-12T)",
  "Light Commercial Vehicle (Pickup)",
];

export const FLEET_FUEL_TYPES = [
  "Diesel",
  "CNG",
  "Electric (EV)",
  "LNG",
  "Petrol",
];

export const FLEET_OWNERSHIP_TYPES = [
  "Owned",
  "Leased / Financed",
  "Attached / Vendor",
];

export const FLEET_STATUS_OPTIONS = [
  "Active",
  "In Transit",
  "Maintenance",
  "Inactive",
];

export const driverTableHeadCells = [
  {
    id: "id",
    numeric: false,
    disablePadding: false,
    label: "Sr. No.",
  },
  {
    id: "profile_photo",
    numeric: false,
    disablePadding: false,
    label: "Photo",
  },
  {
    id: "driver_name",
    numeric: false,
    disablePadding: false,
    label: "Driver Name",
  },
  {
    id: "contact_number",
    numeric: false,
    disablePadding: false,
    label: "Contact No.",
  },
  {
    id: "license_number",
    numeric: false,
    disablePadding: false,
    label: "License No.",
  },
  {
    id: "license_type",
    numeric: false,
    disablePadding: false,
    label: "License Category",
  },
  {
    id: "assigned_vehicle",
    numeric: false,
    disablePadding: false,
    label: "Assigned Vehicle",
  },
  {
    id: "experience_years",
    numeric: false,
    disablePadding: false,
    label: "Experience",
  },
  {
    id: "license_expiry",
    numeric: false,
    disablePadding: false,
    label: "License Expiry",
  },
  {
    id: "supporting_documents",
    numeric: false,
    disablePadding: false,
    label: "Documents",
  },
  {
    id: "status",
    numeric: false,
    disablePadding: false,
    label: "Status",
  },
  { id: "action", numeric: false, disablePadding: false, label: "Action" },
];

export const DRIVER_LICENSE_TYPES = [
  "Heavy Transport Vehicle (HTV)",
  "Hazardous & Container Certified",
  "Chemical & Tanker Certified",
  "Heavy Commercial (HMV/LMV)",
  "Light Commercial Vehicle (LCV)",
  "Multi-Axle Specialized Trailer",
];

export const DRIVER_STATUS_OPTIONS = [
  "Active",
  "On Duty",
  "On Leave",
  "Inactive",
];

export const DRIVER_BLOOD_GROUPS = [
  "A+",
  "A-",
  "B+",
  "B-",
  "AB+",
  "AB-",
  "O+",
  "O-",
];

export const menuItems = [
  {
    title: "Dashboard",
    id: "Dashboard",
    icon: "🌐",
    children: [],
    url: "/",
  },
  {
    title: "Documents",
    id: "documents",
    icon: "🌐",
    children: [],
    url: "/documents",
  },
  {
    title: "Messager",
    id: "Messager",
    icon: "📦",
    url: "/messager",
  },
  {
    title: "Invoice",
    id: "invoice",
    icon: "🎨",
    children: [
      {
        title: "New Invoice",
        id: "newInvoice",
        url: "/invoice/new",
      },
      {
        title: "Advanced Elements",
        id: "Advanced Elements",
        subChildren: [],
      },
      {
        title: "Forms & Tables",
        id: "Forms & Tables",
        subChildren: [
          { title: "Form Elements", id: "FormElements" },
          { title: "Advanced Forms", id: "AdvancedForms" },
          { title: "Basic Tables", id: "BasicTables" },
          { title: "Data Tables", id: "DataTables" },
          { title: "Form Elements", id: "FormElements" },
          { title: "Advanced Forms", id: "AdvancedForms" },
          { title: "Basic Tables", id: "BasicTables" },
          { title: "Data Tables", id: "DataTables" },
          { title: "Form Elements", id: "FormElements" },
          { title: "Advanced Forms", id: "AdvancedForms" },
          { title: "Basic Tables", id: "BasicTables" },
          { title: "Data Tables", id: "DataTables" },
          { title: "Form Elements", id: "FormElements" },
          { title: "Advanced Forms", id: "AdvancedForms" },
          { title: "Basic Tables", id: "BasicTables" },
          { title: "Data Tables", id: "DataTables" },
          { title: "Form Elements", id: "FormElements" },
          { title: "Advanced Forms", id: "AdvancedForms" },
          { title: "Basic Tables", id: "BasicTables" },
          { title: "Data Tables", id: "DataTables" },
          { title: "Form Elements", id: "FormElements" },
          { title: "Advanced Forms", id: "AdvancedForms" },
          { title: "Basic Tables", id: "BasicTables" },
          { title: "Data Tables", id: "DataTables" },
        ],
      },
      {
        title: "Icons",
        id: "Icons",
        children: [],
      },
    ],
  },
  {
    title: "Daily Orders",
    id: "dailyorders",
    icon: "🌍",
    children: [],
    url: "/dailyorders",
  },
  {
    title: "Apps",
    id: "Apps",
    icon: "⚙️",
    children: [],
  },
];

const smapleconatacts = [
  {
    resourceName: "people/c3881715573938456686",
    etag: "%EgkBAgkLLjc9Pj8aBAECBQciDExZWTBHUjYvblNvPQ==",
    names: [
      {
        metadata: {
          primary: true,
          source: {
            type: "CONTACT",
            id: "35de9fbf8fb4086e",
          },
          sourcePrimary: true,
        },
        displayName: "Aba",
        givenName: "Aba",
        displayNameLastFirst: "Aba",
        unstructuredName: "Aba",
      },
    ],
    phoneNumbers: [
      {
        metadata: {
          primary: true,
          source: {
            type: "CONTACT",
            id: "35de9fbf8fb4086e",
          },
        },
        value: "+91 90824 85334",
        canonicalForm: "+919082485334",
        type: "mobile",
        formattedType: "Mobile",
      },
      {
        metadata: {
          source: {
            type: "CONTACT",
            id: "35de9fbf8fb4086e",
          },
        },
        value: "+91 84249 51002",
        canonicalForm: "+918424951002",
        type: "WhatsApp",
        formattedType: "WhatsApp",
      },
    ],
  },
  {
    resourceName: "people/c6959517684702988445",
    etag: "%EgkBAgkLLjc9Pj8aBAECBQciDExZWTBHUjYvblNvPQ==",
    names: [
      {
        metadata: {
          primary: true,
          source: {
            type: "CONTACT",
            id: "60952c760cc5489d",
          },
          sourcePrimary: true,
        },
        displayName: "Bro Old 😎😎",
        familyName: "😎😎",
        givenName: "Bro Old",
        displayNameLastFirst: "😎😎, Bro Old",
        unstructuredName: "Bro Old 😎😎",
      },
    ],
    phoneNumbers: [
      {
        metadata: {
          primary: true,
          source: {
            type: "CONTACT",
            id: "60952c760cc5489d",
          },
        },
        value: "+918779395925",
        canonicalForm: "+918779395925",
        type: "mobile",
        formattedType: "Mobile",
      },
    ],
  },
  {
    resourceName: "people/c8352873953951085462",
    etag: "%EgkBAgkLLjc9Pj8aBAECBQciDExZWTBHUjYvblNvPQ==",
    names: [
      {
        metadata: {
          primary: true,
          source: {
            type: "CONTACT",
            id: "73eb5e9b0eddf396",
          },
          sourcePrimary: true,
        },
        displayName: "👑 DAD 👑",
        familyName: "👑",
        givenName: "👑",
        middleName: "DAD",
        displayNameLastFirst: "👑, 👑 DAD",
        unstructuredName: "👑 DAD 👑",
      },
    ],
    phoneNumbers: [
      {
        metadata: {
          primary: true,
          source: {
            type: "CONTACT",
            id: "73eb5e9b0eddf396",
          },
        },
        value: "+91 97023 92028",
        canonicalForm: "+919702392028",
        type: "work",
        formattedType: "Work",
      },
    ],
  },
  {
    resourceName: "people/c6673055396237318661",
    etag: "%EgkBAgkLLjc9Pj8aBAECBQciDDF0Y2VLM2V3SUFNPQ==",
    names: [
      {
        metadata: {
          primary: true,
          source: {
            type: "CONTACT",
            id: "5c9b74870b3a9a05",
          },
          sourcePrimary: true,
        },
        displayName: "Akshay More",
        familyName: "More",
        givenName: "Akshay ",
        displayNameLastFirst: "More, Akshay",
        unstructuredName: "Akshay More",
      },
    ],
    emailAddresses: [
      {
        metadata: {
          primary: true,
          source: {
            type: "CONTACT",
            id: "5c9b74870b3a9a05",
          },
        },
        value: "aksh@gmail.com",
      },
    ],
    phoneNumbers: [
      {
        metadata: {
          primary: true,
          source: {
            type: "CONTACT",
            id: "5c9b74870b3a9a05",
          },
        },
        value: "+91 99878 27484",
        canonicalForm: "+919987827484",
      },
    ],
  },
];

export const allContactsTableHeadCells = [
  {
    id: "id",
    numeric: false,
    disablePadding: false,
    label: "Sr. No.",
  },
  {
    id: "name",
    numeric: false,
    disablePadding: false,
    label: "Contact Name",
  },
  {
    id: "contactNo",
    numeric: false,
    disablePadding: false,
    label: "Contact No.",
  },
  {
    id: "note",
    numeric: false,
    disablePadding: false,
    label: "Note",
  },
  {
    id: "action",
    numeric: false,
    disablePadding: false,
    label: "Action",
  },
];
export const allContactsGroupsTableHeadCells = [
  {
    id: "id",
    numeric: false,
    disablePadding: false,
    label: "Sr. No.",
  },
  {
    id: "groupName",
    numeric: false,
    disablePadding: false,
    label: "Group Name",
  },

  {
    id: "description",
    numeric: false,
    disablePadding: false,
    label: "Description",
  },
  {
    id: "action",
    numeric: false,
    disablePadding: false,
    label: "Action",
  },
];

const defaultSeedFleets = [
  {
    vehicle_number: "MH 04 EF 9101",
    vehicle_model: "Tata Prima 5530.S",
    vehicle_type: "Multi-Axle Trailer (28-40T)",
    capacity: "35 Tons",
    fuel_type: "Diesel",
    ownership_type: "Owned",
    manufacturing_year: "2023",
    gps_tracking_id: "GPS-TRK-9101",
    chassis_number: "MAT5530SXYZ12345",
    status: "Active",
    notes: "Assigned for western corridor express freight.",
  },
  {
    vehicle_number: "MH 12 UV 0123",
    vehicle_model: "Ashok Leyland 2820-6x2",
    vehicle_type: "Heavy Truck (16-25T)",
    capacity: "20 Tons",
    fuel_type: "Diesel",
    ownership_type: "Owned",
    manufacturing_year: "2022",
    gps_tracking_id: "GPS-TRK-0123",
    chassis_number: "AL2820AB567890",
    status: "In Transit",
    notes: "Currently on route Pune -> Ahmedabad.",
  },
  {
    vehicle_number: "MH 01 JB 1122",
    vehicle_model: "BharatBenz 3528R",
    vehicle_type: "Container Body (20-32 FT)",
    capacity: "25 Tons",
    fuel_type: "Diesel",
    ownership_type: "Leased / Financed",
    manufacturing_year: "2023",
    gps_tracking_id: "GPS-TRK-1122",
    chassis_number: "BB3528RC998877",
    status: "Active",
    notes: "High-value container consignment vehicle.",
  },
  {
    vehicle_number: "MH 03 CD 5678",
    vehicle_model: "Eicher Pro 6028",
    vehicle_type: "Tanker (Chemical/Oil)",
    capacity: "18 KL / 20 Tons",
    fuel_type: "CNG",
    ownership_type: "Attached / Vendor",
    manufacturing_year: "2021",
    gps_tracking_id: "GPS-TRK-5678",
    chassis_number: "EP6028D112233",
    status: "Maintenance",
    notes: "Periodic brake inspection and wheel alignment scheduled.",
  },
  {
    vehicle_number: "MH 05 GH 2345",
    vehicle_model: "Mahindra Blazo X 28",
    vehicle_type: "Tipper / Dumper",
    capacity: "16 Cu.M",
    fuel_type: "Diesel",
    ownership_type: "Owned",
    manufacturing_year: "2022",
    gps_tracking_id: "GPS-TRK-2345",
    chassis_number: "MBX28E445566",
    status: "Active",
    notes: "Operating on civil construction materials route.",
  },
];

export const userTableHeadCells = [
  {
    id: "id",
    numeric: false,
    disablePadding: false,
    label: "Sr. No.",
  },
  {
    id: "member",
    numeric: false,
    disablePadding: false,
    label: "Member",
  },
  {
    id: "role",
    numeric: false,
    disablePadding: false,
    label: "Role",
  },
  {
    id: "orgName",
    numeric: false,
    disablePadding: false,
    label: "Organization",
  },
  {
    id: "phone",
    numeric: false,
    disablePadding: false,
    label: "Contact No.",
  },
  {
    id: "status",
    numeric: false,
    disablePadding: false,
    label: "Status",
  },
  {
    id: "action",
    numeric: false,
    disablePadding: false,
    label: "Action",
  },
];