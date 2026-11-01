const fs = require('fs');

// We can parse PNG with standard zlib
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
zlib.inflate(compressed, (err, decompressed) => {
  if (err) { console.error(err); return; }
  console.log('Decompressed len:', decompressed.length);
  // Scan for red pixels (R > 200, G < 50, B < 50)
  const redBoxes = [];
  const stride = width * 4 + 1; // Assuming RGBA
  let minX1 = 9999, maxX1 = 0, minY1 = 9999, maxY1 = 0;
  let minX2 = 9999, maxX2 = 0, minY2 = 9999, maxY2 = 0;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * stride + 1;
    for (let x = 0; x < width; x++) {
      const p = rowOffset + x * 4;
      const r = decompressed[p];
      const g = decompressed[p+1];
      const b = decompressed[p+2];
      if (r > 210 && g < 40 && b < 40) {
        if (y < 250) {
          if (x < minX1) minX1 = x;
          if (x > maxX1) maxX1 = x;
          if (y < minY1) minY1 = y;
          if (y > maxY1) maxY1 = y;
        } else {
          if (x < minX2) minX2 = x;
          if (x > maxX2) maxX2 = x;
          if (y < minY2) minY2 = y;
          if (y > maxY2) maxY2 = y;
        }
      }
    }
  }

  console.log('Box 1 (Top):', { minX1, maxX1, minY1, maxY1, w: maxX1 - minX1, h: maxY1 - minY1 });
  console.log('Box 2 (Bottom):', { minX2, maxX2, minY2, maxY2, w: maxX2 - minX2, h: maxY2 - minY2 });
});

