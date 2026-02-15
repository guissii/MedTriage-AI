from sqlalchemy import Column, Integer, String, JSON, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from backend.database.connection import Base

class ConsultationDB(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(String, default="default_doc")  # Placeholder, links to Doctor.id
    patient_data = Column(JSON)
    analysis_result = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class Doctor(Base):
    __tablename__ = "doctors"

    id = Column(String, primary_key=True, index=True)  # e.g., UUID string
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)
    license_number = Column(String, unique=True, index=True, nullable=False)  # Numéro d'ordre/des médecins
    national_id = Column(String, index=True, nullable=False)  # CIN/CNIE
    status = Column(String, default="pending")  # pending | approved | rejected
    department = Column(String, default="")
    stamp_path = Column(String, default="")  # chemin du cachet uploadé
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    prescriptions = relationship("Prescription", back_populates="doctor", cascade="all,delete-orphan")


class Patient(Base):
    __tablename__ = "patients"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    doctor_id = Column(String, ForeignKey("doctors.id"), nullable=False)
    first_name = Column(String, nullable=False)
    last_name = Column(String, nullable=False)
    date_of_birth = Column(String, default="")
    gender = Column(String, default="")
    medical_history = Column(JSON, default=[])
    allergies = Column(JSON, default=[])
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    doctor = relationship("Doctor")
    prescriptions = relationship("Prescription", back_populates="patient", cascade="all,delete-orphan")
    scans = relationship("Scan", back_populates="patient", cascade="all,delete-orphan")


class Prescription(Base):
    __tablename__ = "prescriptions"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    doctor_id = Column(String, ForeignKey("doctors.id"), nullable=False)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    items = Column(JSON, nullable=False)  # [{name, dosage, frequency, duration, notes}]
    notes = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    doctor = relationship("Doctor", back_populates="prescriptions")
    patient = relationship("Patient", back_populates="prescriptions")


class Scan(Base):
    __tablename__ = "scans"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    doctor_id = Column(String, ForeignKey("doctors.id"), nullable=False)
    scan_type = Column(String, default="unknown")  # xray | ct | mri | ultrasound | other
    file_path = Column(String, nullable=False)
    notes = Column(Text, default="")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    patient = relationship("Patient", back_populates="scans")
    doctor = relationship("Doctor")
