import { listen } from "@tauri-apps/api/event";
import type { SessionEvent } from "../../entities/domain";

export const SESSION_EVENT = "workspace://session";

export async function listenSessionEvents(
  listener: (event: SessionEvent) => void,
): Promise<() => void> {
  const unlisten = await listen<SessionEvent>(SESSION_EVENT, (event) => {
    if (event.payload) {
      listener(event.payload);
    }
  });

  return () => {
    void unlisten();
  };
}
