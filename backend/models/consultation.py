from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime
from .patient import Patient, Symptoms, BiologicalAnalysis, Imaging

class ConsultationRequest(BaseModel):
    patient: Patient
    symptoms: Symptoms
    biological_analysis: BiologicalAnalysis
    imaging: Imaging

class BiologicalFlags(BaseModel):
    inflammation: bool
    infection_possible: bool
    renal_risk: bool
    liver_stress: bool

class AIAnalysis(BaseModel):
    clinical_reasoning: str
    risk_alerts: Any
    therapeutic_orientation: str
    disclaimer: str

class ConsultationResponse(BaseModel):
    biological_flags: BiologicalFlags
    ai_analysis: AIAnalysis

class ConsultationRecord(BaseModel):
    id: int
    doctor_id: str
    patient_data: ConsultationRequest
    analysis_result: ConsultationResponse
    created_at: datetime

    class Config:
        from_attributes = True
