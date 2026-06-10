/**
 * SMS Service
 *
 * Uses Twilio for SMS delivery. Falls back gracefully if not configured.
 */

import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export async function sendSms(to: string, body: string): Promise<void> {
  if (!client || !fromNumber) {
    console.log("[SMS] Twilio not configured. Would send to", to, ":", body);
    return;
  }

  let normalizedTo = to.replace(/\s/g, "").trim();
  if (normalizedTo.startsWith("0")) {
    normalizedTo = "+44" + normalizedTo.slice(1);
  }
  if (!normalizedTo.startsWith("+")) {
    normalizedTo = "+" + normalizedTo;
  }

  await client.messages.create({
    body,
    from: fromNumber,
    to: normalizedTo,
  });
}

export async function verifyPhoneNumber(phone: string, code: string): Promise<boolean> {
  // In a real app, this would use Twilio Verify API
  // For now, we just accept any code in dev mode
  console.log("[SMS] Verify", phone, "with code", code);
  return true;
}
