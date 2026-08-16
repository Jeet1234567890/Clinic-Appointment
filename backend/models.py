from db import get_connection


class User:
    def __init__(self, id, name, email, password, role):
        self.id = id
        self.name = name
        self.email = email
        self.password = password
        self.role = role

    @classmethod
    def from_row(cls, row):
        return cls(
            id=row["id"],
            name=row["name"],
            email=row["email"],
            password=row["password"],
            role=row["role"],
        )

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "role": self.role,
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
    def create(cls, name, email, password, role):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                INSERT INTO users (name, email, password, role)
                VALUES (%s, %s, %s, %s)
                """,
                (name, email, password, role),
            )
            conn.commit()
            user_id = cursor.lastrowid
        finally:
            cursor.close()
            conn.close()

        return cls(id=user_id, name=name, email=email, password=password, role=role)


class Appointment:
    def __init__(self, id, doctor_id, patient_id, date, time):
        self.id = id
        self.doctor_id = doctor_id
        self.patient_id = patient_id
        self.date = date
        self.time = time

    @classmethod
    def from_row(cls, row):
        return cls(
            id=row["id"],
            doctor_id=row["doctor_id"],
            patient_id=row["patient_id"],
            date=row["date"],
            time=row["time"],
        )

    def to_dict(self):
        return {
            "id": self.id,
            "doctor_id": self.doctor_id,
            "patient_id": self.patient_id,
            "date": self.date,
            "time": self.time,
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
    def create(cls, doctor_id, patient_id, date, time):
        conn = get_connection()
        cursor = conn.cursor(dictionary=True)
        try:
            cursor.execute(
                """
                INSERT INTO appointments (doctor_id, patient_id, `date`, `time`)
                VALUES (%s, %s, %s, %s)
                """,
                (doctor_id, patient_id, date, time),
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
        )
