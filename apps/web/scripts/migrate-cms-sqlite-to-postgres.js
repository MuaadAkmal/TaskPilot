const Database = require("better-sqlite3");
const { Client } = require("pg");
const fs = require("fs");
const path = require("path");

/**
 * ==============================================================================
 * TaskPilot - SQLite to PostgreSQL CMS Migration Script
 * ==============================================================================
 * 
 * Reads records from an existing local SQLite file (.db / .sqlite) in READ-ONLY mode,
 * transforms them to match the new TaskResolution schema, and inserts them into PostgreSQL.
 *
 * Usage:
 * SQLITE_PATH="/path/to/old_cms.db" \
 * NEW_DATABASE_URL="postgresql://postgres:password@localhost:5432/taskpilot_db" \
 * node scripts/migrate-cms-sqlite-to-postgres.js
 */

const SQLITE_PATH = process.env.SQLITE_PATH || path.resolve(__dirname, "../dev.db");
const NEW_DATABASE_URL =
  process.env.NEW_DATABASE_URL ||
  process.env.DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5432/taskpilot_db";

function normalizeStatus(oldStatus) {
  if (!oldStatus) return "PENDING_VERIFICATION";
  const s = String(oldStatus).trim().toUpperCase();
  if (s === "RESOLVED" || s === "DONE" || s === "COMPLETED") return "RESOLVED";
  if (s === "IN_PROGRESS" || s === "IN PROGRESS" || s === "WIP") return "IN_PROGRESS";
  if (s === "CLOSED") return "CLOSED";
  if (s === "PENDING" || s === "PENDING_VERIFICATION" || s === "OPEN") return "PENDING_VERIFICATION";
  return "PENDING_VERIFICATION";
}

async function runMigration() {
  console.log("==================================================");
  console.log("🚀 Starting TaskPilot CMS Migration: SQLite -> PostgreSQL");
  console.log("==================================================");
  console.log(`📁 Source SQLite File : ${SQLITE_PATH}`);
  console.log(`🎯 Target PostgreSQL  : ${NEW_DATABASE_URL.replace(/:[^:@]+@/, ":****@")}\n`);

  if (!fs.existsSync(SQLITE_PATH)) {
    console.error(`❌ Error: Source SQLite file does not exist at "${SQLITE_PATH}".`);
    console.error(`Please provide the correct path using: SQLITE_PATH="/path/to/your/db.db" node scripts/migrate-cms-sqlite-to-postgres.js`);
    process.exit(1);
  }

  // 1. Open SQLite database in READ-ONLY mode to guarantee zero alterations to source
  let sqliteDb;
  try {
    sqliteDb = new Database(SQLITE_PATH, { readonly: true, fileMustExist: true });
    console.log("✅ Opened source SQLite database in READ-ONLY mode (zero modification risk).");
  } catch (err) {
    console.error("❌ Failed to open SQLite database:", err.message);
    process.exit(1);
  }

  // 2. Connect to target PostgreSQL database
  const pgClient = new Client({ connectionString: NEW_DATABASE_URL });
  try {
    await pgClient.connect();
    console.log("✅ Connected to target PostgreSQL database.\n");
  } catch (err) {
    console.error("❌ Failed to connect to target PostgreSQL database:", err.message);
    sqliteDb.close();
    process.exit(1);
  }

  try {
    // 3. Query records from SQLite Task table
    console.log("⏳ Reading records from SQLite 'Task' table...");
    
    // Check available columns dynamically to prevent runtime column errors
    const tableInfo = sqliteDb.pragma("table_info(Task)");
    const columnNames = tableInfo.map((c) => c.name);
    console.log(`ℹ️ Detected columns in source Task table: ${columnNames.join(", ")}`);

    const hasDotAndLea = columnNames.includes("dotAndLea");
    const hasSolutionProvided = columnNames.includes("solutionProvided");
    const hasAssignedToId = columnNames.includes("assignedToId");

    const query = `
      SELECT 
        id, 
        lsa, 
        tsp, 
        ${hasDotAndLea ? '"dotAndLea"' : 'NULL as "dotAndLea"'}, 
        "problemDescription", 
        status, 
        ${hasSolutionProvided ? '"solutionProvided"' : 'NULL as "solutionProvided"'}, 
        remarks, 
        "createdAt", 
        "updatedAt"
      FROM Task
      ORDER BY "createdAt" ASC
    `;

    const oldTasks = sqliteDb.prepare(query).all();
    console.log(`📦 Found ${oldTasks.length} task records in SQLite.\n`);

    if (oldTasks.length === 0) {
      console.log("ℹ️ No records found to migrate. Done.");
      return;
    }

    // 4. Transform and insert each record into PostgreSQL TaskResolution
    console.log("⏳ Inserting transformed records into PostgreSQL 'TaskResolution' table...");
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

      // Handle timestamps properly whether integer ms or ISO string
      let createdAt = new Date();
      if (old.createdAt) {
        createdAt = typeof old.createdAt === "number" ? new Date(old.createdAt) : new Date(old.createdAt);
      }
      let updatedAt = new Date();
      if (old.updatedAt) {
        updatedAt = typeof old.updatedAt === "number" ? new Date(old.updatedAt) : new Date(old.updatedAt);
      }
      const resolvedAt = status === "RESOLVED" ? updatedAt : null;

      try {
        await pgClient.query(
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
      } catch (insertErr) {
        console.error(`⚠️ Failed to insert record ${old.id}:`, insertErr.message);
        skippedCount++;
      }
    }

    console.log("\n==================================================");
    console.log("🎉 SQLite to PostgreSQL Migration Complete!");
    console.log("==================================================");
    console.log(`✅ Successfully migrated : ${insertedCount} records`);
    if (skippedCount > 0) {
      console.log(`⚠️ Skipped/Failed records: ${skippedCount}`);
    }
    console.log("==================================================");
  } catch (error) {
    console.error("❌ Migration error:", error);
  } finally {
    sqliteDb.close();
    await pgClient.end();
    console.log("🔌 All database connections closed safely.");
  }
}

runMigration();
