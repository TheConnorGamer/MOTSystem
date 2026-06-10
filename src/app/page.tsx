import { Navbar } from "@/components/navbar";
import { VehicleLookupForm } from "@/components/vehicle-lookup-form";
import { Shield, Bell, FileText, Gauge } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden border-b bg-gradient-to-b from-gov-blue/5 to-background pb-16 pt-12 md:pt-20">
          <div className="container relative z-10">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl md:text-6xl">
                Never miss an{" "}
                <span className="text-gov-blue">MOT</span> or{" "}
                <span className="text-gov-green">Tax</span> deadline again
              </h1>
              <p className="mt-6 text-lg text-muted-foreground">
                Instantly check your vehicle&rsquo;s MOT history, tax status, and
                service reminders. Save unlimited vehicles and get email alerts
                before anything is due.
              </p>
            </div>

            <div className="mx-auto mt-10 max-w-xl">
              <VehicleLookupForm />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container py-16 md:py-24">
          <div className="mx-auto max-w-3xl text-center mb-12">
            <h2 className="text-3xl font-bold">Everything you need</h2>
            <p className="mt-4 text-muted-foreground">
              A complete vehicle management platform trusted by UK drivers.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              icon={<Shield className="h-6 w-6 text-gov-blue" />}
              title="MOT History"
              description="Full DVSA MOT test history including pass/fail status, advisories, and mileage records."
            />
            <FeatureCard
              icon={<Bell className="h-6 w-6 text-gov-green" />}
              title="Smart Reminders"
              description="Email alerts 30, 14, and 7 days before MOT, tax, and service due dates."
            />
            <FeatureCard
              icon={<FileText className="h-6 w-6 text-gov-blue" />}
              title="PDF Reports"
              description="Download detailed vehicle reports with full history and status summary."
            />
            <FeatureCard
              icon={<Gauge className="h-6 w-6 text-gov-green" />}
              title="Service Estimates"
              description="Intelligent service date predictions based on manufacturer intervals."
            />
          </div>
        </section>

        {/* Trust / GDPR */}
        <section className="border-t bg-muted/40">
          <div className="container py-12">
            <div className="mx-auto max-w-2xl text-center">
              <h3 className="text-lg font-semibold">Your data is safe</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                We are fully GDPR compliant. Your data is encrypted, never sold,
                and you can delete your account at any time. We use official DVSA
                APIs for accurate MOT data.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t bg-background py-8">
        <div className="container flex flex-col items-center justify-between gap-4 md:flex-row">
          <p className="text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} VehicleGuard UK. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
            <span>Cookie Policy</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border bg-card p-6 shadow-sm transition-colors hover:bg-accent/50">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
