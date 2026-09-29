import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Mock fallbacks for resilient development
let mockUsers = [
  {
    id: "usr-1",
    clerkId: "clerk_noc_1",
    email: "sarah.jenkins@telecom.net",
    name: "Sarah Jenkins",
    title: "Lead Telecom & NOC Architect",
    projects: JSON.stringify(["CMS", "CIAS", "TSOC"]),
    role: "TEAM_LEAD",
    receiveEmailAlerts: true,
    alertOnProjects: "ALL",
  },
  {
    id: "usr-2",
    clerkId: "clerk_noc_2",
    email: "alex.kumar@telecom.net",
    name: "Alex Kumar",
    title: "Security & CIAS Infrastructure Lead",
    projects: JSON.stringify(["CIAS", "TSOC"]),
    role: "ENGINEER",
    receiveEmailAlerts: true,
    alertOnProjects: "ALL",
  },
  {
    id: "usr-3",
    clerkId: "clerk_noc_3",
    email: "priya.nair@telecom.net",
    name: "Priya Nair",
    title: "Automatic Speech Recognition (ASR) Lead",
    projects: JSON.stringify(["ASR"]),
    role: "TEAM_LEAD",
    receiveEmailAlerts: false,
    alertOnProjects: JSON.stringify(["ASR"]),
  },
  {
    id: "usr-4",
    clerkId: "clerk_noc_4",
    email: "marcus.vance@telecom.net",
    name: "Marcus Vance",
    title: "CDR & IPDR Mediation Specialist",
    projects: JSON.stringify(["CMS", "CDR", "IPDR"]),
    role: "ENGINEER",
    receiveEmailAlerts: true,
    alertOnProjects: JSON.stringify(["CMS", "CDR", "IPDR"]),
  },
  {
    id: "usr-5",
    clerkId: "clerk_noc_5",
    email: "elena.rostova@telecom.net",
    name: "Elena Rostova",
    title: "Mission Critical Push-to-Talk (MCX) Specialist",
    projects: JSON.stringify(["MCX", "TSOC"]),
    role: "ENGINEER",
    receiveEmailAlerts: true,
    alertOnProjects: JSON.stringify(["MCX"]),
  },
  {
    id: "usr-6",
    clerkId: "clerk_noc_6",
    email: "tariq.mansoor@telecom.net",
    name: "Tariq Mansoor",
    title: "Telecom Security Operations Center (TSOC) Lead",
    projects: JSON.stringify(["TSOC", "CIAS"]),
    role: "TEAM_LEAD",
    receiveEmailAlerts: true,
    alertOnProjects: JSON.stringify(["TSOC"]),
  },
];

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
        if (user) return NextResponse.json({ user });
      }

      const users = await prisma.user.findMany({
        orderBy: { createdAt: "desc" },
      });

      if (users.length > 0) {
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
      }
    } catch (dbErr) {
      console.warn("DB user query error, falling back to mock state:", dbErr);
    }

    if (email) {
      const found = mockUsers.find((u) => u.email === email);
      return NextResponse.json({ user: found || mockUsers[0] });
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
