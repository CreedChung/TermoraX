import { useMemo, useState } from "react";
import type { CommandSnippet } from "../../../entities/domain";
import type { WorkspaceController } from "../../../app/useWorkspaceApp";
import { t } from "../../../shared/i18n";

interface SnippetPanelProps {
  controller: WorkspaceController;
}

const emptySnippet = {
  name: "",
  command: "",
  description: "",
  group: "默认分组",
  tags: "",
};

const PARAMETER_PATTERN = /\{\{\s*([a-zA-Z0-9_-]+)\s*\}\}/g;

function extractSnippetParameters(command: string): string[] {
  const names = new Set<string>();
  let match = PARAMETER_PATTERN.exec(command);

  while (match) {
    names.add(match[1]);
    match = PARAMETER_PATTERN.exec(command);
  }

  PARAMETER_PATTERN.lastIndex = 0;
  return Array.from(names);
}

function resolveSnippetCommand(snippet: CommandSnippet): string | null {
  const parameters = extractSnippetParameters(snippet.command);
  if (parameters.length === 0) {
    return snippet.command;
  }

  let resolvedCommand = snippet.command;

  for (const parameter of parameters) {
    if (typeof window === "undefined" || typeof window.prompt !== "function") {
      return null;
    }

    const value = window.prompt(t("snippets.parameterPrompt", { name: parameter }), "");
    if (value == null) {
      return null;
    }

    const escapedName = parameter.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    resolvedCommand = resolvedCommand.replace(new RegExp(`\\{\\{\\s*${escapedName}\\s*\\}\\}`, "g"), value);
  }

  return resolvedCommand;
}

export function SnippetPanel({ controller }: SnippetPanelProps) {
  const [draft, setDraft] = useState(emptySnippet);
  const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  const groupOptions = useMemo(() => {
    const groups = Array.from(new Set(controller.state.snippets.map((snippet) => snippet.group).filter(Boolean)));
    return groups.sort((left, right) => left.localeCompare(right, "zh-CN"));
  }, [controller.state.snippets]);

  const visibleSnippets = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return controller.state.snippets.filter((snippet) => {
      if (favoritesOnly && !snippet.favorite) {
        return false;
      }

      if (selectedGroup !== "all" && snippet.group !== selectedGroup) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        snippet.name,
        snippet.description,
        snippet.group,
        snippet.command,
        snippet.tags.join(" "),
      ]
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });
  }, [controller.state.snippets, favoritesOnly, query, selectedGroup]);

  function editSnippet(snippet: CommandSnippet) {
    setEditingSnippetId(snippet.id);
    setDraft({
      name: snippet.name,
      command: snippet.command,
      description: snippet.description,
      group: snippet.group,
      tags: snippet.tags.join(", "),
    });
  }

  async function runSnippet(snippet: CommandSnippet) {
    if (!controller.state.activeSessionId) {
      return;
    }

    const command = resolveSnippetCommand(snippet);
    if (!command) {
      return;
    }

    await controller.sendSessionInput(
      controller.state.activeSessionId,
      command.endsWith("\n") || command.endsWith("\r") ? command : `${command}\r`,
    );
  }

  async function toggleFavorite(snippet: CommandSnippet) {
    await controller.saveSnippet({
      ...snippet,
      favorite: !snippet.favorite,
    });
  }

  return (
    <section className="tool-panel snippet-panel">
      <header className="tool-panel__header snippet-panel__header">
        <div>
          <strong>{t("snippets.title")}</strong>
          <span>{t("snippets.subtitle", { count: visibleSnippets.length })}</span>
        </div>
        <div className="snippet-panel__filters">
          <input
            className="tool-panel__search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder={t("snippets.searchPlaceholder")}
            value={query}
          />
          <select onChange={(event) => setSelectedGroup(event.target.value)} value={selectedGroup}>
            <option value="all">{t("snippets.group.all")}</option>
            {groupOptions.map((group) => (
              <option key={group} value={group}>
                {group}
              </option>
            ))}
          </select>
          <button
            className={`ghost-button toolbar-button ${favoritesOnly ? "is-active" : ""}`}
            onClick={() => setFavoritesOnly((current) => !current)}
            type="button"
          >
            {t("snippets.filter.favorite")}
          </button>
        </div>
      </header>

      <div className="snippet-panel__layout">
        <div className="snippet-list snippet-list--dense">
          {visibleSnippets.length === 0 ? (
            <div className="empty-panel">
              <p>{t("snippets.empty")}</p>
            </div>
          ) : (
            visibleSnippets.map((snippet) => {
              const parameterCount = extractSnippetParameters(snippet.command).length;

              return (
                <div className="snippet-row" key={snippet.id}>
                  <div className="snippet-row__summary">
                    <strong>{snippet.name}</strong>
                    <span>
                      {snippet.group}
                      {parameterCount > 0 ? ` · ${t("snippets.parameterCount", { count: parameterCount })}` : ""}
                    </span>
                    <code>{snippet.command}</code>
                    {snippet.description ? <span>{snippet.description}</span> : null}
                  </div>
                  <div className="button-row snippet-row__actions">
                    <button
                      className={`ghost-button toolbar-button ${snippet.favorite ? "is-active" : ""}`}
                      onClick={() => void toggleFavorite(snippet)}
                      type="button"
                    >
                      {snippet.favorite ? t("snippets.unfavorite") : t("snippets.favorite")}
                    </button>
                    <button className="ghost-button toolbar-button" onClick={() => editSnippet(snippet)} type="button">
                      {t("snippets.edit")}
                    </button>
                    <button
                      className="ghost-button toolbar-button"
                      onClick={() => void runSnippet(snippet)}
                      type="button"
                    >
                      {t("snippets.run")}
                    </button>
                    <button
                      className="danger-button toolbar-button"
                      onClick={() => void controller.deleteSnippet(snippet.id)}
                      type="button"
                    >
                      {t("snippets.delete")}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <form
          className="stack-form snippet-editor"
          onSubmit={(event) => {
            event.preventDefault();
            void controller.saveSnippet({
              id: editingSnippetId ?? undefined,
              name: draft.name,
              command: draft.command,
              description: draft.description,
              group: draft.group,
              tags: draft.tags
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            });
            setEditingSnippetId(null);
            setDraft(emptySnippet);
          }}
        >
          <label>
            <span>{t("snippets.field.name")}</span>
            <input
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="磁盘占用检查"
              value={draft.name}
            />
          </label>
          <label>
            <span>{t("snippets.field.command")}</span>
            <textarea
              onChange={(event) => setDraft((current) => ({ ...current, command: event.target.value }))}
              placeholder="df -h"
              rows={4}
              value={draft.command}
            />
          </label>
          <p className="snippet-editor__hint">{t("snippets.parameterHint")}</p>
          <label>
            <span>{t("snippets.field.description")}</span>
            <input
              onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
              placeholder="快速查看文件系统占用"
              value={draft.description}
            />
          </label>
          <div className="form-grid">
            <label>
              <span>{t("snippets.field.group")}</span>
              <input
                onChange={(event) => setDraft((current) => ({ ...current, group: event.target.value }))}
                placeholder="诊断"
                value={draft.group}
              />
            </label>
            <label>
              <span>{t("snippets.field.tags")}</span>
              <input
                onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
                placeholder="磁盘, 运行时"
                value={draft.tags}
              />
            </label>
          </div>
          <button className="primary-button" type="submit">
            {t("snippets.save")}
          </button>
        </form>
      </div>
    </section>
  );
}
