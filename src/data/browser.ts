"use client";

import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { AuthRepository } from "@/data/auth-repository";
import { ChampionRepository } from "@/data/champion-repository";
import { FeedRepository } from "@/data/feed-repository";
import { NotificationRepository } from "@/data/notification-repository";
import { ProfileRepository } from "@/data/profile-repository";
import { SubmissionRepository } from "@/data/submission-repository";

let client: ReturnType<typeof createBrowserSupabaseClient> | null = null;

export function getBrowserClient() {
  if (!client) client = createBrowserSupabaseClient();
  return client;
}

export function getRepos() {
  const supabase = getBrowserClient();
  return {
    auth: new AuthRepository(supabase),
    feed: new FeedRepository(supabase),
    champions: new ChampionRepository(supabase),
    profiles: new ProfileRepository(supabase),
    submissions: new SubmissionRepository(supabase),
    notifications: new NotificationRepository(supabase),
  };
}
