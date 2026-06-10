import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";

const CODE_TTL_MS = 10 * 60 * 1000;

function verificationId(userId: string) {
  return `phone-verify:${userId}`;
}

function generateCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function sendPhoneVerificationCode(
  userId: string,
  phoneNumber: string
): Promise<void> {
  const code = generateCode();
  const expires = new Date(Date.now() + CODE_TTL_MS);
  const identifier = verificationId(userId);

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.verificationToken.create({
    data: { identifier, token: code, expires },
  });

  await sendSms(
    phoneNumber,
    `VehicleGuard UK: Your verification code is ${code}. It expires in 10 minutes.`
  );
}

export async function verifyPhoneCode(
  userId: string,
  code: string
): Promise<boolean> {
  const identifier = verificationId(userId);
  const record = await prisma.verificationToken.findFirst({
    where: { identifier, token: code },
  });

  if (!record || record.expires < new Date()) {
    return false;
  }

  await prisma.verificationToken.deleteMany({ where: { identifier } });
  await prisma.user.update({
    where: { id: userId },
    data: { phoneVerified: true },
  });

  return true;
}
