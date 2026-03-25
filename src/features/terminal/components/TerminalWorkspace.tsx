import { useEffect, useMemo, useRef, useState } from "react";
import type { WorkspaceController } from "../../../app/useWorkspaceApp";
import { StatusBadge } from "../../../shared/components/StatusBadge";
import { Panel } from "../../../shared/components/Panel";
import { t } from "../../../shared/i18n";
import { formatTimestamp } from "../../../shared/lib/time";
import { FitAddon } from "@xterm/addon-fit";
import { Terminal } from "@xterm/xterm";
import "@xterm/xterm/css/xterm.css";

interface TerminalWorkspaceProps {
  controller: WorkspaceController;
}

export function TerminalWorkspace({ controller }: TerminalWorkspaceProps) {
  const { state, activeSession } = controller;
  const [commandInput, setCommandInput] = useState("");
  const hasOtherSessions = state.sessions.length > 1;
  // Only surface terminal dimensions when both axes are available.
  const sessionSize = useMemo(() => {
    const cols = activeSession?.terminalCols;
    const rows = activeSession?.terminalRows;
    if (cols == null || rows == null) {
      return null;
    }
    return { cols, rows };
  }, [activeSession?.terminalCols, activeSession?.terminalRows]);

  return (
    <Panel
      title={t("terminal.title")}
      subtitle={activeSession ? activeSession.title : t("files.noSession")}
      actions={
        <div className="button-row">
          <button className="ghost-button" onClick={() => void controller.toggleTheme()} type="button">
            {t("terminal.toggleTheme")}
          </button>
          <button className="ghost-button" onClick={() => void controller.toggleRightPanel()} type="button">
            {t("terminal.togglePanel")}
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
          {state.sessions.length === 0 ? <div className="tab-strip__empty">{t("terminal.openHint")}</div> : null}
        </div>

        <div className="terminal-view">
          {activeSession ? (
            <>
              <div className="terminal-meta">
                <span>{activeSession.currentPath}</span>
                <span>{t("terminal.lastUpdate", { time: formatTimestamp(activeSession.updatedAt) })}</span>
                {sessionSize ? (
                  <span>{t("terminal.size", { cols: sessionSize.cols, rows: sessionSize.rows })}</span>
                ) : null}
              </div>
              <div className="button-row">
                <button
                  className="ghost-button"
                  onClick={() => void controller.reconnectSession(activeSession.id)}
                  type="button"
                >
                  {t("terminal.reconnect")}
                </button>
                <button
                  className="ghost-button"
                  onClick={() => void controller.clearSessionOutput(activeSession.id)}
                  type="button"
                >
                  {t("terminal.clearOutput")}
                </button>
                <button
                  className="ghost-button"
                  disabled={!hasOtherSessions}
                  onClick={() => void controller.closeOtherSessions(activeSession.id)}
                  title={!hasOtherSessions ? t("terminal.noOtherSessions") : undefined}
                  type="button"
                >
                  {t("terminal.closeOthers")}
                </button>
              </div>
              <div className="terminal-host">
                <TerminalHost
                  cursorStyle={state.settings.terminal.cursorStyle}
                  output={activeSession.lastOutput}
                  onResize={(cols, rows) => void controller.resizeSession(activeSession.id, cols, rows)}
                  theme={state.settings.terminal.theme}
                  fontFamily={state.settings.terminal.fontFamily}
                  fontSize={state.settings.terminal.fontSize}
                  lineHeight={state.settings.terminal.lineHeight}
                />
              </div>
              <form
                className="terminal-input-row"
                onSubmit={(event) => {
                  event.preventDefault();
                  const trimmed = commandInput.trim();
                  if (!trimmed) {
                    return;
                  }
                  void controller.sendSessionInput(activeSession.id, trimmed);
                  setCommandInput("");
                }}
              >
                <input
                  onChange={(event) => setCommandInput(event.target.value)}
                  placeholder={t("terminal.commandPlaceholder")}
                  value={commandInput}
                />
                <button className="primary-button" type="submit">
                  {t("terminal.send")}
                </button>
              </form>
            </>
          ) : (
            <div className="empty-stage">
              <h3>{t("terminal.emptyTitle")}</h3>
              <p>{t("terminal.emptyBody")}</p>
            </div>
          )}
        </div>
      </div>
    </Panel>
  );
}

type TerminalTheme = "midnight" | "sand";

const terminalColorPalettes: Record<TerminalTheme, { background: string; foreground: string }> = {
  midnight: {
    background: "#0c1014",
    foreground: "#dce8d8",
  },
  sand: {
    background: "#efe7d9",
    foreground: "#2a2418",
  },
};

interface TerminalHostProps {
  output: string;
  theme: TerminalTheme;
  fontFamily: string;
  fontSize: number;
  lineHeight: number;
  cursorStyle: "block" | "line";
  onResize?: (cols: number, rows: number) => void;
}

export function TerminalHost({
  output,
  theme,
  fontFamily,
  fontSize,
  lineHeight,
  cursorStyle,
  onResize,
}: TerminalHostProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const terminalRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const lastOutputRef = useRef<string>("");
  const lastResizeRef = useRef<string>("");

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return;
    }

    const terminal = new Terminal({
      fontFamily,
      fontSize,
      lineHeight,
      cursorBlink: true,
      cursorStyle: cursorStyle === "line" ? "bar" : "block",
      disableStdin: true,
      scrollback: 1000,
      theme: terminalColorPalettes[theme],
    });
    const fitAddon = new FitAddon();
    terminal.loadAddon(fitAddon);
    terminal.open(container);
    fitAddon.fit();

    terminalRef.current = terminal;
    fitAddonRef.current = fitAddon;

    const handleResize = () => {
      fitAddon.fit();
      const sizeKey = `${terminal.cols}x${terminal.rows}`;

      if (terminal.cols > 0 && terminal.rows > 0 && sizeKey !== lastResizeRef.current) {
        lastResizeRef.current = sizeKey;
        onResize?.(terminal.cols, terminal.rows);
      }
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      terminal.dispose();
      terminalRef.current = null;
      fitAddonRef.current = null;
    };
  }, [cursorStyle, fontFamily, fontSize, lineHeight, onResize, theme]);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) {
      return;
    }

    terminal.options.theme = terminalColorPalettes[theme];
  }, [theme]);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal) {
      return;
    }
    terminal.options.fontFamily = fontFamily;
    terminal.options.fontSize = fontSize;
    terminal.options.lineHeight = lineHeight;
    terminal.options.cursorStyle = cursorStyle === "line" ? "bar" : "block";
  }, [cursorStyle, fontFamily, fontSize, lineHeight]);

  useEffect(() => {
    const terminal = terminalRef.current;
    if (!terminal || lastOutputRef.current === output) {
      return;
    }
    terminal.reset();
    const normalized = output.replace(/\r?\n/g, "\r\n");
    if (normalized) {
      terminal.write(normalized);
    }
    terminal.scrollToBottom();
    lastOutputRef.current = output;
    fitAddonRef.current?.fit();
  }, [output]);

  return <div className="terminal-host__surface" ref={containerRef} data-testid="terminal-host" />;
}
