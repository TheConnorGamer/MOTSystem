import { Navbar } from "@/components/navbar";
import { SiteFooter } from "@/components/site-footer";
import { VehicleLookupForm } from "@/components/vehicle-lookup-form";
import { Shield, Bell, FileText, Gauge } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        {/* Hero */}
        <section className="garage-page-bg relative overflow-hidden border-b pb-16 pt-10 md:pt-16">
          <div className="container relative z-10">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Never miss an{" "}
                <span className="bg-gradient-to-r from-[#1d70b8] to-[#00703c] bg-clip-text text-transparent">
                  MOT
                </span>{" "}
                or{" "}
                <span className="text-[#00703c]">Tax</span> deadline again
              </h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Free DVSA checks · Personal garage · Email &amp; SMS reminders
              </p>
            </div>

            <div className="mx-auto mt-8 max-w-lg">
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

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard
              gradient="from-blue-500 to-blue-700"
              icon={<Shield className="h-6 w-6" />}
              title="MOT History"
              description="Full DVSA MOT test history including pass/fail status, advisories, and mileage records."
            />
            <FeatureCard
              gradient="from-emerald-500 to-emerald-700"
              icon={<Bell className="h-6 w-6" />}
              title="Smart Reminders"
              description="Email alerts 30, 14, and 7 days before MOT, tax, and service due dates."
            />
            <FeatureCard
              gradient="from-violet-500 to-violet-700"
              icon={<FileText className="h-6 w-6" />}
              title="PDF Reports"
              description="Download detailed vehicle reports with full history and status summary."
            />
            <FeatureCard
              gradient="from-amber-500 to-orange-500"
              icon={<Gauge className="h-6 w-6" />}
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

      <SiteFooter />
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  gradient,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  gradient: string;
}) {
  return (
    <div className="rounded-2xl border bg-card p-6 shadow-md transition-all hover:-translate-y-0.5 hover:shadow-lg">
      <div
        className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow ${gradient}`}
      >
        {icon}
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}
