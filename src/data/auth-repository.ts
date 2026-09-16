import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import { asRecord, hasContentAccess, isEmailIdentifier, parseTimestamptzOrNull } from "@/data/mappers";
import { Rpc, USERNAME_PATTERN, type AppUser } from "@/data/types";

export class AuthRepository {
  constructor(private readonly client: SupabaseClient) {}

  async signIn(emailOrUsername: string, password: string): Promise<AppUser> {
    const identifier = emailOrUsername.trim();
    if (!identifier || !password) {
      throw new AppError("Enter your email/username and password.");
    }
    const email = await this.emailFromIdentifier(identifier);
    const { error } = await this.client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    const user = await this.getCurrentUser();
    if (!user) throw new AppError("Sign-in did not create a session.");
    return user;
  }

  async signUp(email: string, username: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedUsername = username.trim().toLowerCase();
    if (!USERNAME_PATTERN.test(normalizedUsername)) {
      throw new AppError(
        "Username must be 3–24 characters: lowercase letters, numbers, or underscores.",
      );
    }
    if (!isEmailIdentifier(normalizedEmail)) {
      throw new AppError("Enter a valid email address.");
    }
    if (password.length < 8) {
      throw new AppError("Password must be at least 8 characters.");
    }

    const { data: taken } = await this.client
      .from("profiles")
      .select("id")
      .eq("user_name", normalizedUsername)
      .maybeSingle();
    if (taken) throw new AppError("That username is already taken.");

    const { data, error } = await this.client.auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { user_name: normalizedUsername, full_name: normalizedUsername },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) throw error;
    if (!data.session) {
      return { needsEmailConfirmation: true as const, user: null };
    }
    return { needsEmailConfirmation: false as const, user: await this.getCurrentUser() };
  }

  async sendPasswordReset(email: string) {
    const normalized = email.trim().toLowerCase();
    if (!isEmailIdentifier(normalized)) {
      throw new AppError("Enter a valid email address.");
    }
    const { error } = await this.client.auth.resetPasswordForEmail(normalized, {
      redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
    });
    if (error) throw error;
  }

  async updatePassword(newPassword: string) {
    if (newPassword.length < 8) {
      throw new AppError("Password must be at least 8 characters.");
    }
    const { error } = await this.client.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  async signOut() {
    const { error } = await this.client.auth.signOut();
    if (error) throw error;
  }

  async getCurrentUser(): Promise<AppUser | null> {
    const {
      data: { user },
    } = await this.client.auth.getUser();
    if (!user) return null;
    return this.hydrateUser(user.id, user.email ?? "", user.user_metadata ?? {});
  }

  private async emailFromIdentifier(identifier: string): Promise<string> {
    if (isEmailIdentifier(identifier)) return identifier.toLowerCase();
    const username = identifier.toLowerCase();
    if (!USERNAME_PATTERN.test(username)) {
      throw new AppError("Enter a valid email or username.");
    }
    const { data, error } = await this.client.rpc(Rpc.emailForUsername, {
      p_username: username,
    });
    if (error) {
      throw new AppError("Could not look up that username. Try signing in with your email.");
    }
    if (!data) throw new AppError("No account found for that username.");
    return String(data);
  }

  private async hydrateUser(
    id: string,
    email: string,
    metadata: Record<string, unknown>,
  ): Promise<AppUser> {
    const [{ data: profileRow }, { data: subRow }] = await Promise.all([
      this.client
        .from("profiles")
        .select("id, display_name, user_name, avatar_url")
        .eq("id", id)
        .maybeSingle(),
      this.client.from("v_my_subscription").select().maybeSingle(),
    ]);

    const [postsCount, winsCount, agendasCount] = await Promise.all([
      this.count("posts", "user_id", id),
      this.count("hourly_buckets", "winner_user_id", id),
      this.count("agenda_proposals", "user_id", id),
    ]);

    const profile = profileRow ? asRecord(profileRow) : null;
    const sub = subRow ? asRecord(subRow) : null;
    const status = (sub?.status as string | undefined) ?? null;
    const access = hasContentAccess({
      status,
      trialEndsAt: parseTimestamptzOrNull(sub?.trial_ends_at),
      currentPeriodEnd: parseTimestamptzOrNull(sub?.current_period_end),
    });

    const username =
      (profile?.user_name as string | undefined) ??
      (metadata.user_name as string | undefined) ??
      email.split("@")[0] ??
      "user";

    return {
      id,
      displayName:
        (profile?.display_name as string | undefined) ??
        (metadata.full_name as string | undefined) ??
        username,
      username,
      email,
      photoUrl: (profile?.avatar_url as string | null | undefined) ?? null,
      hasContentAccess: access,
      isPaidMember: status === "active" && access,
      postsCount,
      winsCount,
      agendasCount,
      subscriptionStatus: status,
    };
  }

  private async count(table: string, column: string, userId: string): Promise<number> {
    const { count, error } = await this.client
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq(column, userId);
    if (error) return 0;
    return count ?? 0;
  }
}
