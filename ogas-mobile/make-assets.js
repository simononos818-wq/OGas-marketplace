const fs = require('fs');
const zlib = require('zlib');

function createPNG(width, height, r, g, b) {
    let rawData = Buffer.alloc(0);
    for (let y = 0; y < height; y++) {
        rawData = Buffer.concat([rawData, Buffer.from([0])]);
        for (let x = 0; x < width; x++) {
            rawData = Buffer.concat([rawData, Buffer.from([r, g, b])]);
        }
    }
    const compressed = zlib.deflateSync(rawData);
    
    function makeChunk(type, data) {
        const typeBuf = Buffer.from(type);
        const lenBuf = Buffer.alloc(4);
        lenBuf.writeUInt32BE(data.length, 0);
        const chunk = Buffer.concat([typeBuf, data]);
        const crc = zlib.crc32(chunk) >>> 0;
        const crcBuf = Buffer.alloc(4);
        crcBuf.writeUInt32BE(crc, 0);
        return Buffer.concat([lenBuf, chunk, crcBuf]);
    }
    
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(width, 0);
    ihdr.writeUInt32BE(height, 4);
    ihdr[8] = 8; ihdr[9] = 2; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    
    return Buffer.concat([
        Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
        makeChunk('IHDR', ihdr),
        makeChunk('IDAT', compressed),
        makeChunk('IEND', Buffer.alloc(0))
    ]);
}

const assets = [
    ['assets/icon.png', 1024, 1024],
    ['assets/adaptive-icon.png', 1024, 1024],
    ['assets/splash.png', 1024, 1024],
    ['assets/favicon.png', 64, 64]
];

assets.forEach(([file, w, h]) => {
    fs.writeFileSync(file, createPNG(w, h, 255, 107, 35));
    console.log('Created: ' + file);
});

console.log('✅ All assets created!');
