from pydantic import BaseModel
from typing import List, Optional

class Patient(BaseModel):
    age: int
    gender: str
    weight: float
    allergies: List[str] = []
    medical_history: List[str] = []

class Symptoms(BaseModel):
    fever: float
    cough: bool
    dyspnea: bool

class BiologicalAnalysis(BaseModel):
    crp: float
    leukocytes: float
    creatinine: float
    asat: float
    alat: float

class Imaging(BaseModel):
    pulmonary_opacity: bool
