const https = require('https');
const fs = require('fs');

// Use placehold.co which works better than via.placeholder.com
const assets = [
  { name: 'icon.png', url: 'https://placehold.co/1024/FF6B35/FFFFFF/png?text=OGAS', size: '1024x1024' },
  { name: 'adaptive-icon.png', url: 'https://placehold.co/1024/FF5722/FFFFFF/png?text=OGAS', size: '1024x1024' },
  { name: 'splash.png', url: 'https://placehold.co/1242x2436/FF6B35/FFFFFF/png?text=OGAS+Marketplace', size: '1242x2436' },
  { name: 'favicon.png', url: 'https://placehold.co/512/FF6B35/FFFFFF/png?text=O', size: '512x512' }
];

console.log('⏳ Downloading assets...');

let completed = 0;
assets.forEach(asset => {
  const filePath = 'assets/' + asset.name;
  const file = fs.createWriteStream(filePath);
  
  https.get(asset.url, (response) => {
    if (response.statusCode !== 200) {
      console.error(`❌ Failed to download ${asset.name}: HTTP ${response.statusCode}`);
      return;
    }
    
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      const stats = fs.statSync(filePath);
      console.log(`✅ ${asset.name}: ${(stats.size / 1024).toFixed(1)} KB`);
      completed++;
      if (completed === assets.length) {
        console.log('\n🎉 All assets downloaded!');
      }
    });
  }).on('error', (err) => {
    fs.unlink(filePath, () => {});
    console.error(`❌ Error downloading ${asset.name}: ${err.message}`);
  });
});
