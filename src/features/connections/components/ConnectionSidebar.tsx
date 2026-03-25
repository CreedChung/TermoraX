import { useState } from "react";
import type { ConnectionAuthType, ConnectionProfile } from "../../../entities/domain";
import type { WorkspaceController } from "../../../app/useWorkspaceApp";
import { Panel } from "../../../shared/components/Panel";

interface ConnectionSidebarProps {
  controller: WorkspaceController;
}

const emptyDraft = {
  name: "",
  host: "",
  port: "22",
  username: "",
  group: "General",
  authType: "password" as ConnectionAuthType,
  note: "",
  tags: "",
};

export function ConnectionSidebar({ controller }: ConnectionSidebarProps) {
  const { state, selectedConnection } = controller;
  const [draft, setDraft] = useState(emptyDraft);

  function loadProfile(profile: ConnectionProfile) {
    controller.selectConnection(profile.id);
    setDraft({
      name: profile.name,
      host: profile.host,
      port: String(profile.port),
      username: profile.username,
      group: profile.group,
      authType: profile.authType,
      note: profile.note,
      tags: profile.tags.join(", "),
    });
  }

  return (
    <div className="sidebar-stack">
      <Panel
        title="Connections"
        subtitle={`${state.connections.length} profiles`}
        actions={
          <button className="ghost-button" onClick={() => setDraft(emptyDraft)} type="button">
            New
          </button>
        }
      >
        <div className="connection-list">
          {state.connections.map((profile) => (
            <button
              key={profile.id}
              className={`connection-card ${state.selectedConnectionId === profile.id ? "is-active" : ""}`}
              onClick={() => loadProfile(profile)}
              type="button"
            >
              <span className="connection-card__title">{profile.name}</span>
              <span className="connection-card__meta">
                {profile.group} · {profile.username}@{profile.host}
              </span>
              <span className="connection-card__tags">{profile.tags.join("  ")}</span>
            </button>
          ))}
        </div>
      </Panel>

      <Panel
        title="Editor"
        subtitle={selectedConnection ? `Editing ${selectedConnection.name}` : "Create a new SSH target"}
        actions={
          selectedConnection ? (
            <button
              className="danger-button"
              onClick={() => void controller.deleteConnectionProfile(selectedConnection.id)}
              type="button"
            >
              Delete
            </button>
          ) : null
        }
      >
        <form
          className="stack-form"
          onSubmit={(event) => {
            event.preventDefault();
            void controller.saveConnectionProfile({
              id: selectedConnection?.id,
              name: draft.name,
              host: draft.host,
              port: Number(draft.port || 22),
              username: draft.username,
              group: draft.group,
              authType: draft.authType,
              note: draft.note,
              tags: draft.tags
                .split(",")
                .map((item) => item.trim())
                .filter(Boolean),
            });
            setDraft(emptyDraft);
          }}
        >
          <label>
            <span>Name</span>
            <input
              onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
              placeholder="prod-app-01"
              value={draft.name}
            />
          </label>
          <label>
            <span>Host</span>
            <input
              onChange={(event) => setDraft((current) => ({ ...current, host: event.target.value }))}
              placeholder="10.10.0.12"
              value={draft.host}
            />
          </label>
          <div className="form-grid">
            <label>
              <span>Port</span>
              <input
                onChange={(event) => setDraft((current) => ({ ...current, port: event.target.value }))}
                placeholder="22"
                value={draft.port}
              />
            </label>
            <label>
              <span>User</span>
              <input
                onChange={(event) => setDraft((current) => ({ ...current, username: event.target.value }))}
                placeholder="deploy"
                value={draft.username}
              />
            </label>
          </div>
          <div className="form-grid">
            <label>
              <span>Group</span>
              <input
                onChange={(event) => setDraft((current) => ({ ...current, group: event.target.value }))}
                placeholder="Production"
                value={draft.group}
              />
            </label>
            <label>
              <span>Auth</span>
              <select
                onChange={(event) =>
                  setDraft((current) => ({ ...current, authType: event.target.value as ConnectionAuthType }))
                }
                value={draft.authType}
              >
                <option value="password">Password</option>
                <option value="privateKey">Private Key</option>
              </select>
            </label>
          </div>
          <label>
            <span>Tags</span>
            <input
              onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
              placeholder="api, cn-sha"
              value={draft.tags}
            />
          </label>
          <label>
            <span>Note</span>
            <textarea
              onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
              placeholder="用途、网络说明、注意事项"
              rows={3}
              value={draft.note}
            />
          </label>
          <div className="button-row">
            <button className="primary-button" type="submit">
              Save Profile
            </button>
            {selectedConnection ? (
              <button
                className="ghost-button"
                onClick={() => void controller.openSession(selectedConnection.id)}
                type="button"
              >
                Open Session
              </button>
            ) : null}
          </div>
        </form>
      </Panel>
    </div>
  );
}
