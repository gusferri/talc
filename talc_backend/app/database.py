import os
from dotenv import load_dotenv

load_dotenv()
import mysql.connector

def get_connection():
    print("🧪 DB_HOST:", os.getenv("DB_HOST"))
    print("🧪 DB_USER:", os.getenv("DB_USER"))
    print("🧪 DB_PASS:", os.getenv("DB_PASS"))
    print("🧪 DB_NAME:", os.getenv("DB_NAME"))

    return mysql.connector.connect(
        host=os.getenv("DB_HOST"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASS"),
        database=os.getenv("DB_NAME")
    )