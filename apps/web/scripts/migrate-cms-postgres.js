const { Client } = require("pg");

/**
 * ==============================================================================
 * TaskPilot - PostgreSQL Migration Script (Old CMS Tasks -> New TaskPilot DB)
 * ==============================================================================
 *
 * Usage:
 * OLD_DATABASE_URL="postgresql://user:pass@localhost:5432/old_db" \
 * NEW_DATABASE_URL="postgresql://user:pass@localhost:5432/taskpilot_db" \
 * node scripts/migrate-cms-postgres.js
 */

const OLD_DATABASE_URL =
  process.env.OLD_DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/cms_old_db";

const NEW_DATABASE_URL =
  process.env.NEW_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/taskpilot_db";

function normalizeStatus(oldStatus) {
  if (!oldStatus) return "PENDING_VERIFICATION";
  const s = oldStatus.trim().toUpperCase();
  if (s === "RESOLVED" || s === "DONE" || s === "COMPLETED") return "RESOLVED";
  if (s === "IN_PROGRESS" || s === "IN PROGRESS" || s === "WIP") return "IN_PROGRESS";
  if (s === "CLOSED") return "CLOSED";
  if (s === "PENDING" || s === "PENDING_VERIFICATION" || s === "OPEN") return "PENDING_VERIFICATION";
  return "PENDING_VERIFICATION";
}

async function runMigration() {
  console.log("==================================================");
  console.log("🚀 Starting TaskPilot CMS Migration from Old DB");
  console.log("==================================================");
  console.log(`📡 Connecting to Source DB: ${OLD_DATABASE_URL.replace(/:[^:@]+@/, ":****@")}`);
  console.log(`🎯 Connecting to Target DB: ${NEW_DATABASE_URL.replace(/:[^:@]+@/, ":****@")}`);

  const oldClient = new Client({ connectionString: OLD_DATABASE_URL });
  const newClient = new Client({ connectionString: NEW_DATABASE_URL });

  try {
    await oldClient.connect();
    await newClient.connect();
    console.log("✅ Successfully connected to both databases.\n");

    console.log("⏳ Fetching records from old 'Task' table...");
    const selectRes = await oldClient.query(`
      SELECT 
        id, 
        lsa, 
        tsp, 
        "dotAndLea", 
        "problemDescription", 
        status, 
        "solutionProvided", 
        remarks, 
        "createdAt", 
        "updatedAt", 
        "assignedToId"
      FROM "Task"
      ORDER BY "createdAt" ASC
    `);

    const oldTasks = selectRes.rows;
    console.log(`📦 Found ${oldTasks.length} task records to migrate.\n`);

    if (oldTasks.length === 0) {
      console.log("ℹ️ No records found in the source table. Exiting.");
      return;
    }

    console.log("⏳ Inserting transformed records into new 'TaskResolution' table...");
    let insertedCount = 0;
    let skippedCount = 0;

    for (const old of oldTasks) {
      const project = "CMS";
      const lsa = (old.lsa || "ALL").trim();
      const tsp = (old.tsp || "ALL").trim();
      const status = normalizeStatus(old.status);
      const raisedByName = (old.dotAndLea || "DOT").trim();
      const problemDescription = (old.problemDescription || "No description provided").trim();
      const solution = (old.solutionProvided || (status === "RESOLVED" ? "Resolved" : "Under triage")).trim();
      const remarks = old.remarks ? old.remarks.trim() : null;
      const downtimeMinutes = 0;
      const createdAt = old.createdAt ? new Date(old.createdAt) : new Date();
      const updatedAt = old.updatedAt ? new Date(old.updatedAt) : new Date();
      const resolvedAt = status === "RESOLVED" ? updatedAt : null;

      try {
        await newClient.query(
          `
          INSERT INTO "TaskResolution" (
            "project",
            "tsp",
            "lsa",
            "status",
            "problemDescription",
            "solution",
            "remarks",
            "downtimeMinutes",
            "raisedByName",
            "createdAt",
            "resolvedAt",
            "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          `,
          [
            project,
            tsp,
            lsa,
            status,
            problemDescription,
            solution,
            remarks,
            downtimeMinutes,
            raisedByName,
            createdAt,
            resolvedAt,
            updatedAt,
          ]
        );
        insertedCount++;
      } catch (err) {
        console.error(`⚠️ Failed to insert record ${old.id}:`, err.message);
        skippedCount++;
      }
    }

    console.log("\n==================================================");
    console.log("🎉 Migration Summary");
    console.log("==================================================");
    console.log(`✅ Successfully migrated : ${insertedCount} records`);
    if (skippedCount > 0) {
      console.log(`⚠️ Skipped/Failed records: ${skippedCount}`);
    }
    console.log("==================================================");
  } catch (error) {
    console.error("❌ Migration failed with error:", error);
  } finally {
    await oldClient.end();
    await newClient.end();
    console.log("🔌 Database connections closed.");
  }
}

runMigration();
