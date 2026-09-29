export interface EmailAlertPayload {
  task: {
    id: string;
    project: string;
    tsp: string;
    lsa: string;
    problemDescription: string;
    solution: string;
    remarks?: string | null;
    raisedByName: string;
    downtimeMinutes?: number | null;
    resolvedAt?: string | null;
  };
  recipients?: string[];
}

export async function sendResolutionEmailAlert(payload: EmailAlertPayload): Promise<{ success: boolean; messageId?: string; simulated?: boolean }> {
  const apiKey = process.env.RESEND_API_KEY;
  const { task } = payload;

  console.log(`[Resend Email Service] Dispatching alert for Task #${task.id} (${task.project}) - TSP: ${task.tsp}, LSA: ${task.lsa}`);

  if (!apiKey || apiKey.includes("placeholder")) {
    console.log(`[Resend Email Service (Dev/Mock)] Email successfully simulated to team members for Task #${task.id}`);
    return {
      success: true,
      simulated: true,
      messageId: `sim_${Date.now()}`,
    };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const fromEmail = process.env.RESEND_FROM_EMAIL || "TaskPilot Alerts <notifications@resend.dev>";
    const toRecipients = payload.recipients && payload.recipients.length > 0 ? payload.recipients : ["team@novasmart.local"];

    const response = await resend.emails.send({
      from: fromEmail,
      to: toRecipients,
      subject: `[TaskPilot - ${task.project}] New Resolution: ${task.tsp} - ${task.lsa} (Ticket #${task.id})`,
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
          <div style="background-color: #4f46e5; padding: 16px 20px; border-radius: 8px; margin-bottom: 20px;">
            <h2 style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 700;">✈️ TaskPilot Resolution Alert</h2>
            <p style="color: #c7d2fe; margin: 4px 0 0 0; font-size: 12px;">Project: <strong>${task.project}</strong></p>
          </div>

          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
            <tr>
              <td style="padding: 8px 12px; background-color: #f8fafc; font-weight: 600; width: 30%; border: 1px solid #e2e8f0;">Ticket ID</td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0; font-family: monospace; font-weight: 700; color: #4f46e5;">#${task.id}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background-color: #f8fafc; font-weight: 600; border: 1px solid #e2e8f0;">TSP & LSA</td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0;"><strong>${task.tsp}</strong> in <strong>${task.lsa}</strong></td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background-color: #f8fafc; font-weight: 600; border: 1px solid #e2e8f0;">Raised By</td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${task.raisedByName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background-color: #f8fafc; font-weight: 600; border: 1px solid #e2e8f0;">Downtime Duration</td>
              <td style="padding: 8px 12px; border: 1px solid #e2e8f0;">${task.downtimeMinutes ? `${task.downtimeMinutes} minutes` : 'N/A'}</td>
            </tr>
          </table>

          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 13px; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Problem Description</h3>
            <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 13px; color: #1e293b; line-height: 1.5;">
              ${task.problemDescription}
            </div>
          </div>

          <div style="margin-bottom: 16px;">
            <h3 style="font-size: 13px; text-transform: uppercase; color: #059669; margin-bottom: 6px;">Verified Solution Applied</h3>
            <div style="background-color: #ecfdf5; padding: 12px; border-radius: 6px; border: 1px solid #a7f3d0; font-size: 13px; color: #064e3b; line-height: 1.5;">
              ${task.solution}
            </div>
          </div>

          ${task.remarks ? `
          <div style="margin-bottom: 20px;">
            <h3 style="font-size: 13px; text-transform: uppercase; color: #64748b; margin-bottom: 6px;">Remarks & Next Steps</h3>
            <div style="background-color: #f8fafc; padding: 12px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 13px; color: #334155;">
              ${task.remarks}
            </div>
          </div>
          ` : ''}

          <div style="text-align: center; margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0;">
            <a href="http://localhost:3000?project=${task.project}" style="display: inline-block; background-color: #4f46e5; color: #ffffff; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-size: 13px; font-weight: 600;">Open in TaskPilot Dashboard</a>
          </div>
        </div>
      `,
    });

    return {
      success: true,
      messageId: response.data?.id,
    };
  } catch (err) {
    console.error("[Resend Error]:", err);
    return {
      success: false,
    };
  }
}
