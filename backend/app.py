import random
import secrets
import os
from datetime import datetime, time as datetime_time, timedelta
from functools import wraps

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt,
    get_jwt_identity,
    jwt_required,
)
from mysql.connector import Error as MySQLError
from werkzeug.security import check_password_hash, generate_password_hash

from db import get_connection, init_db, init_pool
from models import Appointment, DoctorProfile, DoctorUnavailability, OTPVerification, User

app = Flask(__name__)
app.config["JWT_SECRET_KEY"] = os.getenv(
    "JWT_SECRET_KEY", "clinic-appointment-development-secret-key"
)
app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(hours=1)
CORS(app, resources={r"/api/*": {"origins": "*"}})

jwt = JWTManager(app)

def parse_appointment_time(value):
    """Convert the frontend's time label into a comparable time value."""
    for time_format in ("%I:%M %p", "%H:%M","%H:%M:%S"):
        try:
            return datetime.strptime(value.strip(), time_format).time()
        except (AttributeError, TypeError, ValueError):
            continue
    return None

def time_to_seconds(value):
    """Normalize MySQL TIME values and Python time values for comparison."""
    if isinstance(value, timedelta):
        return int(value.total_seconds())
    if isinstance(value, datetime_time):
        return value.hour * 3600 + value.minute * 60 + value.second
    if isinstance(value, str):
        parsed_time = parse_appointment_time(value)
        if parsed_time:
            return time_to_seconds(parsed_time)
    return None

def format_availability_time(value):
    seconds = time_to_seconds(value)
    if seconds is None:
        return None
    hours, remainder = divmod(seconds, 3600)
    minutes = remainder // 60
    return f"{hours:02d}:{minutes:02d}"

@jwt.additional_claims_loader
def add_claims_to_jwt(identity):
    """Inject role and is_verified into JWT claims."""
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT role, is_verified FROM users WHERE id = %s", (identity,))
        row = cursor.fetchone()
        if row:
            return {"role": row["role"], "is_verified": row["is_verified"]}
    finally:
        cursor.close()
        conn.close()
    
    return {"role": "patient", "is_verified": False}


def admin_required(fn):
    """Decorator to require admin role."""
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get("role") != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return fn(*args, **kwargs)
    return wrapper


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
    phone = data.get("phone")
    password = data.get("password")
    role = data.get("role", "patient")

    if not name or not email or not phone or not password:
        return jsonify({"error": "name, email, phone, and password are required"}), 400

    if role not in ("patient", "doctor", "admin"):
        return jsonify({"error": "role must be 'patient', 'doctor', or 'admin'"}), 400

    if User.find_by_email(email):
        return jsonify({"error": "Email already registered"}), 409

    # Create unverified user
    user = User.create(
        name=name,
        email=email,
        password=generate_password_hash(password),
        role=role,
        phone=phone,
        is_verified=False,
    )

    # Generate dual OTPs
    email_otp = str(random.randint(100000, 999999))
    phone_otp = str(random.randint(100000, 999999))
    expires_at = datetime.utcnow() + timedelta(minutes=10)

    # Store OTPs
    OTPVerification.create(
        user_id=user.id,
        email_otp=email_otp,
        phone_otp=phone_otp,
        expires_at=expires_at,
    )

    # Print OTPs to console (simulating SMS/Email dispatch)
    print(f"\n=== OTP Sent to {email} ===")
    print(f"Email OTP: {email_otp}")
    print(f"Phone OTP ({phone}): {phone_otp}")
    print(f"Expires at: {expires_at}\n")

    return jsonify(
        {
            "user_id": user.id,
            "message": "OTPs sent to email and phone. Please verify to activate your account.",
        }
    ), 201


