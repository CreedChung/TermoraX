import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { WorkspaceController } from "../../../app/useWorkspaceApp";
import { t } from "../../../shared/i18n";
import { formatTimestamp } from "../../../shared/lib/time";

interface LogEntry {
  id: string;
  title: string;
  timestamp: string;
  kind: "activity" | "transfer" | "error";
}

interface LogPanelProps {
  controller: WorkspaceController;
}

export function LogPanel({ controller }: LogPanelProps) {
  const entries = useMemo<LogEntry[]>(() => {
    const activityEntries = controller.state.activity.map((item) => ({
      id: item.id,
      title: item.title,
      timestamp: item.timestamp,
      kind: "activity" as const,
    }));
    const transferEntries = controller.state.transfers.map((task) => ({
      id: `transfer-${task.id}`,
      title: `${task.direction === "upload" ? t("transfers.upload") : t("transfers.download")} · ${task.remotePath}`,
      timestamp: task.finishedAt ?? task.startedAt,
      kind: "transfer" as const,
    }));
    const errorEntries = controller.state.error
      ? [
          {
            id: "workspace-error",
            title: controller.state.error,
            timestamp: new Date().toISOString(),
            kind: "error" as const,
          },
        ]
      : [];

    return [...errorEntries, ...activityEntries, ...transferEntries].sort((left, right) =>
      right.timestamp.localeCompare(left.timestamp),
    );
  }, [controller]);

  return (
    <Card className="tool-panel border border-app-border bg-app-surface/90 text-app-text shadow-none">
      <CardHeader className="tool-panel__header flex flex-row items-center justify-between gap-4">
        <strong>{t("logs.title")}</strong>
      </CardHeader>

      {entries.length === 0 ? (
        <CardContent className="empty-panel">
          <p>{t("logs.empty")}</p>
        </CardContent>
      ) : (
        <CardContent className="log-list">
          {entries.map((entry) => (
            <article className={`log-row log-row--${entry.kind}`} key={entry.id}>
              <strong className="flex items-center gap-2">
                <Badge variant={entry.kind === "error" ? "destructive" : entry.kind === "transfer" ? "secondary" : "outline"}>
                  {entry.kind}
                </Badge>
                <span>{entry.title}</span>
              </strong>
              <span>{formatTimestamp(entry.timestamp)}</span>
            </article>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
