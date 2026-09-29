export type ProjectCode =
  | "CMS"
  | "CDR"
  | "IPDR"
  | "CIAS"
  | "MCX"
  | "TSOC"
  | "ASR"
  | "CMS_VAL_FS"
  | "OTHER";

export interface ProjectMeta {
  code: ProjectCode;
  name: string;
  badge: string;
  description: string;
  color: string;
  fields: {
    primaryFieldLabel: string;
    secondaryFieldLabel: string;
    primaryOptions: readonly string[];
    secondaryOptions: readonly string[];
    raisedByOptions: readonly string[];
  };
}

export const CMS_LSA_LIST = [
  "AP",
  "GJ",
  "KA",
  "KR",
  "MP",
  "MB",
  "MH",
  "OR",
  "TN",
] as const;

export const CMS_LSA_FULL_NAMES: Record<string, string> = {
  AP: "Andhra Pradesh (AP)",
  GJ: "Gujarat (GJ)",
  KA: "Karnataka (KA)",
  KR: "Kerala (KR)",
  MP: "Madhya Pradesh (MP)",
  MB: "Mumbai (MB)",
  MH: "Maharashtra (MH)",
  OR: "Odisha (OR)",
  TN: "Tamil Nadu (TN)",
};

export const CMS_LSA_TSP_MAP: Record<string, string[]> = {
  AP: ["AT", "BS", "RC", "RI", "VO", "TA", "ZVC", "P3 Tech"],
  GJ: ["AT", "BS", "RC", "RI", "VO", "TA"],
  KA: ["AT", "BS", "RC", "RI", "VO", "TA", "Ring Central", "AT and T"],
  KR: ["AT", "BS", "RC", "RI", "VO", "TA"],
  MP: ["AT", "BS", "RC", "RI", "VO", "TA"],
  MB: [
    "AT",
    "BS",
    "RC",
    "RI",
    "VO",
    "TA",
    "British Telecom",
    "BSNL ILD",
    "gcxg",
    "LightStorm",
    "MTNL",
    "Orange ILD",
    "RJIL ILD",
    "Sify ILD",
    "Sprint Telecom",
    "Telestra ILD",
    "Verizon ILD",
    "Reliance ILD",
    "ZVC",
    "NTT",
    "Vodafone ILD",
  ],
  MH: ["AT", "BS", "RC", "RI", "VO", "TA"],
  OR: ["AT", "BS", "RC", "RI", "VO", "TA"],
  TN: ["AT", "BS", "RC", "RI", "VO", "TA", "ZVC", "Airtel IPLC", "Singtel IPLC"],
};

export const TSPS = [
  "AT",
  "BS",
  "RC",
  "RI",
  "VO",
  "TA",
  "ZVC",
  "P3 Tech",
  "Ring Central",
  "AT and T",
  "British Telecom",
  "BSNL ILD",
  "gcxg",
  "LightStorm",
  "MTNL",
  "Orange ILD",
  "RJIL ILD",
  "Sify ILD",
  "Sprint Telecom",
  "Telestra ILD",
  "Verizon ILD",
  "Reliance ILD",
  "NTT",
  "Vodafone ILD",
  "Airtel IPLC",
  "Singtel IPLC",
] as const;

export const LSAS = [
  "AP",
  "GJ",
  "KA",
  "KR",
  "MP",
  "MB",
  "MH",
  "OR",
  "TN",
  "Delhi",
  "Kolkata",
  "Punjab",
  "Haryana",
  "Uttar Pradesh (East)",
  "Uttar Pradesh (West)",
  "Rajasthan",
  "West Bengal",
  "Bihar & Jharkhand",
  "Assam",
  "North East",
  "Jammu & Kashmir",
  "Himachal Pradesh",
] as const;

export const CMS_LEA_RAISED_BY_OPTIONS = [
  "DOT",
  "DOT & LEA",
  "CBDT",
  "CBI",
  "DOE/ED",
  "DRI",
  "NCB",
  "NIA",
  "POLICE",
  "POLICE-CG",
  "IB",
  "RAW",
  "CDOT",
  "SI",
] as const;

export const TSOC_RAISED_BY_OPTIONS = [
  "CDOT",
  "VENDOR",
  "CLIENT",
  "ITI DC TEAM",
] as const;

export const MCX_RAISED_BY_OPTIONS = [
  "Client",
  "PI Team",
  "Validation Team",
  "Vendor",
] as const;

export const CIAS_DEVICE_LOCATIONS = [
  "Back-Gate-1",
  "Back-Gate-2",
  "Main-Gate-1",
  "Main-Gate-2",
  "Main-Gate-3",
  "Main-Gate-4",
  "Mis-Lab",
] as const;

export const CIAS_RAISED_BY_OPTIONS = [
  "Staff",
  "PI Team",
  "Validation Team",
] as const;

export const CDR_IPDR_TSPS = [
  "Airtel",
  "Reliance Jio",
  "Vodafone",
  "BSNL-EAST",
  "BSNLWEST",
  "BSNLNORTH",
  "BSNLSOUTH",
] as const;

