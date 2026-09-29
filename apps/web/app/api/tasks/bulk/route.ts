import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { taskStore, MockTask } from "@/lib/store";
import { calculateDowntimeMinutes } from "@/lib/utils";

// Bulk operations handler: supports status change, delete, and CSV array import
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, ids, status, tasks, project = "CMS" } = body;

    // 1. Bulk Status Update
    if (action === "updateStatus") {
      if (!ids || !Array.isArray(ids) || ids.length === 0 || !status) {
        return NextResponse.json({ error: "Missing ids or target status." }, { status: 400 });
      }

      const numericIds = ids.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));

      try {
        if (numericIds.length > 0) {
          await prisma.taskResolution.updateMany({
            where: { id: { in: numericIds } },
            data: {
              status,
              updatedAt: new Date(),
              ...(status === "RESOLVED" || status === "CLOSED" ? { resolvedAt: new Date() } : {}),
            },
          });
        }
      } catch (dbErr) {
        console.warn("DB bulk update error, falling back to store:", dbErr);
      }

      // Memory store fallback sync
      ids.forEach((id) => {
        taskStore.update(id, {
          status,
          ...(status === "RESOLVED" || status === "CLOSED" ? { resolvedAt: new Date().toISOString() } : {}),
        });
      });

      return NextResponse.json({ success: true, count: ids.length, status }, { status: 200 });
    }

    // 2. Bulk Import Tasks (from CSV)
    if (action === "importTasks") {
      if (!tasks || !Array.isArray(tasks) || tasks.length === 0) {
        return NextResponse.json({ error: "No tasks provided for import." }, { status: 400 });
      }

      let insertedCount = 0;
      const createdList: MockTask[] = [];

      for (const t of tasks) {
        const tsp = (t.tsp || "ALL").trim();
        const lsa = (t.lsa || "ALL").trim();
        const problemDescription = (t.problemDescription || "Bulk imported incident").trim();
        const solution = (t.solution || (t.status === "RESOLVED" ? "Resolved" : "Under triage")).trim();
        const taskStatus = t.status || "RESOLVED";
        const raisedByName = t.raisedByName || "NOC Team";
        const createdByName = t.createdByName || "CSV Import Operator";
        const createdByEmail = t.createdByEmail || "operator@taskpilot.io";
        const remarks = t.remarks || null;
        const createdAt = t.createdAt ? new Date(t.createdAt) : new Date();
        const resolvedAt = taskStatus === "RESOLVED" ? (t.resolvedAt ? new Date(t.resolvedAt) : new Date()) : null;
        const downtimeMinutes = calculateDowntimeMinutes(
          createdAt.toISOString(),
          (resolvedAt || createdAt).toISOString()
        );

        try {
          const dbTask = await prisma.taskResolution.create({
            data: {
              project: t.project || project,
              tsp,
              lsa,
              status: taskStatus,
              raisedByName,
              createdByName,
              createdByEmail,
              problemDescription,
              solution,
              remarks,
              downtimeMinutes,
              createdAt,
              resolvedAt,
            },
          });

          createdList.push({
            id: dbTask.id.toString(),
            project: dbTask.project as any,
            tsp: dbTask.tsp,
            lsa: dbTask.lsa,
            status: dbTask.status as any,
            raisedByName: dbTask.raisedByName,
            createdByName: dbTask.createdByName || null,
            createdByEmail: dbTask.createdByEmail || null,
            problemDescription: dbTask.problemDescription,
            solution: dbTask.solution,
            remarks: dbTask.remarks,
            createdAt: dbTask.createdAt.toISOString(),
            resolvedAt: dbTask.resolvedAt ? dbTask.resolvedAt.toISOString() : null,
            downtimeMinutes: dbTask.downtimeMinutes || 0,
            docLinks: [],
            updatedAt: dbTask.updatedAt.toISOString(),
          });
          insertedCount++;
        } catch (dbErr) {
          // Memory store fallback
          const memTask = taskStore.create({
            project: t.project || project,
            tsp,
            lsa,
            status: taskStatus,
            raisedByName,
            createdByName,
            createdByEmail,
            problemDescription,
            solution,
            remarks,
            createdAt: createdAt.toISOString(),
            resolvedAt: resolvedAt ? resolvedAt.toISOString() : null,
            downtimeMinutes,
            docLinks: [],
          });
          createdList.push(memTask);
          insertedCount++;
        }
      }

      return NextResponse.json({ success: true, count: insertedCount, tasks: createdList }, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid action. Supported: updateStatus, importTasks" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed bulk operation" }, { status: 500 });
  }
}
