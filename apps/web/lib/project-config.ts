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
  "Dynamic Route Optimizer",
  "Gateway Failover Broker",
  "BGP Multipath Controller",
  "Edge Telemetry Agent",
  "Traffic Shaper Daemon",
] as const;

export const ASR_NODES = [
  "DC-North-Primary",
  "DC-North-Secondary",
  "DC-West-Edge01",
  "DC-South-Core02",
  "Edge-POP-Chennai",
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
    name: "ASR (Auto Service Routing)",
    badge: "ASR",
    description: "Automated Service Routing & Node Escalation",
    color: "bg-emerald-600 text-white",
    fields: {
      primaryFieldLabel: "ASR Service Component",
      secondaryFieldLabel: "Target Infrastructure Node",
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
