"""
config.py — Konfigurasi terpusat untuk StockPulse Fundamental Scraper.

Semua nilai sensitif (credentials) dibaca dari environment variable
atau file .env agar tidak hardcode di source code.
"""

import os
from dataclasses import dataclass, field
from dotenv import load_dotenv

load_dotenv()  # baca .env di direktori yang sama

# ─────────────────────────────────────────────────────────────
# Database PostgreSQL
# ─────────────────────────────────────────────────────────────
@dataclass
class DBConfig:
    host:     str = field(default_factory=lambda: os.getenv("PG_HOST", "localhost"))
    port:     int = field(default_factory=lambda: int(os.getenv("PG_PORT", "5432")))
    dbname:   str = field(default_factory=lambda: os.getenv("PG_DBNAME", "stockpulse"))
    user:     str = field(default_factory=lambda: os.getenv("PG_USER", "postgres"))
    password: str = field(default_factory=lambda: os.getenv("PG_PASSWORD", ""))

    @property
    def sqlalchemy_url(self) -> str:
        return (
            f"postgresql+psycopg2://{self.user}:{self.password}"
            f"@{self.host}:{self.port}/{self.dbname}"
        )

    @property
    def psycopg2_dsn(self) -> dict:
        return {
            "host":     self.host,
            "port":     self.port,
            "dbname":   self.dbname,
            "user":     self.user,
            "password": self.password,
        }


# ─────────────────────────────────────────────────────────────
# IDX API / Scraper
# ─────────────────────────────────────────────────────────────
@dataclass
class IDXConfig:
    # Endpoint resmi IDX untuk financial ratio
    financial_ratio_url: str = (
        "https://www.idx.co.id/primary/StockScreener/GetFinancialData"
    )
    company_list_url: str = (
        "https://www.idx.co.id/primary/ListedCompany/GetListedCompanies"
        "?indexFrom=0&pageSize=9999&keyword="
    )

    # Delay antar request (detik) — hindari rate-limit IDX
    request_delay_seconds: float = field(
        default_factory=lambda: float(os.getenv("SCRAPE_DELAY", "1.5"))
    )
    # Timeout per request (detik)
    request_timeout: int = field(
        default_factory=lambda: int(os.getenv("SCRAPE_TIMEOUT", "30"))
    )
    # Jumlah retry jika request gagal
    max_retries: int = 3
    retry_backoff: float = 2.0   # multiplier delay antar retry


# ─────────────────────────────────────────────────────────────
# Logging
# ─────────────────────────────────────────────────────────────
LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")
LOG_FILE:  str = os.getenv("LOG_FILE", "scraper.log")


# ─────────────────────────────────────────────────────────────
# Instance siap pakai
# ─────────────────────────────────────────────────────────────
db_config  = DBConfig()
idx_config = IDXConfig()
