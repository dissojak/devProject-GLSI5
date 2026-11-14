import { describe, expect, it } from "vitest";
import { crc32, createZip } from "@/utils/zip";

function readUint32(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset).getUint32(offset, true);
}

function readUint16(bytes: Uint8Array, offset: number): number {
  return new DataView(bytes.buffer, bytes.byteOffset).getUint16(offset, true);
}

describe("zip", () => {
  it("computes the standard CRC-32 check value", () => {
    expect(crc32(new TextEncoder().encode("123456789"))).toBe(0xcbf43926);
  });

  it("stores each file separately inside its folder", () => {
    const zip = createZip(
      [
        { path: "plan-v1/k8s/web/deployment.yaml", content: "kind: Deployment\n" },
        { path: "plan-v1/k8s/web/service.yaml", content: "kind: Service\n" },
      ],
      new Date(2026, 10, 14, 15, 0, 0),
    );
    const text = new TextDecoder().decode(zip);
    const end = zip.length - 22;

    expect(readUint32(zip, 0)).toBe(0x04034b50);
    expect(readUint32(zip, end)).toBe(0x06054b50);
    expect(readUint16(zip, end + 10)).toBe(2);
    expect(text).toContain("plan-v1/k8s/web/deployment.yaml");
    expect(text).toContain("kind: Service\n");
  });
});
