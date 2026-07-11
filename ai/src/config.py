import os
from dotenv import load_dotenv

# Load .env file
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://admin:1234567@localhost:5432/recommendation_db")
CATALOG_DATABASE_URL = os.getenv("CATALOG_DATABASE_URL", "postgresql://admin:1234567@localhost:5432/catalog_db")
RABBITMQ_URL = os.getenv("RABBITMQ_URL", "amqp://guest:guest@localhost:5672/")
