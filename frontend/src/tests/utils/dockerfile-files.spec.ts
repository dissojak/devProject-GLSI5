import { describe, expect, it } from "vitest";
import { codeLines, fileNameOf, proposalFiles } from "@/utils/dockerfile-files";
import type { DockerfileProposal } from "@/types/dockerfile-proposals";

const PROPOSAL: DockerfileProposal = {
  componentName: "web",
  rootPath: "web",
  path: "web/Dockerfile",
  strategy: "VITE",
  content: "FROM node:22\n",
  dockerignore: "node_modules\n",
  files: [],
  warnings: [],
};

describe("dockerfile files", () => {
  it("names a file after the last path segment", () => {
    expect(fileNameOf("web/nginx.conf")).toBe("nginx.conf");
    expect(fileNameOf("Dockerfile")).toBe("Dockerfile");
  });

  it("lists the Dockerfile and .dockerignore when the proposal has no companion files", () => {
    expect(proposalFiles(PROPOSAL)).toEqual([
      { path: "web/Dockerfile", content: "FROM node:22\n" },
      { path: "web/.dockerignore", content: "node_modules\n" },
    ]);
  });

  it("keeps companion files without listing a path twice", () => {
    const files = proposalFiles({
      ...PROPOSAL,
      files: [
        { path: "web/Dockerfile", content: "FROM node:22\n" },
        { path: "web/nginx.conf", content: "server {}" },
      ],
    });
    expect(files.map((file) => file.path)).toEqual([
      "web/.dockerignore",
      "web/Dockerfile",
      "web/nginx.conf",
    ]);
  });

  it("splits content into lines without a trailing empty line", () => {
    expect(codeLines("a\nb\n")).toEqual(["a", "b"]);
  });
});
