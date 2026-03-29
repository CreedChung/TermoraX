import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Plus, Pencil, Upload, Download, Type, Server, EthernetPort, User, Folder, Shield, Lock, Key, LockKeyhole, Tags, FileText, Save, Play, Plug, Trash2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ConnectionAuthType, ConnectionProfile } from "../../../entities/domain";
import type { WorkspaceController } from "../../../app/useWorkspaceApp";
import { t } from "../../../shared/i18n";
import { detectDuplicateConnections, groupConnections } from "../model/connection-utils";
import {
  ConnectionFilterButton,
  Filter,
  FilterType,
  FilterOperator,
  FilterOption,
} from "@/components/ui/connection-filters";

interface ConnectionSidebarProps {
  controller: WorkspaceController;
  searchTerm?: string;
  onSearchTermChange?: (value: string) => void;
  createRequestKey?: number;
}

interface ContextMenuState {
  connectionId: string;
  x: number;
  y: number;
}

const emptyDraft = {
  name: "",
  host: "",
  port: "22",
  username: "",
  group: "默认分组",
  authType: "password" as ConnectionAuthType,
  note: "",
  tags: "",
  password: "",
  privateKeyPath: "",
  privateKeyPassphrase: "",
};

function draftFromProfile(profile: ConnectionProfile) {
  return {
    name: profile.name,
    host: profile.host,
    port: String(profile.port),
    username: profile.username,
    group: profile.group,
    authType: profile.authType,
    note: profile.note,
    tags: profile.tags.join(", "),
    password: profile.password ?? "",
    privateKeyPath: profile.privateKeyPath ?? "",
    privateKeyPassphrase: profile.privateKeyPassphrase ?? "",
  };
}

