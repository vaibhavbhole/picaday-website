"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { Button, EmptyState, Spinner } from "@/components/ui";
import { useSession } from "@/components/session-provider";
import { getRepos } from "@/data/browser";
import { MAX_POST_IMAGES, preparePostImage } from "@/lib/media/post-image";
import { toUserMessage } from "@/lib/errors";

type Preview = { file: File; url: string };

export function SubmitForm() {
  const { user } = useSession();
  const router = useRouter();
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [already, setAlready] = useState(false);
  const [agendaId, setAgendaId] = useState<string | null>(null);
  const [ready, setLoadingAgenda] = useState(true);
  const pickerRef = useRef<HTMLInputElement>(null);
  const previewsRef = useRef<Preview[]>([]);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    async function load() {
      try {
        const repos = getRepos();
        const agenda = await repos.feed.getCurrentAgenda();
        setAgendaId(agenda.id);
        if (user) {
          setAlready(await repos.submissions.hasSubmittedForAgenda(user.id, agenda.id));
        }
      } catch (err) {
        setError(toUserMessage(err));
      } finally {
        setLoadingAgenda(false);
      }
    }
    void load();
  }, [user]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((item) => URL.revokeObjectURL(item.url));
    };
  }, []);

  function addFiles(list: FileList | File[] | null) {
    if (!list) return;
    const incoming = Array.from(list);
    setPreviews((current) => {
      const room = MAX_POST_IMAGES - current.length;
      const next = incoming.slice(0, room).map((file) => ({ file, url: URL.createObjectURL(file) }));
      return [...current, ...next];
    });
    if (pickerRef.current) pickerRef.current.value = "";
  }

  function removeAt(index: number) {
    setPreviews((current) => {
      const target = current[index];
      if (target) URL.revokeObjectURL(target.url);
      return current.filter((_, i) => i !== index);
    });
  }

  if (ready) return <Spinner />;
  if (!user?.hasContentAccess) {
    return <EmptyState title="Posting is locked" body="Your trial has ended, so new posts cannot be submitted." />;
  }
  if (already) return <EmptyState title="Already posted" body="You can only post once per agenda." />;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user || !agendaId) return;
    setLoading(true);
    setError(null);
    try {
      const images = await Promise.all(previews.map((item) => preparePostImage(item.file)));
      await getRepos().submissions.submitEntry({
        userId: user.id,
        agendaId,
        images,
        caption: caption.trim() || null,
      });
      router.replace("/");
    } catch (err) {
      setError(toUserMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const canAdd = previews.length < MAX_POST_IMAGES;

  return (
    <form className="space-y-4" onSubmit={(e) => void onSubmit(e)}>
      <h1 className="text-2xl font-extrabold">Submit today’s post</h1>
      <input
        ref={pickerRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={(event) => addFiles(event.target.files)}
      />
      <div className="grid grid-cols-2 gap-3">
        {previews.map((item, index) => (
          <div key={item.url} className="relative overflow-hidden rounded-xl border border-[var(--card-border)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt="" className="aspect-[4/5] w-full object-cover" />
            <button
              type="button"
              className="absolute right-2 top-2 rounded-full bg-black/70 p-1"
              onClick={() => removeAt(index)}
              aria-label="Remove image"
            >
              <X size={16} />
            </button>
          </div>
        ))}
        {canAdd ? (
          <button
            type="button"
            onClick={() => pickerRef.current?.click()}
            className="flex aspect-[4/5] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--lavender)] text-sm font-semibold text-[var(--lavender)]"
          >
            <Plus size={28} />
            {previews.length === 0 ? "Add images" : "Add more"}
          </button>
        ) : null}
      </div>
      <p className="text-sm text-[var(--text-muted)]">
        {previews.length} / {MAX_POST_IMAGES} images · cropped to 4:5 when you post
      </p>
      <textarea
        value={caption}
        onChange={(e) => setCaption(e.target.value)}
        placeholder="Optional caption"
        className="min-h-24 w-full rounded-xl border border-[var(--card-border)] bg-[var(--surface-elevated)] p-3"
      />
      {error ? <p className="text-sm text-red-400">{error}</p> : null}
      <Button disabled={loading || previews.length === 0}>{loading ? "Uploading…" : "Post"}</Button>
    </form>
  );
}
