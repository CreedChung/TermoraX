import { describe, expect, it } from "vitest";
import type { SessionEvent, SessionTab } from "../entities/domain";
import { mergeSessionEventMetadata } from "./sessionEvents";

function session(): SessionTab {
  return {
    id: "session-1",
    connectionId: "conn-1",
    title: "测试主机",
    protocol: "ssh",
    status: "connected",
    currentPath: "/home/root",
    lastOutput: "ready",
    terminalCols: 120,
    terminalRows: 32,
    createdAt: "1",
    updatedAt: "1",
  };
}

describe("mergeSessionEvent", () => {
  it("updates the matching session timestamp for output chunks", () => {
    const event: SessionEvent = {
      kind: "output",
      sessionId: "session-1",
      stream: "stdout",
      chunk: "\r\nhello",
      occurredAt: "2",
    };

    const updated = mergeSessionEventMetadata([session()], event);

    expect(updated[0].updatedAt).toBe("2");
  });

  it("updates status events without mutating terminal transcript metadata", () => {
    const event: SessionEvent = {
      kind: "status",
      sessionId: "session-1",
      status: "disconnected",
      message: "\r\nclosed",
      errorCode: null,
      occurredAt: "3",
    };

    const updated = mergeSessionEventMetadata([session()], event);

    expect(updated[0].status).toBe("disconnected");
    expect(updated[0].lastOutput).toBe("ready");
    expect(updated[0].updatedAt).toBe("3");
  });
});
