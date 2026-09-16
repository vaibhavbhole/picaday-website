import { AuthError } from "@supabase/supabase-js";

export class AppError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AppError";
  }
}

export function toUserMessage(error: unknown, fallback = "Something went wrong."): string {
  if (error instanceof AppError) return error.message;
  if (error instanceof AuthError) return authMessage(error.message);
  if (error && typeof error === "object" && "message" in error) {
    const message = String((error as { message: string }).message);
    return mapPostgresMessage(message);
  }
  return fallback;
}

function authMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("invalid login")) return "Incorrect email/username or password.";
  if (lower.includes("already registered")) return "An account already exists for that email.";
  if (lower.includes("email not confirmed")) return "Confirm your email before signing in.";
  return message;
}

function mapPostgresMessage(message: string): string {
  const lower = message.toLowerCase();
  if (lower.includes("already posted") || lower.includes("duplicate key")) {
    return "You can only post once per agenda.";
  }
  if (lower.includes("not live") || lower.includes("bucket not active")) {
    return "This hour is no longer open for voting.";
  }
  if (lower.includes("no subscription") || lower.includes("content access") || lower.includes("42501")) {
    return "Your trial has ended, so posting and voting are unavailable.";
  }
  if (lower.includes("could not find the function")) {
    return "This action is not available on Staging yet. The matching RPC still needs to be deployed.";
  }
  return message;
}
