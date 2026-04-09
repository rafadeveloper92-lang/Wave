const MAX_VIDEO_SEC = 120;
const MAX_FILE_BYTES = 25 * 1024 * 1024;

export function readVideoDurationSeconds(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const v = document.createElement('video');
    v.preload = 'metadata';
    v.muted = true;
    const done = (d: number) => {
      URL.revokeObjectURL(url);
      resolve(d);
    };
    const fail = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Vídeo inválido'));
    };
    v.onloadedmetadata = () => {
      const d = v.duration;
      if (!Number.isFinite(d) || d <= 0) fail();
      else done(d);
    };
    v.onerror = fail;
    v.src = url;
  });
}

export async function validateChatMediaFile(file: File): Promise<{ ok: true; durationSec: number | null } | { ok: false; error: string }> {
  const isImg = file.type.startsWith('image/');
  const isVid = file.type.startsWith('video/');
  if (!isImg && !isVid) return { ok: false, error: 'Escolha uma imagem ou um vídeo.' };
  if (file.size > MAX_FILE_BYTES) return { ok: false, error: 'Ficheiro demasiado grande (máx. 25 MB).' };

  if (isImg) return { ok: true, durationSec: null };

  try {
    const d = await readVideoDurationSeconds(file);
    if (d > MAX_VIDEO_SEC) return { ok: false, error: `Vídeo até ${MAX_VIDEO_SEC} segundos (${Math.floor(MAX_VIDEO_SEC / 60)} min).` };
    return { ok: true, durationSec: Math.max(1, Math.ceil(d)) };
  } catch {
    return { ok: false, error: 'Não foi possível ler o vídeo.' };
  }
}
