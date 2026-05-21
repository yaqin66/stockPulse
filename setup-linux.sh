#!/bin/bash
# ==============================================================================
# Script Instalasi Cepat StockPulse untuk Ubuntu/Debian (Linux CLI)
# ==============================================================================
# Harap jalankan menggunakan sudo atau akses root:
# chmod +x setup-linux.sh
# sudo ./setup-linux.sh
# ==============================================================================

echo "🚀 Memulai Instalasi Dependencies StockPulse untuk Linux CLI..."

# 1. Update list package
echo "📦 Update package list..."
apt-get update -y

# 2. Instal semua dependencies OS yang diperlukan oleh Puppeteer (Headless Chromium)
echo "🌐 Menginstal library grafis untuk Puppeteer..."
apt-get install -y \
  ca-certificates \
  fonts-liberation \
  libappindicator3-1 \
  libasound2 \
  libatk-bridge2.0-0 \
  libatk1.0-0 \
  libc6 \
  libcairo2 \
  libcups2 \
  libdbus-1-3 \
  libexpat1 \
  libfontconfig1 \
  libgbm1 \
  libgcc1 \
  libglib2.0-0 \
  libgtk-3-0 \
  libnspr4 \
  libnss3 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libstdc++6 \
  libx11-6 \
  libx11-xcb1 \
  libxcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxext6 \
  libxfixes3 \
  libxi6 \
  libxrandr2 \
  libxrender1 \
  libxss1 \
  libxtst6 \
  lsb-release \
  wget \
  xdg-utils

# 3. Instal PM2 Global
echo "⚙️ Menginstal PM2 Process Manager secara global..."
npm install -g pm2

# 4. Install dependencies proyek
echo "📂 Menginstal NPM packages untuk Frontend & Backend..."
npm install
cd backend && npm install && cd ..

# 5. Build React Frontend (Vite)
echo "🏗️ Melakukan proses build Frontend React..."
npm run build

echo "✅ Instalasi Selesai!"
echo ""
echo "🔥 Langkah selanjutnya:"
echo "1. Pastikan Anda sudah mengonfigurasi Nginx menggunakan nginx.conf.example"
echo "2. Mulai server backend dengan perintah: pm2 start ecosystem.config.js"
echo "3. Simpan konfigurasi PM2 dengan: pm2 save && pm2 startup"
