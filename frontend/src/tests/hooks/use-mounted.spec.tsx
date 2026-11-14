// @vitest-environment jsdom
import { renderToString } from "react-dom/server";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useMounted } from "@/hooks/use-mounted";

function Probe() {
  return <span>{useMounted() ? "client" : "server"}</span>;
}

describe("useMounted", () => {
  it("is false while rendering on the server", () => {
    expect(renderToString(<Probe />)).toContain("server");
  });

  it("is true once mounted in the browser", () => {
    render(<Probe />);
    expect(screen.getByText("client")).toBeTruthy();
  });
});
