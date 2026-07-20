const SESSION_KEY = "aimelody-played-session";

function alreadyCounted(trackId: string): boolean {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) && list.includes(trackId);
  } catch {
    return false;
  }
}

function markCounted(trackId: string) {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    const ids = Array.isArray(list) ? (list as string[]) : [];
    if (!ids.includes(trackId)) {
      ids.push(trackId);
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(ids));
    }
  } catch {
    // ignore
  }
}

/** یک بار در هر نشست مرورگر برای هر اثر شمارش می‌کند */
export function recordPlayOnce(trackId: string) {
  if (!trackId || typeof window === "undefined") return;
  if (alreadyCounted(trackId)) return;
  markCounted(trackId);

  void fetch(`/api/tracks/${encodeURIComponent(trackId)}/play`, { method: "POST" })
    .then(async (res) => {
      const data = (await res.json()) as { ok?: boolean; plays?: number };
      if (data.ok && typeof data.plays === "number") {
        window.dispatchEvent(
          new CustomEvent("aimelody:plays", {
            detail: { trackId, plays: data.plays },
          }),
        );
      }
    })
    .catch(() => undefined);
}
