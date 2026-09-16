import { WinnersBoard } from "@/features/winners/winners-board";

export default function WinnersPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Today’s Champions</h1>
      <WinnersBoard />
    </div>
  );
}
