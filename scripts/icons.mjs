import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";

const BG = [0xfb, 0xfb, 0xfa];
const FG = [0x19, 0x19, 0x19];
const CELL = 0.4;
const RADIUS = 0.18;

const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <rect width="100" height="100" fill="#fbfbfa"/>
  <rect x="${50 - CELL * 50}" y="${50 - CELL * 50}" width="${CELL * 100}" height="${CELL * 100}" rx="${CELL * 100 * RADIUS}" fill="#191919"/>
</svg>
`;
writeFileSync("public/icon.svg", svg);

function coverage(x, y, size) {
  const half = (CELL * size) / 2;
  const r = CELL * size * RADIUS;
  const dx = Math.max(Math.abs(x - size / 2) - (half - r), 0);
  const dy = Math.max(Math.abs(y - size / 2) - (half - r), 0);
  return Math.hypot(dx, dy) <= r ? 1 : 0;
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = crcTable[(c ^ b) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
const chunk = (type, data) => {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
};

function png(size) {
  const S = 4;
  const raw = Buffer.alloc((size * 3 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 3 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      let a = 0;
      for (let sy = 0; sy < S; sy++)
        for (let sx = 0; sx < S; sx++) a += coverage(x + (sx + 0.5) / S, y + (sy + 0.5) / S, size);
      a /= S * S;
      for (let c = 0; c < 3; c++)
        raw[y * (size * 3 + 1) + 1 + x * 3 + c] = Math.round(BG[c] * (1 - a) + FG[c] * a);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 2;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

for (const size of [180, 192, 512]) writeFileSync(`public/icon-${size}.png`, png(size));
