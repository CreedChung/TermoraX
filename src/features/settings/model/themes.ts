import type { AppSettings, BottomPanelId, TerminalPaneId, TerminalSplitDirection, ThemeId } from "../../../entities/domain";
import { defaultAppSettings } from "./defaults";

type CssThemeVariables = Partial<Record<`--${string}`, string>>;

interface TerminalThemeDefinition {
  background: string;
  foreground: string;
  cursor: string;
  selectionBackground: string;
}

export interface AppThemeDefinition {
  id: ThemeId;
  labelKey: `workspace.theme.${ThemeId}`;
  variables: CssThemeVariables;
  terminal: TerminalThemeDefinition;
}

const builtinThemes: AppThemeDefinition[] = [
  {
    id: "midnight",
    labelKey: "workspace.theme.midnight",
    variables: {
      "--app-background":
        "radial-gradient(circle at top left, rgba(242, 160, 92, 0.16), transparent 30%), radial-gradient(circle at top right, rgba(48, 110, 111, 0.2), transparent 28%), linear-gradient(180deg, #1b2025 0%, #101316 100%)",
      "--surface": "rgba(18, 23, 29, 0.92)",
      "--surface-alt": "rgba(27, 35, 43, 0.92)",
      "--surface-soft": "rgba(40, 49, 59, 0.7)",
      "--border": "rgba(243, 229, 207, 0.08)",
      "--text": "#f5f1e8",
      "--muted": "#b5b0a5",
      "--accent": "#f2a05c",
      "--accent-soft": "rgba(242, 160, 92, 0.18)",
      "--success": "#6fcf97",
      "--danger": "#ff8d7d",
      "--shadow": "0 20px 40px rgba(0, 0, 0, 0.28)",
      "--input-surface": "rgba(8, 11, 14, 0.72)",
      "--input-surface-disabled": "rgba(16, 20, 24, 0.56)",
      "--input-text": "#f5f1e8",
      "--placeholder": "rgba(181, 176, 165, 0.82)",
      "--focus-ring": "rgba(242, 160, 92, 0.24)",
      "--code-surface": "rgba(0, 0, 0, 0.18)",
      "--code-text": "#f4eee4",
      "--terminal-meta-surface": "rgba(0, 0, 0, 0.16)",
      "--selection-surface": "rgba(242, 160, 92, 0.08)",
      // Tailwind theme mappings
      "--bg-primary": "#101316",
      "--bg-secondary": "#12171d",
      "--text-primary": "#f5f1e8",
      "--text-secondary": "#b5b0a5",
      "--text-muted": "#8a8479",
      "--accent-primary": "#f2a05c",
      "--accent-primary-subtle": "rgba(242, 160, 92, 0.18)",
      "--surface-default": "rgba(18, 23, 29, 0.95)",
      "--surface-hover": "rgba(40, 49, 59, 0.85)",
      "--surface-elevated": "rgba(33, 42, 52, 0.98)",
      "--surface-disabled": "rgba(16, 20, 24, 0.56)",
      "--border-default": "rgba(243, 229, 207, 0.12)",
      "--border-focus": "rgba(242, 160, 92, 0.44)",
      "--state-success": "#6fcf97",
      "--state-error": "#ff8d7d",
      // shadcn/ui theme mapping
      "--ui-background": "#101316",
      "--ui-foreground": "#f5f1e8",
      "--ui-card": "rgba(18, 23, 29, 0.92)",
      "--ui-card-foreground": "#f5f1e8",
      "--ui-popover": "rgba(18, 23, 29, 0.96)",
      "--ui-popover-foreground": "#f5f1e8",
      "--ui-primary": "#f2a05c",
      "--ui-primary-foreground": "#101316",
      "--ui-secondary": "rgba(40, 49, 59, 0.8)",
      "--ui-secondary-foreground": "#f5f1e8",
      "--ui-muted": "rgba(40, 49, 59, 0.72)",
      "--ui-muted-foreground": "#b5b0a5",
      "--ui-accent": "rgba(242, 160, 92, 0.18)",
      "--ui-accent-foreground": "#f5f1e8",
      "--ui-destructive": "#ff8d7d",
      "--ui-input": "rgba(8, 11, 14, 0.72)",
      "--ui-ring": "rgba(242, 160, 92, 0.44)",
      "--ui-border": "rgba(243, 229, 207, 0.08)",
    },
    terminal: {
      background: "#0c1014",
      foreground: "#dce8d8",
      cursor: "#f2a05c",
      selectionBackground: "rgba(242, 160, 92, 0.24)",
    },
  },
  {
    id: "sand",
    labelKey: "workspace.theme.sand",
    variables: {
      "--app-background":
        "radial-gradient(circle at top left, rgba(155, 109, 54, 0.16), transparent 32%), radial-gradient(circle at top right, rgba(84, 118, 130, 0.18), transparent 28%), linear-gradient(180deg, #efe5d1 0%, #e1d5bf 100%)",
      "--surface": "rgba(255, 248, 236, 0.86)",
      "--surface-alt": "rgba(244, 234, 217, 0.9)",
      "--surface-soft": "rgba(233, 220, 198, 0.9)",
      "--border": "rgba(45, 36, 25, 0.12)",
      "--text": "#2d2419",
      "--muted": "#6b6358",
      "--accent": "#9b6d36",
      "--accent-soft": "rgba(155, 109, 54, 0.12)",
      "--success": "#3b8f5c",
      "--danger": "#c65959",
      "--shadow": "0 20px 40px rgba(90, 68, 30, 0.12)",
      "--input-surface": "rgba(255, 251, 245, 0.98)",
      "--input-surface-disabled": "rgba(236, 228, 214, 0.92)",
      "--input-text": "#2d2419",
      "--placeholder": "rgba(107, 99, 88, 0.76)",
      "--focus-ring": "rgba(155, 109, 54, 0.16)",
      "--code-surface": "rgba(155, 109, 54, 0.12)",
      "--code-text": "#3a2f1f",
      "--terminal-meta-surface": "rgba(155, 109, 54, 0.08)",
      "--selection-surface": "rgba(155, 109, 54, 0.1)",
      // Tailwind theme mappings
      "--bg-primary": "#e1d5bf",
      "--bg-secondary": "#efe7d9",
      "--text-primary": "#2d2419",
      "--text-secondary": "#6b6358",
      "--text-muted": "#8a7d6b",
      "--accent-primary": "#9b6d36",
      "--accent-primary-subtle": "rgba(155, 109, 54, 0.16)",
      "--surface-default": "rgba(255, 248, 236, 0.86)",
      "--surface-hover": "rgba(233, 220, 198, 0.9)",
      "--surface-elevated": "rgba(255, 252, 246, 0.98)",
      "--surface-disabled": "rgba(236, 228, 214, 0.92)",
      "--border-default": "rgba(45, 36, 25, 0.12)",
      "--border-focus": "rgba(155, 109, 54, 0.32)",
      "--state-success": "#3b8f5c",
      "--state-error": "#c65959",
      // shadcn/ui theme mapping
      "--ui-background": "#e1d5bf",
      "--ui-foreground": "#2d2419",
      "--ui-card": "rgba(255, 248, 236, 0.86)",
      "--ui-card-foreground": "#2d2419",
      "--ui-popover": "rgba(255, 252, 246, 0.96)",
      "--ui-popover-foreground": "#2d2419",
      "--ui-primary": "#9b6d36",
      "--ui-primary-foreground": "#ffffff",
      "--ui-secondary": "rgba(233, 220, 198, 0.9)",
      "--ui-secondary-foreground": "#2d2419",
      "--ui-muted": "rgba(233, 220, 198, 0.76)",
      "--ui-muted-foreground": "#6b6358",
      "--ui-accent": "rgba(155, 109, 54, 0.12)",
      "--ui-accent-foreground": "#2d2419",
      "--ui-destructive": "#c65959",
      "--ui-input": "rgba(255, 251, 245, 0.98)",
      "--ui-ring": "rgba(155, 109, 54, 0.32)",
      "--ui-border": "rgba(45, 36, 25, 0.12)",
    },
    terminal: {
      background: "#efe7d9",
      foreground: "#2a2418",
      cursor: "#9b6d36",
      selectionBackground: "rgba(155, 109, 54, 0.18)",
    },
  },
  {
    id: "jade",
    labelKey: "workspace.theme.jade",
    variables: {
      "--app-background":
        "radial-gradient(circle at top left, rgba(124, 220, 165, 0.1), transparent 24%), radial-gradient(circle at top right, rgba(62, 149, 162, 0.16), transparent 26%), linear-gradient(180deg, #10201f 0%, #0a1115 100%)",
      "--surface": "rgba(15, 28, 30, 0.92)",
      "--surface-alt": "rgba(21, 38, 41, 0.94)",
      "--surface-soft": "rgba(31, 53, 56, 0.76)",
      "--border": "rgba(151, 214, 197, 0.14)",
      "--text": "#e7f3ef",
      "--muted": "#9fbab1",
      "--accent": "#78c89f",
      "--accent-soft": "rgba(120, 200, 159, 0.16)",
      "--success": "#7adba0",
      "--danger": "#ff8c80",
      "--shadow": "0 20px 40px rgba(0, 0, 0, 0.24)",
      "--input-surface": "rgba(8, 18, 19, 0.82)",
      "--input-surface-disabled": "rgba(16, 28, 30, 0.62)",
      "--input-text": "#e7f3ef",
      "--placeholder": "rgba(159, 186, 177, 0.76)",
      "--focus-ring": "rgba(120, 200, 159, 0.2)",
      "--code-surface": "rgba(120, 200, 159, 0.1)",
      "--code-text": "#ddf5ea",
      "--terminal-meta-surface": "rgba(0, 0, 0, 0.18)",
      "--selection-surface": "rgba(120, 200, 159, 0.08)",
      // Tailwind theme mappings
      "--bg-primary": "#0a1115",
      "--bg-secondary": "#10201f",
      "--text-primary": "#e7f3ef",
      "--text-secondary": "#9fbab1",
      "--text-muted": "#6e8a81",
      "--accent-primary": "#78c89f",
      "--accent-primary-subtle": "rgba(120, 200, 159, 0.2)",
      "--surface-default": "rgba(15, 28, 30, 0.92)",
      "--surface-hover": "rgba(31, 53, 56, 0.76)",
      "--surface-elevated": "rgba(25, 43, 46, 0.98)",
      "--surface-disabled": "rgba(16, 28, 30, 0.62)",
      "--border-default": "rgba(151, 214, 197, 0.14)",
      "--border-focus": "rgba(120, 200, 159, 0.36)",
      "--state-success": "#7adba0",
      "--state-error": "#ff8c80",
      // shadcn/ui theme mapping
      "--ui-background": "#0a1115",
      "--ui-foreground": "#e7f3ef",
      "--ui-card": "rgba(15, 28, 30, 0.92)",
      "--ui-card-foreground": "#e7f3ef",
      "--ui-popover": "rgba(25, 43, 46, 0.96)",
      "--ui-popover-foreground": "#e7f3ef",
      "--ui-primary": "#78c89f",
      "--ui-primary-foreground": "#0a1115",
      "--ui-secondary": "rgba(31, 53, 56, 0.76)",
      "--ui-secondary-foreground": "#e7f3ef",
      "--ui-muted": "rgba(31, 53, 56, 0.7)",
      "--ui-muted-foreground": "#9fbab1",
      "--ui-accent": "rgba(120, 200, 159, 0.16)",
      "--ui-accent-foreground": "#e7f3ef",
      "--ui-destructive": "#ff8c80",
      "--ui-input": "rgba(8, 18, 19, 0.82)",
      "--ui-ring": "rgba(120, 200, 159, 0.36)",
      "--ui-border": "rgba(151, 214, 197, 0.14)",
    },
    terminal: {
      background: "#091213",
      foreground: "#dceee5",
      cursor: "#78c89f",
      selectionBackground: "rgba(120, 200, 159, 0.22)",
    },
  },
  {
    id: "tide",
    labelKey: "workspace.theme.tide",
    variables: {
      "--app-background":
        "radial-gradient(circle at top left, rgba(87, 143, 189, 0.16), transparent 30%), radial-gradient(circle at top right, rgba(116, 201, 191, 0.16), transparent 24%), linear-gradient(180deg, #edf4f8 0%, #dbe8ef 100%)",
      "--surface": "rgba(251, 254, 255, 0.86)",
      "--surface-alt": "rgba(236, 245, 250, 0.92)",
      "--surface-soft": "rgba(217, 232, 240, 0.9)",
      "--border": "rgba(29, 59, 81, 0.14)",
      "--text": "#1c3142",
      "--muted": "#5f7688",
      "--accent": "#4f7fa4",
      "--accent-soft": "rgba(79, 127, 164, 0.12)",
      "--success": "#2f8f77",
      "--danger": "#c55f6d",
      "--shadow": "0 20px 40px rgba(60, 92, 114, 0.14)",
      "--input-surface": "rgba(255, 255, 255, 0.98)",
      "--input-surface-disabled": "rgba(225, 235, 240, 0.96)",
      "--input-text": "#1c3142",
      "--placeholder": "rgba(95, 118, 136, 0.76)",
      "--focus-ring": "rgba(79, 127, 164, 0.18)",
      "--code-surface": "rgba(79, 127, 164, 0.1)",
      "--code-text": "#1f3b50",
      "--terminal-meta-surface": "rgba(79, 127, 164, 0.08)",
      "--selection-surface": "rgba(79, 127, 164, 0.1)",
      // Tailwind theme mappings
      "--bg-primary": "#dbe8ef",
      "--bg-secondary": "#edf4f8",
      "--text-primary": "#1c3142",
      "--text-secondary": "#5f7688",
      "--text-muted": "#7a8fa0",
      "--accent-primary": "#4f7fa4",
      "--accent-primary-subtle": "rgba(79, 127, 164, 0.18)",
      "--surface-default": "rgba(251, 254, 255, 0.86)",
      "--surface-hover": "rgba(217, 232, 240, 0.9)",
      "--surface-elevated": "rgba(255, 255, 255, 0.98)",
      "--surface-disabled": "rgba(225, 235, 240, 0.96)",
      "--border-default": "rgba(29, 59, 81, 0.14)",
      "--border-focus": "rgba(79, 127, 164, 0.32)",
      "--state-success": "#2f8f77",
      "--state-error": "#c55f6d",
      // shadcn/ui theme mapping
      "--ui-background": "#dbe8ef",
      "--ui-foreground": "#1c3142",
      "--ui-card": "rgba(251, 254, 255, 0.86)",
      "--ui-card-foreground": "#1c3142",
      "--ui-popover": "rgba(255, 255, 255, 0.98)",
      "--ui-popover-foreground": "#1c3142",
      "--ui-primary": "#4f7fa4",
      "--ui-primary-foreground": "#ffffff",
      "--ui-secondary": "rgba(217, 232, 240, 0.9)",
      "--ui-secondary-foreground": "#1c3142",
      "--ui-muted": "rgba(217, 232, 240, 0.86)",
      "--ui-muted-foreground": "#5f7688",
      "--ui-accent": "rgba(79, 127, 164, 0.12)",
      "--ui-accent-foreground": "#1c3142",
      "--ui-destructive": "#c55f6d",
      "--ui-input": "rgba(255, 255, 255, 0.98)",
      "--ui-ring": "rgba(79, 127, 164, 0.32)",
      "--ui-border": "rgba(29, 59, 81, 0.14)",
    },
    terminal: {
      background: "#edf4f8",
      foreground: "#1c3142",
      cursor: "#4f7fa4",
      selectionBackground: "rgba(79, 127, 164, 0.18)",
    },
  },
  {
    id: "graphite",
    labelKey: "workspace.theme.graphite",
    variables: {
      "--app-background":
        "radial-gradient(circle at top left, rgba(207, 213, 218, 0.08), transparent 24%), radial-gradient(circle at top right, rgba(116, 130, 143, 0.16), transparent 28%), linear-gradient(180deg, #20242a 0%, #14171b 100%)",
      "--surface": "rgba(31, 36, 42, 0.92)",
      "--surface-alt": "rgba(40, 46, 53, 0.94)",
      "--surface-soft": "rgba(55, 62, 71, 0.76)",
      "--border": "rgba(222, 228, 235, 0.08)",
      "--text": "#eef0f3",
      "--muted": "#adb4bc",
      "--accent": "#d7aa60",
      "--accent-soft": "rgba(215, 170, 96, 0.16)",
      "--success": "#76d7a7",
      "--danger": "#f08e83",
      "--shadow": "0 20px 40px rgba(0, 0, 0, 0.3)",
      "--input-surface": "rgba(15, 18, 22, 0.78)",
      "--input-surface-disabled": "rgba(25, 29, 34, 0.58)",
      "--input-text": "#eef0f3",
      "--placeholder": "rgba(173, 180, 188, 0.76)",
      "--focus-ring": "rgba(215, 170, 96, 0.2)",
      "--code-surface": "rgba(0, 0, 0, 0.2)",
      "--code-text": "#eef0f3",
      "--terminal-meta-surface": "rgba(0, 0, 0, 0.2)",
      "--selection-surface": "rgba(215, 170, 96, 0.08)",
      // Tailwind theme mappings
      "--bg-primary": "#14171b",
      "--bg-secondary": "#1f242a",
      "--text-primary": "#eef0f3",
      "--text-secondary": "#adb4bc",
      "--text-muted": "#8a94a0",
      "--accent-primary": "#d7aa60",
      "--accent-primary-subtle": "rgba(215, 170, 96, 0.2)",
      "--surface-default": "rgba(31, 36, 42, 0.92)",
      "--surface-hover": "rgba(55, 62, 71, 0.76)",
      "--surface-elevated": "rgba(46, 52, 60, 0.98)",
      "--surface-disabled": "rgba(25, 29, 34, 0.58)",
      "--border-default": "rgba(222, 228, 235, 0.08)",
      "--border-focus": "rgba(215, 170, 96, 0.36)",
      "--state-success": "#76d7a7",
      "--state-error": "#f08e83",
      // shadcn/ui theme mapping
      "--ui-background": "#14171b",
      "--ui-foreground": "#eef0f3",
      "--ui-card": "rgba(31, 36, 42, 0.92)",
      "--ui-card-foreground": "#eef0f3",
      "--ui-popover": "rgba(46, 52, 60, 0.96)",
      "--ui-popover-foreground": "#eef0f3",
      "--ui-primary": "#d7aa60",
      "--ui-primary-foreground": "#14171b",
      "--ui-secondary": "rgba(55, 62, 71, 0.76)",
      "--ui-secondary-foreground": "#eef0f3",
      "--ui-muted": "rgba(55, 62, 71, 0.7)",
      "--ui-muted-foreground": "#adb4bc",
      "--ui-accent": "rgba(215, 170, 96, 0.16)",
      "--ui-accent-foreground": "#eef0f3",
      "--ui-destructive": "#f08e83",
      "--ui-input": "rgba(15, 18, 22, 0.78)",
      "--ui-ring": "rgba(215, 170, 96, 0.36)",
      "--ui-border": "rgba(222, 228, 235, 0.08)",
    },
    terminal: {
      background: "#121519",
      foreground: "#e8ecef",
      cursor: "#d7aa60",
      selectionBackground: "rgba(215, 170, 96, 0.22)",
    },
  },
  {
    id: "shadcn",
    labelKey: "workspace.theme.shadcn",
    variables: {
      "--app-background":
        "linear-gradient(180deg, #fafafa 0%, #f4f4f5 100%)",
      "--surface": "rgba(255, 255, 255, 0.95)",
      "--surface-alt": "rgba(250, 250, 250, 0.98)",
      "--surface-soft": "rgba(244, 244, 245, 0.9)",
      "--border": "rgba(228, 228, 231, 0.8)",
      "--text": "#18181b",
      "--muted": "#71717a",
      "--accent": "#2563eb",
      "--accent-soft": "rgba(37, 99, 235, 0.1)",
      "--success": "#16a34a",
      "--danger": "#dc2626",
      "--shadow": "0 4px 20px rgba(0, 0, 0, 0.08)",
      "--input-surface": "rgba(255, 255, 255, 0.9)",
      "--input-surface-disabled": "rgba(244, 244, 245, 0.8)",
      "--input-text": "#18181b",
      "--placeholder": "rgba(113, 113, 122, 0.7)",
      "--focus-ring": "rgba(37, 99, 235, 0.2)",
      "--code-surface": "rgba(244, 244, 245, 0.9)",
      "--code-text": "#18181b",
      "--terminal-meta-surface": "rgba(250, 250, 250, 0.95)",
      "--selection-surface": "rgba(37, 99, 235, 0.08)",
      // Tailwind theme mappings
      "--bg-primary": "#f4f4f5",
      "--bg-secondary": "#fafafa",
      "--text-primary": "#18181b",
      "--text-secondary": "#71717a",
      "--text-muted": "#a1a1aa",
      "--accent-primary": "#2563eb",
      "--accent-primary-subtle": "rgba(37, 99, 235, 0.15)",
      "--surface-default": "rgba(255, 255, 255, 0.95)",
      "--surface-hover": "rgba(244, 244, 245, 0.9)",
      "--surface-elevated": "rgba(255, 255, 255, 1)",
      "--surface-disabled": "rgba(244, 244, 245, 0.8)",
      "--border-default": "rgba(228, 228, 231, 0.8)",
      "--border-focus": "rgba(37, 99, 235, 0.3)",
      "--state-success": "#16a34a",
      "--state-error": "#dc2626",
      // shadcn/ui theme mapping
      "--ui-background": "#f4f4f5",
      "--ui-foreground": "#18181b",
      "--ui-card": "rgba(255, 255, 255, 0.95)",
      "--ui-card-foreground": "#18181b",
      "--ui-popover": "rgba(255, 255, 255, 1)",
      "--ui-popover-foreground": "#18181b",
      "--ui-primary": "#2563eb",
      "--ui-primary-foreground": "#ffffff",
      "--ui-secondary": "rgba(244, 244, 245, 0.9)",
      "--ui-secondary-foreground": "#18181b",
      "--ui-muted": "rgba(244, 244, 245, 0.85)",
      "--ui-muted-foreground": "#71717a",
      "--ui-accent": "rgba(37, 99, 235, 0.1)",
      "--ui-accent-foreground": "#18181b",
      "--ui-destructive": "#dc2626",
      "--ui-input": "rgba(255, 255, 255, 0.9)",
      "--ui-ring": "rgba(37, 99, 235, 0.25)",
      "--ui-border": "rgba(228, 228, 231, 0.8)",
    },
    terminal: {
      background: "#fafafa",
      foreground: "#18181b",
      cursor: "#2563eb",
      selectionBackground: "rgba(37, 99, 235, 0.15)",
    },
  },
];

