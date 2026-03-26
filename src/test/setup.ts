import { cleanup } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { resetSessionOutputStore } from "../app/sessionOutputStore";

afterEach(() => {
  cleanup();
  resetSessionOutputStore();
});
