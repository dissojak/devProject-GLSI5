export interface ZipEntry {
  path: string;
  content: string;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

export function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function dosDateTime(date: Date): { time: number; day: number } {
  return {
    time: (date.getHours() << 11) | (date.getMinutes() << 5) | Math.floor(date.getSeconds() / 2),
    day: ((Math.max(date.getFullYear(), 1980) - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate(),
  };
}

function header(size: number, fields: [number, number][]): Uint8Array {
  const buffer = new Uint8Array(size);
  const view = new DataView(buffer.buffer);
  let offset = 0;
  for (const [value, width] of fields) {
    if (width === 4) view.setUint32(offset, value, true);
    else view.setUint16(offset, value, true);
    offset += width;
  }
  return buffer;
}

export function createZip(entries: readonly ZipEntry[], date: Date = new Date()): Uint8Array {
  const encoder = new TextEncoder();
  const { time, day } = dosDateTime(date);
  const UTF8_FLAG = 0x0800;
  const chunks: Uint8Array[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;

  for (const entry of entries) {
    const name = encoder.encode(entry.path);
    const data = encoder.encode(entry.content);
    const crc = crc32(data);
    const common: [number, number][] = [
      [UTF8_FLAG, 2], [0, 2], [time, 2], [day, 2], [crc, 4], [data.length, 4], [data.length, 4], [name.length, 2],
    ];
    const local = header(30, [[0x04034b50, 4], [20, 2], ...common, [0, 2]]);
    chunks.push(local, name, data);
    central.push(
      header(46, [[0x02014b50, 4], [20, 2], [20, 2], ...common, [0, 2], [0, 2], [0, 2], [0, 2], [0, 4], [offset, 4]]),
      name,
    );
    offset += local.length + name.length + data.length;
  }

  const centralSize = central.reduce((sum, chunk) => sum + chunk.length, 0);
  const end = header(22, [
    [0x06054b50, 4], [0, 2], [0, 2], [entries.length, 2], [entries.length, 2], [centralSize, 4], [offset, 4], [0, 2],
  ]);
  const parts = [...chunks, ...central, end];
  const zip = new Uint8Array(parts.reduce((sum, part) => sum + part.length, 0));
  let cursor = 0;
  for (const part of parts) {
    zip.set(part, cursor);
    cursor += part.length;
  }
  return zip;
}
