"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Field } from "@/components/ui";
import { getRepos } from "@/data/browser";
import { toUserMessage } from "@/lib/errors";

export function LoginForm() {
  const router = useRouter();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await getRepos().auth.signIn(identifier, password);
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Welcome back">
      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <Field label="Email or username" value={identifier} onChange={(e) => setIdentifier(e.target.value)} />
        <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button className="w-full" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </Button>
      </form>
      <p className="mt-4 text-sm text-[var(--text-secondary)]">
        <Link className="text-[var(--lavender)]" href="/forgot-password">Forgot password?</Link>
      </p>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">
        New here? <Link className="text-[var(--lavender)]" href="/signup">Create an account</Link>
      </p>
    </AuthCard>
  );
}

export function SignUpForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    setInfo(null);
    try {
      const result = await getRepos().auth.signUp(email, username, password);
      if (result.needsEmailConfirmation) {
        setInfo("Check your email to confirm the account, then sign in.");
        return;
      }
      router.replace("/");
      router.refresh();
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Join PicADay.Vote">
      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <Field label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <Field label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {info ? <p className="text-sm text-[var(--teal)]">{info}</p> : null}
        <Button className="w-full" disabled={loading}>
          {loading ? "Creating…" : "Sign up"}
        </Button>
      </form>
      <p className="mt-3 text-xs text-[var(--text-muted)]">
        By creating an account you agree to the{" "}
        <Link className="text-[var(--lavender)]" href="/terms">Terms</Link>,{" "}
        <Link className="text-[var(--lavender)]" href="/privacy">Privacy Policy</Link>, and{" "}
        <Link className="text-[var(--lavender)]" href="/refunds">Refund Policy</Link>.
      </p>
      <p className="mt-4 text-sm text-[var(--text-secondary)]">
        Already have an account? <Link className="text-[var(--lavender)]" href="/login">Sign in</Link>
      </p>
    </AuthCard>
  );
}

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await getRepos().auth.sendPasswordReset(email);
      setInfo("If that email exists, a reset link is on the way.");
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Reset password">
      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <Field label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        {info ? <p className="text-sm text-[var(--teal)]">{info}</p> : null}
        <Button className="w-full" disabled={loading}>Send reset link</Button>
      </form>
    </AuthCard>
  );
}

export function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await getRepos().auth.updatePassword(password);
      router.replace("/");
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthCard title="Choose a new password">
      <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
        <Field label="New password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
        {error ? <p className="text-sm text-red-400">{error}</p> : null}
        <Button className="w-full" disabled={loading}>Update password</Button>
      </form>
    </AuthCard>
  );
}

function AuthCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-md rounded-2xl border border-[var(--card-border)] bg-[var(--card)] p-6">
      <h1 className="mb-6 text-2xl font-extrabold text-[var(--lavender)]">{title}</h1>
      {children}
    </div>
  );
}