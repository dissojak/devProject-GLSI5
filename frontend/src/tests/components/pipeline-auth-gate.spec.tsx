// @vitest-environment jsdom
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { PipelineAuthGate } from "@/components/pipeline/pipeline-auth-gate";

vi.mock("next/navigation", () => ({ useRouter: () => ({ replace: vi.fn() }) }));
vi.mock("@/hooks/use-auth-session", () => ({
  useAuthSession: () => ({ token: "t", hydrated: true, user: null }),
}));

function DataHook(): never {
  throw new Error("board content must not render during prerender");
}

describe("PipelineAuthGate", () => {
  it("never renders the board (and its data hooks) on the server", () => {
    const html = renderToString(
      <PipelineAuthGate>
        <DataHook />
      </PipelineAuthGate>,
    );
    expect(html).not.toContain("board content");
  });
});
