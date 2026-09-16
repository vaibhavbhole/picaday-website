import type { SupabaseClient } from "@supabase/supabase-js";
import { AppError } from "@/lib/errors";
import { MAX_POST_IMAGES } from "@/lib/media/post-image";
import { Rpc } from "@/data/types";

export class SubmissionRepository {
  constructor(private readonly client: SupabaseClient) {}

  async hasSubmittedForAgenda(userId: string, agendaId: string): Promise<boolean> {
    const { data, error } = await this.client
      .from("posts")
      .select("id")
      .eq("user_id", userId)
      .eq("agenda_id", agendaId)
      .maybeSingle();
    if (error) throw error;
    return Boolean(data);
  }

  async submitEntry(input: {
    userId: string;
    agendaId: string;
    images: Blob[];
    caption: string | null;
  }) {
    if (input.images.length === 0) throw new AppError("Add at least one image.");
    if (input.images.length > MAX_POST_IMAGES) {
      throw new AppError("A post can include at most 20 images.");
    }
    const already = await this.hasSubmittedForAgenda(input.userId, input.agendaId);
    if (already) throw new AppError("You can only post once per agenda.");

    const urls: string[] = [];
    const stamp = Date.now();
    for (let i = 0; i < input.images.length; i += 1) {
      const objectPath = `${input.userId}/${stamp}_${i}.jpg`;
      const { error } = await this.client.storage.from("post-media").upload(objectPath, input.images[i], {
        contentType: "image/jpeg",
        upsert: false,
      });
      if (error) throw error;
      urls.push(this.client.storage.from("post-media").getPublicUrl(objectPath).data.publicUrl);
    }

    const { error } = await this.client.rpc(Rpc.createPost, {
      agenda_id: input.agendaId,
      content_type: "image",
      content_url: urls[0],
      content_urls: urls,
      caption: input.caption,
    });
    if (error) throw error;
  }
}
