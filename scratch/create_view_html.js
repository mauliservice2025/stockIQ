const fs = require('fs');
const zlib = require('zlib');

// Let's create an artifact HTML to view the original image and inspect the red boxes
const artifactHtml = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { background: #1e1e2e; color: #fff; font-family: sans-serif; padding: 20px; }
    .crop-container { display: flex; gap: 20px; flex-wrap: wrap; }
    .card { background: #2a2a3c; padding: 10px; border-radius: 8px; border: 1px solid #444; }
    img { max-width: 100%; border: 1px solid #555; }
  </style>
</head>
<body>
  <h2>User Uploaded Screenshot Analysis</h2>
  <div class="crop-container">
    <div class="card">
      <h3>Full Uploaded Image</h3>
      <img src="media_1793297098372_023d9405.png" style="max-width: 800px;" />
    </div>
  </div>
</body>
</html>
`;

fs.writeFileSync('C:/Users/PravinPatil/.gemini/antigravity/brain/886f0614-deee-4817-9c93-0f0f32234aeb/view_user_image.html', artifactHtml);
console.log('Created view_user_image.html');

