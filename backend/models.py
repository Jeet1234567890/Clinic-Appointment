from db import get_connection

VALID_ROLES = ("admin", "doctor", "patient")
APPOINTMENT_STATUSES = ("scheduled", "cancelled", "completed")


class User:
    def __init__(
        self,
        id,
        name,
        email,
        password,
        role,
        phone=None,
        is_verified=False,
    ):
        self.id = id
        self.name = name
        self.email = email
        self.password = password
        self.role = role
        self.phone = phone
        self.is_verified = is_verified

    @classmethod
    def from_row(cls, row):
        return cls(
            id=row["id"],
            name=row["name"],
            email=row["email"],
            password=row["password"],
            role=row["role"],
            phone=row.get("phone"),
            is_verified=bool(row.get("is_verified", False)),
        )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
            "phone": self.phone,
            "is_verified": self.is_verified,
        }

    @classmethod
    def find_by_email(cls, email):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM users WHERE email = %s", (email,))
            row = cursor.fetchone()
            return cls.from_row(row) if row else None
        finally:
            cursor.close()
            conn.close()

    @classmethod
    def find_by_id_and_role(cls, user_id, role):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                "SELECT * FROM users WHERE id = %s AND role = %s",
                (user_id, role),
            )
            row = cursor.fetchone()
            return cls.from_row(row) if row else None
        finally:
            cursor.close()
            conn.close()

    @classmethod
    def find_all_by_role(cls, role):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM users WHERE role = %s", (role,))
            return [cls.from_row(row) for row in cursor.fetchall()]
        finally:
            cursor.close()
            conn.close()

    @classmethod
    def find_all_doctors_with_profiles(cls):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT
                    u.*,
                    p.specialty,
                    p.available_from,
                    p.available_to
                FROM users u
                LEFT JOIN doctor_profiles p ON p.user_id = u.id
                WHERE u.role = %s
                ORDER BY u.id
                """,
                ("doctor",),
            )
            return cursor.fetchall()
        finally:
            cursor.close()
            conn.close()
            
    @classmethod
    def find_by_id(cls, user_id):
        """Find user by ID regardless of role."""
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute("SELECT * FROM users WHERE id = %s", (user_id,))
            row = cursor.fetchone()
            return cls.from_row(row) if row else None
        finally:
            cursor.close()
            conn.close()

    def delete(self):
        """Delete this user from database."""
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute("DELETE FROM users WHERE id = %s", (self.id,))
            conn.commit()
        finally:
            cursor.close()
            conn.close()

    @classmethod
    def create(cls, name, email, password, role, phone=None, is_verified=False):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                INSERT INTO users (name, email, password, role, phone, is_verified)
                VALUES (%s, %s, %s, %s, %s, %s)
                """,
                (name, email, password, role, phone, is_verified),
            )
            conn.commit()
            user_id = cursor.lastrowid
        finally:
            cursor.close()
            conn.close()

        return cls(
            id=user_id,
            name=name,
            email=email,
            password=password,
            role=role,
            phone=phone,
            is_verified=is_verified,
        )


class OTPVerification:
    def __init__(self, id, user_id, email_otp, phone_otp, expires_at):
        self.id = id
        self.user_id = user_id
        self.email_otp = email_otp
        self.phone_otp = phone_otp
        self.expires_at = expires_at

    @classmethod
    def from_row(cls, row):
        return cls(
            id=row["id"],
            user_id=row["user_id"],
            email_otp=row["email_otp"],
            phone_otp=row["phone_otp"],
            expires_at=row["expires_at"],
        )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "email_otp": self.email_otp,
            "phone_otp": self.phone_otp,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
        }

    @classmethod
    def find_by_user_id(cls, user_id):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT * FROM otp_verifications
                WHERE user_id = %s
                ORDER BY expires_at DESC
                LIMIT 1
                """,
                (user_id,),
            )
            row = cursor.fetchone()
            return cls.from_row(row) if row else None
        finally:
            cursor.close()
            conn.close()

    @classmethod
    def create(cls, user_id, email_otp, phone_otp, expires_at):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                INSERT INTO otp_verifications
                    (user_id, email_otp, phone_otp, expires_at)
                VALUES (%s, %s, %s, %s)
                """,
                (user_id, email_otp, phone_otp, expires_at),
            )
            conn.commit()
            otp_id = cursor.lastrowid
        finally:
            cursor.close()
            conn.close()

        return cls(
            id=otp_id,
            user_id=user_id,
            email_otp=email_otp,
            phone_otp=phone_otp,
            expires_at=expires_at,
        )


