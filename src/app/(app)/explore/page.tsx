import { ExploreList } from "@/features/explore/explore-list";

export default function ExplorePage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Explore</h1>
      <p className="text-sm text-[var(--text-secondary)]">Previous agendas and their hourly champions.</p>
      <ExploreList />
    </div>
  );
}
