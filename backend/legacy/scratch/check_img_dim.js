const fs = require('fs');

// We can read PNG chunks to get width and height
const buf = fs.readFileSync('C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb/.user_uploaded/media_1793297098372_023d9405.png');
const width = buf.readUInt32BE(16);
const height = buf.readUInt32BE(20);
console.log('Image dimensions:', width, 'x', height);

