// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { DockerfileFileBrowser } from "@/components/project-detail/dockerfile-file-browser";
import { stubMotionEnvironment } from "@/tests/motion-stubs";

const FILES = [
  { path: "web/Dockerfile", content: "FROM node:22\nRUN npm ci" },
  { path: "web/nginx.conf", content: "server { listen 80; }" },
];

beforeAll(() => {
  stubMotionEnvironment();
});

afterEach(cleanup);

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("dockerfile file browser", () => {
  it("previews the first file by default", () => {
    render(<DockerfileFileBrowser files={FILES} />);
    expect(screen.getByRole("tab", { name: "Dockerfile" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByText("RUN npm ci")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Download Dockerfile" })).toBeTruthy();
  });

  it("switches the preview to the selected file", async () => {
    render(<DockerfileFileBrowser files={FILES} />);
    fireEvent.click(screen.getByRole("tab", { name: "nginx.conf" }));
    expect(await screen.findByText("server { listen 80; }")).toBeTruthy();
    expect(screen.getByRole("tab", { name: "nginx.conf" }).getAttribute("aria-selected")).toBe("true");
    expect(screen.getByRole("button", { name: "Download nginx.conf" })).toBeTruthy();
  });
});
