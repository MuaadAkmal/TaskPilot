import { ProjectCode } from "./project-config";

export interface MockTask {
  id: string;
  project: ProjectCode;
  tsp: string;
  lsa: string;
  status: "RESOLVED" | "IN_PROGRESS" | "PENDING_VERIFICATION" | "CLOSED";
  problemDescription: string;
  solution: string;
  remarks: string | null;
  createdAt: string;
  resolvedAt: string | null;
  downtimeMinutes: number | null;
  raisedByName: string;
  createdByName?: string | null;
  createdByEmail?: string | null;
  docLinks: string[];
  updatedAt: string;
}

// Initial realistic dataset for CMS VAL&FS and other projects
const INITIAL_TASKS: MockTask[] = [
  {
    id: "TS-1001",
    project: "CMS_VAL_FS",
    tsp: "Airtel",
    lsa: "Delhi",
    status: "RESOLVED",
    problemDescription: "High packet loss (>45%) and latency spikes observed on primary peering interface Gi0/0/3 connecting to Noida Core Ring.",
    solution: "Performed OTDR loop test on the fiber line. Identified optical attenuation at patch bay ODF-2. Cleaned LC connectors and reseated SFP-10G-LR transceiver. Interface link stabilized with 0% packet drop.",
    remarks: "Recommend replacing the patch cord during the next scheduled maintenance window.",
    createdAt: "2026-09-28T08:15:00Z",
    resolvedAt: "2026-09-28T09:05:00Z",
    downtimeMinutes: 50,
    raisedByName: "Sarah Jenkins (NOC Lead)",
    docLinks: ["https://wiki.novasmart.internal/sops/fiber-otdr-guide"],
    updatedAt: "2026-09-28T09:05:00Z",
  },
  {
    id: "TS-1002",
    project: "CMS_VAL_FS",
    tsp: "Jio",
    lsa: "Mumbai",
    status: "RESOLVED",
    problemDescription: "BGP neighbor adjacency flapping continuously every 90 seconds with AS65020 under high peak subscriber load.",
    solution: "Inspected BGP debug logs; hold timer expired due to CPU throttling under DDoS traffic. Configured BGP Control Plane Policing (CoPP) and adjusted hold timer from 90s to 180s.",
    remarks: "Applied coordinated policy across peer edge routers BKC-PE-01 and BKC-PE-02.",
    createdAt: "2026-09-28T11:30:00Z",
    resolvedAt: "2026-09-28T12:45:00Z",
    downtimeMinutes: 75,
    raisedByName: "Rahul Sharma (Sr. Network Specialist)",
    docLinks: ["https://wiki.novasmart.internal/sops/bgp-copp-hardening"],
    updatedAt: "2026-09-28T12:45:00Z",
  },
  {
    id: "TS-1003",
    project: "CMS_VAL_FS",
    tsp: "Vodafone Idea (Vi)",
    lsa: "Karnataka",
    status: "RESOLVED",
    problemDescription: "Multiple cell site gateways in Bangalore East failing radius authentication for operational L2TP tunnels.",
    solution: "Discovered expired certificate on secondary FreeRADIUS server. Regenerated SSL certificate and re-synced cluster with primary authentication daemon.",
    remarks: "Automated alert hook created to notify NOC 30 days before future cert expiries.",
    createdAt: "2026-09-28T14:00:00Z",
    resolvedAt: "2026-09-28T14:40:00Z",
    downtimeMinutes: 40,
    raisedByName: "Ananya Iyer (Infra Eng)",
    docLinks: [],
    updatedAt: "2026-09-28T14:40:00Z",
  },
  {
    id: "TS-1004",
    project: "CMS_VAL_FS",
    tsp: "BSNL",
    lsa: "Kolkata",
    status: "RESOLVED",
    problemDescription: "DWDM transponder failure causing 100G transmission circuit down between Howrah and Salt Lake hub.",
    solution: "Dispatched local field team. Swapped faulty client-side 100G CFP2 module on Chassis-4 Slot-2. Realigned optical power to -3.5 dBm.",
    remarks: "Faulty CFP2 sent for RMA with vendor.",
    createdAt: "2026-09-27T18:20:00Z",
    resolvedAt: "2026-09-27T20:10:00Z",
    downtimeMinutes: 110,
    raisedByName: "Subhashis Roy (Field Engineer)",
    docLinks: [],
    updatedAt: "2026-09-27T20:10:00Z",
  },
  {
    id: "TS-1005",
    project: "CMS_VAL_FS",
    tsp: "Airtel",
    lsa: "Maharashtra",
    status: "RESOLVED",
    problemDescription: "IPSec VPN tunnel between Pune regional office and data center failed following upstream ISP gateway reboot.",
    solution: "Cleared dead IKE security association (SA) states and force-triggered phase 1 / phase 2 renegotiation with crypto map update.",
    remarks: "Enabled DPD (Dead Peer Detection) interval at 10 seconds to auto-recover in future.",
    createdAt: "2026-09-27T09:10:00Z",
    resolvedAt: "2026-09-27T09:35:00Z",
    downtimeMinutes: 25,
    raisedByName: "Sarah Jenkins (NOC Lead)",
    docLinks: [],
    updatedAt: "2026-09-27T09:35:00Z",
  },
  {
    id: "TS-1006",
    project: "CMS_VAL_FS",
    tsp: "Tata Tele",
    lsa: "Gujarat",
    status: "RESOLVED",
    problemDescription: "NTP synchronization failure across Ahmedabad aggregation switches leading to syslog timestamp skew.",
    solution: "Reconfigured primary and secondary NTP sources to internal stratum-1 GPS NTP server (10.200.1.50) and removed stale public pool address.",
    remarks: "All 18 aggregation switches confirmed in sync stratum 2.",
    createdAt: "2026-09-26T16:00:00Z",
    resolvedAt: "2026-09-26T16:20:00Z",
    downtimeMinutes: 20,
    raisedByName: "Vikas Patel (SysAdmin)",
    docLinks: [],
    updatedAt: "2026-09-26T16:20:00Z",
  },
  {
    id: "TS-1007",
    project: "CMS_VAL_FS",
    tsp: "Jio",
    lsa: "Andhra Pradesh & Telangana",
    status: "RESOLVED",
    problemDescription: "Voice over LTE (VoLTE) SIP registration errors reported from Hyderabad Cyberabad node.",
    solution: "P-CSCF load balancer session table overflow. Increased connection session limit to 500k and flushed hung TCP half-open states.",
    remarks: "Monitoring SIP INVITE error rates; stabilized below 0.01%.",
    createdAt: "2026-09-26T11:00:00Z",
    resolvedAt: "2026-09-26T12:30:00Z",
    downtimeMinutes: 90,
    raisedByName: "K. Venkatesh (VoIP Ops)",
    docLinks: [],
    updatedAt: "2026-09-26T12:30:00Z",
  },
  {
    id: "TS-1008",
    project: "CMS_VAL_FS",
    tsp: "MTNL",
    lsa: "Delhi",
    status: "RESOLVED",
    problemDescription: "SNMP polling timeout from Cacti & Zabbix monitoring server for Connaught Place core switch stack.",
    solution: "ACL 110 on management interface was missing permit statement for the new monitoring subnet 10.50.22.0/24. Added permit ACE and verified SNMP v3 walkthrough.",
    remarks: "Alarms cleared in monitoring dashboard.",
    createdAt: "2026-09-25T14:15:00Z",
    resolvedAt: "2026-09-25T14:35:00Z",
    downtimeMinutes: 20,
    raisedByName: "Sarah Jenkins (NOC Lead)",
    docLinks: [],
    updatedAt: "2026-09-25T14:35:00Z",
  },
  {
    id: "TS-1009",
    project: "CMS_VAL_FS",
    tsp: "Airtel",
    lsa: "Tamil Nadu (incl. Chennai)",
    status: "RESOLVED",
    problemDescription: "Submarine cable landing station interconnect reporting intermittent CRC errors on 40G link.",
    solution: "Cleaned MPO-12 fiber connector with click-cleaner tool. Replaced worn jumper cord and verified zero CRC increment over 2-hour soaking test.",
    remarks: "Scheduled monthly physical inspection for all MPO jumpers.",
    createdAt: "2026-09-25T10:00:00Z",
    resolvedAt: "2026-09-25T11:15:00Z",
    downtimeMinutes: 75,
    raisedByName: "M. Ramanathan (Optical Lead)",
    docLinks: [],
    updatedAt: "2026-09-25T11:15:00Z",
  },
  {
    id: "TS-2001",
    project: "ASR",
    tsp: "Jio",
    lsa: "Delhi",
    status: "RESOLVED",
    problemDescription: "Automated Service Routing failed to execute automatic rerouting on trunk failure.",
    solution: "Fixed route orchestration policy trigger in ASR engine. Upgraded decision worker thread pool to handle 50 concurrent link failure events.",
    remarks: "ASR failover tested in staging.",
    createdAt: "2026-09-28T09:00:00Z",
    resolvedAt: "2026-09-28T09:45:00Z",
    downtimeMinutes: 45,
    raisedByName: "Alex Chen (ASR Dev)",
    docLinks: [],
    updatedAt: "2026-09-28T09:45:00Z",
  }
];

