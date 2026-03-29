import { memo } from "react";
import { Trash2, RotateCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TransferTask } from "../../../entities/domain";
import { t } from "../../../shared/i18n";
import { formatTimestamp } from "../../../shared/lib/time";

interface TransferPanelProps {
  tasks: TransferTask[];
  loading?: boolean;
  onRetry?: (task: TransferTask) => void;
  onCancel?: (task: TransferTask) => void;
  onClearCompleted?: () => void;
}

const statusLabels = {
  running: t("transfers.status.running"),
  canceling: t("transfers.status.canceling"),
  succeeded: t("transfers.status.succeeded"),
  failed: t("transfers.status.failed"),
  canceled: t("transfers.status.canceled"),
} satisfies Record<TransferTask["status"], string>;

function getTransferProgress(task: TransferTask): number {
  if (task.bytesTotal <= 0) {
    return task.status === "succeeded" ? 100 : 0;
  }

  return Math.max(0, Math.min(100, Math.round((task.bytesTransferred / task.bytesTotal) * 100)));
}

function formatTransferBytes(task: TransferTask): string {
  return `${task.bytesTransferred} / ${task.bytesTotal || task.bytesTransferred} B`;
}

function getStatusVariant(status: TransferTask["status"]): "outline" | "secondary" | "destructive" {
  if (status === "succeeded") {
    return "secondary";
  }

  if (status === "failed" || status === "canceled") {
    return "destructive";
  }

  return "outline";
}

export const TransferPanel = memo(function TransferPanel({
  tasks,
  loading = false,
  onRetry,
  onCancel,
  onClearCompleted,
}: TransferPanelProps) {
  const summary = loading
    ? t("transfers.loading")
    : tasks.length > 0
      ? t("transfers.taskCount", { count: tasks.length })
      : t("transfers.empty");
  const hasCompleted = tasks.some(
    (task) => task.status === "succeeded" || task.status === "failed" || task.status === "canceled",
  );

  return (
    <Card className="panel transfer-panel border border-app-border bg-app-surface/90 text-app-text shadow-none">
      <CardHeader className="panel__header flex flex-row items-start justify-between gap-4">
        <div>
          <p className="panel__eyebrow">{t("transfers.title")}</p>
          <CardTitle className="panel__title">{summary}</CardTitle>
        </div>
        {onClearCompleted ? (
          <div>
            <Tooltip>
              <TooltipTrigger>
                <Button
                  type="button"
                  className="transfer-row__action"
                  onClick={onClearCompleted}
                  disabled={loading || !hasCompleted}
                  aria-disabled={loading || !hasCompleted}
                  variant="outline"
                  size="icon-sm"
                >
                  <Trash2 className="h-4 w-4" />
                  <span className="sr-only">{t("transfers.clearCompleted")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">{t("transfers.clearCompleted")}</TooltipContent>
            </Tooltip>
          </div>
        ) : null}
      </CardHeader>
      <CardContent className="panel__body">
        {loading ? (
          <Card className="transfer-panel__state border border-app-border bg-app-surface-alt/60 text-app-text shadow-none">
            <CardContent className="py-6">
            <p>{t("transfers.loading")}</p>
            </CardContent>
          </Card>
        ) : tasks.length === 0 ? (
          <Card className="empty-panel border border-app-border bg-app-surface-alt/60 text-app-text shadow-none">
            <CardContent className="py-6">
            <p>{t("transfers.empty")}</p>
            </CardContent>
          </Card>
        ) : (
          <div className="transfer-list">
            {tasks.map((task) => (
              <Card className="transfer-row border border-app-border bg-app-surface-alt/60 text-app-text shadow-none" key={task.id}>
                <CardContent className="flex flex-col gap-3 p-4">
                <div className="transfer-row__summary">
                  <strong>{task.direction === "upload" ? task.localPath : task.remotePath}</strong>
                  <span className="sr-only">
                    {task.direction === "upload" ? t("transfers.upload") : t("transfers.download")}
                    {" · "}
                    {statusLabels[task.status]}
                  </span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{task.direction === "upload" ? t("transfers.upload") : t("transfers.download")}</Badge>
                    <Badge variant={getStatusVariant(task.status)}>{statusLabels[task.status]}</Badge>
                  </div>
                  <p>{task.direction === "upload" ? task.remotePath : task.localPath}</p>
                </div>
                <div className="transfer-row__meta">
                  <div className="transfer-progress">
                    <div className="transfer-progress__fill" style={{ width: `${getTransferProgress(task)}%` }} />
                  </div>
                  <span>{formatTransferBytes(task)}</span>
                  <span className="transfer-row__time">
                    {formatTimestamp(task.finishedAt ?? task.startedAt)}
                  </span>
                  {task.message ? <span>{task.message}</span> : null}
                  {(task.status === "running" || task.status === "canceling") && onCancel ? (
                    <Button
                      type="button"
                      className="transfer-row__action"
                      onClick={() => onCancel(task)}
                      disabled={loading || task.status === "canceling"}
                      aria-disabled={loading || task.status === "canceling"}
                      variant="outline"
                      size="sm"
                    >
                      {task.status === "canceling" ? t("transfers.canceling") : t("transfers.cancel")}
                    </Button>
                  ) : null}
                  {task.status === "failed" && onRetry ? (
                    <Tooltip>
                      <TooltipTrigger>
                        <Button
                          type="button"
                          className="transfer-row__action"
                          onClick={() => onRetry(task)}
                          disabled={loading}
                          aria-disabled={loading}
                          variant="destructive"
                          size="icon-sm"
                        >
                          <RotateCcw className="h-4 w-4" />
                          <span className="sr-only">{t("transfers.retry")}</span>
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="top">{t("transfers.retry")}</TooltipContent>
                    </Tooltip>
                  ) : null}
                </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
});
