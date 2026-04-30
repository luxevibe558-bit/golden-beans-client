const fs = require('fs');

const svg192 = '<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192"><rect width="192" height="192" rx="40" fill="#0F3D2E"/><text x="96" y="130" font-size="100" text-anchor="middle">☕</text></svg>';
const svg512 = '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="512" height="512" rx="100" fill="#0F3D2E"/><text x="256" y="340" font-size="260" text-anchor="middle">☕</text></svg>';

fs.writeFileSync('public/icon-192.png', svg192);
fs.writeFileSync('public/icon-512.png', svg512);
console.log('Icons created!');