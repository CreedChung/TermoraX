import type { WorkspaceController } from "../../../app/useWorkspaceApp";
import { ConnectionSidebar } from "../../connections/components/ConnectionSidebar";
import { SnippetPanel } from "../../snippets/components/SnippetPanel";
import { FilePanel } from "../../sftp/components/FilePanel";
import { TerminalWorkspace } from "../../terminal/components/TerminalWorkspace";
import { formatTimestamp } from "../../../shared/lib/time";

interface WorkspaceShellProps {
  controller: WorkspaceController;
}

export function WorkspaceShell({ controller }: WorkspaceShellProps) {
  const { state, activeSession } = controller;

  return (
    <div className={`workspace workspace--${state.settings.terminal.theme}`}>
      <header className="workspace-topbar">
        <div>
          <p className="workspace-topbar__eyebrow">TermoraX</p>
          <h1>Desktop SSH Workspace</h1>
        </div>
        <div className="workspace-topbar__stats">
          <div>
            <strong>{state.connections.length}</strong>
            <span>Connections</span>
          </div>
          <div>
            <strong>{state.sessions.length}</strong>
            <span>Sessions</span>
          </div>
          <div>
            <strong>{state.extensions.length}</strong>
            <span>Extensions</span>
          </div>
        </div>
      </header>

      {state.error ? <div className="error-banner">{state.error}</div> : null}

      <div className="workspace-grid">
        <aside className="workspace-sidebar">
          <ConnectionSidebar controller={controller} />
        </aside>

        <main className="workspace-main">
          <TerminalWorkspace controller={controller} />
        </main>

        {state.settings.workspace.rightPanelVisible ? (
          <aside className="workspace-right">
            {state.settings.workspace.rightPanel === "files" ? (
              <FilePanel currentPath={activeSession?.currentPath ?? null} entries={state.remoteEntries} />
            ) : null}
            {state.settings.workspace.rightPanel === "snippets" ? <SnippetPanel controller={controller} /> : null}
            {state.settings.workspace.rightPanel === "activity" ? (
              <section className="panel">
                <header className="panel__header">
                  <div>
                    <p className="panel__eyebrow">Activity</p>
                    <h2 className="panel__title">Recent host events</h2>
                  </div>
                </header>
                <div className="panel__body">
                  <div className="activity-list">
                    {state.activity.map((item) => (
                      <article className="activity-row" key={item.id}>
                        <strong>{item.title}</strong>
                        <span>{formatTimestamp(item.timestamp)}</span>
                      </article>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}

            <section className="panel panel--compact">
              <header className="panel__header">
                <div>
                  <p className="panel__eyebrow">Extension Registry</p>
                  <h2 className="panel__title">Built-in contributions</h2>
                </div>
              </header>
              <div className="panel__body">
                <div className="extension-list">
                  {state.extensions.map((extension) => (
                    <article className="extension-row" key={extension.id}>
                      <strong>{extension.title}</strong>
                      <p>{extension.kind}</p>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          </aside>
        ) : null}
      </div>

      <footer className="workspace-footer">
        <div className="button-row">
          <button className="ghost-button" onClick={() => void controller.updateRightPanel("files")} type="button">
            Files
          </button>
          <button className="ghost-button" onClick={() => void controller.updateRightPanel("snippets")} type="button">
            Snippets
          </button>
          <button className="ghost-button" onClick={() => void controller.updateRightPanel("activity")} type="button">
            Activity
          </button>
        </div>
        <div className="button-row">
          <button className="ghost-button" onClick={() => void controller.resetSettings()} type="button">
            Reset Settings
          </button>
          <span>Current theme: {state.settings.terminal.theme}</span>
        </div>
      </footer>
    </div>
  );
}
