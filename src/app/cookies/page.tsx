import type { Metadata } from "next";
import Link from "next/link";
import { LegalPageShell } from "@/components/legal-page-shell";

export const metadata: Metadata = {
  title: "Cookie Policy | VehicleGuard UK",
  description: "How VehicleGuard UK uses cookies and similar technologies.",
};

export default function CookiesPage() {
  return (
    <LegalPageShell
      title="Cookie Policy"
      description="Cookies and local storage used on VehicleGuard UK."
    >
      <h2>What are cookies?</h2>
      <p>
        Cookies are small text files stored on your device. We also use similar technologies
        such as browser local storage for preferences like theme (light/dark mode).
      </p>

      <h2>Cookies we use</h2>
      <table>
        <thead>
          <tr>
            <th>Type</th>
            <th>Purpose</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Strictly necessary</td>
            <td>Session authentication (keeping you signed in securely via NextAuth)</td>
            <td>Session / as configured</td>
          </tr>
          <tr>
            <td>Functional</td>
            <td>Theme preference (light/dark/system)</td>
            <td>Persistent until cleared</td>
          </tr>
        </tbody>
      </table>

      <h2>What we do not do</h2>
      <ul>
        <li>We do not use third-party advertising cookies.</li>
        <li>We do not sell cookie data to data brokers.</li>
      </ul>

      <h2>Managing cookies</h2>
      <p>
        You can block or delete cookies in your browser settings. Blocking strictly necessary
        cookies will prevent you from staying signed in. Clearing local storage will reset your
        theme preference.
      </p>

      <h2>More information</h2>
      <p>
        For how we process personal data, see our{" "}
        <Link href="/privacy">Privacy Policy</Link>. To get in touch, visit{" "}
        <Link href="/contact">Contact</Link>.
      </p>
    </LegalPageShell>
  );
}
