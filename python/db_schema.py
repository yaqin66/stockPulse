"""
db_schema.py — Manajemen skema PostgreSQL untuk data fundamental saham IDX.

Menjalankan file ini langsung akan membuat / memperbarui tabel di database:
    python db_schema.py

Menggunakan SQLAlchemy Core (deklaratif ORM ringan) sehingga bisa
dipakai bersama script scraper maupun ekspor ke Pandas DataFrame.
"""

import logging
from datetime import datetime, timezone

from sqlalchemy import (
    BigInteger,
    Column,
    DateTime,
    Float,
    Index,
    MetaData,
    Numeric,
    String,
    Table,
    Text,
    UniqueConstraint,
    create_engine,
    text,
)
from sqlalchemy.exc import SQLAlchemyError

from config import db_config, LOG_LEVEL, LOG_FILE

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
log = logging.getLogger("db_schema")

# ─────────────────────────────────────────────────────────────
# SQLAlchemy metadata & engine
# ─────────────────────────────────────────────────────────────
metadata = MetaData()

# ─────────────────────────────────────────────────────────────
# Tabel 1: stock_fundamentals
# Menyimpan rasio keuangan per emiten, di-upsert setiap refresh.
# ─────────────────────────────────────────────────────────────
stock_fundamentals = Table(
    "stock_fundamentals",
    metadata,
    # ── Identitas ──────────────────────────────────────────
    Column("id",            BigInteger,   primary_key=True, autoincrement=True),
    Column("ticker",        String(10),   nullable=False,
           comment="Kode emiten IDX, contoh: BBCA, TLKM"),
    Column("company_name",  Text,         nullable=True,
           comment="Nama lengkap perusahaan"),
    Column("sector",        String(128),  nullable=True,
           comment="Sektor industri IDX"),
    Column("sub_sector",    String(128),  nullable=True),

    # ── Rasio Valuasi ──────────────────────────────────────
    Column("per",           Numeric(12, 4), nullable=True,
           comment="Price-to-Earnings Ratio"),
    Column("pbv",           Numeric(12, 4), nullable=True,
           comment="Price-to-Book Value Ratio"),

    # ── Rasio Profitabilitas ───────────────────────────────
    Column("roe",           Numeric(12, 4), nullable=True,
           comment="Return on Equity (%)"),
    Column("npm",           Numeric(12, 4), nullable=True,
           comment="Net Profit Margin (%)"),

    # ── Rasio Solvabilitas ────────────────────────────────
    Column("der",           Numeric(12, 4), nullable=True,
           comment="Debt-to-Equity Ratio"),

    # ── Pasar ────────────────────────────────────────────
    Column("market_cap",    BigInteger,   nullable=True,
           comment="Market Capitalization dalam Rupiah"),
    Column("close_price",   Numeric(14, 2), nullable=True,
           comment="Harga penutupan terakhir"),
    Column("volume",        BigInteger,   nullable=True,
           comment="Volume perdagangan terakhir"),

    # ── Metadata ──────────────────────────────────────────
    Column("data_date",     String(20),   nullable=True,
           comment="Tanggal laporan keuangan (YYYY-MM-DD)"),
    Column("last_updated",  DateTime(timezone=True), nullable=False,
           default=lambda: datetime.now(timezone.utc),
           comment="Waktu terakhir data di-refresh"),
    Column("source",        String(64),   nullable=True,
           default="idx-bei",
           comment="Sumber data"),

    # ── Constraint & Index ────────────────────────────────
    # Satu baris unik per (ticker, tanggal laporan)
    UniqueConstraint("ticker", "data_date", name="uq_ticker_date"),
)

# Index untuk query cepat berdasarkan ticker
Index("ix_fund_ticker",      stock_fundamentals.c.ticker)
Index("ix_fund_last_updated", stock_fundamentals.c.last_updated)
Index("ix_fund_per",         stock_fundamentals.c.per)
Index("ix_fund_market_cap",  stock_fundamentals.c.market_cap)

# ─────────────────────────────────────────────────────────────
# Tabel 2: scrape_logs
# Audit trail setiap sesi scraping (berhasil / gagal).
# ─────────────────────────────────────────────────────────────
scrape_logs = Table(
    "scrape_logs",
    metadata,
    Column("id",             BigInteger, primary_key=True, autoincrement=True),
    Column("run_at",         DateTime(timezone=True), nullable=False,
           default=lambda: datetime.now(timezone.utc)),
    Column("total_tickers",  BigInteger, nullable=True),
    Column("success_count",  BigInteger, nullable=True),
    Column("failed_count",   BigInteger, nullable=True),
    Column("duration_sec",   Float,      nullable=True),
    Column("notes",          Text,       nullable=True),
)


# ─────────────────────────────────────────────────────────────
# DDL helpers
# ─────────────────────────────────────────────────────────────
def get_engine(echo: bool = False):
    """Buat koneksi engine SQLAlchemy ke PostgreSQL."""
    url = db_config.sqlalchemy_url
    log.info("Menghubungkan ke PostgreSQL: %s:%s/%s",
             db_config.host, db_config.port, db_config.dbname)
    try:
        engine = create_engine(url, echo=echo, pool_pre_ping=True,
                               connect_args={"connect_timeout": 10})
        return engine
    except SQLAlchemyError as exc:
        log.critical("❌  Gagal membuat engine: %s", exc)
        raise


def create_tables(engine=None, drop_first: bool = False):
    """
    Buat semua tabel di database. Lewatkan engine=None untuk
    menggunakan konfigurasi default dari config.py.

    Args:
        engine     : SQLAlchemy engine (opsional)
        drop_first : Jika True, DROP TABLE dulu sebelum CREATE
                     — ⚠️ hati-hati di production!
    """
    if engine is None:
        engine = get_engine()

    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))   # test koneksi
        log.info("✅  Koneksi database OK")
    except SQLAlchemyError as exc:
        log.critical("❌  Tidak bisa terhubung ke database: %s", exc)
        raise

    if drop_first:
        log.warning("⚠️   DROP TABLE diaktifkan — menghapus tabel lama…")
        metadata.drop_all(engine)

    log.info("📐  Membuat tabel (jika belum ada)…")
    metadata.create_all(engine)
    log.info("✅  Skema tabel berhasil dibuat / diverifikasi.")
    return engine


# ─────────────────────────────────────────────────────────────
# Entry point — jalankan langsung untuk setup DB
# ─────────────────────────────────────────────────────────────
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Setup skema database StockPulse")
    parser.add_argument(
        "--drop", action="store_true",
        help="DROP tabel lama sebelum CREATE (⚠️ hapus semua data!)"
    )
    parser.add_argument(
        "--echo", action="store_true",
        help="Tampilkan SQL query ke console"
    )
    args = parser.parse_args()

    eng = create_tables(drop_first=args.drop, engine=get_engine(echo=args.echo))

    # Tampilkan ringkasan tabel yang ada
    from sqlalchemy import inspect
    inspector = inspect(eng)
    tables = inspector.get_table_names()
    log.info("📋  Tabel di database: %s", ", ".join(tables))
