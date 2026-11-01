const fs = require('fs');
const zlib = require('zlib');

const buf = fs.readFileSync('C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb/.user_uploaded/media_1793297098372_023d9405.png');

let offset = 8;
const idatChunks = [];
let width = 0, height = 0;

while (offset < buf.length) {
  const len = buf.readUInt32BE(offset);
  const type = buf.toString('ascii', offset + 4, offset + 8);
  if (type === 'IHDR') {
    width = buf.readUInt32BE(offset + 8);
    height = buf.readUInt32BE(offset + 12);
  } else if (type === 'IDAT') {
    idatChunks.push(buf.subarray(offset + 8, offset + 8 + len));
  }
  offset += 12 + len;
}

const compressed = Buffer.concat(idatChunks);
zlib.inflate(compressed, (err, raw) => {
  if (err) throw err;
  const bpp = 4;
  const rowBytes = width * bpp;
  const pixels = Buffer.alloc(width * height * bpp);

  let rawOff = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[rawOff++];
    const prevRow = y > 0 ? (y - 1) * rowBytes : -1;
    const currRow = y * rowBytes;

    for (let x = 0; x < rowBytes; x++) {
      const byte = raw[rawOff++];
      const left = x >= bpp ? pixels[currRow + x - bpp] : 0;
      const up = prevRow >= 0 ? pixels[prevRow + x] : 0;
      const upLeft = (prevRow >= 0 && x >= bpp) ? pixels[prevRow + x - bpp] : 0;

      let val = 0;
      if (filter === 0) val = byte;
      else if (filter === 1) val = (byte + left) & 0xff;
      else if (filter === 2) val = (byte + up) & 0xff;
      else if (filter === 3) val = (byte + Math.floor((left + up) / 2)) & 0xff;
      else if (filter === 4) {
        // Paeth
        const p = left + up - upLeft;
        const pa = Math.abs(p - left);
        const pb = Math.abs(p - up);
        const pc = Math.abs(p - upLeft);
        const pr = (pa <= pb && pa <= pc) ? left : (pb <= pc ? up : upLeft);
        val = (byte + pr) & 0xff;
      }
      pixels[currRow + x] = val;
    }
  }

  // Scan for red bounding boxes (R > 230, G < 40, B < 40)
  const redPoints = [];
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = pixels[idx], g = pixels[idx+1], b = pixels[idx+2];
      if (r > 230 && g < 40 && b < 40) {
        redPoints.push({ x, y });
      }
    }
  }

  console.log('Total red pixels:', redPoints.length);
  // Cluster into top group (y < 280) and bottom group (y >= 280)
  const top = redPoints.filter(p => p.y < 280 && p.x > 300);
  const bottom = redPoints.filter(p => p.y >= 280 && p.x > 300);

  const getBBox = (pts) => {
    let minX = 9999, maxX = 0, minY = 9999, maxY = 0;
    pts.forEach(p => {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    });
    return { minX, maxX, minY, maxY, w: maxX - minX, h: maxY - minY };
  };

  console.log('Top Red Box:', getBBox(top));
  console.log('Bottom Red Box:', getBBox(bottom));
});

