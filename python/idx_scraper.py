"""
idx_scraper.py — Pengambil data fundamental saham IDX menggunakan curl_cffi.

Mengambil data per emiten:
  • PER  (Price-to-Earnings Ratio)
  • PBV  (Price-to-Book Value)
  • ROE  (Return on Equity)
  • DER  (Debt-to-Equity Ratio)
  • NPM  (Net Profit Margin)
  • Market Cap

Strategi:
  1. Ambil daftar semua emiten dari IDX API.
  2. Ambil financial ratio setiap emiten (dengan rate-limit & retry).
  3. Normalkan data ke struktur dict standar.
  4. Kembalikan list[dict] siap masuk ke database.
"""

import logging
import time
from datetime import datetime, timezone
from typing import Optional

from curl_cffi import requests as cffi_requests
from curl_cffi.requests import RequestsError

from config import idx_config, LOG_LEVEL, LOG_FILE

# ─────────────────────────────────────────────────────────────
# Logger
# ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
    ],
)
log = logging.getLogger("idx_scraper")

# ─────────────────────────────────────────────────────────────
# Header browser realistis agar IDX tidak memblok request
# ─────────────────────────────────────────────────────────────
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/124.0.0.0 Safari/537.36"
    ),
    "Accept":          "application/json, text/plain, */*",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8",
    "Referer":         "https://www.idx.co.id/id/data-pasar/laporan-statistik/screener-saham/",
    "Origin":          "https://www.idx.co.id",
    "Cache-Control":   "no-cache",
    "X-Requested-With": "XMLHttpRequest",
}


# ─────────────────────────────────────────────────────────────
# Low-level HTTP helper dengan retry & back-off
# ─────────────────────────────────────────────────────────────
def _get_json(url: str, params: Optional[dict] = None) -> dict:
    """
    GET request ke URL, parse JSON, dengan retry otomatis.

    Raises:
        RuntimeError: jika semua retry habis / status bukan 2xx.
    """
    delay = idx_config.request_delay_seconds
    for attempt in range(1, idx_config.max_retries + 1):
        try:
            resp = cffi_requests.get(
                url,
                params=params,
                headers=_HEADERS,
                timeout=idx_config.request_timeout,
                impersonate="chrome124",   # curl_cffi — browser emulation
            )
            if resp.status_code == 200:
                return resp.json()
            elif resp.status_code == 429:
                wait = delay * (idx_config.retry_backoff ** attempt)
                log.warning("⏳  Rate-limited (429) — tunggu %.1fs sebelum retry ke-%d",
                            wait, attempt)
                time.sleep(wait)
            elif resp.status_code == 403:
                log.warning("🔒  403 Forbidden saat GET %s (attempt %d/%d)",
                            url, attempt, idx_config.max_retries)
                time.sleep(delay * 2)
            else:
                log.warning("⚠️   HTTP %d saat GET %s", resp.status_code, url)
                break
        except RequestsError as exc:
            wait = delay * (idx_config.retry_backoff ** attempt)
            log.warning("🔌  Koneksi gagal (attempt %d/%d): %s — retry %.1fs",
                        attempt, idx_config.max_retries, exc, wait)
            time.sleep(wait)

    raise RuntimeError(f"❌  Gagal GET {url} setelah {idx_config.max_retries} attempt")


# ─────────────────────────────────────────────────────────────
# 1. Ambil daftar emiten
# ─────────────────────────────────────────────────────────────
def fetch_company_list() -> list[dict]:
    """
    Mengambil daftar semua emiten terdaftar di IDX.

    Returns:
        list[dict] dengan field: ticker, company_name, sector, sub_sector
    """
    log.info("📋  Mengambil daftar emiten dari IDX…")
    try:
        data = _get_json(idx_config.company_list_url)
    except RuntimeError as exc:
        log.error("Gagal ambil daftar emiten: %s", exc)
        return []

    companies = []
    # IDX API mengembalikan {"data": [...], "totalData": N}
    raw_list = data.get("data", []) or data.get("Data", [])
    for item in raw_list:
        companies.append({
            "ticker":       (item.get("KodeEmiten") or item.get("StockCode", "")).strip().upper(),
            "company_name": (item.get("NamaEmiten") or item.get("Name", "")).strip(),
            "sector":       (item.get("Sektor")      or item.get("Sector", "")).strip(),
            "sub_sector":   (item.get("SubSektor")   or item.get("SubSector", "")).strip(),
        })

    log.info("✅  Ditemukan %d emiten terdaftar.", len(companies))
    return companies


# ─────────────────────────────────────────────────────────────
# 2. Ambil financial ratio semua emiten (screener IDX)
# ─────────────────────────────────────────────────────────────
def fetch_all_financial_ratios(page_size: int = 500) -> list[dict]:
    """
    Mengambil data financial ratio semua saham dari IDX Screener
    menggunakan pagination.

    Returns:
        list[dict] dengan rasio per emiten
    """
    log.info("📊  Mengambil financial ratio dari IDX Screener…")
    all_records: list[dict] = []
    index_from  = 0
    total_data  = None

    # Endpoint IDX Screener (sama dengan yang dipakai di previous conversation)
    screener_url = (
        "https://www.idx.co.id/primary/StockScreener/GetStockScreenerData"
    )

    while True:
        params = {
            "indexFrom": index_from,
            "pageSize":  page_size,
            "isLQ45":    "false",
        }
        try:
            raw = _get_json(screener_url, params=params)
        except RuntimeError as exc:
            log.error("❌  Gagal ambil screener (indexFrom=%d): %s", index_from, exc)
            break

        # Normalisasi key IDX yang berubah-ubah
        records = (
            raw.get("data")       or
            raw.get("Data")       or
            raw.get("Rows")       or
            []
        )
        if total_data is None:
            total_data = (
                raw.get("totalData") or
                raw.get("TotalData") or
                raw.get("Total")     or
                len(records)
            )
            log.info("   Total data tersedia: %s", total_data)

        if not records:
            log.info("   Tidak ada data lagi di indexFrom=%d", index_from)
            break

        all_records.extend(records)
        log.info("   Halaman indexFrom=%d → %d baris (total dikumpulkan: %d)",
                 index_from, len(records), len(all_records))

        index_from += page_size
        if index_from >= (total_data or 0):
            break

        time.sleep(idx_config.request_delay_seconds)

    log.info("✅  Total %d baris ratio dikumpulkan.", len(all_records))
    return all_records


