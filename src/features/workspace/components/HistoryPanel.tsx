import { useMemo, useState } from "react";
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
    <section className="tool-panel">
      <header className="tool-panel__header">
        <strong>{t("history.title")}</strong>
        <input
          aria-label={t("history.searchPlaceholder")}
          className="tool-panel__search"
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder={t("history.searchPlaceholder")}
          value={searchTerm}
        />
      </header>

      {filteredEntries.length === 0 ? (
        <div className="empty-panel">
          <p>{t("history.empty")}</p>
        </div>
      ) : (
        <div className="history-list">
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
              <button
                className="ghost-button history-row__action"
                disabled={!activeSessionId}
                onClick={() =>
                  activeSessionId ? void controller.sendSessionInput(activeSessionId, `${entry.command}\r`) : undefined
                }
                type="button"
              >
                {t("history.run")}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
