/**
 * marketCalendar.js
 * Kalender libur nasional Indonesia & jam trading IDX
 */

// -----------------------------------------------------------------------
// Hari libur nasional Indonesia 2025 & 2026 (format: "YYYY-MM-DD")
// Sumber: Kalender pemerintah + keputusan bersama
// -----------------------------------------------------------------------
const HOLIDAYS = new Set([
  // === 2025 ===
  '2025-01-01', // Tahun Baru Masehi
  '2025-01-27', // Isra Mi'raj
  '2025-01-28', // Cuti bersama Isra Mi'raj
  '2025-01-29', // Tahun Baru Imlek 2576
  '2025-03-28', // Hari Suci Nyepi (Tahun Baru Saka 1947)
  '2025-03-29', // Cuti bersama Nyepi
  '2025-03-31', // Idul Fitri 1446 H
  '2025-04-01', // Idul Fitri 1446 H (hari ke-2)
  '2025-04-02', // Cuti bersama Idul Fitri
  '2025-04-03', // Cuti bersama Idul Fitri
  '2025-04-04', // Cuti bersama Idul Fitri
  '2025-04-07', // Cuti bersama Idul Fitri
  '2025-04-18', // Wafat Isa Al-Masih (Good Friday)
  '2025-05-01', // Hari Buruh Internasional
  '2025-05-12', // Hari Raya Waisak
  '2025-05-13', // Cuti bersama Waisak
  '2025-05-29', // Kenaikan Isa Al-Masih
  '2025-06-01', // Hari Lahir Pancasila
  '2025-06-06', // Idul Adha 1446 H
  '2025-06-07', // Cuti bersama Idul Adha
  '2025-06-27', // Tahun Baru Islam 1447 H
  '2025-08-17', // HUT RI
  '2025-09-05', // Maulid Nabi Muhammad SAW
  '2025-12-25', // Hari Raya Natal
  '2025-12-26', // Cuti bersama Natal

  // === 2026 ===
  '2026-01-01', // Tahun Baru Masehi
  '2026-01-16', // Isra Mi'raj 1447 H
  '2026-01-17', // Cuti bersama Isra Mi'raj
  '2026-02-17', // Tahun Baru Imlek 2577
  '2026-03-19', // Hari Suci Nyepi (Tahun Baru Saka 1948)
  '2026-03-20', // Idul Fitri 1447 H
  '2026-03-21', // Idul Fitri 1447 H (hari ke-2)
  '2026-03-23', // Cuti bersama Idul Fitri
  '2026-03-24', // Cuti bersama Idul Fitri
  '2026-03-25', // Cuti bersama Idul Fitri
  '2026-03-26', // Cuti bersama Idul Fitri
  '2026-03-27', // Cuti bersama Idul Fitri
  '2026-04-03', // Wafat Isa Al-Masih (Good Friday)
  '2026-05-01', // Hari Buruh Internasional
  '2026-05-14', // Kenaikan Isa Al-Masih
  '2026-05-15', // Cuti bersama Kenaikan Isa Al-Masih
  '2026-05-27', // Hari Raya Waisak
  '2026-05-28', // Idul Adha 1447 H
  '2026-05-29', // Cuti bersama Idul Adha
  '2026-06-01', // Hari Lahir Pancasila
  '2026-06-16', // Tahun Baru Islam 1448 H
  '2026-08-17', // HUT RI
  '2026-08-25', // Maulid Nabi Muhammad SAW
  '2026-12-24', // Cuti bersama Natal
  '2026-12-25', // Hari Raya Natal
])

/**
 * Mengecek apakah tanggal tertentu adalah hari libur nasional
 * @param {Date} date
 * @returns {boolean}
 */
export function isHoliday(date) {
  const key = date.toLocaleDateString('sv-SE', { timeZone: 'Asia/Jakarta' }) // → "YYYY-MM-DD"
  return HOLIDAYS.has(key)
}

/**
 * Mengecek apakah hari ini pasar IDX sedang TERBUKA
 * - Senin–Jumat
 * - Bukan hari libur nasional
 * - Jam 09:00–16:00 WIB (pre-opening 08:45, closing auction 15:50–16:00)
 * @param {Date} [now] - opsional, default Date sekarang
 * @returns {{ open: boolean, reason: string }}
 */
export function getMarketStatus(now = new Date()) {
  // Konversi ke WIB (UTC+7)
  const wibStr = now.toLocaleString('en-US', { timeZone: 'Asia/Jakarta' })
  const wib = new Date(wibStr)

  const day = wib.getDay()   // 0=Minggu, 6=Sabtu
  const hour = wib.getHours()
  const minute = wib.getMinutes()
  const timeInMinutes = hour * 60 + minute

  // Sabtu / Minggu
  if (day === 0 || day === 6) {
    return { open: false, reason: day === 0 ? 'Minggu' : 'Sabtu' }
  }

  // Hari libur nasional
  if (isHoliday(wib)) {
    return { open: false, reason: 'Hari Libur Nasional' }
  }

  // Jam trading IDX: 09:00 – 16:00 WIB
  const OPEN_TIME  = 9 * 60       // 09:00
  const CLOSE_TIME = 16 * 60      // 16:00

  if (timeInMinutes < OPEN_TIME) {
    return { open: false, reason: 'Belum Dibuka' }
  }
  if (timeInMinutes >= CLOSE_TIME) {
    return { open: false, reason: 'Sudah Tutup' }
  }

  return { open: true, reason: 'Sesi Reguler' }
}
