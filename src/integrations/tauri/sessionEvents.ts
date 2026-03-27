import { listen } from "@tauri-apps/api/event";
import type { SessionEvent, TransferTask } from "../../entities/domain";

export const SESSION_EVENT = "workspace://session";
export const TRANSFER_EVENT = "workspace://transfer";

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

export async function listenTransferEvents(
  listener: (task: TransferTask) => void,
): Promise<() => void> {
  const unlisten = await listen<TransferTask>(TRANSFER_EVENT, (event) => {
    if (event.payload) {
      listener(event.payload);
    }
  });

  return () => {
    void unlisten();
  };
}
