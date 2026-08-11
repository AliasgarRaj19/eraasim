export type PostStatus = "draft" | "published" | "scheduled" | "unpublished";
export type PostIntent = "preserve" | PostStatus;

export type PublishingState = {
  status: PostStatus;
  scheduledFor: Date | null;
  publishedAt: Date | null;
  unpublishedAt: Date | null;
};

export type PublishingResult = { ok: true; state: PublishingState } | { ok: false; error: string };

export function parseKolkataDateTime(value: string | undefined) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value ?? "");
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  const kolkataOffset = (5 * 60 + 30) * 60_000;
  const timestamp = Date.UTC(year, month - 1, day, hour, minute) - kolkataOffset;
  const date = new Date(timestamp);
  const localCheck = new Date(timestamp + kolkataOffset);
  if (
    Number.isNaN(date.getTime()) ||
    localCheck.getUTCFullYear() !== year ||
    localCheck.getUTCMonth() !== month - 1 ||
    localCheck.getUTCDate() !== day ||
    localCheck.getUTCHours() !== hour ||
    localCheck.getUTCMinutes() !== minute
  ) return null;
  return date;
}

export function formatKolkataDateTime(value: Date | null) {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}T${part("hour")}:${part("minute")}`;
}

export function resolvePublishingState(current: PublishingState, intent: PostIntent, scheduledLocal: string | undefined, now: Date): PublishingResult {
  const nextStatus = intent === "preserve" ? current.status : intent;
  if (nextStatus === "scheduled") {
    const scheduledFor = parseKolkataDateTime(scheduledLocal);
    if (!scheduledFor || scheduledFor <= now) return { ok: false, error: "Choose a future date and time in Asia/Kolkata." };
    return { ok: true, state: { status: "scheduled", scheduledFor, publishedAt: null, unpublishedAt: null } };
  }
  if (nextStatus === "published") {
    return { ok: true, state: { status: "published", scheduledFor: null, publishedAt: intent === "preserve" ? current.publishedAt ?? now : now, unpublishedAt: null } };
  }
  if (nextStatus === "unpublished") {
    return { ok: true, state: { status: "unpublished", scheduledFor: null, publishedAt: null, unpublishedAt: intent === "preserve" ? current.unpublishedAt ?? now : now } };
  }
  return { ok: true, state: { status: "draft", scheduledFor: null, publishedAt: null, unpublishedAt: null } };
}
