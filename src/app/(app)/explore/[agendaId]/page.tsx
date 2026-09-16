import { WinnersBoard } from "@/features/winners/winners-board";

export default async function ExploreAgendaPage({
  params,
}: {
  params: Promise<{ agendaId: string }>;
}) {
  const { agendaId } = await params;
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">Hourly buckets</h1>
      <WinnersBoard agendaId={agendaId} />
    </div>
  );
}