const themeRegistry = new Map<ThemeId, AppThemeDefinition>(builtinThemes.map((theme) => [theme.id, theme]));

export function registerThemeDefinition(theme: AppThemeDefinition) {
  themeRegistry.set(theme.id, theme);
}

export function getThemeDefinition(themeId: string | null | undefined): AppThemeDefinition {
  return themeRegistry.get(normalizeThemeId(themeId)) ?? builtinThemes[0];
}

export function listThemeDefinitions(): AppThemeDefinition[] {
  return Array.from(themeRegistry.values());
}

export function normalizeThemeId(themeId: string | null | undefined): ThemeId {
  if (themeId && themeRegistry.has(themeId as ThemeId)) {
    return themeId as ThemeId;
  }

  return "midnight";
}

export function normalizeBottomPanelId(panelId: string | null | undefined): BottomPanelId {
  switch (panelId) {
    case "snippets":
      return "snippets";
    case "history":
      return "history";
    case "logs":
      return "logs";
    default:
      return "files";
  }
}

export function normalizeTerminalSplitDirection(
  direction: string | null | undefined,
): TerminalSplitDirection {
  switch (direction) {
    case "horizontal":
      return "horizontal";
    case "vertical":
      return "vertical";
    default:
      return "none";
  }
}

export function normalizeTerminalPaneId(paneId: string | null | undefined): TerminalPaneId {
  return paneId === "secondary" ? "secondary" : "primary";
}

