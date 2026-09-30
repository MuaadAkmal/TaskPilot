import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { taskStore, MockTask } from "@/lib/store";
import { calculateDowntimeMinutes } from "@/lib/utils";
import { sendResolutionEmailAlert } from "@/lib/resend";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const rawProject = searchParams.get("project") || "CMS";
    const project = rawProject === "CMS_VAL_FS" ? "CMS" : rawProject;

    const page = parseInt(searchParams.get("page") || "1", 10);
    const pageSize = parseInt(searchParams.get("pageSize") || "8", 10);
    const search = searchParams.get("search")?.toLowerCase();
    const tsp = searchParams.get("tsp");
    const lsa = searchParams.get("lsa");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const sort = searchParams.get("sort") || "resolvedAt_desc";

    // Query Prisma DB first
    try {
      const whereClause: any = {};

      // If user typed a search query, search across ALL projects OR project-specific if not searching
      if (!search) {
        whereClause.project = { in: project === "CMS" ? ["CMS", "CMS_VAL_FS"] : [project] };
      }

      if (tsp && tsp !== "ALL") whereClause.tsp = tsp;
      if (lsa && lsa !== "ALL") whereClause.lsa = lsa;

      if (search) {
        whereClause.OR = [
          { problemDescription: { contains: search, mode: "insensitive" } },
          { solution: { contains: search, mode: "insensitive" } },
          { remarks: { contains: search, mode: "insensitive" } },
          { raisedByName: { contains: search, mode: "insensitive" } },
        ];
      }

      if (startDate || endDate) {
        whereClause.resolvedAt = {};
        if (startDate) whereClause.resolvedAt.gte = new Date(startDate);
        if (endDate) whereClause.resolvedAt.lte = new Date(endDate);
      }

      let orderBy: any = [
        { resolvedAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
        { id: "desc" },
      ];
      if (sort === "resolvedAt_asc") {
        orderBy = [
          { resolvedAt: { sort: "asc", nulls: "last" } },
          { createdAt: "asc" },
          { id: "asc" },
        ];
      } else if (sort === "resolvedAt_desc") {
        orderBy = [
          { resolvedAt: { sort: "desc", nulls: "last" } },
          { createdAt: "desc" },
          { id: "desc" },
        ];
      } else if (sort === "downtime_desc") {
        orderBy = [{ downtimeMinutes: "desc" }, { id: "desc" }];
      } else if (sort === "downtime_asc") {
        orderBy = [{ downtimeMinutes: "asc" }, { id: "asc" }];
      }

      const [total, dbTasks, allMatching] = await Promise.all([
        prisma.taskResolution.count({ where: whereClause }),
        prisma.taskResolution.findMany({
          where: whereClause,
          skip: (page - 1) * pageSize,
          take: pageSize,
          orderBy,
        }),
        prisma.taskResolution.findMany({
          where: whereClause,
          orderBy,
        }),
      ]);

      const formattedTasks: MockTask[] = dbTasks.map((t) => ({
        id: t.id.toString(),
        project: t.project as any,
        tsp: t.tsp,
        lsa: t.lsa,
        status: t.status as any,
        raisedByName: t.raisedByName,
        createdByName: t.createdByName || null,
        createdByEmail: t.createdByEmail || null,
        problemDescription: t.problemDescription,
        solution: t.solution,
        remarks: t.remarks || null,
        createdAt: t.createdAt.toISOString(),
        resolvedAt: t.resolvedAt?.toISOString() || null,
        downtimeMinutes: t.downtimeMinutes || 0,
        docLinks: [],
        updatedAt: t.updatedAt.toISOString(),
      }));

      const formattedAll: MockTask[] = allMatching.map((t) => ({
        id: t.id.toString(),
        project: t.project as any,
        tsp: t.tsp,
        lsa: t.lsa,
        status: t.status as any,
        raisedByName: t.raisedByName,
        createdByName: t.createdByName || null,
        createdByEmail: t.createdByEmail || null,
        problemDescription: t.problemDescription,
        solution: t.solution,
        remarks: t.remarks || null,
        createdAt: t.createdAt.toISOString(),
        resolvedAt: t.resolvedAt?.toISOString() || null,
        downtimeMinutes: t.downtimeMinutes || 0,
        docLinks: [],
        updatedAt: t.updatedAt.toISOString(),
      }));

      return NextResponse.json({
        tasks: formattedTasks,
        allMatchingTasks: formattedAll,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      });
    } catch (dbError) {
      console.warn("DB query failed, falling back to taskStore:", dbError);
    }

    // Fallback store
    let filtered = taskStore.getAll().filter((t) => {
      if (search) return true; // search across all projects
      if (project === "CMS") {
        return t.project === "CMS" || t.project === ("CMS_VAL_FS" as any);
      }
      return t.project === project;
    });

    if (tsp && tsp !== "ALL") filtered = filtered.filter((t) => t.tsp === tsp);
    if (lsa && lsa !== "ALL") filtered = filtered.filter((t) => t.lsa === lsa);
    if (startDate) filtered = filtered.filter((t) => t.resolvedAt && t.resolvedAt >= startDate);
    if (endDate) filtered = filtered.filter((t) => t.resolvedAt && t.resolvedAt <= endDate);
    if (search) {
      filtered = filtered.filter(
        (t) =>
          t.problemDescription.toLowerCase().includes(search) ||
          t.solution.toLowerCase().includes(search) ||
          t.raisedByName.toLowerCase().includes(search) ||
          (t.createdByName && t.createdByName.toLowerCase().includes(search)) ||
          (t.createdByEmail && t.createdByEmail.toLowerCase().includes(search)) ||
          (t.remarks && t.remarks.toLowerCase().includes(search))
      );
    }

    if (sort === "resolvedAt_desc") {
      filtered.sort((a, b) => new Date(b.resolvedAt || 0).getTime() - new Date(a.resolvedAt || 0).getTime());
    } else if (sort === "resolvedAt_asc") {
      filtered.sort((a, b) => new Date(a.resolvedAt || 0).getTime() - new Date(b.resolvedAt || 0).getTime());
    } else if (sort === "downtime_desc") {
      filtered.sort((a, b) => (b.downtimeMinutes || 0) - (a.downtimeMinutes || 0));
    } else if (sort === "downtime_asc") {
      filtered.sort((a, b) => (a.downtimeMinutes || 0) - (b.downtimeMinutes || 0));
    }

    const total = filtered.length;
    const startIndex = (page - 1) * pageSize;
    const paginated = filtered.slice(startIndex, startIndex + pageSize);

    return NextResponse.json({
      tasks: paginated,
      allMatchingTasks: filtered,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to fetch tasks" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      project = "CMS",
      tsp,
      lsa,
      status = "RESOLVED",
      raisedByName = "NOC Team",
      createdByName = "NOC Engineer",
      createdByEmail = "engineer@taskpilot.io",
      problemDescription,
      solution,
      remarks,
      createdAt,
      resolvedAt,
    } = body;

    const finalTsp = tsp || (project === "TSOC" || project === "MCX" ? "-" : project === "ASR" ? "General" : "");
    const finalLsa = lsa || (project === "TSOC" || project === "MCX" || project === "CIAS" || project === "ASR" ? "-" : "");

    if (!finalTsp || !finalLsa || !problemDescription || !solution) {
      return NextResponse.json(
        { error: "Missing required fields: problemDescription, solution." },
        { status: 400 }
      );
    }

    const createdDate = createdAt ? new Date(createdAt) : new Date();
    const resolvedDate = resolvedAt ? new Date(resolvedAt) : new Date();
    const downtimeMinutes = calculateDowntimeMinutes(
      createdDate.toISOString(),
      resolvedDate.toISOString()
    );

    let createdTask: MockTask;

    try {
      const dbTask = await prisma.taskResolution.create({
        data: {
          project: project === "CMS_VAL_FS" ? "CMS" : project,
          tsp: finalTsp,
          lsa: finalLsa,
          status,
          raisedByName,
          createdByName,
          createdByEmail,
          problemDescription,
          solution,
          remarks,
          downtimeMinutes,
          createdAt: createdDate,
          resolvedAt: resolvedDate,
        },
      });

      createdTask = {
        id: dbTask.id.toString(),
        project: dbTask.project as any,
        tsp: dbTask.tsp,
        lsa: dbTask.lsa,
        status: dbTask.status as any,
        raisedByName: dbTask.raisedByName,
        createdByName: dbTask.createdByName || createdByName,
        createdByEmail: dbTask.createdByEmail || createdByEmail,
        problemDescription: dbTask.problemDescription,
        solution: dbTask.solution,
        remarks: dbTask.remarks || null,
        createdAt: dbTask.createdAt.toISOString(),
        resolvedAt: dbTask.resolvedAt?.toISOString() || null,
        downtimeMinutes: dbTask.downtimeMinutes || 0,
        docLinks: [],
        updatedAt: dbTask.updatedAt.toISOString(),
      };
    } catch (dbError) {
      console.warn("DB insert failed, writing to fallback memory store:", dbError);
      createdTask = taskStore.create({
        project,
        tsp: finalTsp,
        lsa: finalLsa,
        status,
        raisedByName,
        createdByName,
        createdByEmail,
        problemDescription,
        solution,
        remarks: remarks || null,
        createdAt: createdDate.toISOString(),
        resolvedAt: resolvedDate.toISOString(),
        downtimeMinutes,
        docLinks: [],
      });
    }

    try {
      sendResolutionEmailAlert({ task: createdTask }).catch((err) => {
        console.warn("Async email alert dispatch error:", err);
      });
    } catch (e) {
      // Non-blocking
    }

    return NextResponse.json({ task: createdTask }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to create task" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, tsp, lsa, status, raisedByName, problemDescription, solution, remarks } = body;

    if (!id) {
      return NextResponse.json({ error: "Missing required task ID" }, { status: 400 });
    }

    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      try {
        const updatedDb = await prisma.taskResolution.update({
          where: { id: numericId },
          data: {
            ...(tsp && { tsp }),
            ...(lsa && { lsa }),
            ...(status && { status }),
            ...(raisedByName && { raisedByName }),
            ...(problemDescription && { problemDescription }),
            ...(solution && { solution }),
            ...(remarks !== undefined && { remarks }),
          },
        });

        return NextResponse.json({ task: updatedDb }, { status: 200 });
      } catch (dbErr) {
        console.warn("DB update failed, updating memory store fallback:", dbErr);
      }
    }

    const updatedTask = taskStore.update(id, {
      tsp,
      lsa,
      status,
      raisedByName,
      problemDescription,
      solution,
      remarks,
    });

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    }

    return NextResponse.json({ task: updatedTask }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to update task" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const numericId = parseInt(id, 10);
    if (!isNaN(numericId)) {
      try {
        await prisma.taskResolution.delete({
          where: { id: numericId },
        });
      } catch (dbErr: any) {
        console.warn("DB delete failed, falling back to memory store:", dbErr.message);
      }
    }

    taskStore.delete(id);
    return NextResponse.json({ success: true, id }, { status: 200 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to delete task" }, { status: 500 });
  }
}

