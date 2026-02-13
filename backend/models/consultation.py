from pydantic import BaseModel
from typing import Dict, Any
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
    risk_alerts: str
    therapeutic_orientation: str
    disclaimer: str

class ConsultationResponse(BaseModel):
    biological_flags: BiologicalFlags
    ai_analysis: AIAnalysis
