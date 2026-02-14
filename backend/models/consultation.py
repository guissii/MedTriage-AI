from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime
from .patient import Patient, Symptoms, BiologicalAnalysis, Imaging

class ConsultationRequest(BaseModel):
    patient: Patient
    symptoms: Symptoms
    biological_analysis: BiologicalAnalysis
    imaging: Imaging
    language: str = "fr"

class BiologicalFlags(BaseModel):
    inflammation: bool
    infection_possible: bool
    renal_risk: bool
    liver_stress: bool

class AIAnalysis(BaseModel):
    clinical_reasoning: Any
    risk_alerts: Any
    therapeutic_orientation: Any
    disclaimer: str
    extras: Any | None = None

class ConsultationResponse(BaseModel):
    biological_flags: BiologicalFlags
    ai_analysis: AIAnalysis
    ai_raw: Any | None = None

class ConsultationRecord(BaseModel):
    id: int
    doctor_id: str
    patient_data: ConsultationRequest
    analysis_result: ConsultationResponse
    created_at: datetime

    class Config:
        from_attributes = True
