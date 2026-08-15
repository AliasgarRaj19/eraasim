import { and, asc, eq, gte, lt } from "drizzle-orm";
import { requirePermission } from "@/src/auth/authorization";
import { activityModule, csvCell, parseKolkataRange, readableAction, safeMetadata, targetSummary } from "@/src/activity-logs/presentation";
import { db } from "@/src/db";
import { activityLogs, staffAccounts } from "@/src/db/schema";

export async function GET(request: Request) {
  await requirePermission("logs.export");
  const url = new URL(request.url), from = url.searchParams.get("from") ?? "", to = url.searchParams.get("to") ?? "";
  const range = parseKolkataRange(from, to);
  if (!from || !to || !range?.start || !range.end) return new Response("A valid From and To date is required.", { status: 400 });
  const maximum = new Date(range.start); maximum.setUTCMonth(maximum.getUTCMonth() + 12);
  if (range.end > maximum) return new Response("The export range cannot exceed 12 months.", { status: 400 });
  const rows = await db.select({ timestamp: activityLogs.createdAt, staffId: activityLogs.staffAccountId, actor: staffAccounts.name, isMaster: staffAccounts.isMasterAdmin, action: activityLogs.action, entityType: activityLogs.entityType, entityId: activityLogs.entityId, metadata: activityLogs.metadata }).from(activityLogs).leftJoin(staffAccounts, eq(activityLogs.staffAccountId, staffAccounts.id)).where(and(gte(activityLogs.createdAt, range.start), lt(activityLogs.createdAt, range.end))).orderBy(asc(activityLogs.createdAt), asc(activityLogs.id)).limit(50001);
  if (rows.length > 50000) return new Response("This range contains more than 50,000 logs. Choose a smaller range.", { status: 413 });
  const csv = ["timestamp,actor,module,action,original_event,target,safe_metadata", ...rows.map((row) => [row.timestamp.toISOString(), row.staffId ? (row.isMaster ? "Master Admin" : row.actor ?? "Former Staff") : "System", activityModule(row.action), readableAction(row.action), row.action, targetSummary(row.entityType, row.entityId, row.metadata), JSON.stringify(safeMetadata(row.metadata) ?? {})].map(csvCell).join(","))].join("\r\n");
  return new Response(csv, { headers: { "content-type": "text/csv; charset=utf-8", "content-disposition": `attachment; filename="eraasim-activity-logs-${from}-to-${to}.csv"`, "x-content-type-options": "nosniff", "cache-control": "no-store" } });
}
