const { Client } = require("pg");
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

/**
 * ==============================================================================
 * TaskPilot - SQLite to PostgreSQL CMS Migration Script (Zero C++ Addons)
 * ==============================================================================
 * 
 * Uses SQLite CLI / python fallback to dump records to JSON without native C++
 * bindings to eliminate segmentation faults on Linux environments.
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

// Read SQLite records safely using python3 or sqlite3 CLI
function readSqliteRecords(dbPath) {
  const pythonScript = `
import sqlite3, json, sys

try:
    conn = sqlite3.connect("file:${dbPath}?mode=ro", uri=True)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM Task ORDER BY createdAt ASC")
    rows = [dict(row) for row in cursor.fetchall()]
    print(json.dumps(rows))
except Exception as e:
    sys.stderr.write(str(e))
    sys.exit(1)
`;

  try {
    const output = execSync(`python3 -c '${pythonScript.replace(/'/g, "'\\''")}'`, {
      maxBuffer: 50 * 1024 * 1024,
      encoding: "utf-8",
    });
    return JSON.parse(output);
  } catch (pyErr) {
    console.warn("⚠️ Python extractor failed, falling back to sqlite3 CLI JSON dump...");
    const sqliteCliOutput = execSync(`sqlite3 "${dbPath}" ".mode json" "SELECT * FROM Task ORDER BY createdAt ASC;"`, {
      maxBuffer: 50 * 1024 * 1024,
      encoding: "utf-8",
    });
    return JSON.parse(sqliteCliOutput);
  }
}

async function runMigration() {
  console.log("==================================================");
  console.log("🚀 Starting TaskPilot CMS Migration: SQLite -> PostgreSQL");
  console.log("==================================================");
  console.log(`📁 Source SQLite File : ${SQLITE_PATH}`);
  console.log(`🎯 Target PostgreSQL  : ${NEW_DATABASE_URL.replace(/:[^:@]+@/, ":****@")}\n`);

  if (!fs.existsSync(SQLITE_PATH)) {
    console.error(`❌ Error: Source SQLite file does not exist at "${SQLITE_PATH}".`);
    process.exit(1);
  }

  // 1. Fetch records safely without native C++ crashes
  let oldTasks = [];
  try {
    console.log("⏳ Reading records safely in READ-ONLY mode from SQLite...");
    oldTasks = readSqliteRecords(SQLITE_PATH);
    console.log(`📦 Successfully extracted ${oldTasks.length} task records from SQLite.\n`);
  } catch (err) {
    console.error("❌ Failed to read from SQLite:", err.message);
    process.exit(1);
  }

  if (oldTasks.length === 0) {
    console.log("ℹ️ No records found to migrate. Done.");
    return;
  }

  // 2. Connect to PostgreSQL
  const pgClient = new Client({ connectionString: NEW_DATABASE_URL });
  try {
    await pgClient.connect();
    console.log("✅ Connected to target PostgreSQL database.\n");
  } catch (err) {
    console.error("❌ Failed to connect to target PostgreSQL database:", err.message);
    process.exit(1);
  }

  try {
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
      const remarks = old.remarks ? String(old.remarks).trim() : null;
      const downtimeMinutes = 0;

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
    await pgClient.end();
    console.log("🔌 PostgreSQL connection closed safely.");
  }
}

runMigration();
