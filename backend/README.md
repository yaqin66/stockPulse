# StockPulse Backend — IDX API Proxy

Server Express sederhana yang mem-proxy semua request ke API IDX.co.id agar tidak terkena CORS blocking dari browser.

## Instalasi & Jalankan

```powershell
cd C:\Users\Yaqin\Documents\Coding\stockpulse\backend

# Install dependencies
npm install

# Jalankan (development, auto-reload)
npm run dev

# Atau production
npm start
```

Server berjalan di: **http://localhost:3001**

## Endpoints

| Method | Path | Deskripsi |
|--------|------|-----------|
| GET | `/api/announcement/:ticker` | Pengumuman emiten IDX |
| GET | `/api/trading-daily/:ticker` | Data trade harian |
| GET | `/api/trading-history/:ticker` | Riwayat 3 bulan terakhir |
| GET | `/api/chart/:ticker/:period` | Grafik harga (1D/1W/1M/1Y) |
| GET | `/health` | Health check |

## Query Params — Pengumuman

| Param | Default | Contoh |
|-------|---------|--------|
| `indexFrom` | 0 | `?indexFrom=10` |
| `pageSize` | 10 | `?pageSize=20` |
| `dateFrom` | 1 tahun lalu | `?dateFrom=20250101` |
| `dateTo` | hari ini | `?dateTo=20260503` |
| `keyword` | - | `?keyword=dividen` |

## Cara Jalankan Keduanya (Frontend + Backend)

**Terminal 1 — Frontend:**
```powershell
cd C:\Users\Yaqin\Documents\Coding\stockpulse
npm run dev
```

**Terminal 2 — Backend:**
```powershell
cd C:\Users\Yaqin\Documents\Coding\stockpulse\backend
npm install
npm run dev
```

Buka: **http://localhost:5173**
