import fs from 'fs';
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
  ihdrData[8] = 8; // 8 bits per channel
  ihdrData[9] = 6; // RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);

  // Scanlines with filter byte 0
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // filter None
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

// Draw icon for FitCheck AI
function renderIcon(size: number, maskable = false): Buffer {
  const cx = size / 2;
  const cy = size / 2;
  const radius = maskable ? size : size * 0.22; // corner radius

  return createPng(size, size, (x, y) => {
    // Check rounded rect boundaries for non-maskable
    if (!maskable) {
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

    // Normalized coordinates (-1 to 1)
    const scale = maskable ? 0.75 : 0.85;
    const nx = ((x - cx) / (size / 2)) / scale;
    const ny = ((y - cy) / (size / 2)) / scale;

    // Background gradient: #262626 down to #121212
    const gradT = Math.max(0, Math.min(1, (x + y) / (size * 2)));
    const bgR = Math.round(38 * (1 - gradT) + 18 * gradT);
    const bgG = Math.round(38 * (1 - gradT) + 18 * gradT);
    const bgB = Math.round(38 * (1 - gradT) + 18 * gradT);

    // Sparkle accent in top right: center at nx = 0.55, ny = -0.5
    const spX = nx - 0.52;
    const spY = ny - (-0.48);
    const spR = Math.hypot(spX, spY);
    // 4-pointed diamond sparkle
    const spDiamond = Math.abs(spX) + Math.abs(spY);
    if (spDiamond < 0.16) {
      const sparkleAlpha = Math.max(0, 1 - spDiamond / 0.16);
      if (sparkleAlpha > 0.1) {
        // Gold gradient #F59E0B
        return [245, 158, 11, 255];
      }
    }

    // Simplified Shirt Geometry
    // Collar: V shape at top center
    // Body: shoulders, torso, sleeves
    // Let's check distance to shirt silhouette
    // Torso: nx in [-0.42, 0.42], ny in [-0.25, 0.65]
    // Shoulders slope down from (-0.2, -0.55) to (-0.68, -0.2)
    // and (0.2, -0.55) to (0.68, -0.2)
    // Sleeves: (-0.68, -0.2) down to (-0.45, 0.05)
    
    // Stroke-based distance field for shirt outline
    let isStroke = false;

    // Main torso outline
    const torsoLeft = -0.38;
    const torsoRight = 0.38;
    const torsoBottom = 0.65;
    const torsoTop = -0.15;
    const strokeWidth = 0.055;

    // Bottom edge
    if (ny >= torsoBottom - strokeWidth && ny <= torsoBottom && nx >= torsoLeft && nx <= torsoRight) {
      isStroke = true;
    }
    // Left torso
    if (nx >= torsoLeft && nx <= torsoLeft + strokeWidth && ny >= torsoTop && ny <= torsoBottom) {
      isStroke = true;
    }
    // Right torso
    if (nx <= torsoRight && nx >= torsoRight - strokeWidth && ny >= torsoTop && ny <= torsoBottom) {
      isStroke = true;
    }

    // Left sleeve outer: from (-0.22, -0.52) to (-0.68, -0.18)
    // Distance from line
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

    // Collar
    if (distToSegment(nx, ny, -0.18, -0.52, 0, -0.32) < strokeWidth / 2 ||
        distToSegment(nx, ny, 0, -0.32, 0.18, -0.52) < strokeWidth / 2) {
      isStroke = true;
    }

    // Left shoulder
    if (distToSegment(nx, ny, -0.18, -0.52, -0.66, -0.2) < strokeWidth / 2) {
      isStroke = true;
    }
    // Right shoulder
    if (distToSegment(nx, ny, 0.18, -0.52, 0.66, -0.2) < strokeWidth / 2) {
      isStroke = true;
    }

    // Left sleeve opening
    if (distToSegment(nx, ny, -0.66, -0.2, -0.50, -0.02) < strokeWidth / 2) {
      isStroke = true;
    }
    // Right sleeve opening
    if (distToSegment(nx, ny, 0.66, -0.2, 0.50, -0.02) < strokeWidth / 2) {
      isStroke = true;
    }

    // Left underarm to torso
    if (distToSegment(nx, ny, -0.50, -0.02, torsoLeft, torsoTop) < strokeWidth / 2) {
      isStroke = true;
    }
    // Right underarm to torso
    if (distToSegment(nx, ny, 0.50, -0.02, torsoRight, torsoTop) < strokeWidth / 2) {
      isStroke = true;
    }

    // Neckline back arc
    if (distToSegment(nx, ny, -0.18, -0.52, 0.18, -0.52) < strokeWidth / 2) {
      isStroke = true;
    }

    if (isStroke) {
      return [255, 255, 255, 255];
    }

    return [bgR, bgG, bgB, 255];
  });
}

// Generate all required PWA icons
fs.writeFileSync('public/pwa-192x192.png', renderIcon(192, false));
fs.writeFileSync('public/pwa-512x512.png', renderIcon(512, false));
fs.writeFileSync('public/apple-touch-icon.png', renderIcon(180, false));
fs.writeFileSync('public/pwa-maskable-512x512.png', renderIcon(512, true));

console.log('Successfully generated all PWA PNG icons!');
