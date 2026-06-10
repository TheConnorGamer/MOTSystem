"use client";

import { Suspense, useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Bell,
  Mail,
  Smartphone,
  Crown,
  User,
  ArrowLeft,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Navbar } from "@/components/navbar";
import { useToast } from "@/hooks/use-toast";

interface UserSettings {
  name: string | null;
  email: string;
  emailRemindersEnabled: boolean;
  smsRemindersEnabled: boolean;
  phoneNumber: string | null;
  phoneVerified: boolean;
  subscriptionTier: string;
  subscriptionExpiry: string | null;
}

function SettingsLoading() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </main>
    </div>
  );
}

function SettingsPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchSettings();
    }
  }, [status]);

  useEffect(() => {
    if (searchParams.get("success") === "true") {
      toast({ title: "Welcome to Pro!", description: "Your subscription is now active." });
      fetchSettings();
    }
    if (searchParams.get("cancelled") === "true") {
      toast({ title: "Checkout cancelled", description: "You can upgrade anytime from Settings." });
    }
  }, [searchParams]);

  async function fetchSettings() {
    try {
      const res = await fetch("/api/user/settings");
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch {
      toast({ title: "Failed to load settings", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }

  async function saveChanges(updates: Partial<UserSettings>) {
    setSaving(true);
    try {
      const res = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (res.ok) {
        const updated = await res.json();
        setSettings(updated);
        toast({ title: "Settings saved" });
      } else {
        toast({ title: "Failed to save", variant: "destructive" });
      }
    } catch {
      toast({ title: "Something went wrong", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading" || loading) {
    return <SettingsLoading />;
  }

  if (!settings) return null;

  const isPro = settings.subscriptionTier === "PRO";
  const expiryText = settings.subscriptionExpiry
    ? new Date(settings.subscriptionExpiry).toLocaleDateString("en-GB")
    : "No expiry";

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1 container py-8">
        <div className="mx-auto max-w-3xl space-y-8">
          <div className="flex items-center gap-4">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Garage
              </Button>
            </Link>
          </div>

          <div>
            <h1 className="text-3xl font-bold">Settings</h1>
            <p className="text-muted-foreground">
              Manage your account, reminders, and subscription
            </p>
          </div>

          {/* Profile */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Profile
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={settings.name || ""}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setSettings((s) => (s ? { ...s, name: e.target.value } : s))
                  }
                  onBlur={() => {
                    if (settings.name !== undefined) {
                      saveChanges({ name: settings.name });
                    }
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" value={settings.email} disabled />
                <p className="text-xs text-muted-foreground">
                  Email cannot be changed. Contact support if you need to update it.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Reminder Preferences */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Reminder Preferences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Email */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">Email Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Get email alerts 30, 14, and 7 days before MOT, tax, or service due dates
                    </p>
                  </div>
                </div>
                <Button
                  variant={settings.emailRemindersEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    saveChanges({ emailRemindersEnabled: !settings.emailRemindersEnabled })
                  }
                  disabled={saving}
                >
                  {settings.emailRemindersEnabled ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      On
                    </>
                  ) : (
                    "Off"
                  )}
                </Button>
              </div>

              {/* SMS */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Smartphone className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">SMS Reminders</p>
                    <p className="text-sm text-muted-foreground">
                      Get text message alerts to your mobile
                    </p>
                  </div>
                </div>
                <Button
                  variant={settings.smsRemindersEnabled ? "default" : "outline"}
                  size="sm"
                  onClick={() =>
                    saveChanges({ smsRemindersEnabled: !settings.smsRemindersEnabled })
                  }
                  disabled={saving}
                >
                  {settings.smsRemindersEnabled ? (
                    <>
                      <Check className="mr-2 h-4 w-4" />
                      On
                    </>
                  ) : (
                    "Off"
                  )}
                </Button>
              </div>

              {settings.smsRemindersEnabled && (
                <div className="space-y-2 pl-8">
                  <Label htmlFor="phone">Mobile Number</Label>
                  <div className="flex gap-2">
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+44 7123 456789"
                      value={settings.phoneNumber || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setSettings((s) => (s ? { ...s, phoneNumber: e.target.value } : s))
                      }
                    />
                    <Button
                      size="sm"
                      onClick={() => saveChanges({ phoneNumber: settings.phoneNumber })}
                      disabled={saving}
                    >
                      Save
                    </Button>
                  </div>
                  {settings.phoneVerified ? (
                    <p className="text-xs text-green-600">Number verified</p>
                  ) : settings.phoneNumber ? (
                    <p className="text-xs text-yellow-600">
                      Number saved but not verified. Verification coming soon.
                    </p>
                  ) : null}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    {isPro ? "VehicleGuard Pro" : "VehicleGuard Free"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isPro ? `Renews on ${expiryText}` : "Upgrade to unlock all features"}
                  </p>
                </div>
                <Badge variant={isPro ? "default" : "secondary"}>
                  {settings.subscriptionTier}
                </Badge>
              </div>

              {!isPro && (
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="font-semibold mb-2">Upgrade to Pro</h4>
                  <ul className="space-y-1 text-sm mb-4">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Unlimited vehicles
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      SMS reminders
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Document storage
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Service history tracking
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      Priority support
                    </li>
                  </ul>
                  <Button
                    className="w-full"
                    onClick={async () => {
                      setCheckingOut(true);
                      try {
                        const res = await fetch("/api/stripe/checkout", { method: "POST" });
                        const data = await res.json();
                        if (data.url) {
                          window.location.href = data.url;
                        } else {
                          toast({ title: data.message || "Checkout failed", variant: "destructive" });
                        }
                      } catch {
                        toast({ title: "Checkout failed", variant: "destructive" });
                      } finally {
                        setCheckingOut(false);
                      }
                    }}
                    disabled={checkingOut}
                  >
                    {checkingOut ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Upgrade to Pro - £4.99/month
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsLoading />}>
      <SettingsPageContent />
    </Suspense>
  );
}
