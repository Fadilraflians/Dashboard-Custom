const fs = require('fs');
const path = require('path');

const target = path.resolve(__dirname, '../src/app/Chatbot.tsx');
let code = fs.readFileSync(target, 'utf8').replace(/\r\n/g, '\n');

code = code.replace(
  'Halo, saya AIGovtech. Apa yang ingin Anda tanyakan?',
  'Halo, saya AIGovtech, asisten analitik data BOK Puskesmas Kemenkes RI • BNI. Apa metrik atau grafik yang ingin Anda tanyakan atau tambahkan ke dashboard?'
);

const oldPrompts = `const starterPrompts = [
  "Produk fashion apa yang paling banyak terjual?",
  "Kota mana yang memiliki total penjualan tertinggi?",
  "Bagaimana tren penjualan per bulan selama 2025?",
];`;

const newPrompts = `const starterPrompts = [
  "Tampilkan kartu Total Dana Disalurkan",
  "Tampilkan grafik tren alokasi pagu vs SP2D 2026",
  "Tampilkan proporsi alokasi sub-program TW III",
  "Terapkan semua widget rekomendasi ke dashboard",
];`;

code = code.replace(oldPrompts, newPrompts);
fs.writeFileSync(target, code, 'utf8');
console.log('Successfully updated Chatbot.tsx!');
