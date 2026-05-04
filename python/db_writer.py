"""
db_writer.py — Menulis data fundamental ke PostgreSQL menggunakan SQLAlchemy.

Mendukung dua strategi:
  • UPSERT  : INSERT ... ON CONFLICT DO UPDATE  (default, aman untuk re-run)
  • INSERT  : INSERT biasa (akan error jika duplikat)

Juga menyimpan audit log ke tabel scrape_logs.
"""

import logging
from datetime import datetime, timezone
from typing import Optional

from sqlalchemy import text
from sqlalchemy.exc import IntegrityError, OperationalError, SQLAlchemyError

from config import LOG_LEVEL, LOG_FILE
from db_schema import (
    create_tables,
    get_engine,
    scrape_logs,
    stock_fundamentals,
)

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
log = logging.getLogger("db_writer")


# ─────────────────────────────────────────────────────────────
# Helper: test koneksi database
# ─────────────────────────────────────────────────────────────
def test_connection(engine=None) -> bool:
    """
    Coba koneksi ke PostgreSQL.

    Returns:
        True jika berhasil, False jika gagal.
    """
    if engine is None:
        try:
            engine = get_engine()
        except Exception:
            return False
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        log.info("✅  Koneksi database OK")
        return True
    except OperationalError as exc:
        log.error("❌  Koneksi database gagal: %s", exc)
        return False


# ─────────────────────────────────────────────────────────────
# UPSERT — INSERT ... ON CONFLICT DO UPDATE
# ─────────────────────────────────────────────────────────────
_UPSERT_SQL = text("""
INSERT INTO stock_fundamentals (
    ticker, company_name, sector, sub_sector,
    per, pbv, roe, npm, der,
    market_cap, close_price, volume,
    data_date, last_updated, source
)
VALUES (
    :ticker, :company_name, :sector, :sub_sector,
    :per, :pbv, :roe, :npm, :der,
    :market_cap, :close_price, :volume,
    :data_date, :last_updated, :source
)
ON CONFLICT (ticker, data_date)
DO UPDATE SET
    company_name  = EXCLUDED.company_name,
    sector        = EXCLUDED.sector,
    sub_sector    = EXCLUDED.sub_sector,
    per           = EXCLUDED.per,
    pbv           = EXCLUDED.pbv,
    roe           = EXCLUDED.roe,
    npm           = EXCLUDED.npm,
    der           = EXCLUDED.der,
    market_cap    = EXCLUDED.market_cap,
    close_price   = EXCLUDED.close_price,
    volume        = EXCLUDED.volume,
    last_updated  = EXCLUDED.last_updated,
    source        = EXCLUDED.source
""")


def upsert_fundamentals(
    records: list[dict],
    engine=None,
    batch_size: int = 200,
) -> tuple[int, int]:
    """
    UPSERT (insert-or-update) sejumlah record fundamental ke PostgreSQL.

    Proses dalam batch untuk efisiensi memory dan mengurangi lock time.

    Args:
        records    : list[dict] dari idx_scraper.scrape_all_fundamentals()
        engine     : SQLAlchemy engine (opsional, buat baru jika None)
        batch_size : jumlah baris per transaksi

    Returns:
        (success_count, failed_count) — jumlah baris berhasil & gagal
    """
    if not records:
        log.warning("⚠️   Tidak ada record untuk di-upsert.")
        return 0, 0

    if engine is None:
        engine = get_engine()

    success_count = 0
    failed_count  = 0
    total         = len(records)

    log.info("💾  Memulai upsert %d record ke PostgreSQL…", total)

    for batch_start in range(0, total, batch_size):
        batch = records[batch_start : batch_start + batch_size]
        batch_num = batch_start // batch_size + 1

        # Pastikan data_date tidak None (gunakan tanggal hari ini jika kosong)
        today_str = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        for rec in batch:
            if not rec.get("data_date"):
                rec["data_date"] = today_str
            if not rec.get("last_updated"):
                rec["last_updated"] = datetime.now(timezone.utc)

        try:
            with engine.begin() as conn:   # auto-commit / rollback
                conn.execute(_UPSERT_SQL, batch)
            success_count += len(batch)
            log.info("   Batch %d: ✅  %d record berhasil (total: %d/%d)",
                     batch_num, len(batch), success_count, total)

        except IntegrityError as exc:
            failed_count += len(batch)
            log.error("   Batch %d: ❌  IntegrityError — %s", batch_num, exc.orig)

        except SQLAlchemyError as exc:
            failed_count += len(batch)
            log.error("   Batch %d: ❌  DB Error — %s", batch_num, exc)

        except Exception as exc:
            failed_count += len(batch)
            log.exception("   Batch %d: ❌  Unexpected error — %s", batch_num, exc)

    log.info("📦  Upsert selesai: %d berhasil, %d gagal.", success_count, failed_count)
    return success_count, failed_count


# ─────────────────────────────────────────────────────────────
# Simpan log sesi scraping
# ─────────────────────────────────────────────────────────────
def save_scrape_log(
    engine,
    total_tickers: int,
    success_count: int,
    failed_count:  int,
    duration_sec:  float,
    notes: Optional[str] = None,
):
    """Simpan audit log ke tabel scrape_logs."""
    try:
        with engine.begin() as conn:
            conn.execute(
                scrape_logs.insert(),
                {
                    "run_at":        datetime.now(timezone.utc),
                    "total_tickers": total_tickers,
                    "success_count": success_count,
                    "failed_count":  failed_count,
                    "duration_sec":  round(duration_sec, 2),
                    "notes":         notes,
                },
            )
        log.info("📝  Log sesi scraping tersimpan.")
    except SQLAlchemyError as exc:
        log.warning("⚠️   Gagal simpan scrape log: %s", exc)


# ─────────────────────────────────────────────────────────────
# Entry point — test upsert dengan data dummy
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import json, sys

    print("\n🧪  Mode test db_writer.py")
    eng = get_engine()

    if not test_connection(eng):
        sys.exit(1)

    # Buat tabel jika belum ada
    create_tables(engine=eng)

    # Contoh data dummy untuk verifikasi
    sample = [
        {
            "ticker":       "BBCA",
            "company_name": "Bank Central Asia Tbk",
            "sector":       "Finance",
            "sub_sector":   "Bank",
            "per":          25.4,
            "pbv":          5.1,
            "roe":          18.9,
            "npm":          32.5,
            "der":          0.8,
            "market_cap":   1_050_000_000_000,
            "close_price":  9600.0,
            "volume":       12_000_000,
            "data_date":    "2024-12-31",
            "last_updated": datetime.now(timezone.utc),
            "source":       "test",
        },
        {
            "ticker":       "TLKM",
            "company_name": "Telekomunikasi Indonesia Tbk",
            "sector":       "Infrastructure",
            "sub_sector":   "Telecommunications",
            "per":          18.2,
            "pbv":          3.1,
            "roe":          17.1,
            "npm":          15.8,
            "der":          1.2,
            "market_cap":   350_000_000_000,
            "close_price":  3760.0,
            "volume":       25_000_000,
            "data_date":    "2024-12-31",
            "last_updated": datetime.now(timezone.utc),
            "source":       "test",
        },
    ]

    ok, fail = upsert_fundamentals(sample, engine=eng)
    print(f"\n✅  Upsert selesai: {ok} berhasil, {fail} gagal.")
    print("   Cek tabel stock_fundamentals di PostgreSQL Anda.")
