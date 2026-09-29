import { NextRequest, NextResponse } from "next/server";
import { taskStore } from "@/lib/store";
import { ProjectCode } from "@/lib/project-config";
import { sendResolutionEmailAlert } from "@/lib/resend";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const project = (searchParams.get("project") as ProjectCode) || "CMS_VAL_FS";
  const tsp = searchParams.get("tsp");
  const lsa = searchParams.get("lsa");
  const search = searchParams.get("search")?.toLowerCase().trim();
  const startDate = searchParams.get("startDate");
  const endDate = searchParams.get("endDate");
  const sort = searchParams.get("sort") || "resolvedAt_desc";
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "8", 10);

  let tasks = taskStore.getAll(project);

  // Filter by TSP
  if (tsp && tsp !== "ALL") {
    tasks = tasks.filter((t) => t.tsp === tsp);
  }

  // Filter by LSA
  if (lsa && lsa !== "ALL") {
    tasks = tasks.filter((t) => t.lsa === lsa);
  }

  // Filter by search query (searches problemDescription, solution, remarks, raisedByName, tsp, lsa)
  if (search) {
    tasks = tasks.filter(
      (t) =>
        t.problemDescription.toLowerCase().includes(search) ||
        t.solution.toLowerCase().includes(search) ||
        (t.remarks && t.remarks.toLowerCase().includes(search)) ||
        t.raisedByName.toLowerCase().includes(search) ||
        t.tsp.toLowerCase().includes(search) ||
        t.lsa.toLowerCase().includes(search) ||
        t.id.toLowerCase().includes(search)
    );
  }

  // Filter by Date Range
  if (startDate) {
    const start = new Date(startDate).getTime();
    tasks = tasks.filter((t) => new Date(t.createdAt).getTime() >= start);
  }
  if (endDate) {
    const end = new Date(endDate).getTime();
    tasks = tasks.filter((t) => new Date(t.createdAt).getTime() <= end);
  }

  // Sorting
  tasks.sort((a, b) => {
    switch (sort) {
      case "resolvedAt_asc":
        return new Date(a.resolvedAt || a.createdAt).getTime() - new Date(b.resolvedAt || b.createdAt).getTime();
      case "resolvedAt_desc":
        return new Date(b.resolvedAt || b.createdAt).getTime() - new Date(a.resolvedAt || a.createdAt).getTime();
      case "downtime_desc":
        return (b.downtimeMinutes || 0) - (a.downtimeMinutes || 0);
      case "downtime_asc":
        return (a.downtimeMinutes || 0) - (b.downtimeMinutes || 0);
      case "tsp_asc":
        return a.tsp.localeCompare(b.tsp);
      case "lsa_asc":
        return a.lsa.localeCompare(b.lsa);
      default:
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const total = tasks.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startIndex = (page - 1) * pageSize;
  const paginatedTasks = tasks.slice(startIndex, startIndex + pageSize);

  return NextResponse.json({
    tasks: paginatedTasks,
    allMatchingTasks: tasks, // used for full CSV/PDF export
    total,
    page,
    totalPages,
    pageSize,
  });
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
      raisedByName = "Operations Engineer",
      createdAt,
      resolvedAt,
    } = body;

    if (!problemDescription || !solution || !tsp || !lsa) {
      return NextResponse.json(
        { error: "Missing required fields (TSP, LSA, Problem Description, Solution)" },
        { status: 400 }
      );
    }

    const cTime = createdAt ? new Date(createdAt).toISOString() : new Date().toISOString();
    const rTime = resolvedAt ? new Date(resolvedAt).toISOString() : new Date().toISOString();

    // Compute downtime in minutes
    let downtimeMinutes: number | null = null;
    if (cTime && rTime) {
      const diffMs = new Date(rTime).getTime() - new Date(cTime).getTime();
      downtimeMinutes = Math.max(0, Math.round(diffMs / (1000 * 60)));
    }

    const newTask = taskStore.create({
      project: project as ProjectCode,
      tsp,
      lsa,
      status,
      problemDescription,
      solution,
      remarks: remarks || null,
      raisedByName,
      createdAt: cTime,
      resolvedAt: rTime,
      downtimeMinutes,
      docLinks: [],
    });

    // Asynchronously trigger Resend Email alert
    sendResolutionEmailAlert({
      task: {
        id: newTask.id,
        project: newTask.project,
        tsp: newTask.tsp,
        lsa: newTask.lsa,
        problemDescription: newTask.problemDescription,
        solution: newTask.solution,
        remarks: newTask.remarks,
        raisedByName: newTask.raisedByName,
        downtimeMinutes: newTask.downtimeMinutes,
        resolvedAt: newTask.resolvedAt,
      },
    }).catch((err) => console.error("Email alert background dispatch failed:", err));

    return NextResponse.json({ success: true, task: newTask }, { status: 201 });
  } catch (error) {
    console.error("POST /api/tasks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    // Recompute downtime if timestamps changed
    if (updates.createdAt && updates.resolvedAt) {
      const diffMs = new Date(updates.resolvedAt).getTime() - new Date(updates.createdAt).getTime();
      updates.downtimeMinutes = Math.max(0, Math.round(diffMs / (1000 * 60)));
    }

    const updatedTask = taskStore.update(id, updates);
    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, task: updatedTask });
  } catch (error) {
    console.error("PUT /api/tasks error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
