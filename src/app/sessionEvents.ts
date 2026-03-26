import type { SessionEvent, SessionTab } from "../entities/domain";

/**
 * Merges backend-driven session metadata into the in-memory tab list while
 * keeping terminal transcript buffering outside of React workspace state.
 */
export function mergeSessionEventMetadata(sessions: SessionTab[], event: SessionEvent): SessionTab[] {
  let mutated = false;

  const updated = sessions.map((session) => {
    if (session.id !== event.sessionId) {
      return session;
    }

    mutated = true;

    if (event.kind === "output") {
      if (session.updatedAt === event.occurredAt) {
        return session;
      }

      return {
        ...session,
        updatedAt: event.occurredAt,
      };
    }

    const nextStatus = event.status ?? session.status;
    if (session.status === nextStatus && session.updatedAt === event.occurredAt) {
      return session;
    }

    return {
      ...session,
      status: nextStatus,
      updatedAt: event.occurredAt,
    };
  });

  return mutated ? updated : sessions;
}
