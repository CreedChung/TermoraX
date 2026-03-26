import { describe, expect, it } from "vitest";
import type { SessionEvent, SessionTab } from "../entities/domain";
import {
  applySessionOutputEvents,
  applySessionSnapshotOutputs,
  getSessionOutputState,
  resetSessionOutputStore,
} from "./sessionOutputStore";

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

function readOutput(sessionId = "session-1", fallback = ""): string {
  return getSessionOutputState(sessionId, fallback).text;
}

describe("sessionOutputStore", () => {
  it("keeps newer event-driven output when a stale snapshot arrives", () => {
    resetSessionOutputStore();
    applySessionSnapshotOutputs([session({ lastOutput: "ready", updatedAt: "1" })]);

    const event: SessionEvent = {
      kind: "output",
      sessionId: "session-1",
      stream: "stdout",
      chunk: "\r\nls",
      occurredAt: "5",
    };
    applySessionOutputEvents([event]);
    applySessionSnapshotOutputs([session({ lastOutput: "ready", updatedAt: "4" })]);

    expect(readOutput()).toBe("ready\r\nls");
  });

  it("replaces output when a newer snapshot resets the transcript", () => {
    resetSessionOutputStore();
    applySessionSnapshotOutputs([session({ lastOutput: "ready\r\nls", updatedAt: "5" })]);
    applySessionSnapshotOutputs([session({ lastOutput: "会话输出已清空。", updatedAt: "6" })]);

    expect(readOutput()).toBe("会话输出已清空。");
  });

  it("truncates oversized output to the most recent suffix", () => {
    resetSessionOutputStore();
    const largeChunk = "a".repeat(250_000);
    const event: SessionEvent = {
      kind: "output",
      sessionId: "session-1",
      stream: "stdout",
      chunk: largeChunk,
      occurredAt: "2",
    };

    applySessionOutputEvents([event]);

    const output = readOutput();
    expect(output.length).toBe(200_000);
    expect(output.endsWith("a".repeat(32))).toBe(true);
  });

  it("drops outputs for sessions that are no longer present in the latest snapshot", () => {
    resetSessionOutputStore();
    applySessionSnapshotOutputs([session({ id: "session-1" }), session({ id: "session-2" })]);
    applySessionSnapshotOutputs([session({ id: "session-2" })]);

    expect(readOutput("session-1", "")).toBe("");
    expect(readOutput("session-2")).toBe("ready");
  });
});
