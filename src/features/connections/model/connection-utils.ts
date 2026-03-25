import type { ConnectionProfile } from "../../../entities/domain";

export interface ConnectionGroup {
  group: string;
  entries: ConnectionProfile[];
}

export function normalizeSearchTerm(term: string) {
  return term.trim().toLowerCase();
}

function sortConnectionsByRecent(left: ConnectionProfile, right: ConnectionProfile) {
  const leftTimestamp = Number(left.lastConnectedAt ?? 0);
  const rightTimestamp = Number(right.lastConnectedAt ?? 0);

  if (leftTimestamp !== rightTimestamp) {
    return rightTimestamp - leftTimestamp;
  }

  return left.name.localeCompare(right.name, "zh-CN");
}

export function groupConnections(connections: ConnectionProfile[], searchTerm: string): ConnectionGroup[] {
  const normalized = normalizeSearchTerm(searchTerm);
  const filtered = connections.filter((profile) => {
    if (!normalized) {
      return true;
    }
    return (
      profile.name.toLowerCase().includes(normalized) ||
      profile.host.toLowerCase().includes(normalized) ||
      profile.username.toLowerCase().includes(normalized) ||
      profile.group.toLowerCase().includes(normalized) ||
      profile.tags.some((tag) => tag.toLowerCase().includes(normalized))
    );
  });

  const bucket: Record<string, ConnectionProfile[]> = {};
  filtered.forEach((profile) => {
    const key = profile.group || "未分组";
    if (!bucket[key]) {
      bucket[key] = [];
    }
    bucket[key].push(profile);
  });

  return Object.keys(bucket)
    .sort()
    .map((group) => ({
      group,
      entries: bucket[group].sort(sortConnectionsByRecent),
    }));
}

export function detectDuplicateConnections(connections: ConnectionProfile[]) {
  const map: Record<string, number> = {};
  connections.forEach((profile) => {
    const key = `${profile.host}:${profile.port}@${profile.username}`.toLowerCase();
    map[key] = (map[key] ?? 0) + 1;
  });

  return Object.entries(map)
    .filter(([_, count]) => count > 1)
    .map(([key]) => key);
}
