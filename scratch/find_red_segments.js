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
zlib.inflate(compressed, (err, decompressed) => {
  if (err) { console.error(err); return; }
  const stride = width * 4 + 1;
  // Let's find horizontal red line segments where R is very high and G,B are very low, with length > 50
  for (let y = 0; y < height; y++) {
    const rowOffset = y * stride + 1;
    let segStart = -1;
    for (let x = 0; x < width; x++) {
      const p = rowOffset + x * 4;
      const r = decompressed[p], g = decompressed[p+1], b = decompressed[p+2];
      const isRed = (r > 200 && g < 40 && b < 40);
      if (isRed) {
        if (segStart === -1) segStart = x;
      } else {
        if (segStart !== -1) {
          if (x - segStart > 50) {
            console.log(`Red horizontal line at y=${y}, from x=${segStart} to x=${x} (length ${x - segStart})`);
          }
          segStart = -1;
        }
      }
    }
  }
});
