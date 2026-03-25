import type { AppSettings, ConnectionProfile, CommandSnippet } from "../../../entities/domain";

export const defaultAppSettings: AppSettings = {
  terminal: {
    fontFamily: '"JetBrains Mono", "Cascadia Code", Consolas, monospace',
    fontSize: 14,
    lineHeight: 1.6,
    theme: "midnight",
    cursorStyle: "block",
    copyOnSelect: false,
  },
  workspace: {
    sidebarCollapsed: false,
    rightPanel: "files",
    rightPanelVisible: true,
  },
};

export const starterConnections: ConnectionProfile[] = [
  {
    id: "conn-prod-app-01",
    name: "prod-app-01",
    host: "10.10.0.12",
    port: 22,
    username: "deploy",
    authType: "privateKey",
    group: "Production",
    tags: ["api", "cn-sha"],
    note: "Primary application node",
    lastConnectedAt: null,
  },
  {
    id: "conn-stage-bastion",
    name: "stage-bastion",
    host: "10.20.1.5",
    port: 22,
    username: "ops",
    authType: "password",
    group: "Staging",
    tags: ["bastion"],
    note: "Jump host for staging network",
    lastConnectedAt: null,
  },
];

export const starterSnippets: CommandSnippet[] = [
  {
    id: "snippet-tail-api",
    name: "Tail API Logs",
    command: "tail -f /var/log/app/api.log",
    description: "Follow the main API service log.",
    group: "Diagnostics",
    tags: ["logs", "api"],
    favorite: true,
  },
  {
    id: "snippet-disk-check",
    name: "Disk Usage",
    command: "df -h",
    description: "Check disk consumption on the current host.",
    group: "Diagnostics",
    tags: ["disk"],
    favorite: false,
  },
  {
    id: "snippet-release-status",
    name: "Release Status",
    command: "systemctl status termorax-release",
    description: "Inspect the rollout service state.",
    group: "Deploy",
    tags: ["release", "systemd"],
    favorite: false,
  },
];
