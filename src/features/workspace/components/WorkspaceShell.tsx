import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  CommandMenu,
  CommandMenuContent,
  CommandMenuInput,
  CommandMenuList,
  CommandMenuGroup,
  CommandMenuItem,
  CommandMenuSeparator,
  CommandMenuEmpty,
  useCommandMenuShortcut,
} from "@/components/ui/command-menu";
import type { WorkspaceController } from "../../../app/useWorkspaceApp";
import type { TrustedHost } from "../../../entities/domain";
import { ConnectionSidebar } from "../../connections/components/ConnectionSidebar";
import { getThemeDefinition } from "../../settings/model/themes";
import { useThemeStore } from "../../settings/model/themeStore";
import { SettingsDialog } from "../../settings/components/SettingsDialog";
import { SnippetPanel } from "../../snippets/components/SnippetPanel";
import { FilePanel } from "../../sftp/components/FilePanel";
import { TransferPanel } from "../../transfers/components/TransferPanel";
import { TerminalWorkspace } from "../../terminal/components/TerminalWorkspace";
import { t } from "../../../shared/i18n";
import { formatTimestamp } from "../../../shared/lib/time";
import { useWindowSize, useBreakpointDown } from "../../../shared/hooks";
import { HistoryPanel } from "./HistoryPanel";
import { LogPanel } from "./LogPanel";
import { Plus, PanelLeft, PanelBottom, Folder, Code, History, FileText, Shield, Columns, XSquare, Settings, Wrench, Upload, ChevronDown } from "lucide-react";

interface WorkspaceShellProps {
  controller: WorkspaceController;
}

interface CommandPaletteAction {
  id: string;
  title: string;
  keywords: string;
  icon?: React.ReactNode;
  onSelect: () => void;
}

const MIN_LEFT_PANE_WIDTH = 220;
const MAX_LEFT_PANE_WIDTH = 320;
const MIN_BOTTOM_PANE_HEIGHT = 120;
const MAX_BOTTOM_PANE_HEIGHT = 520;

function clampBottomPaneHeight(value: number): number {
  return Math.min(Math.max(value, MIN_BOTTOM_PANE_HEIGHT), MAX_BOTTOM_PANE_HEIGHT);
}

