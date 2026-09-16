import type { SocialLinks } from "@/lib/social-links";

export const USERNAME_PATTERN = /^[a-z0-9_]{3,24}$/;

export const Rpc = {
  emailForUsername: "email_for_username",
  createPost: "create_post",
  castVote: "cast_vote",
  submitAgendaProposal: "submit_agenda_proposal",
  recordProfileVisit: "record_profile_visit",
  markNotificationRead: "mark_notification_read",
  updateOwnProfile: "update_own_profile",
  createContentReport: "create_content_report",
} as const;

export type SubscriptionStatus = "trialing" | "active" | "expired" | "cancelled" | string;

export type AppUser = {
  id: string;
  displayName: string;
  username: string;
  email: string;
  photoUrl: string | null;
  hasContentAccess: boolean;
  isPaidMember: boolean;
  postsCount: number;
  winsCount: number;
  agendasCount: number;
  subscriptionStatus: SubscriptionStatus | null;
};

export type Agenda = {
  id: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
  status: string;
  bucketIndex: number;
  totalBuckets: number;
  bucketStartsAt: Date;
  bucketEndsAt: Date;
  bucketId: string;
};

export type HourlyBucket = {
  id: string;
  agendaId: string;
  bucketNumber: number;
  startsAt: Date;
  endsAt: Date;
  status: "scheduled" | "active" | "completed" | string;
  winningPostId: string | null;
  winnerUserId: string | null;
  winningVotes: number | null;
};

export type Post = {
  id: string;
  agendaId: string | null;
  userId: string | null;
  username: string;
  userAvatarUrl: string;
  imageUrls: string[];
  likes: number;
  createdAt: Date;
  caption: string | null;
  isWinner: boolean;
  agendaTitle: string | null;
};

export type ChampionSlotStatus = "completed" | "live" | "upcoming";

export type ChampionSlot = {
  id: string;
  agendaId: string;
  bucketNumber: number;
  hourLabel: string;
  status: ChampionSlotStatus;
  username: string | null;
  userAvatarUrl: string | null;
  votes: number | null;
  thumbnailUrl: string | null;
  startsAt: Date;
  endsAt: Date;
};

export type BucketFeed = {
  agenda: Pick<Agenda, "id" | "title" | "description">;
  bucket: HourlyBucket;
  winner: {
    username: string | null;
    avatarUrl: string | null;
    votes: number | null;
    thumbnailUrl: string | null;
  } | null;
  posts: Post[];
  hasMore: boolean;
};

export type AppNotification = {
  id: string;
  type: "hourly_winner" | "profile_visits_daily";
  title: string;
  body: string | null;
  agendaId: string | null;
  bucketId: string | null;
  winningPostId: string | null;
  winningPostUrl: string | null;
  profileVisitCount: number | null;
  proposalTitle: string | null;
  proposalDescription: string | null;
  proposalSubmittedAt: Date | null;
  isRead: boolean;
  createdAt: Date;
  canProposeAgenda: boolean;
};

export type AgendaProposal = {
  id: string;
  title: string;
  description: string | null;
  status: string;
  createdAt: Date;
  agendaId: string | null;
};

export type PublicProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  postsCount: number;
  winsCount: number;
  agendasCount: number;
  socialLinks: SocialLinks;
};

export type SearchProfile = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
};

export type ProfileVisitor = SearchProfile & {
  visitedAt: Date;
  visitCount: number;
};

export type PastAgenda = {
  id: string;
  title: string;
  description: string | null;
  startsAt: Date;
  endsAt: Date;
};
