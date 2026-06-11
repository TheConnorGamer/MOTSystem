"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell, CheckCircle2, Clock, XCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { UkPlateDisplay } from "@/components/uk-plate-display";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatDateShort } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ReminderRow {
  id: string;
  type: string;
  dueDate: string;
  daysBefore: number;
  status: string;
  sentAt: string | null;
  vehicle: {
    registration: string;
    make: string | null;
    model: string | null;
  };
}

const typeColors: Record<string, string> = {
  MOT: "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300",
  TAX: "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300",
  SERVICE: "bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300",
  INSURANCE: "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300",
  WARRANTY: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
  BREAKDOWN: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300",
};

export default function RemindersPage() {
  const { status } = useSession();
  const router = useRouter();
  const { toast } = useToast();
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/signin");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") loadReminders();
  }, [status]);

  async function loadReminders() {
    try {
      const res = await fetch("/api/reminders");
      if (res.ok) setReminders(await res.json());
    } catch {
      toast({ title: "Failed to load reminders", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function checkNow() {
    setSending(true);
    try {
      const res = await fetch("/api/reminders/send", { method: "POST" });
      const data = await res.json();
      toast({
        title: data.sent > 0 ? `${data.sent} reminder(s) sent` : "No reminders due right now",
      });
      await loadReminders();
    } catch {
      toast({ title: "Failed to check reminders", variant: "destructive" });
    } finally {
      setSending(false);
    }
  }

  const pending = reminders.filter((r) => r.status === "PENDING");
  const sent = reminders.filter((r) => r.status === "SENT");

  if (status === "loading" || loading) {
    return (
      <AppShell>
        <div className="mx-auto max-w-2xl space-y-4">
          <Skeleton className="h-10 w-48" />
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Reminders</h1>
            <p className="text-sm text-muted-foreground">
              Email &amp; SMS alerts at 30, 14, 7 and 1 day before deadlines
            </p>
          </div>
          <Button size="sm" onClick={checkNow} disabled={sending}>
            <Bell className="mr-2 h-4 w-4" />
            Check now
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card>
            <CardContent className="flex items-center gap-2 p-4">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-xl font-bold">{pending.length}</p>
                <p className="text-xs text-muted-foreground">Upcoming</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-2 p-4">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-xl font-bold">{sent.length}</p>
                <p className="text-xs text-muted-foreground">Sent</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {reminders.length === 0 ? (
          <div className="rounded-xl border p-8 text-center">
            <Bell className="mx-auto h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-muted-foreground">
              No reminders yet. Add a vehicle with due dates to get started.
            </p>
            <Link href="/add">
              <Button className="mt-4" variant="outline">
                Add vehicle
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-2">
            {reminders.map((r) => (
              <Card key={r.id}>
                <CardContent className="flex items-center gap-3 p-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="outline"
                        className={typeColors[r.type] || ""}
                      >
                        {r.type}
                      </Badge>
                      <UkPlateDisplay registration={r.vehicle.registration} size="sm" />
                      {r.status === "SENT" && (
                        <CheckCircle2 className="h-4 w-4 text-green-600" />
                      )}
                      {r.status === "FAILED" && (
                        <XCircle className="h-4 w-4 text-red-600" />
                      )}
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {r.vehicle.make} {r.vehicle.model} · {r.daysBefore} days before ·
                      notify on {formatDateShort(r.dueDate)}
                    </p>
                    {r.sentAt && (
                      <p className="text-xs text-green-600">
                        Sent {formatDate(r.sentAt)}
                      </p>
                    )}
                  </div>
                  <Badge variant={r.status === "PENDING" ? "secondary" : "outline"}>
                    {r.status}
                  </Badge>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground">
          Manage notification channels in{" "}
          <Link href="/settings" className="text-primary underline">
            Account settings
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
