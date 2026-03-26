import { describe, expect, it } from "vitest";
import type { SessionTab } from "../entities/domain";
import { mergeSnapshotSessions } from "./useWorkspaceApp";

function session(overrides?: Partial<SessionTab>): SessionTab {
  return {
    id: "session-1",
    connectionId: "conn-1",
    title: "测试会话",
    protocol: "ssh",
    status: "connected",
    currentPath: "/home/demo",
    lastOutput: "ready",
    terminalCols: 120,
    terminalRows: 32,
    createdAt: "1",
    updatedAt: "1",
    ...overrides,
  };
}

describe("mergeSnapshotSessions", () => {
  it("preserves newer event-driven output when a stale snapshot arrives", () => {
    const currentSessions = [session({ lastOutput: "ready\r\nls", updatedAt: "5" })];
    const snapshotSessions = [session({ lastOutput: "ready", updatedAt: "4" })];

    const merged = mergeSnapshotSessions(currentSessions, snapshotSessions);

    expect(merged[0].lastOutput).toBe("ready\r\nls");
    expect(merged[0].updatedAt).toBe("5");
  });

  it("accepts the snapshot when it already contains the latest output", () => {
    const currentSessions = [session({ lastOutput: "ready", updatedAt: "4" })];
    const snapshotSessions = [session({ lastOutput: "ready\r\nls\r\napp.log", updatedAt: "6" })];

    const merged = mergeSnapshotSessions(currentSessions, snapshotSessions);

    expect(merged[0].lastOutput).toBe("ready\r\nls\r\napp.log");
    expect(merged[0].updatedAt).toBe("6");
  });

  it("accepts the snapshot when session lifecycle changed during reconnect", () => {
    const currentSessions = [
      session({
        status: "disconnected",
        currentPath: "/home/demo",
        lastOutput: "old prompt\r\n\r\n[TermoraX] SSH 连接已断开。",
        updatedAt: "8",
      }),
    ];
    const snapshotSessions = [
      session({
        status: "connected",
        currentPath: "/",
        lastOutput: "已重新连接到 demo@example:22\r\n\r\n[TermoraX] 真实 SSH 终端已恢复。",
        updatedAt: "7",
      }),
    ];

    const merged = mergeSnapshotSessions(currentSessions, snapshotSessions);

    expect(merged[0].status).toBe("connected");
    expect(merged[0].currentPath).toBe("/");
    expect(merged[0].lastOutput).toContain("真实 SSH 终端已恢复");
  });
});
