"use client";

import { useEffect, useState } from "react";
import { CreditCard, Shield, Trash2, User } from "lucide-react";
import { toast } from "sonner";

import { useAuth } from "@/components/providers/auth-provider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useProfile } from "@/hooks/use-profile";
import { getProfileSubscriptionLabel, type ProfileTier } from "@/lib/profile";

const tierCopy: Record<ProfileTier, string> = {
  free: "Free account",
  pro: "Pro — $9.99/mo",
  enterprise: "Enterprise",
};

export default function SystemPage() {
  const { user, signOut, isLoading: authLoading } = useAuth();
  const [supabase] = useState(() => createClient());
  const { profile, setProfile, isLoading: profileLoading } = useProfile(user?.id);

  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFullName(profile.fullName);
  }, [profile.fullName]);

  const handleUpdateProfile = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ full_name: fullName })
        .eq("id", user.id);

      if (error) throw error;
      setProfile((current) => ({
        ...current,
        fullName,
      }));
      toast.success("Profile updated");
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!user?.email) return;
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      });

      if (error) throw error;
      toast.success(`Password reset email sent to ${user.email}`);
    } catch (error) {
      console.error("Error sending password reset:", error);
      toast.error("Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planKey: "pro_monthly",
          currency: "USD",
          successUrl: window.location.href,
          cancelUrl: window.location.origin,
        }),
      });

      const data = await response.json();

      if (!data.url) {
        toast.error(`Failed to start checkout: ${data.error || "Unknown error"}`);
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error(error);
      toast.error("Error starting checkout");
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/stripe/portal", {
        method: "POST",
      });

      const data = await response.json();

      if (!data.url) {
        toast.error("Failed to open portal");
        setLoading(false);
        return;
      }

      window.location.href = data.url;
    } catch (error) {
      console.error("Error opening billing portal:", error);
      toast.error("Error opening portal");
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!confirm("Delete this account? This action is irreversible.")) return;
    setLoading(true);
    toast.error("Account deletion still requires an admin-approved server action.");
    setLoading(false);
  };

  if (authLoading || profileLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center text-[color:var(--muted)]">Loading Tado system data...</div>;
  }

  if (!user) return null;

  const billingStatus = getProfileSubscriptionLabel(profile);

  return (
    <div className="mx-auto flex w-full max-w-[1280px] flex-col gap-8 px-4 pb-20 pt-4 md:px-8">
      <header className="rounded-[5.5px] border border-white/10 bg-[color:var(--glass-bg-standard)] p-6 shadow-[var(--glass-shadow-e3)] backdrop-blur-[18px] sm:p-8">
        <p className="text-[0.72rem] uppercase tracking-[0.2em] text-[color:var(--muted)]">Tado System</p>
        <h1 className="mt-3 max-w-[11ch] text-[clamp(2.8rem,6vw,5.5rem)] leading-[0.9] tracking-[-0.08em] text-[color:var(--title)] [font-family:var(--type-title-family)] [font-weight:var(--type-title-weight)]">
          Account, billing, and security controls.
        </h1>
        <p className="mt-4 max-w-[62ch] text-sm leading-[1.75] text-[color:var(--subtitle)] sm:text-base">
          Use this page for account identity, payment status, password reset, and session control.
        </p>
      </header>

      <section className="grid gap-4 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        <article className="rounded-[5.5px] border border-white/10 bg-[color:var(--glass-bg-standard)] p-6">
          <div className="flex items-center gap-3">
            <User className="size-5 text-[color:var(--accent)]" />
            <h2 className="text-[1.4rem] leading-none tracking-[-0.05em] text-[color:var(--title)] [font-family:var(--type-heading-family)] [font-weight:var(--type-heading-weight)]">
              Identity
            </h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="mt-6 space-y-5">
            <label className="grid gap-2">
              <span className="text-[0.72rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">Display name</span>
              <input
                type="text"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                className="h-12 rounded-[5.5px] border border-white/10 bg-black/15 px-4 text-[color:var(--text)] outline-none transition-colors focus:border-white/25"
                placeholder="Your name"
              />
            </label>

            <div className="grid gap-2">
              <span className="text-[0.72rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">Email</span>
              <div className="flex min-h-12 items-center rounded-[5.5px] border border-white/10 bg-black/10 px-4 text-sm text-[color:var(--text)]">
                {user.email}
              </div>
              <p className="text-xs leading-[1.6] text-[color:var(--muted)]">
                Email changes are not exposed here. Use the reset flow if you need to recover access.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button type="submit" variant="brand" className="min-h-11 px-5 text-xs uppercase tracking-[0.16em]" disabled={loading}>
                Save Profile
              </Button>
            </div>
          </form>
        </article>

        <article className="rounded-[5.5px] border border-white/10 bg-[color:var(--glass-bg-standard)] p-6">
          <div className="flex items-center gap-3">
            <CreditCard className="size-5 text-[color:var(--accent)]" />
            <h2 className="text-[1.4rem] leading-none tracking-[-0.05em] text-[color:var(--title)] [font-family:var(--type-heading-family)] [font-weight:var(--type-heading-weight)]">
              Billing
            </h2>
          </div>

          <div className="mt-6 space-y-4 rounded-[5.5px] border border-white/8 bg-white/[0.02] p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">Current tier</p>
                <p className="mt-2 text-2xl leading-none text-[color:var(--title)] [font-family:var(--type-heading-family)] [font-weight:var(--type-heading-weight)]">
                  {profile.tier}
                </p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-[0.68rem] uppercase tracking-[0.16em] text-[color:var(--muted)]">
                {billingStatus}
              </span>
            </div>
            <p className="text-sm leading-[1.7] text-[color:var(--text)]">{tierCopy[profile.tier]}</p>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            {profile.tier === "free" ? (
              <Button
                type="button"
                variant="brand"
                className="min-h-11 px-5 text-xs uppercase tracking-[0.16em]"
                disabled={loading}
                onClick={handleUpgrade}
              >
                Upgrade to Pro — $9.99/mo
              </Button>
            ) : null}

            {(profile.tier === "pro" || profile.subscriptionStatus === "active") ? (
              <Button
                type="button"
                variant="ghost"
                className="min-h-11 rounded-full border border-white/10 px-5 text-xs uppercase tracking-[0.16em] text-[color:var(--fg)]"
                disabled={loading}
                onClick={handleManageSubscription}
              >
                Manage Billing
              </Button>
            ) : null}
          </div>
        </article>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-[5.5px] border border-white/10 bg-[color:var(--glass-bg-standard)] p-6">
          <div className="flex items-center gap-3">
            <Shield className="size-5 text-[color:var(--accent)]" />
            <h2 className="text-[1.4rem] leading-none tracking-[-0.05em] text-[color:var(--title)] [font-family:var(--type-heading-family)] [font-weight:var(--type-heading-weight)]">
              Security
            </h2>
          </div>

          <div className="mt-6 grid gap-4">
            <div className="rounded-[5.5px] border border-white/8 bg-white/[0.02] p-5">
              <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">Password reset</p>
              <p className="mt-2 text-sm leading-[1.7] text-[color:var(--text)]">
                Send a reset link to the current account email and finish the new password flow from the callback page.
              </p>
              <Button
                type="button"
                variant="ghost"
                className="mt-4 min-h-11 rounded-full border border-white/10 px-5 text-xs uppercase tracking-[0.16em] text-[color:var(--fg)]"
                disabled={loading}
                onClick={handlePasswordReset}
              >
                Send Reset Email
              </Button>
            </div>

            <div className="rounded-[5.5px] border border-white/8 bg-white/[0.02] p-5">
              <p className="text-[0.72rem] uppercase tracking-[0.18em] text-[color:var(--muted)]">Active session</p>
              <p className="mt-2 text-sm leading-[1.7] text-[color:var(--text)]">
                Sign out of the current Tado session and return to the auth screen.
              </p>
              <Button
                type="button"
                variant="ghost"
                className="mt-4 min-h-11 rounded-full border border-white/10 px-5 text-xs uppercase tracking-[0.16em] text-[color:var(--fg)]"
                onClick={() => user && signOut()}
              >
                Sign Out
              </Button>
            </div>
          </div>
        </article>

        <article className="rounded-[5.5px] border border-red-900/35 bg-[color:var(--glass-bg-standard)] p-6">
          <div className="flex items-center gap-3">
            <Trash2 className="size-5 text-red-400" />
            <h2 className="text-[1.4rem] leading-none tracking-[-0.05em] text-red-200 [font-family:var(--type-heading-family)] [font-weight:var(--type-heading-weight)]">
              Account lifecycle
            </h2>
          </div>
          <p className="mt-6 max-w-[48ch] text-sm leading-[1.75] text-red-200/80">
            Account deletion is not self-serve yet. The client surface still requires a protected server-side workflow before any destructive removal can happen.
          </p>
          <Button
            type="button"
            variant="ghost"
            className="mt-6 min-h-11 rounded-full border border-red-900/40 px-5 text-xs uppercase tracking-[0.16em] text-red-200 hover:border-red-700 hover:text-red-100"
            disabled={loading}
            onClick={handleDeleteAccount}
          >
            Request Deletion
          </Button>
        </article>
      </section>
    </div>
  );
}
