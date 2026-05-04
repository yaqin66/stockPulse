"""
scrape_fundamentals.py — Entry point utama pipeline scraping fundamental IDX.

Urutan eksekusi:
  1. Verifikasi koneksi PostgreSQL
  2. Pastikan skema tabel tersedia (auto-create)
  3. Scrape data fundamental dari IDX (PER, PBV, ROE, DER, NPM, Market Cap)
  4. Upsert ke PostgreSQL dalam batch
  5. Simpan audit log

Cara pakai:
    # Install dependency dulu:
    pip install curl_cffi sqlalchemy psycopg2-binary python-dotenv pandas

    # Setup env (atau buat file .env):
    $env:PG_HOST="localhost"; $env:PG_DBNAME="stockpulse"; $env:PG_USER="postgres"; $env:PG_PASSWORD="secret"

    # Jalankan:
    python scrape_fundamentals.py

    # Opsi tambahan:
    python scrape_fundamentals.py --dry-run          # scrape saja, tidak insert ke DB
    python scrape_fundamentals.py --export-csv        # simpan juga ke CSV
    python scrape_fundamentals.py --tickers BBCA TLKM # filter ticker tertentu
"""

import argparse
import logging
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

from config import db_config, LOG_FILE, LOG_LEVEL
from db_schema import create_tables, get_engine
from db_writer import save_scrape_log, test_connection, upsert_fundamentals
from idx_scraper import scrape_all_fundamentals

# ─────────────────────────────────────────────────────────────
# Logger utama
# ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL),
    format="%(asctime)s  %(levelname)-8s  %(name)s — %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
    handlers=[
        logging.StreamHandler(sys.stdout),
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
    ],
)
log = logging.getLogger("main")


