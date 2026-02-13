from sqlalchemy import Column, Integer, String, JSON, DateTime
from sqlalchemy.sql import func
from backend.database.connection import Base

class ConsultationDB(Base):
    __tablename__ = "consultations"

    id = Column(Integer, primary_key=True, index=True)
    doctor_id = Column(String, default="default_doc") # Placeholder
    patient_data = Column(JSON)
    analysis_result = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