@app.route("/api/verify-otp", methods=["POST"])
def verify_otp():
    """Verify email and phone OTPs and activate account."""
    data = request.get_json(silent=True) or {}

    user_id = data.get("user_id")
    email_otp = data.get("email_otp")
    phone_otp = data.get("phone_otp")

    if user_id is None or not email_otp or not phone_otp:
        return jsonify({"error": "user_id, email_otp, and phone_otp are required"}), 400

    # Fetch user by ID
    conn = get_connection()
    cursor = conn.cursor(dictionary=True)
    try:
        cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
        row = cursor.fetchone()
        if row:
            user = User.from_row(row)
        else:
            user = None
    finally:
        cursor.close()
        conn.close()
    
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Fetch OTP record
    otp_record = OTPVerification.find_by_user_id(user_id)
    if not otp_record:
        return jsonify({"error": "No OTP found for this user"}), 400

    # Check expiration
    if datetime.fromisoformat(otp_record.expires_at.isoformat()) < datetime.utcnow():
        return jsonify({"error": "OTP expired. Please request a new one."}), 400

    # Verify OTPs
    if otp_record.email_otp != email_otp or otp_record.phone_otp != phone_otp:
        return jsonify({"error": "Invalid OTP. Please check and try again."}), 401

    # Mark user as verified
    conn = get_connection()
    cursor = conn.cursor()
    try:
        cursor.execute(
            "UPDATE users SET is_verified = TRUE WHERE id = %s",
            (user_id,),
        )
        # Delete OTP record
        cursor.execute("DELETE FROM otp_verifications WHERE user_id = %s", (user_id,))
        conn.commit()
    finally:
        cursor.close()
        conn.close()

    # Generate JWT token
    access_token = create_access_token(identity=str(user.id))

    return jsonify(
        {
            "message": "Account verified successfully",
            "access_token": access_token,
            "user_id": user.id,
        }
    ), 200


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

    # Check if account is verified
    if not user.is_verified:
        return jsonify({"error": "Account not verified. Please verify OTP."}), 403

    # Generate JWT token
    access_token = create_access_token(identity=str(user.id))

    return jsonify(
        {
            "access_token": access_token,
            "user_id": user.id,
            "user": user.to_dict(),
        }
    ), 200


@app.route("/api/doctors", methods=["GET"])
def get_doctors():
    doctor_rows = User.find_all_doctors_with_profiles()
    result = []
    for row in doctor_rows:
        doctor_data = User.from_row(row).to_dict()
        doctor_data.update(
            {
                "speciality": row.get("specialty"),
                "available_from": format_availability_time(row.get("available_from")),
                "available_to": format_availability_time(row.get("available_to")),
            }
        )
        result.append(doctor_data)
        print("result",result)
    return jsonify(result), 200


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

    requested_time = parse_appointment_time(time)
    if requested_time is None:
        return jsonify({"error": "Invalid appointment time"}), 400

    doctor_profile = DoctorProfile.find_by_user_id(doctor_id)
    if not doctor_profile or not doctor_profile.available_from or not doctor_profile.available_to:
        return jsonify({"error": "Doctor availability is not configured"}), 400

    requested_seconds = time_to_seconds(requested_time)
    available_from_seconds = time_to_seconds(doctor_profile.available_from)
    available_to_seconds = time_to_seconds(doctor_profile.available_to)

    
    if None in (requested_seconds, available_from_seconds, available_to_seconds):
        return jsonify({"error": "Doctor availability is invalid"}), 400

    if not available_from_seconds <= requested_seconds <= available_to_seconds:
        return jsonify({"error": "Appointment time is outside the doctor's availability"}), 400
    
    # Check if doctor is unavailable on this date
    if DoctorUnavailability.find_by_doctor_and_date(doctor_id, date):
        return jsonify({"error": "Doctor is unavailable on this date"}), 400

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


# Admin Doctor Management Endpoints

@app.route("/api/admin/doctors", methods=["POST"])
@admin_required
def create_doctor():
    """Create a new doctor user and profile."""
    data = request.get_json(silent=True) or {}

    name = data.get("name")
    email = data.get("email")
    phone = data.get("phone")
    password = data.get("password")
    specialty = data.get("specialty")
    available_from = data.get("available_from")
    available_to = data.get("available_to")

    if not all([name, email, phone, password, specialty, available_from, available_to]):
        return jsonify({
            "error": "name, email, phone, password, specialty, available_from, and available_to are required"
        }), 400

    if User.find_by_email(email):
        return jsonify({"error": "Email already registered"}), 409

    # Create doctor user (auto-verified)
    user = User.create(
        name=name,
        email=email,
        password=generate_password_hash(password),
        role="doctor",
        phone=phone,
        is_verified=True,
    )

    # Create doctor profile
    DoctorProfile.create(
        user_id=user.id,
        specialty=specialty,
        available_from=available_from,
        available_to=available_to,
    )

    return jsonify({
        "message": "Doctor created successfully",
        "doctor": user.to_dict(),
    }), 201


