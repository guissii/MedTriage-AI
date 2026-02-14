from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.models.consultation import ConsultationRequest, ConsultationResponse, BiologicalFlags, AIAnalysis, ConsultationRecord
from backend.services.biological_engine import analyze_biology
from backend.services.ollama_service import call_ollama
from backend.services.drug_optimizer import suggest_ma_options
from backend.database.connection import get_db
from backend.models.db_models import ConsultationDB
import json

router = APIRouter()

@router.post("/consultation", response_model=ConsultationResponse)
async def create_consultation(request: ConsultationRequest, db: Session = Depends(get_db)):
    # 1. Biological Analysis
    bio_results = analyze_biology(request.biological_analysis)
    
    # 2. AI Analysis (Ollama)
    ai_results = call_ollama(request, bio_results)
    
    # Construct response objects
    flags = BiologicalFlags(**bio_results)
    ma_opts = suggest_ma_options(request, bio_results, ai_results)
    ai_analysis = AIAnalysis(
        clinical_reasoning=ai_results.get("clinical_reasoning", "N/A"),
        risk_alerts=ai_results.get("risk_alerts", "N/A"),
        therapeutic_orientation=ai_results.get("therapeutic_orientation", "N/A"),
        disclaimer=ai_results.get("disclaimer", "AI generated."),
        extras={
            **{k: v for k, v in ai_results.items() if k not in ["clinical_reasoning", "risk_alerts", "therapeutic_orientation", "disclaimer"]},
            **ma_opts
        }
    )
    
    response = ConsultationResponse(
        biological_flags=flags,
        ai_analysis=ai_analysis,
        ai_raw=ai_results
    )
    
    # 3. Save to Database
    db_consultation = ConsultationDB(
        patient_data=request.model_dump(),
        analysis_result=response.model_dump()
    )
    db.add(db_consultation)
    db.commit()
    db.refresh(db_consultation)
    
    return response

@router.get("/consultation", response_model=list[ConsultationRecord])
def get_consultations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    consultations = db.query(ConsultationDB).offset(skip).limit(limit).all()
    # Map DB models to Pydantic models explicitly if needed, but Pydantic might handle it.
    # Given patient_data is a dict, and ConsultationRecord expects ConsultationRequest, 
    # we might need to parse it. Let's see if Pydantic does it automatically.
    # Actually, from_attributes=True usually handles object attributes.
    # If patient_data is a dict, it should work.
    return consultations
