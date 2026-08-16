import os
from dotenv import load_dotenv
import mysql.connector
from mysql.connector import pooling

load_dotenv()
DB_CONFIG = {
    "host": os.getenv("MYSQL_HOST", "localhost"),
    "port": int(os.getenv("MYSQL_PORT", "3306")),
    "user": os.getenv("MYSQL_USER", "root"),
    "password": os.getenv("MYSQL_PASSWORD", ""),
    "database": os.getenv("MYSQL_DATABASE", "clinic"),
}

pool = None


def init_pool():
    global pool
    pool = pooling.MySQLConnectionPool(
        pool_name="clinic_pool",
        pool_size=5,
        **DB_CONFIG,
    )


def get_connection():
    if pool is None:
        raise RuntimeError("Database pool is not initialized")
    return pool.get_connection()


def init_db():
    database = DB_CONFIG["database"]
    bootstrap_config = {k: v for k, v in DB_CONFIG.items() if k != "database"}

    conn = mysql.connector.connect(**bootstrap_config)
    cursor = conn.cursor()
    cursor.execute(
        f"CREATE DATABASE IF NOT EXISTS `{database}` "
        "DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"
    )
    cursor.close()
    conn.close()

    if pool is None:
        init_pool()

    conn = get_connection()
    cursor = conn.cursor()

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(120) NOT NULL UNIQUE,
            password VARCHAR(256) NOT NULL,
            role VARCHAR(20) NOT NULL
        )
        """
    )

    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS appointments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            doctor_id INT NOT NULL,
            patient_id INT NOT NULL,
            `date` VARCHAR(20) NOT NULL,
            `time` VARCHAR(20) NOT NULL,
            UNIQUE KEY uq_doctor_date_time (doctor_id, `date`, `time`),
            FOREIGN KEY (doctor_id) REFERENCES users(id),
            FOREIGN KEY (patient_id) REFERENCES users(id)
        )
        """
    )

    conn.commit()
    cursor.close()
    conn.close()
