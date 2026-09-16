"use client";

import { useEffect, useState } from "react";
import { ChampionGrid } from "@/components/champions";
import { EmptyState, Spinner } from "@/components/ui";
import { getRepos } from "@/data/browser";
import type { ChampionSlot } from "@/data/types";
import { toUserMessage } from "@/lib/errors";

export function WinnersBoard({ agendaId }: { agendaId?: string }) {
  const [id, setId] = useState(agendaId);
  const [slots, setSlots] = useState<ChampionSlot[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const repos = getRepos();
        const resolved = agendaId ?? (await repos.champions.getActiveAgendaId());
        const next = await repos.champions.getChampionSlots(resolved);
        if (!mounted) return;
        setId(resolved);
        setSlots(next);
      } catch (err) {
        if (mounted) setError(toUserMessage(err));
      } finally {
        if (mounted) setLoading(false);
      }
    }
    void load();
    return () => {
      mounted = false;
    };
  }, [agendaId]);

  if (loading) return <Spinner />;
  if (error || !id) return <EmptyState title="No champions yet" body={error ?? undefined} />;
  return <ChampionGrid slots={slots} agendaId={id} />;
}
