import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { taskStore } from "@/lib/store";
import { ProjectCode } from "@/lib/project-config";
import { sendResolutionEmailAlert } from "@/lib/resend";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const project = (searchParams.get("project") as ProjectCode) || "CMS_VAL_FS";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "8", 10);
    const search = searchParams.get("search") || "";
    const tsp = searchParams.get("tsp") || "ALL";
    const lsa = searchParams.get("lsa") || "ALL";
    const sort = searchParams.get("sort") || "resolvedAt_desc";

    // 1. Try fetching from SQLite database via Prisma
    try {
      const whereClause: any = {
        project: project,
      };

      if (tsp && tsp !== "ALL") {
        whereClause.tsp = tsp;
      }
      if (lsa && lsa !== "ALL") {
        whereClause.lsa = lsa;
      }
      if (search && search.trim()) {
        const query = search.toLowerCase();
        whereClause.OR = [
          { problemDescription: { contains: query } },
          { solution: { contains: query } },
          { remarks: { contains: query } },
          { raisedByName: { contains: query } },
          { tsp: { contains: query } },
          { lsa: { contains: query } },
        ];
      }

      // Determine orderBy
      let orderBy: any = { resolvedAt: "desc" };
      if (sort === "resolvedAt_asc") orderBy = { resolvedAt: "asc" };
      else if (sort === "downtime_desc") orderBy = { downtimeMinutes: "desc" };
      else if (sort === "downtime_asc") orderBy = { downtimeMinutes: "asc" };
      else if (sort === "tsp_asc") orderBy = { tsp: "asc" };

      const total = await prisma.taskResolution.count({ where: whereClause });
      const tasks = await prisma.taskResolution.findMany({
        where: whereClause,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
      });

      const allMatchingTasks = await prisma.taskResolution.findMany({
        where: whereClause,
        orderBy,
      });

      return NextResponse.json({
        tasks,
        allMatchingTasks,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
        source: "sqlite",
      });
    } catch (dbErr) {
      console.warn("Prisma query fallback to in-memory store:", dbErr);
    }

    // 2. Fallback to in-memory store if DB query fails
    const all = taskStore.getAll(project);
    return NextResponse.json({
      tasks: all.slice(0, 8),
      allMatchingTasks: all,
      total: all.length,
      page: 1,
      pageSize: 8,
      totalPages: Math.ceil(all.length / 8) || 1,
      source: "memory_store",
    });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      project = "CMS_VAL_FS",
      tsp,
      lsa,
      status = "RESOLVED",
      problemDescription,
      solution,
      remarks,
      raisedByName = "NOC Team",
      createdAt,
      resolvedAt,
    } = body;

    if (!problemDescription || !solution) {
      return NextResponse.json(
        { error: "Problem description and solution are required" },
        { status: 400 }
      );
    }

    // Calculate downtime duration in minutes
    let downtimeMinutes = 0;
    const start = createdAt ? new Date(createdAt) : new Date(Date.now() - 45 * 60 * 1000);
    const end = resolvedAt ? new Date(resolvedAt) : new Date();
    if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
      downtimeMinutes = Math.max(0, Math.round((end.getTime() - start.getTime()) / (1000 * 60)));
    }

    let newTask: any = null;

    // 1. Try persisting to SQLite database via Prisma
    try {
      newTask = await prisma.taskResolution.create({
        data: {
          project,
          tsp: tsp || "Airtel",
          lsa: lsa || "Delhi",
          status,
          problemDescription,
          solution,
          remarks: remarks || "",
          downtimeMinutes,
          raisedByName,
          createdAt: start,
          resolvedAt: end,
        },
      });
    } catch (dbErr) {
      console.warn("Prisma write fallback to in-memory store:", dbErr);
      newTask = taskStore.create({
        project,
        tsp: tsp || "Airtel",
        lsa: lsa || "Delhi",
        status,
        problemDescription,
        solution,
        remarks: remarks || "",
        downtimeMinutes,
        raisedByName,
        docLinks: [],
        createdAt: start.toISOString(),
        resolvedAt: end.toISOString(),
      });
    }

    // 2. Dispatch async email notification
    sendResolutionEmailAlert({
      task: {
        id: newTask.id.toString(),
        project: newTask.project,
        tsp: newTask.tsp,
        lsa: newTask.lsa,
        status: newTask.status,
        problemDescription: newTask.problemDescription,
        solution: newTask.solution,
        remarks: newTask.remarks,
        downtimeMinutes: newTask.downtimeMinutes,
        raisedByName: newTask.raisedByName,
      },
    }).catch((err) => console.error("Email notification dispatch error:", err));

    return NextResponse.json({ success: true, task: newTask }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, status, problemDescription, solution, remarks } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required for update" }, { status: 400 });
    }

    try {
      const updated = await prisma.taskResolution.update({
        where: { id: Number(id) },
        data: {
          status,
          problemDescription,
          solution,
          remarks,
          updatedAt: new Date(),
        },
      });
      return NextResponse.json({ success: true, task: updated });
    } catch (dbErr) {
      const updated = taskStore.update(id.toString(), {
        status,
        problemDescription,
        solution,
        remarks,
      });
      if (!updated) {
        return NextResponse.json({ error: "Task not found" }, { status: 404 });
      }
      return NextResponse.json({ success: true, task: updated });
    }
  } catch (error) {
    console.error("PUT /api/tasks error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}
