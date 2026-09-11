import os

from dotenv import load_dotenv


load_dotenv()


DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL bulunamadı. "
        "backend klasöründeki .env dosyasını kontrol edin."
    )


SECRET_KEY = os.getenv(
    "SECRET_KEY",
    "business-system-super-secret-key-2026",
)

ALGORITHM = "HS256"

ACCESS_TOKEN_EXPIRE_MINUTES = 60