# ─────────────────────────────────────────────────────────────
# 3. Normalkan data mentah → struktur standar
# ─────────────────────────────────────────────────────────────
def _safe_float(value, default=None) -> Optional[float]:
    """Konversi ke float, kembalikan default jika gagal."""
    if value is None or value == "" or value == "-":
        return default
    try:
        return float(str(value).replace(",", "").replace("%", "").strip())
    except (ValueError, TypeError):
        return default


def _safe_int(value, default=None) -> Optional[int]:
    """Konversi ke int, kembalikan default jika gagal."""
    if value is None or value == "" or value == "-":
        return default
    try:
        return int(float(str(value).replace(",", "").strip()))
    except (ValueError, TypeError):
        return default


def normalize_ratio_record(raw: dict) -> dict:
    """
    Normalisasi satu baris data mentah dari IDX API ke skema standar.

    IDX API memiliki beberapa varian key name (camelCase vs PascalCase),
    sehingga kita coba semua kemungkinan.
    """
    def pick(*keys):
        """Ambil nilai pertama yang ditemukan dari raw dict."""
        for k in keys:
            if k in raw and raw[k] is not None:
                return raw[k]
        return None

    now_utc = datetime.now(timezone.utc)

    return {
        # ── Identitas ────────────────────────────────────
        "ticker":       (pick("stockCode", "StockCode", "KodeEmiten", "Kode") or "").strip().upper(),
        "company_name": (pick("stockName",  "StockName",  "NamaEmiten", "Nama") or "").strip(),
        "sector":       (pick("sectorName", "SectorName", "Sektor", "sector") or "").strip(),
        "sub_sector":   (pick("subSector",  "SubSector",  "SubSektor") or "").strip(),

        # ── Rasio Valuasi ────────────────────────────────
        "per": _safe_float(pick(
            "per", "PER", "priceToEarning", "PE_Ratio",
        )),
        "pbv": _safe_float(pick(
            "pbv", "PBV", "priceToBook", "PB_Ratio",
        )),

        # ── Rasio Profitabilitas ─────────────────────────
        "roe": _safe_float(pick(
            "roe", "ROE", "returnOnEquity",
        )),
        "npm": _safe_float(pick(
            "netProfitMargin", "NetProfitMargin", "npm", "NPM",
        )),

        # ── Rasio Solvabilitas ───────────────────────────
        "der": _safe_float(pick(
            "der", "DER", "debtToEquity",
        )),

        # ── Data Pasar ───────────────────────────────────
        "market_cap":  _safe_int(pick(
            "marketCap", "MarketCap", "kapitalisasiPasar",
        )),
        "close_price": _safe_float(pick(
            "lastPrice", "LastPrice", "closePrice", "HargaTerakhir",
        )),
        "volume":      _safe_int(pick(
            "volume", "Volume", "tradingVolume",
        )),

        # ── Metadata ─────────────────────────────────────
        "data_date":   pick("reportDate", "ReportDate", "periode", "Periode"),
        "last_updated": now_utc,
        "source":       "idx-bei",
    }


# ─────────────────────────────────────────────────────────────
# 4. Pipeline utama — ambil + normalkan semua data
# ─────────────────────────────────────────────────────────────
def scrape_all_fundamentals() -> list[dict]:
    """
    Pipeline lengkap: ambil daftar emiten + financial ratio,
    gabungkan, normalisasi, dan kembalikan list siap masuk DB.

    Returns:
        list[dict] — satu dict per emiten
    """
    log.info("🚀  Memulai scraping fundamental IDX…")
    start = time.time()

    # Ambil daftar emiten (metadata: nama, sektor)
    companies = fetch_company_list()
    company_map = {c["ticker"]: c for c in companies}

    # Ambil semua financial ratio
    raw_ratios = fetch_all_financial_ratios()

    # Normalkan & gabungkan info perusahaan
    results: list[dict] = []
    for raw in raw_ratios:
        record = normalize_ratio_record(raw)

        # Enrichment dari company list jika ada data lebih lengkap
        ticker = record["ticker"]
        if ticker in company_map:
            meta = company_map[ticker]
            record["company_name"] = record["company_name"] or meta["company_name"]
            record["sector"]       = record["sector"]       or meta["sector"]
            record["sub_sector"]   = record["sub_sector"]   or meta["sub_sector"]

        # Lewati baris tanpa ticker
        if not ticker:
            continue

        results.append(record)

    elapsed = time.time() - start
    log.info("✅  Scraping selesai: %d emiten dalam %.1fs", len(results), elapsed)
    return results, elapsed
