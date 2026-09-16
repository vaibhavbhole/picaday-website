import { NotificationsInbox } from "@/features/notifications/notifications-inbox";

export default function NotificationsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Notifications</h1>
      <NotificationsInbox />
    </div>
  );
}
