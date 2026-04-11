/**
 * Reels a partir do YouTube (Shorts): API Data v3 ou lista fixa de IDs (sem quota).
 * Termos: https://developers.google.com/youtube/terms/api-services-terms-of-service
 */

export type YouTubeReelSource = {
  id: string;
  youtubeId: string;
  title: string;
  channelTitle: string;
  channelThumb?: string;
};

function parseFallbackIds(raw: string | undefined): string[] {
  if (!raw?.trim()) return [];
  return raw
    .split(/[,\s]+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** IDs de exemplo (embed público). Substitui por VITE_YOUTUBE_FALLBACK_IDS ou usa API com playlist/pesquisa. */
const DEFAULT_FALLBACK_IDS = ['BkH4zqIP4qs', 'jfKfPfyJRdk', 'DWcJFNfaw9c'];

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`YouTube API ${res.status}: ${text.slice(0, 120)}`);
  }
  return res.json() as Promise<T>;
}

type PlaylistItemsResponse = {
  items?: Array<{
    snippet?: {
      title?: string;
      videoOwnerChannelTitle?: string;
      thumbnails?: { default?: { url?: string } };
      resourceId?: { videoId?: string };
    };
    contentDetails?: { videoId?: string };
  }>;
};

type SearchResponse = {
  items?: Array<{
    id?: { videoId?: string };
    snippet?: {
      title?: string;
      channelTitle?: string;
      thumbnails?: { default?: { url?: string } };
    };
  }>;
};

function mapPlaylistItems(data: PlaylistItemsResponse): YouTubeReelSource[] {
  const out: YouTubeReelSource[] = [];
  for (const it of data.items || []) {
    const vid = it.contentDetails?.videoId || it.snippet?.resourceId?.videoId;
    if (!vid) continue;
    const title = it.snippet?.title || 'Short';
    const channelTitle = it.snippet?.videoOwnerChannelTitle || 'YouTube';
    const channelThumb = it.snippet?.thumbnails?.default?.url;
    out.push({
      id: `yt-${vid}`,
      youtubeId: vid,
      title,
      channelTitle,
      channelThumb,
    });
  }
  return out;
}

function mapSearchItems(data: SearchResponse): YouTubeReelSource[] {
  const out: YouTubeReelSource[] = [];
  for (const it of data.items || []) {
    const vid = it.id?.videoId;
    if (!vid) continue;
    out.push({
      id: `yt-${vid}`,
      youtubeId: vid,
      title: it.snippet?.title || 'Short',
      channelTitle: it.snippet?.channelTitle || 'YouTube',
      channelThumb: it.snippet?.thumbnails?.default?.url,
    });
  }
  return out;
}

/** Carrega metadados (título, canal) para IDs conhecidos — 1 unidade de quota por vídeo em batches. */
async function hydrateVideoDetails(
  apiKey: string,
  videoIds: string[]
): Promise<Map<string, { title: string; channelTitle: string; thumb?: string }>> {
  const map = new Map<string, { title: string; channelTitle: string; thumb?: string }>();
  const chunks: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 50) chunks.push(videoIds.slice(i, i + 50));
  for (const chunk of chunks) {
    if (!chunk.length) continue;
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('id', chunk.join(','));
    url.searchParams.set('key', apiKey);
    const data = await fetchJson<{
      items?: Array<{
        id?: string;
        snippet?: {
          title?: string;
          channelTitle?: string;
          thumbnails?: { default?: { url?: string } };
        };
        contentDetails?: { duration?: string };
      }>;
    }>(url.toString());
    for (const v of data.items || []) {
      const id = v.id;
      if (!id || !v.snippet) continue;
      // Filtra duração ≤ 120s (Shorts costumam ser ≤ 60s)
      const dur = v.contentDetails?.duration || '';
      const sec = parseIso8601DurationSeconds(dur);
      if (sec != null && sec > 120) continue;
      map.set(id, {
        title: v.snippet.title || 'Short',
        channelTitle: v.snippet.channelTitle || 'YouTube',
        thumb: v.snippet.thumbnails?.default?.url,
      });
    }
  }
  return map;
}

function parseIso8601DurationSeconds(iso: string): number | null {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return null;
  const h = parseInt(m[1] || '0', 10);
  const min = parseInt(m[2] || '0', 10);
  const s = parseInt(m[3] || '0', 10);
  return h * 3600 + min * 60 + s;
}

export async function fetchYouTubeReelSources(): Promise<YouTubeReelSource[]> {
  const apiKey = import.meta.env.VITE_YOUTUBE_API_KEY?.trim();
  const playlistId = import.meta.env.VITE_YOUTUBE_PLAYLIST_ID?.trim();
  const searchQuery = import.meta.env.VITE_YOUTUBE_SHORTS_QUERY?.trim() || 'youtube shorts';

  if (apiKey) {
    try {
      if (playlistId) {
        const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
        url.searchParams.set('part', 'snippet,contentDetails');
        url.searchParams.set('playlistId', playlistId);
        url.searchParams.set('maxResults', '25');
        url.searchParams.set('key', apiKey);
        const data = await fetchJson<PlaylistItemsResponse>(url.toString());
        const mapped = mapPlaylistItems(data);
        if (mapped.length) return mapped;
      }

      const url = new URL('https://www.googleapis.com/youtube/v3/search');
      url.searchParams.set('part', 'snippet');
      url.searchParams.set('type', 'video');
      url.searchParams.set('videoDuration', 'short');
      url.searchParams.set('maxResults', '15');
      url.searchParams.set('q', searchQuery);
      url.searchParams.set('key', apiKey);
      const data = await fetchJson<SearchResponse>(url.toString());
      const mapped = mapSearchItems(data);
      if (mapped.length) return mapped;
    } catch (e) {
      console.warn('YouTube API reels:', e);
    }
  }

  const fallbackIds = parseFallbackIds(import.meta.env.VITE_YOUTUBE_FALLBACK_IDS);
  const ids = fallbackIds.length ? fallbackIds : DEFAULT_FALLBACK_IDS;

  if (apiKey) {
    try {
      const details = await hydrateVideoDetails(apiKey, ids);
      return ids
        .filter((id) => details.has(id))
        .map((id) => {
          const d = details.get(id)!;
          return {
            id: `yt-${id}`,
            youtubeId: id,
            title: d.title,
            channelTitle: d.channelTitle,
            channelThumb: d.thumb,
          };
        });
    } catch {
      /* usar labels genéricos */
    }
  }

  return ids.map((youtubeId) => ({
    id: `yt-${youtubeId}`,
    youtubeId,
    title: 'YouTube Short',
    channelTitle: 'YouTube',
  }));
}

export function youtubeEmbedUrl(
  videoId: string,
  opts: { autoplay: boolean; muted: boolean }
): string {
  const u = new URL(`https://www.youtube.com/embed/${encodeURIComponent(videoId)}`);
  u.searchParams.set('playsinline', '1');
  u.searchParams.set('rel', '0');
  u.searchParams.set('modestbranding', '1');
  u.searchParams.set('controls', '0');
  u.searchParams.set('autoplay', opts.autoplay ? '1' : '0');
  u.searchParams.set('mute', opts.muted ? '1' : '0');
  u.searchParams.set('loop', '1');
  u.searchParams.set('playlist', videoId);
  u.searchParams.set('enablejsapi', '1');
  return u.toString();
}
