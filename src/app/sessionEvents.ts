import type { SessionEvent, SessionTab } from "../entities/domain";

/**
 * Merges backend-driven session events into the in-memory tab list.
 */
export function mergeSessionEvent(sessions: SessionTab[], event: SessionEvent): SessionTab[] {
  let mutated = false;

  const updated = sessions.map((session) => {
    if (session.id !== event.sessionId) {
      return session;
    }

    mutated = true;

    if (event.kind === "output") {
      return {
        ...session,
        lastOutput: `${session.lastOutput}${event.chunk}`,
        updatedAt: event.occurredAt,
      };
    }

    const next = {
      ...session,
      status: event.status ?? session.status,
      updatedAt: event.occurredAt,
    } satisfies SessionTab;

    if (event.message) {
      next.lastOutput = `${session.lastOutput}${event.message}`;
    }

    return next;
  });

  return mutated ? updated : sessions;
}
