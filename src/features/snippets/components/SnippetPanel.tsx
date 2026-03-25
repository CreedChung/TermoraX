import { useState } from "react";
import type { CommandSnippet } from "../../../entities/domain";
import type { WorkspaceController } from "../../../app/useWorkspaceApp";
import { Panel } from "../../../shared/components/Panel";

interface SnippetPanelProps {
  controller: WorkspaceController;
}

const emptySnippet = {
  name: "",
  command: "",
  description: "",
  group: "General",
  tags: "",
};

export function SnippetPanel({ controller }: SnippetPanelProps) {
  const [draft, setDraft] = useState(emptySnippet);
  const [editingSnippetId, setEditingSnippetId] = useState<string | null>(null);

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

  return (
    <Panel title="Snippets" subtitle={`${controller.state.snippets.length} reusable commands`}>
      <div className="snippet-list">
        {controller.state.snippets.map((snippet) => (
          <div className="snippet-card" key={snippet.id}>
            <div className="snippet-card__header">
              <div>
                <strong>{snippet.name}</strong>
                <p>{snippet.group}</p>
              </div>
              <div className="button-row">
                <button className="ghost-button" onClick={() => editSnippet(snippet)} type="button">
                  Edit
                </button>
                <button className="ghost-button" onClick={() => void controller.runSnippetOnActiveSession(snippet.id)} type="button">
                  Run
                </button>
                <button className="danger-button" onClick={() => void controller.deleteSnippet(snippet.id)} type="button">
                  Delete
                </button>
              </div>
            </div>
            <code>{snippet.command}</code>
            <span>{snippet.description}</span>
          </div>
        ))}
      </div>

      <form
        className="stack-form stack-form--spaced"
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
          <span>Name</span>
          <input
            onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
            placeholder="Disk Usage"
            value={draft.name}
          />
        </label>
        <label>
          <span>Command</span>
          <textarea
            onChange={(event) => setDraft((current) => ({ ...current, command: event.target.value }))}
            placeholder="df -h"
            rows={3}
            value={draft.command}
          />
        </label>
        <label>
          <span>Description</span>
          <input
            onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
            placeholder="Quickly inspect filesystem usage"
            value={draft.description}
          />
        </label>
        <div className="form-grid">
          <label>
            <span>Group</span>
            <input
              onChange={(event) => setDraft((current) => ({ ...current, group: event.target.value }))}
              placeholder="Diagnostics"
              value={draft.group}
            />
          </label>
          <label>
            <span>Tags</span>
            <input
              onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
              placeholder="disk, runtime"
              value={draft.tags}
            />
          </label>
        </div>
        <button className="primary-button" type="submit">
          Save Snippet
        </button>
      </form>
    </Panel>
  );
}