export const PROJECTS: ProjectMeta[] = [
  {
    code: "CMS",
    name: "CMS",
    badge: "CMS",
    description: "Centralized Monitoring System for Telecom Operations and Circles",
    color: "bg-indigo-600 text-white",
    fields: {
      primaryFieldLabel: "TSP (Telecom Provider)",
      secondaryFieldLabel: "LSA (Service Circle)",
      primaryOptions: TSPS,
      secondaryOptions: CMS_LSA_LIST,
      raisedByOptions: CMS_LEA_RAISED_BY_OPTIONS,
    },
  },
  {
    code: "CIAS",
    name: "CIAS",
    badge: "CIAS",
    description: "Access control, biometric gates, perimeter devices & security logging",
    color: "bg-amber-600 text-white",
    fields: {
      primaryFieldLabel: "Device Location",
      secondaryFieldLabel: "Zone / Category",
      primaryOptions: CIAS_DEVICE_LOCATIONS,
      secondaryOptions: ["Perimeter Access", "Security Control", "Lab Facility", "Core Facility"],
      raisedByOptions: CIAS_RAISED_BY_OPTIONS,
    },
  },
  {
    code: "TSOC",
    name: "TSOC",
    badge: "TSOC",
    description: "Telecom Security Operations Center, Threat Hunting & Incident Response",
    color: "bg-rose-600 text-white",
    fields: {
      primaryFieldLabel: "Category / Threat Area",
      secondaryFieldLabel: "System / Tier",
      primaryOptions: ["SS7/Diameter Attack", "DDoS Mitigation", "Rogue BTS / IMSI Catcher", "Malicious Traffic Surge", "BGP Hijack Alert", "Firewall / Perimeter", "System Infrastructure"],
      secondaryOptions: ["Circle Border Gateway", "Core Packet Switched", "Signaling Core", "Interconnect Gateway", "DC Server Stack", "Management OOB"],
      raisedByOptions: TSOC_RAISED_BY_OPTIONS,
    },
  },
  {
    code: "MCX",
    name: "MCX",
    badge: "MCX",
    description: "Mission Critical Push-to-Talk & Broadband Communications Platform",
    color: "bg-purple-600 text-white",
    fields: {
      primaryFieldLabel: "Service Component",
      secondaryFieldLabel: "Cluster / Site",
      primaryOptions: ["MC-PTT Server", "MC-Video Gateway", "MC-Data Broker", "Floor Control Agent", "Key Management Server"],
      secondaryOptions: ["Core-DC-Primary", "Core-DC-Secondary", "Edge-Node-01", "Edge-Node-02"],
      raisedByOptions: MCX_RAISED_BY_OPTIONS,
    },
  },
  {
    code: "CDR",
    name: "CDR",
    badge: "CDR",
    description: "Call Detail Record Ingestion, Mediation & Forensic Processing",
    color: "bg-cyan-600 text-white",
    fields: {
      primaryFieldLabel: "TSP",
      secondaryFieldLabel: "LSA",
      primaryOptions: CDR_IPDR_TSPS,
      secondaryOptions: CMS_LSA_LIST,
      raisedByOptions: CMS_LEA_RAISED_BY_OPTIONS,
    },
  },
  {
    code: "IPDR",
    name: "IPDR",
    badge: "IPDR",
    description: "Internet Protocol Detail Record Stream & Packet Flow Analytics",
    color: "bg-blue-600 text-white",
    fields: {
      primaryFieldLabel: "TSP",
      secondaryFieldLabel: "LSA",
      primaryOptions: CDR_IPDR_TSPS,
      secondaryOptions: CMS_LSA_LIST,
      raisedByOptions: CMS_LEA_RAISED_BY_OPTIONS,
    },
  },
  {
    code: "ASR",
    name: "ASR",
    badge: "ASR",
    description: "Automatic Speech Recognition & Realtime Transcription Engine",
    color: "bg-emerald-600 text-white",
    fields: {
      primaryFieldLabel: "Speech Component / Pipeline",
      secondaryFieldLabel: "Processing Cluster / Node",
      primaryOptions: [
        "Audio Ingestion & Streaming",
        "Acoustic Model Engine",
        "Language & Vocabulary Decoder",
        "Realtime Transcription Gateway",
        "Voice Activity Detector (VAD)",
      ],
      secondaryOptions: [
        "GPU-Cluster-Alpha",
        "Inference-Pod-01",
        "Inference-Pod-02",
        "Streaming-Buffer-DC1",
        "Edge-Transcriber-PoP",
      ],
      raisedByOptions: CMS_LEA_RAISED_BY_OPTIONS,
    },
  },
];

export const LEA_RAISED_BY_OPTIONS = CMS_LEA_RAISED_BY_OPTIONS;

export const STATUS_OPTIONS = [
  { value: "RESOLVED", label: "Resolved", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "PENDING_VERIFICATION", label: "Pending Verification", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "CLOSED", label: "Closed", color: "bg-slate-100 text-slate-800 border-slate-200" },
] as const;
