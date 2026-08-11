const youtubeIdPattern = /^[A-Za-z0-9_-]{11}$/;

export function getYouTubeVideoId(value: string) {
  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  const host = url.hostname.toLowerCase().replace(/^www\./, "");
  let videoId: string | null = null;

  if (host === "youtu.be") videoId = url.pathname.split("/").filter(Boolean)[0] ?? null;
  if (["youtube.com", "m.youtube.com", "youtube-nocookie.com"].includes(host)) {
    if (url.pathname === "/watch") videoId = url.searchParams.get("v");
    else {
      const [kind, id] = url.pathname.split("/").filter(Boolean);
      if (["embed", "shorts", "live"].includes(kind)) videoId = id ?? null;
    }
  }

  return videoId && youtubeIdPattern.test(videoId) ? videoId : null;
}

export function canonicalYouTubeUrl(value: string) {
  const videoId = getYouTubeVideoId(value);
  return videoId ? `https://www.youtube.com/watch?v=${videoId}` : null;
}
