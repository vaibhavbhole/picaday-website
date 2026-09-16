import { BucketFeedView } from "@/features/explore/bucket-feed-view";

export default async function BucketFeedPage({
  params,
}: {
  params: Promise<{ agendaId: string; bucketId: string }>;
}) {
  const { agendaId, bucketId } = await params;
  return <BucketFeedView agendaId={agendaId} bucketId={bucketId} />;
}
