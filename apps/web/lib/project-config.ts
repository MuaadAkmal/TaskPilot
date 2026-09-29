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
  };
}

export const TSPS = [
  "Airtel",
  "Jio",
  "Vodafone Idea (Vi)",
  "BSNL",
  "MTNL",
  "Tata Tele",
] as const;

export const LSAS = [
  "Delhi",
  "Mumbai",
  "Kolkata",
  "Maharashtra",
  "Gujarat",
  "Andhra Pradesh & Telangana",
  "Karnataka",
  "Tamil Nadu (incl. Chennai)",
  "Kerala",
  "Punjab",
  "Haryana",
  "Uttar Pradesh (East)",
  "Uttar Pradesh (West)",
  "Rajasthan",
  "Madhya Pradesh & Chhattisgarh",
  "West Bengal",
  "Bihar & Jharkhand",
  "Odisha",
  "Assam",
  "North East",
  "Jammu & Kashmir",
  "Himachal Pradesh",
] as const;

export const PROJECTS: ProjectMeta[] = [
  {
    code: "CMS",
    name: "CMS (Central Monitoring System)",
    badge: "CMS",
    description: "Centralized Monitoring System for Telecom Operations and Circles",
    color: "bg-indigo-600 text-white",
    fields: {
      primaryFieldLabel: "TSP (Telecom Provider)",
      secondaryFieldLabel: "LSA (Service Circle)",
      primaryOptions: TSPS,
      secondaryOptions: LSAS,
    },
  },
  {
    code: "CDR",
    name: "CDR (Call Detail Records)",
    badge: "CDR",
    description: "Call Detail Record Ingestion, Mediation & Forensic Processing",
    color: "bg-cyan-600 text-white",
    fields: {
      primaryFieldLabel: "Carrier / Gateway",
      secondaryFieldLabel: "Region / Circle",
      primaryOptions: TSPS,
      secondaryOptions: LSAS,
    },
  },
  {
    code: "IPDR",
    name: "IPDR (Internet Protocol Detail Record)",
    badge: "IPDR",
    description: "Internet Protocol Detail Record Stream & Packet Flow Analytics",
    color: "bg-blue-600 text-white",
    fields: {
      primaryFieldLabel: "ISP / Gateway",
      secondaryFieldLabel: "Zone / Node",
      primaryOptions: TSPS,
      secondaryOptions: LSAS,
    },
  },
  {
    code: "CIAS",
    name: "CIAS (Core Infrastructure)",
    badge: "CIAS",
    description: "Core Infrastructure Audit & Security Services",
    color: "bg-amber-600 text-white",
    fields: {
      primaryFieldLabel: "Security Domain / Module",
      secondaryFieldLabel: "Network Zone / Tier",
      primaryOptions: [
        "Identity & Access IAM",
        "Hardware Security Module (HSM)",
        "Firewall & WAF Rules",
        "Audit Log Ingestion",
        "Vulnerability Patching",
      ],
      secondaryOptions: [
        "Production DMZ",
        "Internal Core Backbone",
        "Management Subnet OOB",
        "Secure Vault Zone",
        "Partner Peering Hub",
      ],
    },
  },
  {
    code: "MCX",
    name: "MCX (Mission Critical Push-to-Talk)",
    badge: "MCX",
    description: "Mission Critical Push-to-Talk & Broadband Communications Platform",
    color: "bg-purple-600 text-white",
    fields: {
      primaryFieldLabel: "Service Component",
      secondaryFieldLabel: "Cluster / Site",
      primaryOptions: ["MC-PTT Server", "MC-Video Gateway", "MC-Data Broker", "Floor Control Agent", "Key Management Server"],
      secondaryOptions: ["Core-DC-Primary", "Core-DC-Secondary", "Edge-Node-01", "Edge-Node-02"],
    },
  },
  {
    code: "TSOC",
    name: "TSOC (Telecom Security Operations Center)",
    badge: "TSOC",
    description: "Telecom Security Operations Center, Threat Hunting & Incident Response",
    color: "bg-rose-600 text-white",
    fields: {
      primaryFieldLabel: "Threat Vector / Category",
      secondaryFieldLabel: "Monitored Tier",
      primaryOptions: ["SS7/Diameter Attack", "DDoS Mitigation", "Rogue BTS / IMSI Catcher", "Malicious Traffic Surge", "BGP Hijack Alert"],
      secondaryOptions: ["Circle Border Gateway", "Core Packet Switched", "Signaling Core", "Interconnect Gateway"],
    },
  },
  {
    code: "ASR",
    name: "ASR (Automatic Speech Recognition)",
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
    },
  },
];

export const STATUS_OPTIONS = [
  { value: "RESOLVED", label: "Resolved", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "PENDING_VERIFICATION", label: "Pending Verification", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "CLOSED", label: "Closed", color: "bg-slate-100 text-slate-800 border-slate-200" },
] as const;
