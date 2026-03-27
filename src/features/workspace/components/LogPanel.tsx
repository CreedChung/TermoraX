import { useMemo } from "react";
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
    <section className="tool-panel">
      <header className="tool-panel__header">
        <strong>{t("logs.title")}</strong>
      </header>

      {entries.length === 0 ? (
        <div className="empty-panel">
          <p>{t("logs.empty")}</p>
        </div>
      ) : (
        <div className="log-list">
          {entries.map((entry) => (
            <article className={`log-row log-row--${entry.kind}`} key={entry.id}>
              <strong>{entry.title}</strong>
              <span>{formatTimestamp(entry.timestamp)}</span>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
