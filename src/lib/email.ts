/**
 * Email Service
 *
 * Uses Resend for production email delivery with Nodemailer as fallback.
 * All emails are HTML formatted with a consistent branded template.
 */

import { Resend } from "resend";
import nodemailer from "nodemailer";

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || "noreply@vehicleguard.uk";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

// Fallback SMTP transport (for local dev without Resend)
const smtpTransport = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.resend.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  auth: {
    user: process.env.SMTP_USER || "resend",
    pass: resendApiKey || "",
  },
});

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

function wrapTemplate(title: string, content: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${title}</title>
  <style>
    body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f3f2f1; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #1d70b8; padding: 24px; text-align: center; }
    .header h1 { color: #ffffff; margin: 0; font-size: 24px; }
    .content { padding: 32px 24px; color: #0b0c0c; font-size: 16px; line-height: 1.6; }
    .footer { background: #f3f2f1; padding: 24px; text-align: center; font-size: 12px; color: #505a5f; }
    .button { display: inline-block; padding: 12px 24px; background: #00703c; color: #ffffff !important; text-decoration: none; border-radius: 4px; font-weight: 600; }
    .alert { padding: 16px; border-left: 4px solid #d4351c; background: #fdf2f2; margin: 16px 0; }
    .info { padding: 16px; border-left: 4px solid #1d70b8; background: #f0f9ff; margin: 16px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>VehicleGuard UK</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      <p>VehicleGuard UK &bull; MOT & Tax Reminder Service</p>
      <p>You are receiving this email because you have an account with us.</p>
    </div>
  </div>
</body>
</html>`;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  const html = options.html;

  if (resend) {
    await resend.emails.send({
      from: emailFrom,
      to: options.to,
      subject: options.subject,
      html,
      text: options.text,
    });
  } else {
    await smtpTransport.sendMail({
      from: emailFrom,
      to: options.to,
      subject: options.subject,
      html,
      text: options.text,
    });
  }
}

export type ReminderEmailType =
  | "MOT"
  | "TAX"
  | "SERVICE"
  | "INSURANCE"
  | "WARRANTY"
  | "BREAKDOWN";

export async function sendReminderEmail(
  to: string,
  type: ReminderEmailType,
  vehicleReg: string,
  vehicleMake: string,
  vehicleModel: string,
  dueDate: Date,
  daysRemaining: number
): Promise<void> {
  const isUrgent = daysRemaining <= 7;
  const urgencyLabel = isUrgent ? "URGENT" : "REMINDER";
  const subject = `${urgencyLabel}: Your ${type} for ${vehicleReg} is due in ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""}`;

  const typeLabels: Record<ReminderEmailType, string> = {
    MOT: "MOT Test",
    TAX: "Vehicle Tax (VED)",
    SERVICE: "Service",
    INSURANCE: "Insurance Renewal",
    WARRANTY: "Warranty Expiry",
    BREAKDOWN: "Breakdown Cover",
  };

  const typeDescriptions: Record<ReminderEmailType, string> = {
    MOT: "Your MOT test is a legal requirement for vehicles over 3 years old. Driving without a valid MOT can result in a fine of up to £1,000.",
    TAX: "Vehicle Excise Duty (VED) must be kept up to date. Driving without tax can result in an £80 fine plus the cost of backdated tax.",
    SERVICE: "Regular servicing helps maintain your vehicle's reliability, safety, and resale value.",
    INSURANCE: "Keep your insurance policy up to date. Driving without valid insurance is illegal and can result in serious penalties.",
    WARRANTY: "Your manufacturer or extended warranty may be expiring soon. Check what's still covered before it lapses.",
    BREAKDOWN: "Your breakdown cover renewal is coming up. Don't get caught without roadside assistance.",
  };

  const content = `
    <h2>${urgencyLabel}: ${typeLabels[type]} Due Soon</h2>
    
    <div class="${isUrgent ? "alert" : "info"}">
      <strong>Vehicle:</strong> ${vehicleMake} ${vehicleModel} (${vehicleReg})<br/>
      <strong>${typeLabels[type]} Due:</strong> ${dueDate.toLocaleDateString("en-GB")}<br/>
      <strong>Days Remaining:</strong> ${daysRemaining}
    </div>

    <p>${typeDescriptions[type]}</p>

    <p style="text-align: center; margin: 32px 0;">
      <a href="${process.env.APP_URL}/dashboard" class="button">View My Garage</a>
    </p>

    <p style="font-size: 14px; color: #505a5f;">
      Want to stop receiving these reminders? You can manage your preferences in your account settings.
    </p>
  `;

  await sendEmail({
    to,
    subject,
    html: wrapTemplate(subject, content),
  });
}

export async function sendWelcomeEmail(to: string, name: string): Promise<void> {
  const content = `
    <h2>Welcome to VehicleGuard UK, ${name || "there"}!</h2>
    <p>Thank you for signing up. You're now ready to:</p>
    <ul>
      <li>Check MOT and tax status for any UK vehicle</li>
      <li>Save vehicles to your personal garage</li>
      <li>Receive timely email reminders before MOT, tax, and service due dates</li>
      <li>Download detailed PDF reports</li>
    </ul>
    <p style="text-align: center; margin: 32px 0;">
      <a href="${process.env.APP_URL}/dashboard" class="button">Go to Dashboard</a>
    </p>
  `;

  await sendEmail({
    to,
    subject: "Welcome to VehicleGuard UK",
    html: wrapTemplate("Welcome", content),
  });
}
