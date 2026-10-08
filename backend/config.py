import os
from dotenv import load_dotenv

load_dotenv()

# Supabase URL normalization
raw_supabase_url = os.getenv("SUPABASE_URL", "")
if raw_supabase_url:
    SUPABASE_URL = raw_supabase_url.replace("/rest/v1/", "").rstrip("/")
else:
    SUPABASE_URL = ""

SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")

# JWT Configuration
JWT_SECRET = os.getenv("JWT_SECRET", "campos_campus_os_default_secret_key_2026")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours

# Database Configuration
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, os.getenv("DB_PATH", "campos.db"))