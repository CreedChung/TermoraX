import { useState } from "react";
import type { WorkspaceController } from "../../../app/useWorkspaceApp";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { Panel } from "../../../shared/components/Panel";
import { formatTimestamp } from "../../../shared/lib/time";

interface TerminalWorkspaceProps {
  controller: WorkspaceController;
}

export function TerminalWorkspace({ controller }: TerminalWorkspaceProps) {
  const { state, activeSession } = controller;
  const [commandInput, setCommandInput] = useState("");

  return (
    <Panel
      title="Workspace"
      subtitle={activeSession ? activeSession.title : "No active session"}
      actions={
        <div className="button-row">
          <button className="ghost-button" onClick={() => void controller.toggleTheme()} type="button">
            Theme
          </button>
          <button className="ghost-button" onClick={() => void controller.toggleRightPanel()} type="button">
            Panel
          </button>
        </div>
      }
      className="terminal-panel"
    >
      <div className="terminal-shell">
        <div className="tab-strip">
          {state.sessions.map((session) => (
            <button
              key={session.id}
              className={`tab-chip ${state.activeSessionId === session.id ? "is-active" : ""}`}
              onClick={() => controller.selectSession(session.id)}
              type="button"
            >
              <span>{session.title}</span>
              <StatusBadge status={session.status} />
              <span
                className="tab-chip__close"
                onClick={(event) => {
                  event.stopPropagation();
                  void controller.closeSession(session.id);
                }}
                role="button"
                tabIndex={0}
              >
                ×
              </span>
            </button>
          ))}
          {state.sessions.length === 0 ? <div className="tab-strip__empty">Open a connection to start.</div> : null}
        </div>

        <div className="terminal-view">
          {activeSession ? (
            <>
              <div className="terminal-meta">
                <span>{activeSession.currentPath}</span>
                <span>Last update: {formatTimestamp(activeSession.updatedAt)}</span>
              </div>
              <pre
                className={`terminal-output terminal-output--${state.settings.terminal.theme}`}
                style={{
                  fontFamily: state.settings.terminal.fontFamily,
                  fontSize: `${state.settings.terminal.fontSize}px`,
                  lineHeight: state.settings.terminal.lineHeight,
                }}
              >
                {activeSession.lastOutput}
              </pre>
              <form
                className="terminal-input-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  void controller.sendSessionInput(activeSession.id, commandInput);
                  setCommandInput("");
                }}
              >
                <input
                  onChange={(event) => setCommandInput(event.target.value)}
                  placeholder="Type a command"
                  value={commandInput}
                />
                <button className="primary-button" type="submit">
                  Send
                </button>
              </form>
            </>
          ) : (
            <div className="empty-stage">
              <h3>Session area is ready</h3>
              <p>Open a connection from the left sidebar. The current build simulates the transport while keeping the real Tauri command boundary intact.</p>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}