@app.route("/api/admin/doctors/<int:doctor_id>", methods=["DELETE"])
@admin_required
def delete_doctor(doctor_id):
    """Delete a doctor and all records owned by their profile."""
    doctor = User.find_by_id_and_role(doctor_id, "doctor")
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    conn = get_connection()
    cursor = conn.cursor()
    try:
        # Appointments reference the doctor without ON DELETE CASCADE.
        cursor.execute("DELETE FROM appointments WHERE doctor_id = %s", (doctor_id,))
        cursor.execute("DELETE FROM doctor_profiles WHERE user_id = %s", (doctor_id,))
        cursor.execute("DELETE FROM doctor_unavailability WHERE doctor_id = %s", (doctor_id,))
        cursor.execute("DELETE FROM users WHERE id = %s AND role = 'doctor'", (doctor_id,))
        conn.commit()
    except MySQLError:
        conn.rollback()
        return jsonify({"error": "Unable to delete doctor"}), 500
    finally:
        cursor.close()
        conn.close()

    return jsonify({"message": "Doctor deleted successfully"}), 200


@app.route("/api/admin/doctors/<int:doctor_id>/unavailable", methods=["POST"])
@admin_required
def set_doctor_unavailable(doctor_id):
    """Mark a doctor as unavailable on a specific date and cancel their appointments."""
    data = request.get_json(silent=True) or {}
    date = data.get("date")

    if not date:
        return jsonify({"error": "date is required"}), 400

    doctor = User.find_by_id_and_role(doctor_id, "doctor")
    if not doctor:
        return jsonify({"error": "Doctor not found"}), 404

    # Check if already marked unavailable
    if DoctorUnavailability.find_by_doctor_and_date(doctor_id, date):
        return jsonify({"error": "Doctor already marked unavailable on this date"}), 409

    # Add unavailability record
    DoctorUnavailability.create(doctor_id=doctor_id, unavailable_date=date)

    # Find all scheduled appointments for this doctor on this date and cancel them
    appointments = Appointment.find_by_doctor_and_date(doctor_id, date)
    
    cancelled_count = 0
    for appointment in appointments:
        if appointment.status == "scheduled":
            appointment.update_status("cancelled")
            
            # Get patient info for SMS simulation
            patient = User.find_by_id(appointment.patient_id)
            if patient:
                print(f"[SMS Simulation] Sent to {patient.phone}: Your appointment on {date} with Dr. {doctor.name} has been cancelled.")
            
            cancelled_count += 1

    return jsonify({
        "message": f"Doctor marked unavailable. {cancelled_count} appointments cancelled.",
        "cancelled_count": cancelled_count,
    }), 200


# Patient Tracking Endpoints

@app.route("/api/patient/appointments", methods=["GET"])
@jwt_required()
def get_patient_appointments():
    """Get all appointments for the currently logged-in patient."""
    patient_id = get_jwt_identity()

    # Get patient's appointments
    appointments = Appointment.find_by_patient_id(patient_id)
    
    result = []
    for appointment in appointments:
        doctor = User.find_by_id(appointment.doctor_id)
        doctor_profile = DoctorProfile.find_by_user_id(appointment.doctor_id) if doctor else None
        
        result.append({
            "id": appointment.id,
            "date": appointment.date,
            "time": appointment.time,
            "status": appointment.status,
            "doctor": {
                "id": doctor.id,
                "name": doctor.name,
                "email": doctor.email,
                "phone": doctor.phone,
                "specialty": doctor_profile.specialty if doctor_profile else None,
            } if doctor else None,
        })

    return jsonify({"appointments": result}), 200


init_db()



if __name__ == "__main__":
    app.run(debug=True, port=5000)
