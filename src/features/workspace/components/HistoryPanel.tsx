import { useMemo, useState } from "react";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import type { WorkspaceController } from "../../../app/useWorkspaceApp";
import { formatTimestamp } from "../../../shared/lib/time";
import { t } from "../../../shared/i18n";

interface HistoryPanelProps {
  controller: WorkspaceController;
}

export function HistoryPanel({ controller }: HistoryPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const activeSessionId = controller.state.activeSessionId;
  const filteredEntries = useMemo(() => {
    const normalized = searchTerm.trim().toLowerCase();
    if (!normalized) {
      return controller.state.commandHistory;
    }

    return controller.state.commandHistory.filter((entry) => {
      const haystack = `${entry.command} ${entry.sessionTitle}`.toLowerCase();
      return haystack.includes(normalized);
    });
  }, [controller.state.commandHistory, searchTerm]);

  return (
    <Card className="tool-panel border border-app-border bg-app-surface/90 text-app-text shadow-none">
      <CardHeader className="tool-panel__header flex flex-row items-center justify-between gap-4">
        <strong>{t("history.title")}</strong>
        <Input
          aria-label={t("history.searchPlaceholder")}
          className="tool-panel__search border-app-border bg-black/20 text-app-text"
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={t("history.searchPlaceholder")}
          value={searchTerm}
        />
      </CardHeader>

      {filteredEntries.length === 0 ? (
        <CardContent className="empty-panel">
          <p>{t("history.empty")}</p>
        </CardContent>
      ) : (
        <CardContent className="history-list">
          {filteredEntries.map((entry) => (
            <article className="history-row" key={entry.id}>
              <div className="history-row__summary">
                <code>{entry.command}</code>
                <span>
                  {entry.sessionTitle}
                  {" · "}
                  {formatTimestamp(entry.executedAt)}
                </span>
              </div>
              <Tooltip>
                <TooltipTrigger>
                  <Button
                    className="history-row__action"
                    disabled={!activeSessionId}
                    onClick={() =>
                      activeSessionId ? void controller.sendSessionInput(activeSessionId, `${entry.command}\r`) : undefined
                    }
                    type="button"
                    variant="outline"
                    size="icon-sm"
                  >
                    <Play className="h-4 w-4" />
                    <span className="sr-only">{t("history.run")}</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="top">{t("history.run")}</TooltipContent>
              </Tooltip>
            </article>
          ))}
        </CardContent>
      )}
    </Card>
  );
}
