import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { TransferPanel } from "./TransferPanel";
import type { TransferTask } from "../../../entities/domain";

const tasks: TransferTask[] = [
  {
    id: "task-1",
    sessionId: "session-1",
    direction: "upload",
    status: "running",
    localPath: "C:/logs/app.log",
    remotePath: "/home/demo/app.log",
    bytesTotal: 2048,
    bytesTransferred: 512,
    startedAt: "2026-01-01T12:00:00.000Z",
    finishedAt: null,
    message: "同步中",
  },
  {
    id: "task-2",
    sessionId: "session-1",
    direction: "download",
    status: "succeeded",
    localPath: "D:/backup/report.txt",
    remotePath: "/srv/report.txt",
    bytesTotal: 4096,
    bytesTransferred: 4096,
    startedAt: "2026-01-01T12:01:00.000Z",
    finishedAt: "2026-01-01T12:01:05.000Z",
    message: null,
  },
];

describe("TransferPanel", () => {
  it("renders loading, empty, and task states", () => {
    render(<TransferPanel tasks={[]} loading />);
    expect(screen.getAllByText("正在获取传输状态…").length).toBeGreaterThan(0);

    render(<TransferPanel tasks={[]} />);
    expect(screen.getAllByText("暂无传输任务。").length).toBeGreaterThan(0);

    render(<TransferPanel tasks={tasks} />);
    expect(screen.getByText("C:/logs/app.log")).toBeInTheDocument();
    expect(screen.getByText("/home/demo/app.log")).toBeInTheDocument();
    expect(screen.getByText("D:/backup/report.txt")).toBeInTheDocument();
    expect(screen.getByText("/srv/report.txt")).toBeInTheDocument();
    expect(screen.getByText("同步中")).toBeInTheDocument();
    expect(screen.getAllByText(/上传 ·/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/下载 ·/).length).toBeGreaterThan(0);
  });

  it("shows correct progress bar width", () => {
    render(<TransferPanel tasks={[tasks[0]]} />);
    const fill = document.querySelector(".transfer-progress__fill") as HTMLElement | null;
    expect(fill).not.toBeNull();
    expect(fill?.style.width).toBe("25%");
  });
});
