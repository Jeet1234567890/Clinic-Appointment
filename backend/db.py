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

    # Create users table with all required columns
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            email VARCHAR(120) NOT NULL UNIQUE,
            password VARCHAR(256) NOT NULL,
            role VARCHAR(20) NOT NULL,
            phone VARCHAR(20),
            is_verified BOOLEAN DEFAULT FALSE
        )
        """
    )

   
    # Create appointments table with status column
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS appointments (
            id INT AUTO_INCREMENT PRIMARY KEY,
            doctor_id INT NOT NULL,
            patient_id INT NOT NULL,
            `date` VARCHAR(20) NOT NULL,
            `time` VARCHAR(20) NOT NULL,
            status VARCHAR(20) DEFAULT 'scheduled',
            UNIQUE KEY uq_doctor_date_time (doctor_id, `date`, `time`),
            FOREIGN KEY (doctor_id) REFERENCES users(id),
            FOREIGN KEY (patient_id) REFERENCES users(id)
        )
        """
    )

   

    # Create otp_verifications table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS otp_verifications (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            email_otp VARCHAR(6),
            phone_otp VARCHAR(6),
            expires_at DATETIME,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_user_id (user_id)
        )
        """
    )

    # Create doctor_profiles table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS doctor_profiles (
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            specialty VARCHAR(120) NOT NULL,
            available_from TIME,
            available_to TIME,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY uq_user_id (user_id)
        )
        """
    )

    cursor.execute(
        """
        ALTER TABLE doctor_profiles
        MODIFY COLUMN available_from TIME,
        MODIFY COLUMN available_to TIME
        """
    )

    # Create doctor_unavailability table
    cursor.execute(
        """
        CREATE TABLE IF NOT EXISTS doctor_unavailability (
            id INT AUTO_INCREMENT PRIMARY KEY,
            doctor_id INT NOT NULL,
            unavailable_date DATE NOT NULL,
            FOREIGN KEY (doctor_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_doctor_id (doctor_id),
            UNIQUE KEY uq_doctor_date (doctor_id, unavailable_date)
        )
        """
    )

    conn.commit()
    cursor.close()
    conn.close()