// Global in-memory / persistent mock store with automatic fallback
declare global {
  var __taskStore: MockTask[] | undefined;
}

if (!globalThis.__taskStore) {
  globalThis.__taskStore = [...INITIAL_TASKS];
}

export const taskStore = {
  getAll: (project?: ProjectCode): MockTask[] => {
    const list = globalThis.__taskStore || [];
    if (project) {
      return list.filter((t) => t.project === project);
    }
    return list;
  },

  getById: (id: string): MockTask | undefined => {
    return (globalThis.__taskStore || []).find((t) => t.id === id);
  },

  create: (task: Omit<MockTask, "id" | "updatedAt">): MockTask => {
    const id = `TS-${Math.floor(1000 + Math.random() * 9000)}`;
    const now = new Date().toISOString();
    const newTask: MockTask = {
      ...task,
      id,
      updatedAt: now,
    };
    if (!globalThis.__taskStore) {
      globalThis.__taskStore = [];
    }
    globalThis.__taskStore.unshift(newTask);
    return newTask;
  },

  update: (id: string, updates: Partial<MockTask>): MockTask | null => {
    const list = globalThis.__taskStore || [];
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) return null;

    const existing = list[index];
    const updated: MockTask = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    list[index] = updated;
    return updated;
  },

  delete: (id: string): boolean => {
    const list = globalThis.__taskStore || [];
    const index = list.findIndex((t) => t.id === id);
    if (index === -1) return false;
    list.splice(index, 1);
    return true;
  },
};
