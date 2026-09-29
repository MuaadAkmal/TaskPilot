import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding initial TaskPilot records...");

  const count = await prisma.taskResolution.count();
  if (count > 0) {
    console.log(`Database already contains ${count} records. Skipping seed.`);
    return;
  }

  const initialRecords = [
    {
      project: "CMS_VAL_FS",
      tsp: "Airtel",
      lsa: "Delhi",
      status: "RESOLVED",
      problemDescription: "High BER and intermittent link drops observed on primary 10G optical interconnect between Delhi Core router and OLT-04.",
      solution: "Cleaned optical fiber LC connectors, measured RX power (-14dBm vs previous -23dBm), and swapped degraded 10G-LR SFP+ module on interface TenGigE0/1/0/4.",
      remarks: "Optics telemetry stabilized. Scheduled 24h BER soak test.",
      downtimeMinutes: 42,
      raisedByName: "Rahul Sharma (NOC Tier 2)",
      createdAt: new Date(Date.now() - 3600000 * 24),
      resolvedAt: new Date(Date.now() - 3600000 * 23),
    },
    {
      project: "CMS_VAL_FS",
      tsp: "Jio",
      lsa: "Mumbai",
      status: "RESOLVED",
      problemDescription: "BGP IPv4 peering session flap between Mumbai Peering Node and IX switch due to hold timer expiry during traffic burst.",
      solution: "Adjusted BGP timers to keepalive 10s / holdtime 30s. Enabled BFD fast-failover with 300ms intervals and hardened CoPP policy for BGP control plane traffic.",
      remarks: "Session steady. No further prefix drops observed across peak load window.",
      downtimeMinutes: 18,
      raisedByName: "Amit Patel (Core NetOps)",
      createdAt: new Date(Date.now() - 3600000 * 18),
      resolvedAt: new Date(Date.now() - 3600000 * 17.7),
    },
    {
      project: "CMS_VAL_FS",
      tsp: "Vodafone Idea (Vi)",
      lsa: "Karnataka",
      status: "RESOLVED",
      problemDescription: "Multiple cell site gateways (CSG) failing RADIUS TACACS+ authentication post upgrade on Bangalore aggregation ring.",
      solution: "Updated shared secret mismatch in AAA configuration template and restarted local freeradius-auth daemon on radius-auth-blr-02.",
      remarks: "All 14 node authentications verified successfully.",
      downtimeMinutes: 65,
      raisedByName: "Priya Nair (L2 Field Eng)",
      createdAt: new Date(Date.now() - 3600000 * 12),
      resolvedAt: new Date(Date.now() - 3600000 * 10.9),
    },
    {
      project: "CMS_VAL_FS",
      tsp: "BSNL",
      lsa: "Kolkata",
      status: "RESOLVED",
      problemDescription: "Fiber cut on NH-34 underground conduit affecting 40G DWDM trunk line between Kolkata Central and Siliguri.",
      solution: "Field maintenance team executed OTDR trace, located physical rupture at KM 42.6, pulled 120m replacement armored fiber, and completed fusion splicing.",
      remarks: "All 32 lambda channels restored to normal power levels.",
      downtimeMinutes: 210,
      raisedByName: "Debjit Roy (Optical Operations)",
      createdAt: new Date(Date.now() - 3600000 * 8),
      resolvedAt: new Date(Date.now() - 3600000 * 4.5),
    },
    {
      project: "ASR",
      tsp: "Dynamic Route Optimizer",
      lsa: "DC-North-Primary",
      status: "RESOLVED",
      problemDescription: "Route optimizer daemon CPU pegged at 100% due to unhandled circular metric recalculation loop during failover.",
      solution: "Applied patch v2.4.1 preventing circular DAG evaluation, restarted route-daemon service, and verified route convergence within 12ms.",
      remarks: "Patched across all 4 production broker instances.",
      downtimeMinutes: 25,
      raisedByName: "Marcus Vance (SRE Team)",
      createdAt: new Date(Date.now() - 3600000 * 6),
      resolvedAt: new Date(Date.now() - 3600000 * 5.5),
    },
    {
      project: "CIAS",
      tsp: "Identity & Access IAM",
      lsa: "Production DMZ",
      status: "RESOLVED",
      problemDescription: "JWT token signing key rotation failed on auth microservice causing 401 unauthorized errors for incoming gateway requests.",
      solution: "Manually reloaded public JWKS certificate cache and refreshed Vault secret lease for authentication microservice.",
      remarks: "Automated rotation webhook updated with retry backoff.",
      downtimeMinutes: 14,
      raisedByName: "Elena Rostova (SecOps)",
      createdAt: new Date(Date.now() - 3600000 * 3),
      resolvedAt: new Date(Date.now() - 3600000 * 2.7),
    },
  ];

  for (const record of initialRecords) {
    await prisma.taskResolution.create({
      data: record,
    });
  }

  console.log(`Successfully seeded ${initialRecords.length} records into SQLite database!`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