class DoctorProfile:
    def __init__(
        self,
        id,
        user_id,
        specialty,
        available_from,
        available_to,
    ):
        self.id = id
        self.user_id = user_id
        self.specialty = specialty
        self.available_from = available_from
        self.available_to = available_to

    @classmethod
    def from_row(cls, row):
        return cls(
            id=row["id"],
            user_id=row["user_id"],
            specialty=row["specialty"],
            available_from=row["available_from"],
            available_to=row["available_to"],
        )

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "specialty": self.specialty,
            "available_from": (
                self.available_from.isoformat() if self.available_from else None
            ),
            "available_to": (
                self.available_to.isoformat() if self.available_to else None
            ),
        }

    @classmethod
    def find_by_user_id(cls, user_id):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                "SELECT * FROM doctor_profiles WHERE user_id = %s",
                (user_id,),
            )
            row = cursor.fetchone()
            return cls.from_row(row) if row else None
        finally:
            cursor.close()
            conn.close()

    @classmethod
    def create(cls, user_id, specialty, available_from, available_to):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                INSERT INTO doctor_profiles
                    (user_id, specialty, available_from, available_to)
                VALUES (%s, %s, %s, %s)
                """,
                (user_id, specialty, available_from, available_to),
            )
            conn.commit()
            profile_id = cursor.lastrowid
        finally:
            cursor.close()
            conn.close()

        return cls(
            id=profile_id,
            user_id=user_id,
            specialty=specialty,
            available_from=available_from,
            available_to=available_to,
        )


class DoctorUnavailability:
    def __init__(self, id, doctor_id, unavailable_date):
        self.id = id
        self.doctor_id = doctor_id
        self.unavailable_date = unavailable_date

    @classmethod
    def from_row(cls, row):
        return cls(
            id=row["id"],
            doctor_id=row["doctor_id"],
            unavailable_date=row["unavailable_date"],
        )

    def to_dict(self):
        return {
            "id": self.id,
            "doctor_id": self.doctor_id,
            "unavailable_date": (
                self.unavailable_date.isoformat()
                if self.unavailable_date
                else None
            ),
        }

    @classmethod
    def find_by_doctor_and_date(cls, doctor_id, unavailable_date):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT * FROM doctor_unavailability
                WHERE doctor_id = %s AND unavailable_date = %s
                """,
                (doctor_id, unavailable_date),
            )
            row = cursor.fetchone()
            return cls.from_row(row) if row else None
        finally:
            cursor.close()
            conn.close()

    @classmethod
    def find_by_doctor_id(cls, doctor_id):
        """Find all unavailable dates for a doctor."""
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT * FROM doctor_unavailability
                WHERE doctor_id = %s
                """,
                (doctor_id,),
            )
            return [cls.from_row(row) for row in cursor.fetchall()]
        finally:
            cursor.close()
            conn.close()

    @classmethod
    def create(cls, doctor_id, unavailable_date):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                INSERT INTO doctor_unavailability (doctor_id, unavailable_date)
                VALUES (%s, %s)
                """,
                (doctor_id, unavailable_date),
            )
            conn.commit()
            record_id = cursor.lastrowid
        finally:
            cursor.close()
            conn.close()

        return cls(
            id=record_id,
            doctor_id=doctor_id,
            unavailable_date=unavailable_date,
        )


class Appointment:
    def __init__(
        self,
        id,
        doctor_id,
        patient_id,
        date,
        time,
        status="scheduled",
    ):
        self.id = id
        self.doctor_id = doctor_id
        self.patient_id = patient_id
        self.date = date
        self.time = time
        self.status = status

    @classmethod
    def from_row(cls, row):
        return cls(
            id=row["id"],
            doctor_id=row["doctor_id"],
            patient_id=row["patient_id"],
            date=row["date"],
            time=row["time"],
            status=row.get("status", "scheduled"),
        )

    def to_dict(self):
        return {
            "id": self.id,
            "doctor_id": self.doctor_id,
            "patient_id": self.patient_id,
            "date": self.date,
            "time": self.time,
            "status": self.status,
        }

    @classmethod
    def find_by_slot(cls, doctor_id, date, time):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT * FROM appointments
                WHERE doctor_id = %s AND `date` = %s AND `time` = %s
                """,
                (doctor_id, date, time),
            )
            row = cursor.fetchone()
            return cls.from_row(row) if row else None
        finally:
            cursor.close()
            conn.close()

    @classmethod
    def find_by_patient_id(cls, patient_id):
        """Find all appointments for a patient."""
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT * FROM appointments
                WHERE patient_id = %s
                ORDER BY `date` DESC, `time` DESC
                """,
                (patient_id,),
            )
            return [cls.from_row(row) for row in cursor.fetchall()]
        finally:
            cursor.close()
            conn.close()

    @classmethod
    def find_by_doctor_and_date(cls, doctor_id, date):
        """Find all appointments for a doctor on a specific date."""
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                SELECT * FROM appointments
                WHERE doctor_id = %s AND `date` = %s
                """,
                (doctor_id, date),
            )
            return [cls.from_row(row) for row in cursor.fetchall()]
        finally:
            cursor.close()
            conn.close()

    def update_status(self, new_status):
        """Update the status of this appointment."""
        conn = get_connection()
        cursor = conn.cursor()
        try:
            cursor.execute(
                """
                UPDATE appointments
                SET status = %s
                WHERE id = %s
                """,
                (new_status, self.id),
            )
            conn.commit()
            self.status = new_status
        finally:
            cursor.close()
            conn.close()

    @classmethod
    def create(cls, doctor_id, patient_id, date, time, status="scheduled"):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                INSERT INTO appointments
                    (doctor_id, patient_id, `date`, `time`, status)
                VALUES (%s, %s, %s, %s, %s)
                """,
                (doctor_id, patient_id, date, time, status),
            )
            conn.commit()
            appointment_id = cursor.lastrowid
        except Exception:
            conn.rollback()
            raise
        finally:
            cursor.close()
            conn.close()

        return cls(
            id=appointment_id,
            doctor_id=doctor_id,
            patient_id=patient_id,
            date=date,
            time=time,
            status=status,
        )
