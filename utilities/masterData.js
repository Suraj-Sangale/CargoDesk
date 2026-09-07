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
