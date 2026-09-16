import { UserSearch } from "@/features/search/user-search";

export default function SearchPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Search people</h1>
      <UserSearch />
    </div>
  );
}
