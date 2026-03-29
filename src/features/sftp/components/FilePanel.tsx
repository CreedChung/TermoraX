import {
  FormEvent,
  PointerEvent,
  type WheelEvent as ReactWheelEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { RefreshCw, Upload, Download, FolderPlus, CornerUpLeft, Folder, FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { RemoteFileEntry } from "../../../entities/domain";
import { Panel } from "../../../shared/components/Panel";
import { t } from "../../../shared/i18n";
import { formatTimestamp } from "../../../shared/lib/time";

interface FilePanelProps {
  entries: RemoteFileEntry[];
  rootEntries: RemoteFileEntry[];
  currentPath: string | null;
  layoutScale?: number;
  loading?: boolean;
  onRefresh?: () => void;
  onOpenDirectory?: (path: string) => void;
  onGoParent?: () => void;
  onUpload?: () => void;
  onCreateDirectory?: () => void;
  onDownload?: (path: string) => void;
  onRename?: (entry: RemoteFileEntry) => void;
  onDelete?: (entry: RemoteFileEntry) => void;
}

const MIN_DIRECTORY_WIDTH = 180;

function formatFileSize(value: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"] as const;
  let size = value;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }

  if (unitIndex === 0) {
    return `${Math.round(size)}${units[unitIndex]}`;
  }

  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

function normalizeIdentityPart(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function formatOwnerGroup(owner: string | null | undefined, group: string | null | undefined): string {
  const normalizedOwner = normalizeIdentityPart(owner);
  const normalizedGroup = normalizeIdentityPart(group);

  if (!normalizedOwner && !normalizedGroup) {
    return "-/-";
  }

  if (normalizedOwner === "0" && normalizedGroup === "0") {
    return "root/root";
  }

  return `${normalizedOwner ?? "-"}/${normalizedGroup ?? "-"}`;
}

function resolveRootDirectorySelection(currentPath: string | null, rootEntries: RemoteFileEntry[]): string | null {
  if (rootEntries.length === 0) {
    return null;
  }

  if (!currentPath || currentPath === "/") {
    return rootEntries[0]?.path ?? null;
  }

  const segments = currentPath.split("/").filter(Boolean);
  if (segments.length === 0) {
    return rootEntries[0]?.path ?? null;
  }

  const rootPath = `/${segments[0]}`;
  return rootEntries.find((entry) => entry.path === rootPath)?.path ?? rootEntries[0]?.path ?? null;
}

export function FilePanel(props: FilePanelProps) {
  const {
    entries,
    rootEntries,
    currentPath,
    layoutScale = 1,
    loading = false,
    onRefresh,
    onOpenDirectory,
    onGoParent,
    onUpload,
    onCreateDirectory,
    onDownload,
    onRename,
    onDelete,
  } = props;

  const [pathDraft, setPathDraft] = useState(currentPath ?? "");
  const [selectedDirectory, setSelectedDirectory] = useState<string | null>(null);
  const [selectedEntryPath, setSelectedEntryPath] = useState<string | null>(null);
  const [directoryWidth, setDirectoryWidth] = useState(280);
  const splitRef = useRef<HTMLDivElement | null>(null);
  const directoryListRef = useRef<HTMLDivElement | null>(null);
  const fileTableBodyRef = useRef<HTMLDivElement | null>(null);

  const rootDirectories = useMemo(() => rootEntries.filter((entry) => entry.kind === "directory"), [rootEntries]);
  const selectedEntry = useMemo(
    () => entries.find((entry) => entry.path === selectedEntryPath) ?? null,
    [entries, selectedEntryPath],
  );
  useEffect(() => {
    setPathDraft(currentPath ?? "");
    setSelectedDirectory(resolveRootDirectorySelection(currentPath, rootDirectories));
    setSelectedEntryPath(null);
  }, [currentPath, rootDirectories]);

  const statusMessage = useMemo(() => (loading ? t("files.loading") : t("files.empty")), [loading]);
  const pathLabel = t("files.currentPathLabel");
  const summaryLabel = loading
    ? t("files.loading")
    : entries.length > 0
    ? t("files.entryCount", { count: entries.length })
    : t("files.empty");

  const handlePathSubmit = useCallback(
    (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      const trimmed = pathDraft.trim();
      if (!trimmed || !onOpenDirectory) {
        return;
      }
      onOpenDirectory(trimmed);
    },
    [onOpenDirectory, pathDraft],
  );

  const openDirectory = useCallback(
    (path: string) => {
      setSelectedDirectory(path);
      onOpenDirectory?.(path);
    },
    [onOpenDirectory],
  );

  const handlePointerDown = useCallback(
    (event: PointerEvent<HTMLDivElement>) => {
      if (!splitRef.current) {
        return;
      }
      if (typeof window === "undefined") {
        return;
      }

      event.preventDefault();
      const startX = event.clientX;
      const startWidth = directoryWidth;
      const containerWidth = splitRef.current.clientWidth;

      const onMove = (moveEvent: PointerEvent) => {
        const delta = (moveEvent.clientX - startX) / layoutScale;
        const maxWidth = Math.max(containerWidth - MIN_DIRECTORY_WIDTH, MIN_DIRECTORY_WIDTH);
        const nextWidth = Math.min(Math.max(startWidth + delta, MIN_DIRECTORY_WIDTH), maxWidth);
        setDirectoryWidth(nextWidth);
      };

      const onUp = () => {
        window.removeEventListener("pointermove", onMove as unknown as EventListener);
        window.removeEventListener("pointerup", onUp);
      };

      window.addEventListener("pointermove", onMove as unknown as EventListener);
      window.addEventListener("pointerup", onUp);
    },
    [directoryWidth, layoutScale],
  );

  const iconButton = (label: string, onClick?: () => void, disabled?: boolean, icon?: React.ReactNode) => (
    <Button
      type="button"
      className="file-panel__icon-button"
      onClick={onClick}
      disabled={disabled}
      aria-disabled={disabled}
      aria-label={label}
      variant="outline"
      size="icon-sm"
    >
      <span aria-hidden="true">{icon ?? <span className="h-4 w-4" />}</span>
      <span className="sr-only">{label}</span>
    </Button>
  );

  const forwardWheelToActiveList = useCallback((event: ReactWheelEvent<HTMLElement>) => {
    const fileBody = fileTableBodyRef.current;
    const directoryList = directoryListRef.current;
    const targets = [fileBody, directoryList].filter((value): value is HTMLDivElement => Boolean(value));

    for (const target of targets) {
      const maxScrollTop = target.scrollHeight - target.clientHeight;
      if (maxScrollTop <= 0) {
        continue;
      }

      const nextScrollTop = Math.min(Math.max(target.scrollTop + event.deltaY, 0), maxScrollTop);
      if (nextScrollTop !== target.scrollTop) {
        target.scrollTop = nextScrollTop;
        event.preventDefault();
        return;
      }
    }
  }, []);

  return (
    <Panel title={t("files.title")} className="file-panel">
      <form className="file-panel__path-row" onSubmit={handlePathSubmit} onWheel={forwardWheelToActiveList}>
        <label className="sr-only" htmlFor="file-panel-path">
          {pathLabel}
        </label>
        <Input
          id="file-panel-path"
          type="text"
          value={pathDraft}
          onChange={(event) => setPathDraft(event.target.value)}
          disabled={!currentPath || loading}
          placeholder={currentPath ? t("files.pathPlaceholder") : t("files.noSession")}
          className="file-panel__path-input border-app-border bg-black/20 text-app-text"
        />
        <div className="file-panel__icon-buttons">
          {iconButton(t("files.refresh"), onRefresh, loading || !currentPath || !onRefresh, <RefreshCw className="h-4 w-4" />)}
          {iconButton(t("files.upload"), onUpload, loading || !onUpload, <Upload className="h-4 w-4" />)}
          {iconButton(
            t("files.download"),
            selectedEntry && selectedEntry.kind === "file" && onDownload
              ? () => onDownload(selectedEntry.path)
              : undefined,
            loading || !onDownload || !selectedEntry || selectedEntry.kind !== "file",
            <Download className="h-4 w-4" />,
          )}
          {iconButton(
            t("files.newFolder"),
            onCreateDirectory,
            loading || !onCreateDirectory,
            <FolderPlus className="h-4 w-4" />,
          )}
          <Button
            type="button"
            className="file-panel__icon-button"
            onClick={onGoParent}
            disabled={!currentPath || loading || !onGoParent}
            variant="outline"
            size="icon-sm"
            aria-label={t("files.goParent")}
          >
            <CornerUpLeft className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{t("files.goParent")}</span>
          </Button>
        </div>
      </form>
      <div className="flex items-center justify-between gap-3">
        <p className="file-panel__meta-count">{summaryLabel}</p>
        {currentPath ? <Badge variant="outline">{currentPath}</Badge> : null}
      </div>

      {loading ? (
        <Card className="file-panel__state w-full border border-app-border bg-app-surface-alt/60 text-app-text shadow-none">
          <CardContent className="py-6">
          <p>{statusMessage}</p>
          </CardContent>
        </Card>
      ) : (
        <div
          className="file-panel__split"
          ref={splitRef}
          style={{ gridTemplateColumns: `${directoryWidth}px 8px minmax(0, 1fr)` }}
        >
          <section className="file-panel__directories">
            <Card className="h-full border border-app-border bg-app-surface-alt/60 text-app-text shadow-none">
              <CardHeader className="file-panel__directories-header">
                <CardTitle className="text-sm">{t("files.directories")}</CardTitle>
                <span>{t("files.entryCount", { count: rootDirectories.length })}</span>
              </CardHeader>
              <CardContent className="min-h-0">
            <div className="file-panel__directories-list" ref={directoryListRef}>
              {rootDirectories.map((entry) => (
                <Button
                  key={entry.path}
                  type="button"
                  className={`file-panel__directory-row ${
                    selectedDirectory === entry.path ? "file-panel__directory-row--active" : ""
                  }`}
                  onClick={() => setSelectedDirectory(entry.path)}
                  onDoubleClick={() => openDirectory(entry.path)}
                  disabled={loading}
                  variant={selectedDirectory === entry.path ? "secondary" : "ghost"}
                  size="sm"
                >
                  <Folder className="file-panel__directory-icon h-4 w-4" />
                  <span>{entry.name}</span>
                </Button>
              ))}
              {rootDirectories.length === 0 ? (
                <p className="file-panel__directories-empty">{t("files.directoryEmpty")}</p>
              ) : null}
            </div>
              </CardContent>
            </Card>
          </section>

          <div
            className="file-panel__split-handle"
            role="separator"
            aria-orientation="vertical"
            onPointerDown={handlePointerDown}
          />

          <section className="file-panel__files">
            {!entries.length ? (
              <Card className="empty-panel w-full border border-app-border bg-app-surface-alt/60 text-app-text shadow-none">
                <CardContent className="py-6">
                <p>{statusMessage}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="file-table">
                <header className="file-table__header" onWheel={forwardWheelToActiveList}>
                  <span>{t("files.name")}</span>
                  <span className="file-table__header-meta">{t("files.size")}</span>
                  <span className="file-table__header-meta">{t("files.type")}</span>
                  <span className="file-table__header-meta">{t("files.modifiedAt")}</span>
                  <span className="file-table__header-meta">{t("files.actions")}</span>
                </header>
                <div className="file-table__body" ref={fileTableBodyRef}>
                {entries.map((entry) => {
                  const typeLabel = entry.kind === "file" ? t("files.file") : t("files.folder");
                  const sizeLabel = formatFileSize(entry.size);
                  const ownerGroup = formatOwnerGroup(entry.owner, entry.group);
                  const permissions = entry.permissions ?? t("files.unknown");
                  const isSelected = selectedEntryPath === entry.path;
                  return (
                    <article
                      className={`file-table__row ${isSelected ? "file-table__row--selected" : ""}`}
                      key={entry.path}
                      onClick={() => setSelectedEntryPath(entry.path)}
                      onDoubleClick={() => {
                        if (!loading && entry.kind === "directory" && onOpenDirectory) {
                          openDirectory(entry.path);
                        }
                      }}
                    >
                      <div className="file-table__cell file-table__cell--name">
                        <span className="file-table__name-icon" aria-hidden="true">
                          {entry.kind === "directory" ? <Folder className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                        </span>
                        <div className="file-table__name-copy">
                          <strong className="flex items-center gap-2">
                            <span>{entry.name}</span>
                            <Badge variant={entry.kind === "directory" ? "secondary" : "outline"}>{typeLabel}</Badge>
                          </strong>
                          <span className="file-table__name-meta">
                            {entry.createdAt ? `${t("files.createdAt")} ${formatTimestamp(entry.createdAt)}` : null}
                            {entry.createdAt ? " · " : ""}
                            {t("files.permissions")} {permissions}
                            {" · "}
                            {t("files.ownerGroup")} {ownerGroup}
                          </span>
                        </div>
                      </div>
                      <span className="file-table__cell file-table__cell--meta">{sizeLabel}</span>
                      <span className="file-table__cell file-table__cell--meta">{typeLabel}</span>
                      <span className="file-table__cell file-table__cell--meta">{formatTimestamp(entry.modifiedAt)}</span>
                      <div className="file-table__cell file-table__cell--actions">
                        {entry.kind === "file" && onDownload ? (
                          <Button
                            type="button"
                            className="file-item__action-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onDownload(entry.path);
                            }}
                            disabled={loading}
                            aria-disabled={loading}
                            variant="outline"
                            size="sm"
                          >
                            {t("files.download")}
                          </Button>
                        ) : null}
                        {onRename ? (
                          <Button
                            type="button"
                            className="file-item__action-button"
                            onClick={(event) => {
                              event.stopPropagation();
                              onRename(entry);
                            }}
                            disabled={loading}
                            aria-disabled={loading}
                            variant="ghost"
                            size="sm"
                          >
                            {t("files.rename")}
                          </Button>
                        ) : null}
                        {onDelete ? (
                          <Button
                            type="button"
                            className="file-item__action-button file-item__action-button--danger"
                            onClick={(event) => {
                              event.stopPropagation();
                              onDelete(entry);
                            }}
                            disabled={loading}
                            aria-disabled={loading}
                            variant="destructive"
                            size="sm"
                          >
                            {t("files.delete")}
                          </Button>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
                </div>
              </div>
            )}
          </section>
        </div>
      )}
    </Panel>
  );
}
