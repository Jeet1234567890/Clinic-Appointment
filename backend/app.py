import secrets

from flask import Flask, jsonify, request
from flask_cors import CORS
from mysql.connector import Error as MySQLError
from werkzeug.security import check_password_hash, generate_password_hash

from db import init_db, init_pool
from models import Appointment, User

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})


def seed_doctors():
    """Create 3 dummy doctors if they do not already exist."""
    doctors = [
        {
            "name": "Dr. Sarah Johnson",
            "email": "sarah.johnson@clinic.com",
            "password": generate_password_hash("doctor123"),
            "role": "doctor",
        },
        {
            "name": "Dr. Michael Chen",
            "email": "michael.chen@clinic.com",
            "password": generate_password_hash("doctor123"),
            "role": "doctor",
        },
        {
            "name": "Dr. Emily Davis",
            "email": "emily.davis@clinic.com",
            "password": generate_password_hash("doctor123"),
            "role": "doctor",
        },
    ]

    for doctor_data in doctors:
        if not User.find_by_email(doctor_data["email"]):
            User.create(**doctor_data)


@app.route("/api/register", methods=["POST"])
def register():
    data = request.get_json(silent=True) or {}

    name = data.get("name")
    email = data.get("email")
    password = data.get("password")
    role = data.get("role", "patient")

    if not name or not email or not password:
        return jsonify({"error": "name, email, and password are required"}), 400

    if role not in ("patient", "doctor"):
        return jsonify({"error": "role must be 'patient' or 'doctor'"}), 400

    if User.find_by_email(email):
        return jsonify({"error": "Email already registered"}), 409

    user = User.create(
        name=name,
        email=email,
        password=generate_password_hash(password),
        role=role,
    )

    token = secrets.token_hex(16)

    return jsonify(
        {
            "token": token,
            "user_id": user.id,
            "user": user.to_dict(),
        }
    ), 201


@app.route("/api/login", methods=["POST"])
def login():
    data = request.get_json(silent=True) or {}

    email = data.get("email")
    password = data.get("password")

    if not email or not password:
        return jsonify({"error": "email and password are required"}), 400

    user = User.find_by_email(email)
    if not user or not check_password_hash(user.password, password):
        return jsonify({"error": "Invalid email or password"}), 401

    token = secrets.token_hex(16)

    return jsonify(
        {
            "token": token,
            "user_id": user.id,
            "user": user.to_dict(),
        }
    ), 200


@app.route("/api/doctors", methods=["GET"])
def get_doctors():
    doctors = User.find_all_by_role("doctor")
    return jsonify([doctor.to_dict() for doctor in doctors]), 200


@app.route("/api/book", methods=["POST"])
def book_appointment():
    data = request.get_json(silent=True) or {}

    doctor_id = data.get("doctor_id")
    patient_id = data.get("patient_id")
    date = data.get("date")
    time = data.get("time")

    if doctor_id is None or patient_id is None or not date or not time:
        return jsonify(
            {"error": "doctor_id, patient_id, date, and time are required"}
        ), 400

    doctor = User.find_by_id_and_role(doctor_id, "doctor")
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    patient = User.find_by_id_and_role(patient_id, "patient")
    if not patient:
        return jsonify({"error": "Patient not found"}), 404

    if Appointment.find_by_slot(doctor_id, date, time):
        return jsonify({"error": "Slot booked"}), 409

    try:
        appointment = Appointment.create(
            doctor_id=doctor_id,
            patient_id=patient_id,
            date=date,
            time=time,
        )
    except MySQLError as exc:
        if exc.errno == 1062:
            return jsonify({"error": "Slot booked"}), 409
        raise

    return jsonify(
        {"message": "Appointment booked", "appointment": appointment.to_dict()}
    ), 201


init_db()
seed_doctors()


if __name__ == "__main__":
    app.run(debug=True, port=5000)