export function ConnectionSidebar({
  controller,
  searchTerm,
  onSearchTermChange,
  createRequestKey = 0,
}: ConnectionSidebarProps) {
  const { state, selectedConnection } = controller;
  const [draft, setDraft] = useState(emptyDraft);
  const [localSearchTerm, setLocalSearchTerm] = useState("");
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingConnectionId, setEditingConnectionId] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filter[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const effectiveSearchTerm = searchTerm ?? localSearchTerm;

  // Extract unique groups and tags for filter options
  const groupOptions: FilterOption[] = useMemo(() => {
    const groups = new Set(state.connections.map((c) => c.group).filter(Boolean));
    return Array.from(groups).map((group) => ({
      name: group,
      icon: <Folder className="size-3.5" />,
    }));
  }, [state.connections]);

  const tagOptions: FilterOption[] = useMemo(() => {
    const tags = new Set(state.connections.flatMap((c) => c.tags));
    return Array.from(tags).map((tag) => ({
      name: tag,
      icon: <Tags className="size-3.5" />,
    }));
  }, [state.connections]);

  // Apply filters to connections
  const filteredConnections = useMemo(() => {
    if (filters.length === 0) return state.connections;

    return state.connections.filter((connection) => {
      return filters.every((filter) => {
        if (filter.value.length === 0) return true;

        if (filter.type === FilterType.GROUP) {
          const connectionGroup = connection.group || "";
          switch (filter.operator) {
            case FilterOperator.IS:
              return filter.value.includes(connectionGroup);
            case FilterOperator.IS_NOT:
              return !filter.value.includes(connectionGroup);
            case FilterOperator.INCLUDE_ANY:
              return filter.value.some((v) => connectionGroup === v);
            default:
              return true;
          }
        } else if (filter.type === FilterType.TAG) {
          const connectionTags = connection.tags || [];
          switch (filter.operator) {
            case FilterOperator.IS:
            case FilterOperator.INCLUDE_ANY:
              return filter.value.some((v) => connectionTags.includes(v));
            case FilterOperator.IS_NOT:
              return !filter.value.some((v) => connectionTags.includes(v));
            case FilterOperator.INCLUDE_ALL:
              return filter.value.every((v) => connectionTags.includes(v));
            default:
              return true;
          }
        }
        return true;
      });
    });
  }, [state.connections, filters]);

  const groupedConnections = useMemo(
    () => groupConnections(filteredConnections, effectiveSearchTerm),
    [filteredConnections, effectiveSearchTerm],
  );
  const duplicateEntries = detectDuplicateConnections(state.connections);
  const pendingHostVerification =
    selectedConnection && state.pendingHostVerification?.connectionId === selectedConnection.id
      ? state.pendingHostVerification
      : null;
  const lastHostInspection =
    pendingHostVerification && state.lastHostInspection?.connectionId === pendingHostVerification.connectionId
      ? state.lastHostInspection
      : null;

  useEffect(() => {
    const handlePointerDown = () => setContextMenu(null);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => window.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  useEffect(() => {
    if (!selectedConnection || !editorOpen || editingConnectionId !== selectedConnection.id) {
      return;
    }

    setDraft(draftFromProfile(selectedConnection));
  }, [editingConnectionId, editorOpen, selectedConnection?.id]);

  useEffect(() => {
    if (createRequestKey <= 0) {
      return;
    }

    openCreateEditor();
  }, [createRequestKey]);

  function updateSearchTerm(value: string) {
    if (onSearchTermChange) {
      onSearchTermChange(value);
      return;
    }

    setLocalSearchTerm(value);
  }

  function buildDraftProfile(): Partial<ConnectionProfile> {
    return {
      id: editingConnectionId ?? undefined,
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
      password: draft.password,
      privateKeyPath: draft.privateKeyPath,
      privateKeyPassphrase: draft.privateKeyPassphrase,
    };
  }

  function toggleGroup(group: string) {
    setCollapsedGroups((current) => ({
      ...current,
      [group]: !current[group],
    }));
  }

  function selectProfile(profile: ConnectionProfile) {
    controller.selectConnection(profile.id);
    controller.clearConnectionFeedback();
    setContextMenu(null);
  }

  function openCreateEditor() {
    controller.clearConnectionFeedback();
    setConfirmDeleteId(null);
    setDraft(emptyDraft);
    setEditingConnectionId(null);
    setEditorOpen(true);
    setContextMenu(null);
  }

  function openEditEditor(profile: ConnectionProfile) {
    controller.selectConnection(profile.id);
    controller.clearConnectionFeedback();
    setConfirmDeleteId(null);
    setDraft(draftFromProfile(profile));
    setEditingConnectionId(profile.id);
    setEditorOpen(true);
    setContextMenu(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await controller.saveConnectionProfile(buildDraftProfile());
    setEditorOpen(false);
  }

  async function handleDeleteConfirm() {
    if (!selectedConnection) {
      return;
    }

    await controller.deleteConnectionProfile(selectedConnection.id);
    setConfirmDeleteId(null);
    setDraft(emptyDraft);
    setEditingConnectionId(null);
    setEditorOpen(false);
  }

  async function handleExport() {
    const result = await controller.exportConnectionProfiles();

    if (!result) {
      return;
    }

    const url = URL.createObjectURL(new Blob([result.content], { type: "application/json;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `termorax-connections-${result.exportedAt}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  async function handleImport(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const content = await file.text();
    await controller.importConnectionProfilesFromJson(content);
    event.target.value = "";
  }

  async function handleOpenFiles(connectionId: string) {
    await controller.openSession(connectionId);
    await controller.selectBottomPanel("files");
  }

  const contextProfile = contextMenu
    ? state.connections.find((profile) => profile.id === contextMenu.connectionId) ?? null
    : null;

  return (
    <Card className="connections-pane h-full border border-app-border bg-app-surface/90 text-app-text shadow-none">
      <input hidden accept="application/json" onChange={handleImport} ref={fileInputRef} type="file" />

      <CardHeader className="connections-pane__header">
        <div className="connections-pane__title">
          <CardTitle className="text-base">{t("connections.title")}</CardTitle>
          <span>{t("connections.subtitle", { count: filteredConnections.length })}</span>
        </div>
      </CardHeader>

      <CardContent className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="connections-pane__search-row">
        <Input
          className="border-app-border bg-black/20 text-app-text"
          onChange={(event) => updateSearchTerm(event.currentTarget.value)}
          placeholder={t("connections.searchPlaceholder")}
          value={effectiveSearchTerm}
        />
        <Tooltip>
          <TooltipTrigger>
            <Button className="shrink-0" onClick={openCreateEditor} type="button" variant="outline" size="icon">
              <Plus className="h-4 w-4" />
              <span className="sr-only">{t("connections.new")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{t("connections.new")}</TooltipContent>
        </Tooltip>
      </div>

      <div className="connections-pane__filter-row">
        <ConnectionFilterButton
          filters={filters}
          setFilters={setFilters}
          groupOptions={groupOptions}
          tagOptions={tagOptions}
        />
      </div>

      <div className="connections-pane__actions">
        {selectedConnection ? (
          <Tooltip>
            <TooltipTrigger>
              <Button
                onClick={() => openEditEditor(selectedConnection)}
                type="button"
                variant="ghost"
                size="icon-sm"
              >
                <Pencil className="h-4 w-4" />
                <span className="sr-only">{t("connections.editInline")}</span>
              </Button>
            </TooltipTrigger>
            <TooltipContent side="top">{t("connections.editInline")}</TooltipContent>
          </Tooltip>
        ) : null}
        <Tooltip>
          <TooltipTrigger>
            <Button onClick={() => fileInputRef.current?.click()} type="button" variant="ghost" size="icon-sm">
              <Upload className="h-4 w-4" />
              <span className="sr-only">{t("connections.import")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{t("connections.import")}</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger>
            <Button onClick={() => void handleExport()} type="button" variant="ghost" size="icon-sm">
              <Download className="h-4 w-4" />
              <span className="sr-only">{t("connections.export")}</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top">{t("connections.export")}</TooltipContent>
        </Tooltip>
      </div>

      {state.connectionStatusMessage ? (
        <Alert className="border-app-border bg-app-surface-alt/70">
          <AlertDescription>{state.connectionStatusMessage}</AlertDescription>
        </Alert>
      ) : null}
      {state.connectionDuplicateWarning ? (
        <Alert className="border-app-border bg-app-surface-alt/70" variant="destructive">
          <AlertDescription>{state.connectionDuplicateWarning.message}</AlertDescription>
        </Alert>
      ) : null}
      {duplicateEntries.length ? (
        <Alert className="border-app-border bg-app-surface-alt/70" variant="destructive">
          <AlertTitle>发现重复连接配置</AlertTitle>
          <AlertDescription>
            <p>发现重复连接配置，请检查 host:port@user：</p>
          <ul>
            {duplicateEntries.map((entry) => (
              <li key={entry}>{entry}</li>
            ))}
          </ul>
          </AlertDescription>
        </Alert>
      ) : null}

      <div aria-label={t("connections.title")} className="connection-tree" role="tree">
        {groupedConnections.length === 0 ? (
          <div className="empty-panel">
            <p>{t("connections.treeEmpty")}</p>
          </div>
        ) : (
          groupedConnections.map(({ group, entries }) => {
            const isCollapsed = collapsedGroups[group];

            return (
              <section className="connection-tree__group" key={group}>
                <button
                  className="connection-tree__group-header"
                  onClick={() => toggleGroup(group)}
                  type="button"
                >
                  <span className="connection-tree__group-title">{group}</span>
                  <span className="connection-tree__group-count">{t("connections.groupCount", { count: entries.length })}</span>
                  <span>{isCollapsed ? "▸" : "▾"}</span>
                </button>

                {!isCollapsed ? (
                  <div className="connection-tree__group-body">
                    {entries.map((profile) => (
                      <button
                        aria-selected={state.selectedConnectionId === profile.id}
                        className={`connection-tree__item ${
                          state.selectedConnectionId === profile.id ? "is-active" : ""
                        }`}
                        key={profile.id}
                        onClick={() => selectProfile(profile)}
                        onContextMenu={(event) => {
                          event.preventDefault();
                          selectProfile(profile);
                          setContextMenu({
                            connectionId: profile.id,
                            x: event.clientX,
                            y: event.clientY,
                          });
                        }}
                        onDoubleClick={() => void controller.openSession(profile.id)}
                        role="treeitem"
                        type="button"
                      >
                        <span className="connection-tree__item-title flex items-center gap-2">
                          <span>{profile.name}</span>
                          {profile.authType === "privateKey" ? <Badge variant="outline">Key</Badge> : null}
                        </span>
                        <span className="connection-tree__item-meta">
                          {profile.username}@{profile.host}:{profile.port}
                        </span>
                      </button>
                    ))}
                  </div>
                ) : null}
              </section>
            );
          })
        )}
      </div>

      {contextProfile ? (
        <div
          aria-label={t("connections.contextMenuLabel")}
          className="connection-context-menu"
          role="menu"
          style={{ left: `${contextMenu?.x ?? 0}px`, top: `${contextMenu?.y ?? 0}px` }}
        >
          <button onClick={() => void controller.openSession(contextProfile.id)} role="menuitem" type="button">
            {t("connections.openSession")}
          </button>
          <button onClick={() => void handleOpenFiles(contextProfile.id)} role="menuitem" type="button">
            {t("connections.openFiles")}
          </button>
          <button onClick={() => openEditEditor(contextProfile)} role="menuitem" type="button">
            {t("connections.editInline")}
          </button>
        </div>
      ) : null}

      <Dialog
        open={editorOpen}
        onOpenChange={(open) => {
          setEditorOpen(open);
          if (!open) {
            setEditingConnectionId(null);
            setConfirmDeleteId(null);
          }
        }}
      >
        <DialogContent className="connection-editor-dialog max-h-[90vh] max-w-4xl overflow-y-auto border border-app-border bg-app-surface text-app-text">
          <DialogHeader className="connection-editor-dialog__header">
            <DialogTitle>{t("connections.editorTitle")}</DialogTitle>
            <DialogDescription>
              {selectedConnection
                ? editingConnectionId
                  ? t("connections.editorEditing", { name: selectedConnection.name })
                  : t("connections.editorCreate")
                : t("connections.editorCreate")}
            </DialogDescription>
          </DialogHeader>

          <form className="stack-form space-y-5" onSubmit={handleSubmit}>
            {/* 第一行：名称 + 主机 */}
            <div className="form-grid">
              <label>
                <span className="field-label"><Type size={14} /> {t("connections.field.name")}</span>
                <Input
                  className="border-app-border bg-black/20 text-app-text"
                  onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))}
                  placeholder="生产应用-01"
                  value={draft.name}
                />
                {state.connectionValidationErrors.name ? (
                  <span className="field-error">{state.connectionValidationErrors.name}</span>
                ) : null}
              </label>

              <label>
                <span className="field-label"><Server size={14} /> {t("connections.field.host")}</span>
                <Input
                  className="border-app-border bg-black/20 text-app-text"
                  onChange={(event) => setDraft((current) => ({ ...current, host: event.target.value }))}
                  placeholder="10.10.0.12"
                  value={draft.host}
                />
                {state.connectionValidationErrors.host ? (
                  <span className="field-error">{state.connectionValidationErrors.host}</span>
                ) : null}
              </label>
            </div>

            {/* 第二行：端口 + 用户 */}
            <div className="form-grid">
              <label>
                <span className="field-label"><EthernetPort size={14} /> {t("connections.field.port")}</span>
                <Input
                  className="border-app-border bg-black/20 text-app-text"
                  onChange={(event) => setDraft((current) => ({ ...current, port: event.target.value }))}
                  placeholder="22"
                  value={draft.port}
                />
                {state.connectionValidationErrors.port ? (
                  <span className="field-error">{state.connectionValidationErrors.port}</span>
                ) : null}
              </label>

              <label>
                <span className="field-label"><User size={14} /> {t("connections.field.user")}</span>
                <Input
                  className="border-app-border bg-black/20 text-app-text"
                  onChange={(event) => setDraft((current) => ({ ...current, username: event.target.value }))}
                  placeholder="deploy"
                  value={draft.username}
                />
                {state.connectionValidationErrors.username ? (
                  <span className="field-error">{state.connectionValidationErrors.username}</span>
                ) : null}
              </label>
            </div>

            {/* 第三行：分组 + 认证 */}
            <div className="form-grid">
              <label>
                <span className="field-label"><Folder size={14} /> {t("connections.field.group")}</span>
                <Input
                  className="border-app-border bg-black/20 text-app-text"
                  onChange={(event) => setDraft((current) => ({ ...current, group: event.target.value }))}
                  placeholder="生产环境"
                  value={draft.group}
                />
              </label>

              <label>
                <span className="field-label"><Shield size={14} /> {t("connections.field.auth")}</span>
                <Select
                  value={draft.authType}
                  onValueChange={(value) =>
                    setDraft((current) => ({ ...current, authType: value as ConnectionAuthType }))
                  }
                >
                  <SelectTrigger className="h-8 w-full border-app-border bg-black/20 px-2.5 py-1 text-app-text dark:bg-black/20">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="password">{t("connections.auth.password")}</SelectItem>
                    <SelectItem value="privateKey">{t("connections.auth.privateKey")}</SelectItem>
                  </SelectContent>
                </Select>
              </label>
            </div>

            {/* 认证信息 */}
            {draft.authType === "password" ? (
              <label className="mb-2">
                <span className="field-label"><Lock size={14} /> {t("connections.field.password")}</span>
                <Input
                  className="border-app-border bg-black/20 text-app-text"
                  onChange={(event) => setDraft((current) => ({ ...current, password: event.target.value }))}
                  placeholder={t("connections.placeholder.password")}
                  type="password"
                  value={draft.password}
                />
                {state.connectionValidationErrors.password ? (
                  <span className="field-error">{state.connectionValidationErrors.password}</span>
                ) : null}
              </label>
            ) : (
              <div className="form-grid mb-2">
                <label>
                  <span className="field-label"><Key size={14} /> {t("connections.field.privateKeyPath")}</span>
                  <Input
                    className="border-app-border bg-black/20 text-app-text"
                    onChange={(event) => setDraft((current) => ({ ...current, privateKeyPath: event.target.value }))}
                    placeholder={t("connections.placeholder.privateKeyPath")}
                    value={draft.privateKeyPath}
                  />
                  {state.connectionValidationErrors.privateKeyPath ? (
                    <span className="field-error">{state.connectionValidationErrors.privateKeyPath}</span>
                  ) : null}
                </label>
                <label>
                  <span className="field-label"><LockKeyhole size={14} /> {t("connections.field.privateKeyPassphrase")}</span>
                  <Input
                    className="border-app-border bg-black/20 text-app-text"
                    onChange={(event) =>
                      setDraft((current) => ({ ...current, privateKeyPassphrase: event.target.value }))
                    }
                    placeholder={t("connections.placeholder.privateKeyPassphrase")}
                    type="password"
                    value={draft.privateKeyPassphrase}
                  />
                </label>
              </div>
            )}

            {/* 第四行：标签 + 备注 */}
            <div className="form-grid">
              <label>
                <span className="field-label"><Tags size={14} /> {t("connections.field.tags")}</span>
                <Input
                  className="border-app-border bg-black/20 text-app-text"
                  onChange={(event) => setDraft((current) => ({ ...current, tags: event.target.value }))}
                  placeholder="api, cn-sha"
                  value={draft.tags}
                />
              </label>

              <label>
                <span className="field-label"><FileText size={14} /> {t("connections.field.note")}</span>
                <Textarea
                  className="border-app-border bg-black/20 text-app-text"
                  onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value }))}
                  placeholder="用途、网络说明、注意事项"
                  rows={2}
                  value={draft.note}
                />
              </label>
            </div>

              <DialogFooter className="button-row justify-start border-t border-app-border/30 bg-transparent pt-4">
                <Button type="submit">
                  <Save size={16} /> {t("connections.save")}
                </Button>
                <Button
                  onClick={() => void controller.testConnectionProfile(buildDraftProfile())}
                  type="button"
                  variant="outline"
                >
                  <Play size={16} /> {t("connections.test")}
                </Button>
                {editingConnectionId && selectedConnection ? (
                  <Button
                    onClick={() => void controller.openSession(selectedConnection.id)}
                    type="button"
                    variant="secondary"
                  >
                    <Plug size={16} /> {t("connections.openSession")}
                  </Button>
                ) : null}
                {editingConnectionId && selectedConnection ? (
                  <Button
                    onClick={() => setConfirmDeleteId(selectedConnection.id)}
                    type="button"
                    variant="destructive"
                  >
                    <Trash2 size={16} /> {t("connections.delete")}
                  </Button>
                ) : null}
              </DialogFooter>

              {pendingHostVerification ? (
                <Alert className="host-verification-panel border-app-border bg-app-surface-alt/70">
                  <AlertTitle>{t("connections.hostInspectionTitle")}</AlertTitle>
                  <AlertDescription>
                    <p>
                    {t("connections.hostInspectionMessage", {
                      host: pendingHostVerification.host,
                      port: pendingHostVerification.port,
                      algorithm: pendingHostVerification.algorithm,
                    })}
                    </p>
                  <p className="host-verification-panel__fingerprint">
                    {t("connections.hostInspectionFingerprint", { fingerprint: pendingHostVerification.fingerprint })}
                  </p>
                  {lastHostInspection?.trustedFingerprint ? (
                    <Alert className="mt-3 border-app-border bg-app-surface-soft/70" variant="destructive">
                      <AlertDescription>
                      {t("connections.hostInspectionTrustedFingerprint", {
                        fingerprint: lastHostInspection.trustedFingerprint,
                      })}
                      </AlertDescription>
                    </Alert>
                  ) : null}
                  {lastHostInspection?.trustStatus === "mismatch" ? (
                    <Alert className="mt-3 border-app-border bg-app-surface-soft/70" variant="destructive">
                      <AlertDescription>{t("connections.hostInspectionMismatch")}</AlertDescription>
                    </Alert>
                  ) : null}
                  <Alert className="mt-3 border-app-border bg-app-surface-soft/70">
                    <AlertDescription>{t("connections.hostInspectionWarning")}</AlertDescription>
                  </Alert>
                  <div className="button-row">
                    <Button onClick={() => void controller.trustPendingHost()} type="button">
                      {t("connections.hostInspectionTrust")}
                    </Button>
                    <Button onClick={() => controller.dismissPendingHostVerification()} type="button" variant="outline">
                      {t("connections.hostInspectionCancel")}
                    </Button>
                  </div>
                  </AlertDescription>
                </Alert>
              ) : null}
            </form>

            {confirmDeleteId ? (
              <Alert className="danger-zone mt-4 border-app-border bg-app-surface-alt/70" variant="destructive">
                <AlertTitle>{t("connections.deleteConfirmTitle")}</AlertTitle>
                <AlertDescription>{t("connections.deleteConfirmBody")}</AlertDescription>
                <div className="button-row">
                  <Button onClick={() => void handleDeleteConfirm()} type="button" variant="destructive">
                    {t("connections.deleteConfirmAction")}
                  </Button>
                  <Button onClick={() => setConfirmDeleteId(null)} type="button" variant="outline">
                    {t("connections.deleteCancel")}
                  </Button>
                </div>
              </Alert>
            ) : null}
        </DialogContent>
      </Dialog>
      </CardContent>
    </Card>
  );
}