export function WorkspaceShell({ controller }: WorkspaceShellProps) {
  const { state, activeSession } = controller;
  // Responsive layout hooks
  const { width: windowWidth, height: windowHeight } = useWindowSize();
  const isCompactView = useBreakpointDown("lg");

  // Adjust min pane width based on viewport size for responsive behavior
  const dynamicMinLeftPaneWidth = isCompactView ? 180 : MIN_LEFT_PANE_WIDTH;

  // Use zustand persisted theme for immediate consistency across reloads
  const persistedTheme = useThemeStore((s) => s.theme);
  const effectiveTheme = persistedTheme ?? state.settings.terminal.theme;
  const themeDefinition = getThemeDefinition(effectiveTheme);
  const runningTransfers = state.transfers.filter((task) => task.status === "running").length;
  const [leftPaneWidth, setLeftPaneWidth] = useState(state.settings.workspace.leftPaneWidth);
  const [bottomPaneHeight, setBottomPaneHeight] = useState(state.settings.workspace.bottomPaneHeight);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [createRequestKey, setCreateRequestKey] = useState(0);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [commandQuery, setCommandQuery] = useState("");
  const [trustedHostsOpen, setTrustedHostsOpen] = useState(false);
  const [hostVerificationOpen, setHostVerificationOpen] = useState(false);

  // Auto-open host verification dialog when pendingHostVerification exists
  useEffect(() => {
    if (state.pendingHostVerification) {
      setHostVerificationOpen(true);
    }
  }, [state.pendingHostVerification]);

  // Global keyboard shortcut for command menu (Cmd/Ctrl+K)
  useCommandMenuShortcut(() => setCommandPaletteOpen(true));

  useEffect(() => {
    setLeftPaneWidth(state.settings.workspace.leftPaneWidth);
  }, [state.settings.workspace.leftPaneWidth]);

  useEffect(() => {
    setBottomPaneHeight(state.settings.workspace.bottomPaneHeight);
  }, [state.settings.workspace.bottomPaneHeight]);

  // Responsive: Ensure pane sizes stay within window bounds when viewport changes
  useEffect(() => {
    if (windowWidth === 0) return;

    // Ensure left pane doesn't exceed window width
    const maxSafeWidth = Math.min(leftPaneWidth, windowWidth * 0.5);
    if (maxSafeWidth < leftPaneWidth) {
      setLeftPaneWidth(Math.max(maxSafeWidth, dynamicMinLeftPaneWidth));
    }

    // Ensure bottom pane doesn't exceed window height
    const maxSafeHeight = Math.min(bottomPaneHeight, windowHeight * 0.6);
    if (maxSafeHeight < bottomPaneHeight) {
      setBottomPaneHeight(Math.max(maxSafeHeight, MIN_BOTTOM_PANE_HEIGHT));
    }
  }, [windowWidth, windowHeight, leftPaneWidth, bottomPaneHeight, dynamicMinLeftPaneWidth]);

  // Threshold for auto-collapsing sidebar when window is too small
  const AUTO_COLLAPSE_THRESHOLD = 1000;
  const autoCollapsedRef = useRef(false);

  // Auto-collapse sidebar when window becomes too small
  useEffect(() => {
    if (windowWidth === 0) return;

    const isTooSmall = windowWidth < AUTO_COLLAPSE_THRESHOLD;
    const isSidebarVisible = state.settings.workspace.leftPaneVisible;

    if (isTooSmall && isSidebarVisible && !autoCollapsedRef.current) {
      // Auto-collapse sidebar
      void controller.toggleLeftPane();
      autoCollapsedRef.current = true;
    } else if (!isTooSmall && !isSidebarVisible && autoCollapsedRef.current) {
      // Auto-expand sidebar when window becomes large enough again
      void controller.toggleLeftPane();
      autoCollapsedRef.current = false;
    } else if (!isTooSmall) {
      // Reset the flag when window is large enough
      autoCollapsedRef.current = false;
    }
  }, [windowWidth, state.settings.workspace.leftPaneVisible, controller]);

  // Sync theme CSS variables to document.documentElement so Portal-based components (like Dialog) inherit them
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(themeDefinition.variables).forEach(([key, value]) => {
      if (value) {
        root.style.setProperty(key, value);
      }
    });
  }, [themeDefinition]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tagName = target?.tagName.toLowerCase();
      const isEditable =
        target?.getAttribute("contenteditable") === "true" ||
        tagName === "input" ||
        tagName === "textarea" ||
        tagName === "select";

      if (isEditable || !event.ctrlKey || event.altKey || event.metaKey) {
        return;
      }

      if (event.key.toLowerCase() === "b") {
        event.preventDefault();
        void controller.toggleLeftPane();
      }

      if (event.key.toLowerCase() === "j") {
        event.preventDefault();
        void controller.toggleBottomPanel();
      }

      if (event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandPaletteOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [controller]);

  const handleLeftSplitPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startX = event.clientX;
      const startWidth = leftPaneWidth;
      let nextWidth = startWidth;

      const onMove = (moveEvent: PointerEvent) => {
        nextWidth = Math.min(Math.max(startWidth + moveEvent.clientX - startX, dynamicMinLeftPaneWidth), MAX_LEFT_PANE_WIDTH);
        setLeftPaneWidth(nextWidth);
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        void controller.setLeftPaneWidth(nextWidth);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [controller, leftPaneWidth],
  );

  const handleBottomSplitPointerDown = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      event.preventDefault();
      const startY = event.clientY;
      const startHeight = bottomPaneHeight;

      const onMove = (moveEvent: PointerEvent) => {
        setBottomPaneHeight(clampBottomPaneHeight(startHeight - (moveEvent.clientY - startY)));
      };

      const onUp = (upEvent: PointerEvent) => {
        const nextHeight = clampBottomPaneHeight(startHeight - (upEvent.clientY - startY));
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        void controller.setBottomPaneHeight(nextHeight);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [bottomPaneHeight, controller],
  );

  const toolbarStyle = themeDefinition.variables as CSSProperties;

  function openConnectionEditor() {
    setCreateRequestKey((current) => current + 1);
  }

  function closeCommandPalette() {
    setCommandPaletteOpen(false);
    setCommandQuery("");
  }

  function openCommandPalette() {
    setCommandPaletteOpen(true);
  }

  function handleBottomPaneTabSelect(panelId: "files" | "snippets" | "history" | "logs") {
    if (state.settings.workspace.bottomPaneVisible && state.settings.workspace.bottomPane === panelId) {
      void controller.toggleBottomPanel();
      return;
    }

    void controller.selectBottomPanel(panelId);
  }

  const commandPaletteActions = useMemo<CommandPaletteAction[]>(() => {
    const actions: CommandPaletteAction[] = [
      {
        id: "workspace.new-connection",
        title: t("toolbar.newConnection"),
        keywords: "connection new create ssh",
        icon: <Plus size={16} />,
        onSelect: () => openConnectionEditor(),
      },
      {
        id: "workspace.toggle-sidebar",
        title: t("toolbar.toggleSidebar"),
        keywords: "sidebar pane left",
        icon: <PanelLeft size={16} />,
        onSelect: () => void controller.toggleLeftPane(),
      },
      {
        id: "workspace.toggle-tools",
        title: t("toolbar.toggleTools"),
        keywords: "bottom panel tools",
        icon: <PanelBottom size={16} />,
        onSelect: () => void controller.toggleBottomPanel(),
      },
      {
        id: "workspace.bottom.files",
        title: t("workspace.action.files"),
        keywords: "files sftp transfer",
        icon: <Folder size={16} />,
        onSelect: () => void controller.selectBottomPanel("files"),
      },
      {
        id: "workspace.bottom.snippets",
        title: t("workspace.action.snippets"),
        keywords: "snippets command",
        icon: <Code size={16} />,
        onSelect: () => void controller.selectBottomPanel("snippets"),
      },
      {
        id: "workspace.bottom.history",
        title: t("workspace.action.history"),
        keywords: "history commands",
        icon: <History size={16} />,
        onSelect: () => void controller.selectBottomPanel("history"),
      },
      {
        id: "workspace.bottom.logs",
        title: t("workspace.action.logs"),
        keywords: "logs activity",
        icon: <FileText size={16} />,
        onSelect: () => void controller.selectBottomPanel("logs"),
      },
      {
        id: "workspace.trusted-hosts",
        title: t("trustedHosts.title"),
        keywords: "trusted hosts fingerprint ssh security",
        icon: <Shield size={16} />,
        onSelect: () => setTrustedHostsOpen(true),
      },
    ];

    if (activeSession) {
      actions.push(
        {
          id: "terminal.split-vertical",
          title: t("terminal.splitVertical"),
          keywords: "terminal split vertical pane",
          icon: <Columns size={16} />,
          onSelect: () => void controller.splitTerminal("vertical"),
        },
        {
          id: "terminal.split-horizontal",
          title: t("terminal.splitHorizontal"),
          keywords: "terminal split horizontal pane",
          icon: <Columns size={16} className="rotate-90" />,
          onSelect: () => void controller.splitTerminal("horizontal"),
        },
        {
          id: "terminal.close-pane",
          title:
            state.settings.workspace.terminalSplitDirection === "none"
              ? t("terminal.closeSession")
              : t("terminal.closePane"),
          keywords: "terminal close pane session",
          icon: <XSquare size={16} />,
          onSelect: () => void controller.closeActiveTerminalPane(),
        },
      );
    }

    if (state.settings.workspace.terminalSplitDirection !== "none") {
      actions.push(
        {
          id: "terminal.focus-primary",
          title: t("terminal.focusPrimary"),
          keywords: "terminal focus primary pane",
          onSelect: () => void controller.focusTerminalPane("primary"),
        },
        {
          id: "terminal.focus-secondary",
          title: t("terminal.focusSecondary"),
          keywords: "terminal focus secondary pane",
          onSelect: () => void controller.focusTerminalPane("secondary"),
        },
      );
    }

    state.sessions.forEach((session) => {
      actions.push({
        id: `session.${session.id}`,
        title: `${t("terminal.switchSession")} ${session.title}`,
        keywords: `${session.title} session terminal ssh`,
        onSelect: () => controller.selectSession(session.id),
      });
    });

    state.connections.slice(0, 12).forEach((connection) => {
      actions.push({
        id: `connection.${connection.id}`,
        title: `${t("connections.openSession")} ${connection.name}`,
        keywords: `${connection.name} ${connection.host} ${connection.username} connection ssh`,
        onSelect: () => void controller.openSession(connection.id),
      });
    });

    return actions;
  }, [
    activeSession,
    controller,
    state.connections,
    state.sessions,
    state.settings.workspace.terminalSplitDirection,
  ]);

  const filteredActions = useMemo(() => {
    const normalizedQuery = commandQuery.trim().toLowerCase();
    if (!normalizedQuery) {
      return commandPaletteActions;
    }

    return commandPaletteActions.filter((action) =>
      `${action.title} ${action.keywords}`.toLowerCase().includes(normalizedQuery),
    );
  }, [commandPaletteActions, commandQuery]);

  function executeCommandAction(action: CommandPaletteAction | undefined) {
    if (!action) {
      return;
    }

    closeCommandPalette();
    action.onSelect();
  }

  // Group actions for CommandMenu
  const generalActions = useMemo(() => 
    commandPaletteActions.filter(a => 
      !a.id.startsWith("connection.") && 
      !a.id.startsWith("terminal.split")
    ), [commandPaletteActions]);

  const terminalActions = useMemo(() => 
    commandPaletteActions.filter(a => 
      a.id.startsWith("terminal.")
    ), [commandPaletteActions]);

  const connectionActions = useMemo(() => 
    commandPaletteActions.filter(a => 
      a.id.startsWith("connection.")
    ), [commandPaletteActions]);

  return (
    <div className="workspace-shell" style={toolbarStyle}>
      <header className="workspace-toolbar">
        <div className="workspace-toolbar__left">
          <Tooltip>
            <TooltipTrigger>
              <Button
                aria-pressed={state.settings.workspace.leftPaneVisible}
                onClick={() => void controller.toggleLeftPane()}
                type="button"
                variant={state.settings.workspace.leftPaneVisible ? "secondary" : "ghost"}
                size="icon"
              >
                <PanelLeft size={18} />
                <span className="sr-only">{t("toolbar.toggleSidebar")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t("toolbar.toggleSidebar")}</TooltipContent>
          </Tooltip>
        </div>

        <div className="workspace-toolbar__center">
          <div 
            className="workspace-toolbar__search-container flex items-center gap-2 px-3 py-1.5 rounded-md border border-app-border bg-black/20 text-app-text cursor-pointer hover:bg-black/30 transition-colors"
            onClick={openCommandPalette}
          >
            <span className="text-muted-foreground text-sm flex-1">
              {t("toolbar.commandPalette")}
            </span>
            <div className="flex items-center gap-1">
              <Kbd size="xs">{typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0 ? '⌘' : 'Ctrl'}</Kbd>
              <Kbd size="xs">K</Kbd>
            </div>
          </div>
        </div>

        <div className="button-row workspace-toolbar__right">
          <div className="workspace-toolbar__settings">
            <Tooltip>
              <TooltipTrigger>
                <Button onClick={() => setSettingsOpen(true)} type="button" variant="ghost" size="icon">
                  <Settings size={18} />
                  <span className="sr-only">{t("toolbar.settings")}</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">{t("toolbar.settings")}</TooltipContent>
            </Tooltip>
            <SettingsDialog
              open={settingsOpen}
              onOpenChange={setSettingsOpen}
              controller={controller}
              onTrustedHostsClick={() => {
                setSettingsOpen(false);
                setTrustedHostsOpen(true);
              }}
            />
          </div>
          <Tooltip>
            <TooltipTrigger>
              <Button
                aria-pressed={state.settings.workspace.bottomPaneVisible}
                onClick={() => void controller.toggleBottomPanel()}
                type="button"
                variant={state.settings.workspace.bottomPaneVisible ? "secondary" : "ghost"}
                size="icon"
              >
                <Wrench size={18} />
                <span className="sr-only">{t("toolbar.toggleTools")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{t("toolbar.toggleTools")}</TooltipContent>
          </Tooltip>
        </div>
      </header>

      {state.error ? (
        <Alert className="mx-5 mt-3 border-app-border bg-app-surface-alt/70" variant="destructive">
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      ) : null}

      <div className="workspace-layout">
        {state.settings.workspace.leftPaneVisible ? (
          <>
            <aside className="workspace-pane workspace-pane--left" style={{ width: `${leftPaneWidth}px` }}>
              <ConnectionSidebar controller={controller} createRequestKey={createRequestKey} />
            </aside>
            <div
              aria-orientation="vertical"
              className="workspace-splitter workspace-splitter--vertical"
              onPointerDown={handleLeftSplitPointerDown}
              role="separator"
            />
          </>
        ) : null}

        <main className="workspace-center">
          <section className="workspace-terminal-pane">
            <TerminalWorkspace controller={controller} />
          </section>

          {state.settings.workspace.bottomPaneVisible ? (
            <>
              <div
                aria-orientation="horizontal"
                className="workspace-splitter workspace-splitter--horizontal"
                onPointerDown={handleBottomSplitPointerDown}
                role="separator"
              />
              <section className="workspace-bottom-pane" style={{ height: `${bottomPaneHeight}px` }}>
                <div className="workspace-tools">
                  <div className="workspace-tools__header">
                    <Tabs
                      value={state.settings.workspace.bottomPane}
                      onValueChange={(value) => handleBottomPaneTabSelect(value as "files" | "snippets" | "history" | "logs")}
                      className="workspace-tools__tabs"
                    >
                    <TabsList>
                      {([
                        { id: "files", icon: Folder, label: t("workspace.action.files") },
                        { id: "snippets", icon: Code, label: t("workspace.action.snippets") },
                        { id: "history", icon: History, label: t("workspace.action.history") },
                        { id: "logs", icon: FileText, label: t("workspace.action.logs") },
                      ] as const).map(({ id: panelId, icon: Icon, label }) => (
                        <Tooltip key={panelId}>
                          <TooltipTrigger>
                            <TabsTrigger value={panelId}>
                              <Icon className="h-4 w-4" />
                              <span className="sr-only">{label}</span>
                              {panelId === "files" && runningTransfers > 0 ? (
                                <Badge className="ml-1" variant="secondary">
                                  {runningTransfers}
                                </Badge>
                              ) : null}
                            </TabsTrigger>
                          </TooltipTrigger>
                          <TooltipContent side="top">{label}</TooltipContent>
                        </Tooltip>
                      ))}
                    </TabsList>
                    </Tabs>
                    <div className="button-row workspace-tools__actions">
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            disabled={!activeSession}
                            onClick={() => {
                              void controller.selectBottomPanel("files");
                              void controller.uploadFileToCurrentDirectory();
                            }}
                            type="button"
                            variant="outline"
                            size="icon-sm"
                          >
                            <Upload className="h-4 w-4" />
                            <span className="sr-only">{t("toolbar.upload")}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">{t("toolbar.upload")}</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger>
                          <Button
                            className="workspace-tools__close"
                            onClick={() => void controller.toggleBottomPanel()}
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                          >
                            <ChevronDown className="h-4 w-4" />
                            <span className="sr-only">{t("terminal.toggleBottomPanel")}</span>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="top">{t("terminal.toggleBottomPanel")}</TooltipContent>
                      </Tooltip>
                    </div>
                  </div>

                  <div className="workspace-tools__content">
                    {state.settings.workspace.bottomPane === "files" ? (
                      <div className="workspace-files-panel">
                        <FilePanel
                          currentPath={activeSession?.currentPath ?? null}
                          entries={state.remoteEntries}
                          loading={state.remoteEntriesLoading}
                          onCreateDirectory={controller.createRemoteDirectory}
                          onDelete={controller.deleteRemoteEntry}
                          onDownload={controller.downloadRemoteFile}
                          onGoParent={controller.goRemoteParent}
                          onOpenDirectory={controller.openRemoteDirectory}
                          onRefresh={controller.refreshRemoteEntriesForActiveSession}
                          onRename={controller.renameRemoteEntry}
                          onUpload={controller.uploadFileToCurrentDirectory}
                          rootEntries={state.remoteRootEntries}
                        />
                        {state.transfers.length > 0 ? (
                          <div className="workspace-files-panel__transfers">
                            <TransferPanel
                              onCancel={controller.cancelTransfer}
                              onClearCompleted={controller.clearCompletedTransfers}
                              onRetry={controller.retryTransfer}
                              tasks={state.transfers}
                            />
                          </div>
                        ) : null}
                      </div>
                    ) : null}
                    {state.settings.workspace.bottomPane === "snippets" ? (
                      <SnippetPanel controller={controller} />
                    ) : null}
                    {state.settings.workspace.bottomPane === "history" ? (
                      <HistoryPanel controller={controller} />
                    ) : null}
                    {state.settings.workspace.bottomPane === "logs" ? (
                      <LogPanel controller={controller} />
                    ) : null}
                  </div>
                </div>
              </section>
            </>
          ) : null}
        </main>
      </div>

      <CommandMenu open={commandPaletteOpen} onOpenChange={(open) => (open ? openCommandPalette() : closeCommandPalette())}>
        <CommandMenuContent>
          <CommandMenuInput placeholder={t("toolbar.commandPalette")} showShortcut={true} />
          <CommandMenuList maxHeight="400px">
            {filteredActions.length === 0 ? (
              <CommandMenuEmpty>{t("commandPalette.empty")}</CommandMenuEmpty>
            ) : (
              <>
                {generalActions.length > 0 && (
                  <CommandMenuGroup heading={t("commandPalette.general")}>
                    {generalActions.map((action, index) => (
                      <CommandMenuItem
                        key={action.id}
                        index={index}
                        icon={action.icon}
                        onSelect={() => executeCommandAction(action)}
                      >
                        {action.title}
                      </CommandMenuItem>
                    ))}
                  </CommandMenuGroup>
                )}
                {terminalActions.length > 0 && generalActions.length > 0 && <CommandMenuSeparator />}
                {terminalActions.length > 0 && (
                  <CommandMenuGroup heading={t("commandPalette.terminal")}>
                    {terminalActions.map((action, index) => (
                      <CommandMenuItem
                        key={action.id}
                        index={index + generalActions.length}
                        icon={action.icon}
                        onSelect={() => executeCommandAction(action)}
                      >
                        {action.title}
                      </CommandMenuItem>
                    ))}
                  </CommandMenuGroup>
                )}
                {connectionActions.length > 0 && (generalActions.length > 0 || terminalActions.length > 0) && <CommandMenuSeparator />}
                {connectionActions.length > 0 && (
                  <CommandMenuGroup heading={t("commandPalette.connections")}>
                    {connectionActions.map((action, index) => (
                      <CommandMenuItem
                        key={action.id}
                        index={index + generalActions.length + terminalActions.length}
                        icon={action.icon}
                        onSelect={() => executeCommandAction(action)}
                      >
                        {action.title}
                      </CommandMenuItem>
                    ))}
                  </CommandMenuGroup>
                )}
              </>
            )}
          </CommandMenuList>
        </CommandMenuContent>
      </CommandMenu>

      <Dialog open={trustedHostsOpen} onOpenChange={setTrustedHostsOpen}>
        <DialogContent className="workspace-dialog trusted-hosts-dialog border border-app-border bg-app-surface text-app-text sm:max-w-2xl">
            <DialogHeader className="trusted-hosts-dialog__header">
              <div>
                <DialogTitle>{t("trustedHosts.title")}</DialogTitle>
                <DialogDescription>{t("trustedHosts.subtitle", { count: state.trustedHosts.length })}</DialogDescription>
              </div>
              <Button onClick={() => setTrustedHostsOpen(false)} type="button" variant="ghost" size="sm">
                {t("trustedHosts.close")}
              </Button>
            </DialogHeader>
            <div className="trusted-hosts-dialog__list">
              {state.trustedHosts.length === 0 ? (
                <div className="empty-panel">
                  <p>{t("trustedHosts.empty")}</p>
                </div>
              ) : (
                state.trustedHosts.map((host) => (
                  <TrustedHostRow
                    host={host}
                    key={`${host.host}:${host.port}`}
                    onDelete={() => void controller.deleteTrustedHost(host)}
                  />
                ))
              )}
            </div>
        </DialogContent>
      </Dialog>

      {/* Host Fingerprint Verification Dialog */}
      <Dialog open={hostVerificationOpen} onOpenChange={(open) => {
        if (!open) {
          controller.dismissPendingHostVerification();
        }
        setHostVerificationOpen(open);
      }}>
        <DialogContent className="workspace-dialog host-verification-dialog border border-app-border bg-app-surface text-app-text sm:max-w-xl">
          <DialogHeader className="host-verification-dialog__header">
            <DialogTitle>{t("connections.hostInspectionTitle")}</DialogTitle>
            <DialogDescription>
              {state.pendingHostVerification && (
                <>
                  {t("connections.hostInspectionMessage", {
                    host: state.pendingHostVerification.host,
                    port: state.pendingHostVerification.port,
                    algorithm: state.pendingHostVerification.algorithm,
                  })}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          {state.pendingHostVerification && (
            <div className="host-verification-dialog__content space-y-4">
              <Alert className="host-verification-panel border-app-border bg-app-surface-alt/70">
                <AlertDescription className="space-y-3">
                  <p className="host-verification-panel__fingerprint font-mono text-sm break-all">
                    <strong>{t("connections.hostVerification.fingerprint")}:</strong> {state.pendingHostVerification.fingerprint}
                  </p>
                  {state.lastHostInspection?.trustStatus === "mismatch" && (
                    <Alert className="border-app-border bg-app-surface-soft/70" variant="destructive">
                      <AlertDescription>
                        {t("connections.hostVerification.mismatchBody")}
                        {state.lastHostInspection?.trustedFingerprint && (
                          <p className="mt-1 font-mono text-xs">
                            {t("connections.hostInspectionTrustedFingerprint", {
                              fingerprint: state.lastHostInspection.trustedFingerprint,
                            })}
                          </p>
                        )}
                      </AlertDescription>
                    </Alert>
                  )}
                  <Alert className="border-app-border bg-app-surface-soft/70">
                    <AlertDescription>{t("connections.hostInspectionWarning")}</AlertDescription>
                  </Alert>
                </AlertDescription>
              </Alert>
              <div className="flex justify-end gap-2">
                <Button
                  onClick={() => void controller.trustPendingHost()}
                  type="button"
                >
                  {t("connections.hostInspectionTrust")}
                </Button>
                <Button
                  onClick={() => {
                    controller.dismissPendingHostVerification();
                    setHostVerificationOpen(false);
                  }}
                  type="button"
                  variant="outline"
                >
                  {t("connections.hostInspectionCancel")}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function TrustedHostRow({
  host,
  onDelete,
}: {
  host: TrustedHost;
  onDelete: () => void;
}) {
  return (
    <article className="trusted-host-row">
      <div className="trusted-host-row__summary">
        <strong>{`${host.host}:${host.port}`}</strong>
        <Badge variant="outline">{host.algorithm}</Badge>
        <code>{host.fingerprint}</code>
        <span>{t("trustedHosts.trustedAt", { time: formatTimestamp(host.trustedAt) })}</span>
      </div>
      <Button onClick={onDelete} type="button" variant="destructive" size="sm">
        {t("trustedHosts.delete")}
      </Button>
    </article>
  );
}
