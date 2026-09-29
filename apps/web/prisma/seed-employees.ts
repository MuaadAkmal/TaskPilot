import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Add or paste employee records here
// Supports User Name, Email, Employee ID, PBX, Title, Role, and assigned Projects
export const EMPLOYEE_RECORDS = [
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

async function seedEmployees() {
  console.log(`🌱 Seeding ${EMPLOYEE_RECORDS.length} employee records...`);

  for (const emp of EMPLOYEE_RECORDS) {
    if (!emp.email) continue;

    const email = emp.email.trim().toLowerCase();
    const name = emp.name?.trim() || null;
    const employeeId = emp.employeeId ? String(emp.employeeId).trim() : null;
    const pbx = emp.pbx ? String(emp.pbx).trim() : null;
    const title = emp.title?.trim() || "Operations Engineer";
    const role = emp.role?.trim() || "ENGINEER";

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

    console.log(`✓ [${user.employeeId || "NO_ID"}] ${user.name} (${user.email}) - PBX: ${user.pbx || "N/A"}`);
  }

  console.log(`\n🎉 Employee seeding completed!`);
}

seedEmployees()
  .catch((e) => {
    console.error("❌ Error seeding employees:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
