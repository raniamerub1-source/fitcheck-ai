import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf: Buffer): number {
  let table: number[] = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  let c = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ (-1)) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const typeBuf = Buffer.from(type, 'ascii');
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(data.length, 0);
  const toCrc = Buffer.concat([typeBuf, data]);
  const crc = crc32(toCrc);
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc, 0);
  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

export function createPng(
  width: number,
  height: number,
  drawPixel: (x: number, y: number) => [number, number, number, number]
): Buffer {
  const sig = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 6;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pxOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawPixel(x, y);
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdrChunk, idatChunk, iendChunk]);
}

function distToSegment(px: number, py: number, x1: number, y1: number, x2: number, y2: number) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}

function renderFitCheckIcon(size: number, shape: 'square' | 'round' | 'fullBleed'): Buffer {
  const cx = size / 2;
  const cy = size / 2;

  return createPng(size, size, (x, y) => {
    if (shape === 'round') {
      if (Math.hypot(x - cx, y - cy) > size / 2) return [0, 0, 0, 0];
    } else if (shape === 'square') {
      const cornerR = size * 0.22;
      let inBounds = true;
      if (x < cornerR && y < cornerR) {
        if (Math.hypot(x - cornerR, y - cornerR) > cornerR) inBounds = false;
      } else if (x > size - cornerR && y < cornerR) {
        if (Math.hypot(x - (size - cornerR), y - cornerR) > cornerR) inBounds = false;
      } else if (x < cornerR && y > size - cornerR) {
        if (Math.hypot(x - cornerR, y - (size - cornerR)) > cornerR) inBounds = false;
      } else if (x > size - cornerR && y > size - cornerR) {
        if (Math.hypot(x - (size - cornerR), y - (size - cornerR)) > cornerR) inBounds = false;
      }
      if (!inBounds) return [0, 0, 0, 0];
    }

    const scale = shape === 'fullBleed' ? 0.72 : 0.85;
    const nx = ((x - cx) / (size / 2)) / scale;
    const ny = ((y - cy) / (size / 2)) / scale;

    const gradT = Math.max(0, Math.min(1, (x + y) / (size * 2)));
    const bgR = Math.round(38 * (1 - gradT) + 18 * gradT);
    const bgG = Math.round(38 * (1 - gradT) + 18 * gradT);
    const bgB = Math.round(38 * (1 - gradT) + 18 * gradT);

    const spX = nx - 0.52;
    const spY = ny - (-0.48);
    const spDiamond = Math.abs(spX) + Math.abs(spY);
    if (spDiamond < 0.16) {
      return [245, 158, 11, 255];
    }

    let isStroke = false;
    const torsoLeft = -0.38;
    const torsoRight = 0.38;
    const torsoBottom = 0.65;
    const torsoTop = -0.15;
    const strokeWidth = 0.055;

    if (ny >= torsoBottom - strokeWidth && ny <= torsoBottom && nx >= torsoLeft && nx <= torsoRight) {
      isStroke = true;
    }
    if (nx >= torsoLeft && nx <= torsoLeft + strokeWidth && ny >= torsoTop && ny <= torsoBottom) {
      isStroke = true;
    }
    if (nx <= torsoRight && nx >= torsoRight - strokeWidth && ny >= torsoTop && ny <= torsoBottom) {
      isStroke = true;
    }

    if (distToSegment(nx, ny, -0.18, -0.52, 0, -0.32) < strokeWidth / 2 ||
        distToSegment(nx, ny, 0, -0.32, 0.18, -0.52) < strokeWidth / 2) {
      isStroke = true;
    }
    if (distToSegment(nx, ny, -0.18, -0.52, -0.66, -0.2) < strokeWidth / 2) {
      isStroke = true;
    }
    if (distToSegment(nx, ny, 0.18, -0.52, 0.66, -0.2) < strokeWidth / 2) {
      isStroke = true;
    }
    if (distToSegment(nx, ny, -0.66, -0.2, -0.50, -0.02) < strokeWidth / 2) {
      isStroke = true;
    }
    if (distToSegment(nx, ny, 0.66, -0.2, 0.50, -0.02) < strokeWidth / 2) {
      isStroke = true;
    }
    if (distToSegment(nx, ny, -0.50, -0.02, torsoLeft, torsoTop) < strokeWidth / 2) {
      isStroke = true;
    }
    if (distToSegment(nx, ny, 0.50, -0.02, torsoRight, torsoTop) < strokeWidth / 2) {
      isStroke = true;
    }
    if (distToSegment(nx, ny, -0.18, -0.52, 0.18, -0.52) < strokeWidth / 2) {
      isStroke = true;
    }

    if (isStroke) {
      return [255, 255, 255, 255];
    }

    return [bgR, bgG, bgB, 255];
  });
}

const baseDir = path.join(process.cwd(), 'android/app/src/main/res');

const densities: { folder: string; size: number }[] = [
  { folder: 'mipmap-mdpi', size: 48 },
  { folder: 'mipmap-hdpi', size: 72 },
  { folder: 'mipmap-xhdpi', size: 96 },
  { folder: 'mipmap-xxhdpi', size: 144 },
  { folder: 'mipmap-xxxhdpi', size: 192 },
];

for (const d of densities) {
  const dirPath = path.join(baseDir, d.folder);
  fs.mkdirSync(dirPath, { recursive: true });

  const squareIcon = renderFitCheckIcon(d.size, 'square');
  const roundIcon = renderFitCheckIcon(d.size, 'round');

  fs.writeFileSync(path.join(dirPath, 'ic_launcher.png'), squareIcon);
  fs.writeFileSync(path.join(dirPath, 'ic_launcher_round.png'), roundIcon);
}

const drawableDir = path.join(baseDir, 'drawable');
fs.mkdirSync(drawableDir, { recursive: true });
const splash = renderFitCheckIcon(512, 'square');
fs.writeFileSync(path.join(drawableDir, 'ic_launcher_splash.png'), splash);

console.log('Successfully generated all Android mipmap and splash icons!');
