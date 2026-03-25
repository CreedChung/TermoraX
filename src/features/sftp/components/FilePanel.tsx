import type { RemoteFileEntry } from "../../../entities/domain";
import { Panel } from "../../../shared/components/Panel";

interface FilePanelProps {
  entries: RemoteFileEntry[];
  currentPath: string | null;
}

export function FilePanel({ entries, currentPath }: FilePanelProps) {
  return (
    <Panel title="Remote Files" subtitle={currentPath ?? "No session selected"}>
      {entries.length === 0 ? (
        <div className="empty-panel">
          <p>Remote file data will appear after a session is opened.</p>
        </div>
      ) : (
        <div className="file-list">
          {entries.map((entry) => (
            <div className="file-row" key={entry.path}>
              <div>
                <strong>{entry.name}</strong>
                <p>{entry.path}</p>
              </div>
              <div className="file-row__meta">
                <span>{entry.kind}</span>
                <span>{entry.kind === "file" ? `${entry.size} B` : "folder"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
