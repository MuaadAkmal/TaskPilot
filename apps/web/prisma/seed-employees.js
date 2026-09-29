const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");

const prisma = new PrismaClient();

/**
 * You can paste raw employee lists here in Javascript or load from a JSON/CSV file.
 * Fields:
 * - name: Full User Name
 * - email: Official Email Address
 * - employeeId: Employee ID (string / number)
 * - pbx: Internal Extension / PBX code
 * - title: Designation (optional)
 * - role: "ADMIN" | "TEAM_LEAD" | "ENGINEER" (default: "ENGINEER")
 */
const DEFAULT_EMPLOYEES = [
  {
    name: "Hner R",
    email: "chan@hunter.in",
    employeeId: "3494",
    pbx: "9622",
    title: "NOC Engineer",
    role: "ENGINEER",
  },
  {
    name: "KING SOLOMON",
    email: "Ddadfasdf@asdasdfasdf.in",
    employeeId: "2464",
    pbx: "9696",
    title: "Senior Lead Engineer",
    role: "TEAM_LEAD",
  },
];

async function seed() {
  console.log(`\n========================================`);
  console.log(`🌱 Seeding Employee & User Directory...`);
  console.log(`========================================\n`);

  let employeesToSeed = DEFAULT_EMPLOYEES;

  // If an external employees.json exists in this folder, load from it
  const jsonPath = path.join(__dirname, "employees.json");
  if (fs.existsSync(jsonPath)) {
    try {
      const fileData = JSON.parse(fs.readFileSync(jsonPath, "utf8"));
      if (Array.isArray(fileData) && fileData.length > 0) {
        employeesToSeed = fileData;
        console.log(`📂 Loaded ${fileData.length} records from prisma/employees.json`);
      }
    } catch (err) {
      console.warn(`⚠️ Could not parse employees.json, falling back to default list:`, err.message);
    }
  }

  let successCount = 0;

  for (const emp of employeesToSeed) {
    if (!emp.email) {
      console.warn(`⚠️ Skipping record with missing email:`, emp);
      continue;
    }

    const email = String(emp.email).trim().toLowerCase();
    const name = emp.name ? String(emp.name).trim() : null;
    const employeeId = emp.employeeId ? String(emp.employeeId).trim() : null;
    const pbx = emp.pbx ? String(emp.pbx).trim() : null;
    const title = emp.title ? String(emp.title).trim() : "Operations Engineer";
    const role = emp.role ? String(emp.role).trim() : "ENGINEER";

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        name,
        employeeId,
        pbx,
        title,
        role,
      },
      create: {
        email,
        name,
        employeeId,
        pbx,
        title,
        role,
        projects: JSON.stringify(["CMS_VAL_FS", "ASR", "CIAS", "TSOC", "CDR", "IPDR", "MCX"]),
      },
    });

    console.log(`✓ [Emp ID: ${user.employeeId || "—"}] ${user.name || "Unnamed"} <${user.email}> | PBX: ${user.pbx || "—"} | Role: ${user.role}`);
    successCount++;
  }

  console.log(`\n✨ Successfully synced ${successCount} employees to the database!\n`);
}

seed()
  .catch((e) => {
    console.error("❌ Error running employee seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
