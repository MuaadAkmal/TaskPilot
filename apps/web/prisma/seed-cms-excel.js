const { PrismaClient } = require("@prisma/client");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const prisma = new PrismaClient();

/**
 * Normalizes varied date formats commonly found in Excel:
 * - "September 25th, 2026" / "September 23rd, 2026"
 * - "25/09/2026", "2026-09-25", "25-Sep-2026"
 * - Excel numeric serial timestamps (e.g. 45678)
 */
function parseDateFlexible(val) {
  if (!val) return new Date();

  if (val instanceof Date && !isNaN(val.getTime())) {
    return val;
  }

  if (typeof val === "number") {
    // Excel date code conversion
    const utcDays = Math.floor(val - 25569);
    const utcValue = utcDays * 86400;
    const dateInfo = new Date(utcValue * 1000);
    return isNaN(dateInfo.getTime()) ? new Date() : dateInfo;
  }

  if (typeof val === "string") {
    // Clean ordinal suffixes: "25th" -> "25", "23rd" -> "23", "1st" -> "1", "2nd" -> "2"
    let clean = val.replace(/(\d+)(st|nd|rd|th)/gi, "$1").trim();
    const parsed = new Date(clean);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }
  }

  return new Date();
}

/**
 * Normalizes status strings to Prisma enum values: RESOLVED, IN_PROGRESS, PENDING
 */
function normalizeStatus(val) {
  if (!val) return "RESOLVED";
  const s = String(val).trim().toUpperCase();
  if (s.includes("RESOLV")) return "RESOLVED";
  if (s.includes("PROGRESS")) return "IN_PROGRESS";
  if (s.includes("PENDING")) return "PENDING";
  if (s.includes("CLOSE")) return "RESOLVED";
  return "RESOLVED";
}

/**
 * Resolves header aliases for messy or slightly different excel columns
 */
function getRowValue(row, aliases) {
  for (const alias of aliases) {
    for (const key of Object.keys(row)) {
      if (key.trim().toLowerCase() === alias.toLowerCase()) {
        const val = row[key];
        return val !== undefined && val !== null ? String(val).trim() : "";
      }
    }
  }
  return "";
}

async function seed() {
  console.log(`\n==============================================`);
  console.log(`📊 TaskPilot - CMS Excel Ingestion & Seeding`);
  console.log(`==============================================\n`);

  // Allow custom path passed via argument: node prisma/seed-cms-excel.js /path/to/file.xlsx
  const customFilePath = process.argv[2];
  const defaultPath = path.join(__dirname, "cms_records.xlsx");
  const targetFilePath = customFilePath ? path.resolve(customFilePath) : defaultPath;

  if (!fs.existsSync(targetFilePath)) {
    console.error(`❌ Excel file not found at: ${targetFilePath}`);
    console.log(`\n👉 Usage:`);
    console.log(`   npm run prisma:seed:cms -- /path/to/your-file.xlsx`);
    console.log(`   OR place your file at: apps/web/prisma/cms_records.xlsx\n`);
    process.exit(1);
  }

  console.log(`📖 Reading Excel file: ${targetFilePath}`);
  const workbook = XLSX.readFile(targetFilePath, { cellDates: true });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];

  const rawRows = XLSX.utils.sheet_to_json(sheet, { raw: false, defval: "" });
  console.log(`📋 Found ${rawRows.length} rows in sheet "${sheetName}".\n`);

  let insertedCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];

    const lsa = getRowValue(row, ["LSA", "Circle", "Circle (LSA)", "LSA (Circle)"]) || "ALL";
    const tsp = getRowValue(row, ["TSP", "Provider", "Telecom Provider", "Operator"]) || "None";
    const problemDescription = getRowValue(row, [
      "Problem Description",
      "Problem",
      "Issue Description",
      "Description",
      "Problem description / Activity Detail",
    ]);
    const solution = getRowValue(row, [
      "Solution",
      "Resolution",
      "Action Taken",
      "Fix",
      "Root Cause & Resolution",
    ]);
    const remarks = getRowValue(row, ["Remarks", "Remark", "Notes", "Comment"]) || null;
    const raisedByName = getRowValue(row, ["Request Raised By", "Raised By", "LEA", "Raised By (LEA)"]) || "LEA / NOC Team";
    const rawStatus = getRowValue(row, ["Status", "State"]);
    const rawCreatedAt = row["Created At"] || row["Date"] || row["Date & Time"] || row["CreatedAt"];

    if (!problemDescription && !solution) {
      skippedCount++;
      continue;
    }

    const status = normalizeStatus(rawStatus);
    const createdAtDate = parseDateFlexible(rawCreatedAt);
    const resolvedAtDate = status === "RESOLVED" ? createdAtDate : null;

    await prisma.taskResolution.create({
      data: {
        project: "CMS_VAL_FS",
        lsa: lsa.toUpperCase(),
        tsp: tsp,
        status: status,
        problemDescription: problemDescription || "No description provided",
        solution: solution || "Pending resolution",
        remarks: remarks || undefined,
        raisedByName: raisedByName,
        createdAt: createdAtDate,
        resolvedAt: resolvedAtDate,
        downtimeMinutes: 0,
      },
    });

    insertedCount++;
    if (insertedCount % 20 === 0 || insertedCount === rawRows.length) {
      console.log(`  ✓ Ingested ${insertedCount} / ${rawRows.length} records...`);
    }
  }

  console.log(`\n==============================================`);
  console.log(`✨ Ingestion Complete!`);
  console.log(`   - Total Inserted: ${insertedCount}`);
  console.log(`   - Skipped Empty:  ${skippedCount}`);
  console.log(`==============================================\n`);
}

seed()
  .catch((err) => {
    console.error("❌ Fatal error seeding CMS Excel data:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