export function normalizeAppSettings(settings: AppSettings): AppSettings {
  const workspaceRecord = settings.workspace as unknown as Record<string, unknown>;
  const leftPaneVisible =
    typeof workspaceRecord.leftPaneVisible === "boolean"
      ? workspaceRecord.leftPaneVisible
      : typeof workspaceRecord.sidebarCollapsed === "boolean"
        ? !workspaceRecord.sidebarCollapsed
        : defaultAppSettings.workspace.leftPaneVisible;
  const leftPaneWidth =
    typeof workspaceRecord.leftPaneWidth === "number" && Number.isFinite(workspaceRecord.leftPaneWidth)
      ? Math.min(Math.max(workspaceRecord.leftPaneWidth, 220), 320)
      : defaultAppSettings.workspace.leftPaneWidth;
  const bottomPaneHeight =
    typeof workspaceRecord.bottomPaneHeight === "number" && Number.isFinite(workspaceRecord.bottomPaneHeight)
      ? Math.min(Math.max(workspaceRecord.bottomPaneHeight, 120), 520)
      : defaultAppSettings.workspace.bottomPaneHeight;
  const bottomPaneVisible =
    typeof workspaceRecord.bottomPaneVisible === "boolean"
      ? workspaceRecord.bottomPaneVisible
      : typeof workspaceRecord.bottomPanelVisible === "boolean"
        ? workspaceRecord.bottomPanelVisible
        : typeof workspaceRecord.rightPanelVisible === "boolean"
          ? workspaceRecord.rightPanelVisible
          : defaultAppSettings.workspace.bottomPaneVisible;
  const bottomPane = normalizeBottomPanelId(
    typeof workspaceRecord.bottomPane === "string"
      ? workspaceRecord.bottomPane
      : typeof workspaceRecord.bottomPanel === "string"
        ? workspaceRecord.bottomPanel
        : typeof workspaceRecord.rightPanel === "string"
          ? workspaceRecord.rightPanel
          : defaultAppSettings.workspace.bottomPane,
  );
  const terminalSplitDirection = normalizeTerminalSplitDirection(
    typeof workspaceRecord.terminalSplitDirection === "string"
      ? workspaceRecord.terminalSplitDirection
      : null,
  );
  const activeTerminalPane = normalizeTerminalPaneId(
    typeof workspaceRecord.activeTerminalPane === "string"
      ? workspaceRecord.activeTerminalPane
      : null,
  );

  return {
    ...settings,
    terminal: {
      ...settings.terminal,
      theme: normalizeThemeId(settings.terminal.theme),
    },
    workspace: {
      leftPaneVisible,
      leftPaneWidth,
      bottomPane,
      bottomPaneVisible,
      bottomPaneHeight,
      terminalSplitDirection,
      activeTerminalPane,
    },
  };
}
