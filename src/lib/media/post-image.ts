const ASPECT = 4 / 5;
const MAX_WIDTH = 1080;
const JPEG_QUALITY = 0.88;
export const MAX_POST_IMAGES = 20;

export async function preparePostImage(file: File): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const srcAspect = bitmap.width / bitmap.height;
  let sx = 0;
  let sy = 0;
  let sw = bitmap.width;
  let sh = bitmap.height;

  if (Math.abs(srcAspect - ASPECT) > 0.01) {
    if (srcAspect > ASPECT) {
      sw = bitmap.height * ASPECT;
      sx = (bitmap.width - sw) / 2;
    } else {
      sh = bitmap.width / ASPECT;
      sy = (bitmap.height - sh) / 2;
    }
  }

  const destW = Math.min(MAX_WIDTH, Math.round(sw));
  const destH = Math.round(destW / ASPECT);
  const canvas = document.createElement("canvas");
  canvas.width = destW;
  canvas.height = destH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Could not prepare image.");
  ctx.drawImage(bitmap, sx, sy, sw, sh, 0, 0, destW, destH);
  bitmap.close();

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => (result ? resolve(result) : reject(new Error("Could not encode JPEG."))),
      "image/jpeg",
      JPEG_QUALITY,
    );
  });
  return blob;
}
