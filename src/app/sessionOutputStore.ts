import type { SessionEvent, SessionTab } from "../entities/domain";
import { debugLog } from "../shared/lib/debug";

const MAX_SESSION_OUTPUT_CHARS = 200_000;
const SESSION_OUTPUT_DEBUG_FLAG = "termorax-debug-session-output";
const SESSION_OUTPUT_PREVIEW_CHARS = 120;

export interface SessionOutputState {
  text: string;
  updatedAt: string;
  version: number;
  delta: string;
  didReset: boolean;
}

const outputs = new Map<string, SessionOutputState>();
const listeners = new Map<string, Set<() => void>>();

function parseSessionTimestamp(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function clampSessionOutput(value: string): string {
  return value.length > MAX_SESSION_OUTPUT_CHARS ? value.slice(-MAX_SESSION_OUTPUT_CHARS) : value;
}

function appendSessionOutput(base: string, addition: string): string {
  if (!addition) {
    return base;
  }

  return clampSessionOutput(`${base}${addition}`);
}

function previewOutput(value: string): string {
  const sanitized = value.replace(/\r/g, "\\r").replace(/\n/g, "\\n");
  return sanitized.length > SESSION_OUTPUT_PREVIEW_CHARS
    ? `${sanitized.slice(0, SESSION_OUTPUT_PREVIEW_CHARS)}...`
    : sanitized;
}

function notifySessions(sessionIds: Iterable<string>) {
  const notified = new Set<string>();

  for (const sessionId of sessionIds) {
    if (notified.has(sessionId)) {
      continue;
    }

    notified.add(sessionId);
    listeners.get(sessionId)?.forEach((listener) => {
      listener();
    });
  }
}

function buildOutputState(
  previous: SessionOutputState | undefined,
  nextText: string,
  updatedAt: string,
  delta: string,
  didReset: boolean,
): SessionOutputState {
  return {
    text: nextText,
    updatedAt,
    version: (previous?.version ?? 0) + 1,
    delta,
    didReset,
  };
}

function setSessionOutputState(sessionId: string, nextState: SessionOutputState): boolean {
  const current = outputs.get(sessionId);
  if (
    current?.text === nextState.text &&
    current.updatedAt === nextState.updatedAt &&
    current.delta === nextState.delta &&
    current.didReset === nextState.didReset
  ) {
    return false;
  }

  outputs.set(sessionId, nextState);
  return true;
}

export function applySessionSnapshotOutputs(snapshotSessions: SessionTab[]) {
  const activeSessionIds = new Set(snapshotSessions.map((session) => session.id));
  const changedSessionIds = new Set<string>();

  for (const session of snapshotSessions) {
    const snapshotText = clampSessionOutput(session.lastOutput);
    const current = outputs.get(session.id);

    if (!current) {
      if (
        setSessionOutputState(
          session.id,
          buildOutputState(undefined, snapshotText, session.updatedAt, snapshotText, true),
        )
      ) {
        debugLog(SESSION_OUTPUT_DEBUG_FLAG, "session_output_store.snapshot_seed", {
          sessionId: session.id,
          updatedAt: session.updatedAt,
          textLength: snapshotText.length,
          preview: previewOutput(snapshotText),
        });
        changedSessionIds.add(session.id);
      }
      continue;
    }

    const currentExtendsSnapshot =
      current.text.length > snapshotText.length && current.text.startsWith(snapshotText);
    const currentIsNewer = parseSessionTimestamp(current.updatedAt) > parseSessionTimestamp(session.updatedAt);

    if (currentExtendsSnapshot && currentIsNewer) {
      debugLog(SESSION_OUTPUT_DEBUG_FLAG, "session_output_store.snapshot_skip_stale", {
        sessionId: session.id,
        snapshotUpdatedAt: session.updatedAt,
        currentUpdatedAt: current.updatedAt,
        snapshotLength: snapshotText.length,
        currentLength: current.text.length,
      });
      continue;
    }

    if (
      setSessionOutputState(
        session.id,
        buildOutputState(current, snapshotText, session.updatedAt, snapshotText, true),
      )
    ) {
      debugLog(SESSION_OUTPUT_DEBUG_FLAG, "session_output_store.snapshot_reset", {
        sessionId: session.id,
        updatedAt: session.updatedAt,
        textLength: snapshotText.length,
        preview: previewOutput(snapshotText),
      });
      changedSessionIds.add(session.id);
    }
  }

  for (const sessionId of [...outputs.keys()]) {
    if (activeSessionIds.has(sessionId)) {
      continue;
    }

    outputs.delete(sessionId);
    changedSessionIds.add(sessionId);
  }

  notifySessions(changedSessionIds);
}

export function applySessionOutputEvents(events: SessionEvent[]) {
  const changedSessionIds = new Set<string>();

  for (const event of events) {
    const current = outputs.get(event.sessionId);
    const currentText = current?.text ?? "";

    if (event.kind === "output") {
      const nextText = appendSessionOutput(currentText, event.chunk);
      if (
        setSessionOutputState(
          event.sessionId,
          buildOutputState(current, nextText, event.occurredAt, event.chunk, false),
        )
      ) {
        debugLog(SESSION_OUTPUT_DEBUG_FLAG, "session_output_store.event_append", {
          sessionId: event.sessionId,
          kind: event.kind,
          stream: event.stream,
          occurredAt: event.occurredAt,
          deltaLength: event.chunk.length,
          totalLength: nextText.length,
          preview: previewOutput(event.chunk),
        });
        changedSessionIds.add(event.sessionId);
      }
      continue;
    }

    if (!event.message) {
      continue;
    }

    const nextText = appendSessionOutput(currentText, event.message);
    if (
      setSessionOutputState(
        event.sessionId,
        buildOutputState(current, nextText, event.occurredAt, event.message, false),
      )
    ) {
      debugLog(SESSION_OUTPUT_DEBUG_FLAG, "session_output_store.event_append", {
        sessionId: event.sessionId,
        kind: event.kind,
        status: event.status,
        occurredAt: event.occurredAt,
        deltaLength: event.message.length,
        totalLength: nextText.length,
        preview: previewOutput(event.message),
      });
      changedSessionIds.add(event.sessionId);
    }
  }

  notifySessions(changedSessionIds);
}

export function subscribeSessionOutput(sessionId: string, listener: () => void): () => void {
  const sessionListeners = listeners.get(sessionId) ?? new Set<() => void>();
  sessionListeners.add(listener);
  listeners.set(sessionId, sessionListeners);

  return () => {
    const currentListeners = listeners.get(sessionId);
    if (!currentListeners) {
      return;
    }

    currentListeners.delete(listener);
    if (currentListeners.size === 0) {
      listeners.delete(sessionId);
    }
  };
}

export function getSessionOutputState(sessionId: string | null, fallbackOutput = ""): SessionOutputState {
  if (!sessionId) {
    return {
      text: fallbackOutput,
      updatedAt: "0",
      version: 0,
      delta: fallbackOutput,
      didReset: true,
    };
  }

  return (
    outputs.get(sessionId) ?? {
      text: fallbackOutput,
      updatedAt: "0",
      version: 0,
      delta: fallbackOutput,
      didReset: true,
    }
  );
}

export function resetSessionOutputStore() {
  outputs.clear();
  listeners.clear();
}
