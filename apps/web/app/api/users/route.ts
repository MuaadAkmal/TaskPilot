import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Empty user mock fallback
let mockUsers: any[] = [];

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");
    const rawProject = searchParams.get("project");
    const project = rawProject === "CMS_VAL_FS" ? "CMS" : rawProject;

    try {
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
    } catch (dbErr) {
      console.warn("DB user query error, falling back to empty state:", dbErr);
    }

    if (email) {
      const found = mockUsers.find((u) => u.email === email);
      return NextResponse.json({ user: found || null });
    }

    if (project) {
      const filtered = mockUsers.filter((u) => {
        try {
          const assigned = JSON.parse(u.projects || "[]");
          return assigned.includes(project) || (project === "CMS" && assigned.includes("CMS_VAL_FS"));
        } catch {
          return false;
        }
      });
      return NextResponse.json({ users: filtered });
    }

    return NextResponse.json({ users: mockUsers });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to fetch users" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, name, title, role, receiveEmailAlerts, projects, alertOnProjects } = body;

    if (!email) {
      return NextResponse.json({ error: "Email is required." }, { status: 400 });
    }

    const projectsStr = Array.isArray(projects) ? JSON.stringify(projects) : projects || "[]";
    const alertProjectsStr = Array.isArray(alertOnProjects) ? JSON.stringify(alertOnProjects) : alertOnProjects || "ALL";

    try {
      const user = await prisma.user.upsert({
        where: { email },
        update: {
          name: name || undefined,
          title: title || undefined,
          role: role || undefined,
          receiveEmailAlerts: receiveEmailAlerts !== undefined ? Boolean(receiveEmailAlerts) : undefined,
          projects: projectsStr,
          alertOnProjects: alertProjectsStr,
        },
        create: {
          clerkId: `usr_${Date.now()}`,
          email,
          name: name || "Anonymous Engineer",
          title: title || "Operations Specialist",
          role: role || "ENGINEER",
          receiveEmailAlerts: receiveEmailAlerts !== undefined ? Boolean(receiveEmailAlerts) : true,
          projects: projectsStr,
          alertOnProjects: alertProjectsStr,
        },
      });

      return NextResponse.json({ user });
    } catch (dbErr) {
      console.warn("DB upsert user error, updating mock fallback:", dbErr);
      const existingIdx = mockUsers.findIndex((u) => u.email === email);
      const updatedUser = {
        id: existingIdx >= 0 ? mockUsers[existingIdx].id : `usr-${Date.now()}`,
        clerkId: `clerk_${Date.now()}`,
        email,
        name: name || "Current Engineer",
        title: title || "Operations Engineer",
        projects: projectsStr,
        role: role || "ENGINEER",
        receiveEmailAlerts: receiveEmailAlerts !== undefined ? Boolean(receiveEmailAlerts) : true,
        alertOnProjects: alertProjectsStr,
      };

      if (existingIdx >= 0) {
        mockUsers[existingIdx] = updatedUser;
      } else {
        mockUsers.push(updatedUser);
      }

      return NextResponse.json({ user: updatedUser });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || "Failed to upsert user" }, { status: 500 });
  }
}
