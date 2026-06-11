import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal-page-shell";

export const metadata: Metadata = {
  title: "Terms of Service | VehicleGuard UK",
  description: "Terms and conditions for using VehicleGuard UK.",
};

export default function TermsPage() {
  return (
    <LegalPageShell
      title="Terms of Service"
      description="Rules for using VehicleGuard UK."
    >
      <h2>Agreement</h2>
      <p>
        By creating an account or using VehicleGuard UK, you agree to these Terms and our{" "}
        <Link href="/privacy">Privacy Policy</Link>. If you do not agree, do not use the service.
      </p>

      <h2>The service</h2>
      <p>
        VehicleGuard UK helps you check MOT history (via DVSA), store vehicles in a personal
        garage, and receive reminders for MOT, tax, service, and related dates you configure.
        Features may change over time. We aim for accuracy but do not guarantee that third-party
        data (including DVSA) is complete or up to date at all times.
      </p>

      <h2>Your responsibilities</h2>
      <ul>
        <li>Provide accurate account information and keep your password secure.</li>
        <li>Only add vehicle registrations you are entitled to manage.</li>
        <li>Verify critical dates (especially tax and insurance) on GOV.UK or with your insurer.</li>
        <li>Do not misuse the service, attempt unauthorised access, or scrape APIs abusively.</li>
      </ul>

      <h2>Reminders are not legal advice</h2>
      <p>
        Reminders are a convenience only. You remain responsible for taxing, insuring, and
        MOT-testing your vehicle in line with UK law. We are not liable for fines, penalties,
        or losses arising from missed deadlines or incorrect data.
      </p>

      <h2>Accounts and subscriptions</h2>
      <p>
        Free and paid tiers may be offered. Paid features, pricing, and billing terms are shown
        at checkout. You may cancel subscriptions according to the process in your account
        settings. Refunds are handled in line with applicable consumer law.
      </p>

      <h2>Intellectual property</h2>
      <p>
        The VehicleGuard UK brand, software, and design are protected. MOT data is sourced from
        official APIs and remains subject to their terms. You may not copy or resell our service
        without permission.
      </p>

      <h2>Limitation of liability</h2>
      <p>
        To the fullest extent permitted by law, VehicleGuard UK is provided &quot;as is&quot;.
        We are not liable for indirect or consequential losses. Nothing in these Terms limits
        liability for death or personal injury caused by negligence, fraud, or other rights that
        cannot be excluded under UK law.
      </p>

      <h2>Termination</h2>
      <p>
        You may delete your account at any time. We may suspend or terminate accounts that breach
        these Terms or pose a security risk.
      </p>

      <h2>Governing law</h2>
      <p>
        These Terms are governed by the laws of England and Wales. Disputes are subject to the
        exclusive jurisdiction of the courts of England and Wales, without prejudice to mandatory
        consumer rights in Scotland or Northern Ireland.
      </p>

      <h2>Contact</h2>
      <p>
        Questions about these Terms? See our <Link href="/contact">Contact</Link> page.
      </p>
    </LegalPageShell>
  );
}
