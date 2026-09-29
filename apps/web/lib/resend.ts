import { Resend } from "resend";
import { ProjectCode, PROJECTS } from "./project-config";
import { prisma } from "./prisma";

const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey && !resendApiKey.includes("placeholder") ? new Resend(resendApiKey) : null;

export interface EmailAlertPayload {
  task: {
    id: string;
    project: string;
    tsp: string;
    lsa: string;
    status?: string;
    problemDescription: string;
    solution: string;
    remarks?: string | null;
    raisedByName: string;
    downtimeMinutes?: number | null;
    resolvedAt?: string | Date | null;
  };
  teamEmails?: string[];
}

export async function sendResolutionEmailAlert({ task, teamEmails }: EmailAlertPayload) {
  const projectMeta = PROJECTS.find((p) => p.code === (task.project as ProjectCode)) || PROJECTS[0];

  // 1. Fetch subscribed team members who haven't opted out
  let recipients: string[] = [];
  if (teamEmails && teamEmails.length > 0) {
    recipients = teamEmails;
  } else {
    try {
      const activeSubscribedUsers = await prisma.user.findMany({
        where: {
          receiveEmailAlerts: true, // Only users with the tick mark enabled
        },
        select: {
          email: true,
          projects: true,
          alertOnProjects: true,
        },
      });

      // Filter by project subscription
      recipients = activeSubscribedUsers
        .filter((u) => {
          if (u.alertOnProjects === "ALL") return true;
          try {
            const projects = JSON.parse(u.projects || "[]");
            return projects.includes(task.project);
          } catch {
            return true;
          }
        })
        .map((u) => u.email);
    } catch (dbErr) {
      console.warn("Could not query subscribed users from DB:", dbErr);
    }
  }

  // Fallback default list if no custom users in DB yet
  if (recipients.length === 0) {
    recipients = ["team-alerts@taskpilot.internal"];
  }

  const emailHtml = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #4f46e5; padding: 24px; color: #ffffff;">
        <h1 style="margin: 0; font-size: 20px; font-weight: 700;">TaskPilot Incident Resolution Alert</h1>
        <p style="margin: 6px 0 0 0; font-size: 13px; color: #e0e7ff;">New resolved entry recorded for <strong>${projectMeta.name}</strong></p>
      </div>
      
      <div style="padding: 24px; color: #1e293b; font-size: 14px; line-height: 1.5;">
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Ticket ID</td>
            <td style="padding: 6px 0; font-weight: 700; color: #4f46e5;">#${task.id}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">${projectMeta.fields.primaryFieldLabel}</td>
            <td style="padding: 6px 0; font-weight: 600;">${task.tsp}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">${projectMeta.fields.secondaryFieldLabel}</td>
            <td style="padding: 6px 0; font-weight: 600;">${task.lsa}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Raised By</td>
            <td style="padding: 6px 0;">${task.raisedByName}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 600;">Downtime Duration</td>
            <td style="padding: 6px 0; font-weight: 600; color: #b45309;">${task.downtimeMinutes ? `${task.downtimeMinutes} mins` : "N/A"}</td>
          </tr>
        </table>

        <div style="background-color: #f8fafc; border-left: 4px solid #6366f1; padding: 14px; margin-bottom: 16px; border-radius: 4px;">
          <h3 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #334155; text-transform: uppercase;">Problem Description</h3>
          <p style="margin: 0; color: #0f172a;">${task.problemDescription}</p>
        </div>

        <div style="background-color: #ecfdf5; border-left: 4px solid #10b981; padding: 14px; margin-bottom: 16px; border-radius: 4px;">
          <h3 style="margin: 0 0 6px 0; font-size: 13px; font-weight: 700; color: #065f46; text-transform: uppercase;">Verified Solution Applied</h3>
          <p style="margin: 0; color: #064e3b; font-family: monospace;">${task.solution}</p>
        </div>

        ${
          task.remarks
            ? `<div style="background-color: #f1f5f9; padding: 12px; margin-bottom: 20px; border-radius: 6px;">
                <strong style="font-size: 12px; color: #475569;">Remarks / Notes:</strong>
                <p style="margin: 4px 0 0 0; color: #334155; font-size: 13px;">${task.remarks}</p>
              </div>`
            : ""
        }

        <div style="text-align: center; margin-top: 24px;">
          <a href="http://localhost:3005?project=${task.project}" style="background-color: #4f46e5; color: #ffffff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 13px; font-weight: 600; display: inline-block;">
            Open in TaskPilot Dashboard
          </a>
        </div>
      </div>

      <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 14px; text-align: center; color: #94a3b8; font-size: 11px;">
        Sent automatically by TaskPilot Operational Hub to opted-in team members.
      </div>
    </div>
  `;

  if (!resend) {
    console.log(`[Resend Mock Simulation] Alert dispatched only to opted-in users (${recipients.join(", ")}): Ticket #${task.id}`);
    return { success: true, simulated: true, recipients };
  }

  try {
    const fromAddress = process.env.RESEND_FROM_EMAIL || "TaskPilot Alerts <onboarding@resend.dev>";
    const response = await resend.emails.send({
      from: fromAddress,
      to: recipients,
      subject: `[TaskPilot - ${projectMeta.badge}] Incident #${task.id} Resolved (${task.tsp} / ${task.lsa})`,
      html: emailHtml,
    });
    return { success: true, response, recipients };
  } catch (error) {
    console.error("[Resend Error]: Failed to send notification email", error);
    return { success: false, error };
  }
}
