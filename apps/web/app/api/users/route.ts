import { NextResponse } from "next/server";
import { currentUser } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const rawProject = searchParams.get("project");
    const project = rawProject === "CMS_VAL_FS" ? "CMS" : rawProject;

    if (email) {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      return NextResponse.json({ user: user || null });
    }

    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });

    if (project) {
      const filtered = users.filter((u) => {
        try {
          const assigned = JSON.parse(u.projects || "[]");
          return assigned.includes(project) || (project === "CMS" && assigned.includes("CMS_VAL_FS"));
        } catch {
          return false;
        }
      });
      return NextResponse.json({ users: filtered });
    }

    return NextResponse.json({ users });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      email,
      name,
      employeeId,
      pbx,
      title,
      role,
      receiveEmailAlerts,
      projects,
      alertOnProjects,
    } = body;

    if (!email && !id) {
      return NextResponse.json({ error: "Email or ID is required." }, { status: 400 });
    }

    const projectsStr = Array.isArray(projects) ? JSON.stringify(projects) : projects || "[]";
    const alertProjectsStr = Array.isArray(alertOnProjects) ? JSON.stringify(alertOnProjects) : alertOnProjects || "ALL";

    let targetEmail = email ? String(email).trim().toLowerCase() : "";

    if (id && !targetEmail) {
      const existing = await prisma.user.findUnique({ where: { id } });
      if (existing) targetEmail = existing.email;
    }

    const user = await prisma.user.upsert({
      where: { email: targetEmail },
      update: {
        ...(name !== undefined && { name }),
        ...(employeeId !== undefined && { employeeId }),
        ...(pbx !== undefined && { pbx }),
        ...(title !== undefined && { title }),
        ...(role !== undefined && { role }),
        ...(receiveEmailAlerts !== undefined && { receiveEmailAlerts: Boolean(receiveEmailAlerts) }),
        ...(projects !== undefined && { projects: projectsStr }),
        ...(alertOnProjects !== undefined && { alertOnProjects: alertProjectsStr }),
      },
      create: {
        email: targetEmail,
        name: name || "New Engineer",
        employeeId: employeeId || null,
        pbx: pbx || null,
        title: title || "Operations Specialist",
        role: role || (targetEmail.includes("mdak") ? "ADMIN" : "ENGINEER"),
        receiveEmailAlerts: receiveEmailAlerts !== undefined ? Boolean(receiveEmailAlerts) : false,
        projects: projectsStr,
        alertOnProjects: alertProjectsStr,
      },
    });

    return NextResponse.json({ user });
  } catch (err: any) {
    console.error("User mutation error:", err);
    return NextResponse.json({ error: err.message || "Failed to save user" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to delete user" }, { status: 500 });
  }
}
