import { ProfileVisitors } from "@/features/notifications/profile-visitors";

export default function ProfileVisitorsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Profile visitors</h1>
      <p className="text-sm text-[var(--text-secondary)]">People who viewed your profile in the last 24 hours.</p>
      <ProfileVisitors />
    </div>
  );
}
