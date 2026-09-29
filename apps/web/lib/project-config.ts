export type ProjectCode = "CMS_VAL_FS" | "ASR" | "CIAS" | "OTHER";

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

export const ASR_SERVICES = [
  "Audio Ingestion & Streaming",
  "Acoustic Model Engine",
  "Language & Vocabulary Decoder",
  "Realtime Transcription Gateway",
  "Voice Activity Detector (VAD)",
] as const;

export const ASR_NODES = [
  "GPU-Cluster-Alpha",
  "Inference-Pod-01",
  "Inference-Pod-02",
  "Streaming-Buffer-DC1",
  "Edge-Transcriber-PoP",
] as const;

export const CIAS_DOMAINS = [
  "Identity & Access IAM",
  "Hardware Security Module (HSM)",
  "Firewall & WAF Rules",
  "Audit Log Ingestion",
  "Vulnerability Patching",
] as const;

export const CIAS_ZONES = [
  "Production DMZ",
  "Internal Core Backbone",
  "Management Subnet OOB",
  "Secure Vault Zone",
  "Partner Peering Hub",
] as const;

export const PROJECTS: ProjectMeta[] = [
  {
    code: "CMS_VAL_FS",
    name: "CMS VAL & FS",
    badge: "CMS VAL&FS",
    description: "Centralized Monitoring & Field Services for Telecom Circles",
    color: "bg-indigo-600 text-white",
    fields: {
      primaryFieldLabel: "TSP (Telecom Provider)",
      secondaryFieldLabel: "LSA (Service Circle)",
      primaryOptions: TSPS,
      secondaryOptions: LSAS,
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
      primaryOptions: ASR_SERVICES,
      secondaryOptions: ASR_NODES,
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
      primaryOptions: CIAS_DOMAINS,
      secondaryOptions: CIAS_ZONES,
    },
  },
];

export const STATUS_OPTIONS = [
  { value: "RESOLVED", label: "Resolved", color: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  { value: "IN_PROGRESS", label: "In Progress", color: "bg-blue-100 text-blue-800 border-blue-200" },
  { value: "PENDING_VERIFICATION", label: "Pending Verification", color: "bg-amber-100 text-amber-800 border-amber-200" },
  { value: "CLOSED", label: "Closed", color: "bg-slate-100 text-slate-800 border-slate-200" },
] as const;