# ─────────────────────────────────────────────────────────────
# Argumen CLI
# ─────────────────────────────────────────────────────────────
def parse_args():
    p = argparse.ArgumentParser(
        description="Scraper fundamental saham IDX → PostgreSQL",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    p.add_argument(
        "--dry-run",
        action="store_true",
        help="Scrape & normalkan data tetapi JANGAN insert ke database",
    )
    p.add_argument(
        "--export-csv",
        action="store_true",
        help="Ekspor hasil scraping ke file CSV di direktori yang sama",
    )
    p.add_argument(
        "--tickers",
        nargs="+",
        metavar="TICKER",
        help="Filter hanya ticker tertentu, contoh: --tickers BBCA TLKM GOTO",
    )
    p.add_argument(
        "--batch-size",
        type=int,
        default=200,
        help="Jumlah baris per batch upsert (default: 200)",
    )
    p.add_argument(
        "--setup-db-only",
        action="store_true",
        help="Hanya buat skema tabel lalu keluar (tanpa scraping)",
    )
    return p.parse_args()


# ─────────────────────────────────────────────────────────────
# Export CSV helper
# ─────────────────────────────────────────────────────────────
def export_csv(records: list[dict], output_dir: Path = Path(".")):
    """Ekspor records ke CSV menggunakan pandas."""
    try:
        import pandas as pd
        ts = datetime.now().strftime("%Y%m%d_%H%M%S")
        out_file = output_dir / f"idx_fundamentals_{ts}.csv"
        df = pd.DataFrame(records)
        df.to_csv(out_file, index=False, encoding="utf-8-sig")
        log.info("📄  Data diekspor ke: %s (%d baris)", out_file, len(df))
        return out_file
    except ImportError:
        log.warning("⚠️   pandas tidak tersedia, skip ekspor CSV.")
        return None
    except Exception as exc:
        log.error("❌  Gagal ekspor CSV: %s", exc)
        return None


# ─────────────────────────────────────────────────────────────
# Banner
# ─────────────────────────────────────────────────────────────
def print_banner():
    print("""
╔══════════════════════════════════════════════════════════╗
║    StockPulse — IDX Fundamental Scraper                  ║
║    Data: PER, PBV, ROE, DER, NPM, Market Cap             ║
║    Sumber: IDX / Bursa Efek Indonesia                    ║
╚══════════════════════════════════════════════════════════╝
""")


# ─────────────────────────────────────────────────────────────
# Pipeline utama
# ─────────────────────────────────────────────────────────────
def main():
    args = parse_args()
    print_banner()

    pipeline_start = time.time()
    now_str = datetime.now(timezone.utc).isoformat()
    log.info("▶️   Pipeline dimulai — %s", now_str)

    # ── STEP 1: Koneksi & setup database ─────────────────────
    engine = None
    if not args.dry_run:
        log.info("🔌  Menghubungkan ke PostgreSQL (%s:%s/%s)…",
                 db_config.host, db_config.port, db_config.dbname)
        try:
            engine = get_engine()
        except Exception as exc:
            log.critical("❌  Tidak bisa membuat engine DB: %s", exc)
            sys.exit(1)

        if not test_connection(engine):
            log.critical(
                "❌  Koneksi PostgreSQL gagal!\n"
                "   Pastikan:\n"
                "   • PostgreSQL berjalan\n"
                "   • Credential di .env sudah benar\n"
                "   • Database '%s' sudah dibuat (CREATE DATABASE %s;)",
                db_config.dbname, db_config.dbname,
            )
            sys.exit(1)

        # Auto-create tabel
        try:
            create_tables(engine=engine)
        except Exception as exc:
            log.critical("❌  Gagal membuat tabel: %s", exc)
            sys.exit(1)

    if args.setup_db_only:
        log.info("✅  Skema database berhasil dibuat. Selesai (--setup-db-only).")
        return

    # ── STEP 2: Scraping ─────────────────────────────────────
    log.info("🌐  Memulai scraping data fundamental IDX…")
    try:
        records, scrape_elapsed = scrape_all_fundamentals()
    except Exception as exc:
        log.critical("❌  Scraping gagal total: %s", exc)
        if engine:
            save_scrape_log(engine, 0, 0, 0, 0, notes=f"Scraping crash: {exc}")
        sys.exit(1)

    if not records:
        log.warning("⚠️   Tidak ada data yang berhasil di-scrape. Pipeline berhenti.")
        sys.exit(0)

    # ── STEP 3: Filter ticker (opsional) ──────────────────────
    if args.tickers:
        filter_set = {t.upper() for t in args.tickers}
        records = [r for r in records if r.get("ticker") in filter_set]
        log.info("🔍  Filter ticker aktif — %d record tersisa.", len(records))

    # ── STEP 4: Ekspor CSV (opsional) ─────────────────────────
    if args.export_csv:
        export_csv(records, output_dir=Path(__file__).parent)

    # ── STEP 5: Print ringkasan data (dry-run) ────────────────
    if args.dry_run:
        log.info("🔎  DRY-RUN aktif — menampilkan 5 sampel data:")
        for r in records[:5]:
            log.info(
                "   [%s] PER=%-6s  PBV=%-5s  ROE=%-6s  DER=%-5s  "
                "NPM=%-6s  MarketCap=%s",
                r.get("ticker", "?"),
                r.get("per"),
                r.get("pbv"),
                r.get("roe"),
                r.get("der"),
                r.get("npm"),
                f"{r.get('market_cap', 0):,}" if r.get("market_cap") else "N/A",
            )
        log.info("✅  Dry-run selesai — %d record siap untuk insert.", len(records))
        return

    # ── STEP 6: Upsert ke PostgreSQL ──────────────────────────
    log.info("💾  Menyimpan %d record ke PostgreSQL…", len(records))
    try:
        ok_count, fail_count = upsert_fundamentals(
            records, engine=engine, batch_size=args.batch_size
        )
    except Exception as exc:
        log.critical("❌  Upsert gagal total: %s", exc)
        fail_count = len(records)
        ok_count   = 0

    # ── STEP 7: Audit log ─────────────────────────────────────
    total_elapsed = time.time() - pipeline_start
    notes = None
    if fail_count > 0:
        notes = f"{fail_count} record gagal di-insert."

    save_scrape_log(
        engine,
        total_tickers=len(records),
        success_count=ok_count,
        failed_count=fail_count,
        duration_sec=total_elapsed,
        notes=notes,
    )

    # ── Ringkasan akhir ───────────────────────────────────────
    print("\n" + "─" * 60)
    print(f"  ✅  Pipeline selesai dalam {total_elapsed:.1f} detik")
    print(f"  📊  Total emiten diproses : {len(records)}")
    print(f"  💾  Berhasil di-upsert    : {ok_count}")
    print(f"  ❌  Gagal                 : {fail_count}")
    print("─" * 60 + "\n")

    if fail_count > 0:
        sys.exit(1)


if __name__ == "__main__":
    main()
