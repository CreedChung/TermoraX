import { describe, expect, it } from "vitest";
import type { ConnectionProfile } from "../../../entities/domain";
import { detectDuplicateConnections, groupConnections } from "./connection-utils";

const sampleConnections: ConnectionProfile[] = [
  {
    id: "conn-1",
    name: "prod-api",
    host: "10.0.0.1",
    port: 22,
    username: "deploy",
    authType: "password",
    group: "生产",
    tags: ["api"],
    note: "",
    lastConnectedAt: null,
  },
  {
    id: "conn-2",
    name: "prod-db",
    host: "10.0.0.2",
    port: 22,
    username: "deploy",
    authType: "privateKey",
    group: "生产",
    tags: ["db"],
    note: "",
    lastConnectedAt: null,
  },
  {
    id: "conn-3",
    name: "stage-web",
    host: "10.0.1.1",
    port: 8022,
    username: "ops",
    authType: "password",
    group: "预发",
    tags: ["web"],
    note: "",
    lastConnectedAt: "100",
  },
  {
    id: "conn-4",
    name: "prod-api-copy",
    host: "10.0.0.1",
    port: 22,
    username: "deploy",
    authType: "password",
    group: "生产",
    tags: ["api"],
    note: "",
    lastConnectedAt: "200",
  },
];

describe("connection-utils", () => {
  it("groups connections by group name", () => {
    const grouped = groupConnections(sampleConnections, "");
    const prodGroup = grouped.find((group) => group.group === "生产");

    expect(grouped).toHaveLength(2);
    expect(prodGroup).toBeTruthy();
    expect(prodGroup?.entries).toHaveLength(3);
  });

  it("filters groups by search term", () => {
    const filtered = groupConnections(sampleConnections, "stage");

    expect(filtered).toHaveLength(1);
    expect(filtered[0].entries[0].name).toBe("stage-web");
  });

  it("detects duplicate host and user combinations", () => {
    expect(detectDuplicateConnections(sampleConnections)).toEqual(["10.0.0.1:22@deploy"]);
  });

  it("sorts entries in each group by most recent connection first", () => {
    const grouped = groupConnections(sampleConnections, "");
    const prodGroup = grouped.find((group) => group.group === "生产");

    expect(prodGroup?.entries[0].id).toBe("conn-4");
  });
});
