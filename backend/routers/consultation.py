from fastapi import APIRouter, Depends, HTTPException, Header, Response
from sqlalchemy.orm import Session
from backend.models.consultation import ConsultationRequest, ConsultationResponse, BiologicalFlags, AIAnalysis, ConsultationRecord
from backend.services.biological_engine import analyze_biology
from backend.services.ollama_service import call_ollama, ask_chat
from backend.services.drug_optimizer import suggest_ma_options
from backend.database.connection import get_db
from backend.models.db_models import ConsultationDB, Patient
from backend.storage.json_store import get_store, use_json_store
import json
from pydantic import BaseModel

router = APIRouter()

def _format_any_block(val) -> str:
    if val is None:
        return ""
    if isinstance(val, dict):
        out = []
        for k, v in val.items():
            out.append(f"{k}: {v}")
        return "\n".join(out)
    if isinstance(val, list):
        return "\n".join([str(x) for x in val])
    return str(val)

def _simple_disease_probabilities(request: ConsultationRequest, bio_flags: dict) -> list[dict]:
    fever = 0.0
    try:
        fever = float(getattr(request.symptoms, "fever", 0) or 0)
    except Exception:
        fever = 0.0
    cough = bool(getattr(request.symptoms, "cough", False))
    dyspnea = bool(getattr(request.symptoms, "dyspnea", False))
    opacity = bool(getattr(request.imaging, "pulmonary_opacity", False))
    mh = []
    try:
        mh = list(getattr(request.patient, "medical_history", []) or [])
    except Exception:
        mh = []
    mh_l = " ".join([str(x).lower() for x in mh])
    asthma = "asthma" in mh_l
    copd = "copd" in mh_l
    heart = "heart" in mh_l
    inflammation = bool(bio_flags.get("inflammation"))
    infection = bool(bio_flags.get("infection_possible"))

    cands = [
        {"disease": "Community-acquired pneumonia", "icd10Code": "J18.9", "score": 0.0},
        {"disease": "Acute bronchitis", "icd10Code": "J20.9", "score": 0.0},
        {"disease": "COVID-19 / viral respiratory infection", "icd10Code": "U07.1", "score": 0.0},
        {"disease": "Asthma exacerbation", "icd10Code": "J45.901", "score": 0.0},
        {"disease": "COPD exacerbation", "icd10Code": "J44.1", "score": 0.0},
        {"disease": "Heart failure exacerbation", "icd10Code": "I50.9", "score": 0.0},
        {"disease": "Pulmonary embolism", "icd10Code": "I26.99", "score": 0.0},
    ]

    def add(name: str, delta: float):
        for c in cands:
            if c["disease"] == name:
                c["score"] = float(c.get("score") or 0) + float(delta)
                return

    if cough:
        add("Community-acquired pneumonia", 2)
        add("Acute bronchitis", 3)
        add("COVID-19 / viral respiratory infection", 2)
    if dyspnea:
        add("Community-acquired pneumonia", 2)
        add("Asthma exacerbation", 3)
        add("COPD exacerbation", 3)
        add("Heart failure exacerbation", 2)
        add("Pulmonary embolism", 2)
    if fever >= 38:
        add("Community-acquired pneumonia", 3)
        add("COVID-19 / viral respiratory infection", 2)
        add("Acute bronchitis", 1)
    if opacity:
        add("Community-acquired pneumonia", 5)
        add("Acute bronchitis", -2)
        add("Asthma exacerbation", -2)
        add("COPD exacerbation", -1)
    if infection or inflammation:
        add("Community-acquired pneumonia", 2)
        add("Acute bronchitis", 1)
    if asthma:
        add("Asthma exacerbation", 4)
    if copd:
        add("COPD exacerbation", 4)
    if heart:
        add("Heart failure exacerbation", 2)

    positives = [c for c in cands if (c.get("score") or 0) > 0]
    positives.sort(key=lambda x: float(x.get("score") or 0), reverse=True)
    positives = positives[:5]
    if not positives:
        return [{"disease": "Undifferentiated illness", "probability": 100}]
    total = sum([float(c.get("score") or 0) for c in positives]) or 1.0
    out = []
    for c in positives:
        prob = max(1, round((float(c.get("score") or 0) / total) * 100))
        item = {"disease": c["disease"], "probability": prob}
        if c.get("icd10Code"):
            item["icd10Code"] = c.get("icd10Code")
        out.append(item)
    s = sum([int(x.get("probability") or 0) for x in out])
    if out:
        out[0]["probability"] = int(out[0].get("probability") or 0) + (100 - s)
    return out

@router.post("/consultation", response_model=ConsultationResponse)
async def create_consultation(
    request: ConsultationRequest,
    db: Session = Depends(get_db),
    x_doctor_id: str | None = Header(default=None),
    x_patient_id: str | None = Header(default=None)
):
    if not x_patient_id:
        raise HTTPException(status_code=400, detail="patient_id is required")
    try:
        pid = int(x_patient_id)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid patient_id")
    if use_json_store():
        store = get_store()
        if not store.is_initialized():
            raise HTTPException(status_code=503, detail="JSON database not initialized. Call /api/db/init first.")
        pat = store.get_patient(pid)
        if not pat:
            raise HTTPException(status_code=404, detail="patient not found")
        if x_doctor_id and pat.get("doctor_id") != x_doctor_id:
            raise HTTPException(status_code=403, detail="patient does not belong to this doctor")
    else:
        patient = db.query(Patient).filter(Patient.id == pid).first()
        if not patient:
            raise HTTPException(status_code=404, detail="patient not found")
        if x_doctor_id and patient.doctor_id != x_doctor_id:
            raise HTTPException(status_code=403, detail="patient does not belong to this doctor")
    # 1. Biological Analysis
    bio_results = analyze_biology(request.biological_analysis)
    
    # 2. AI Analysis (Ollama)
    ai_results = call_ollama(request, bio_results)
    if isinstance(ai_results, dict) and "disease_probabilities" not in ai_results:
        try:
            ai_results["disease_probabilities"] = _simple_disease_probabilities(request, bio_results)
        except Exception:
            pass
    
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
    
    augmented_patient_data = request.model_dump()
    augmented_patient_data["patient_id"] = pid
    if use_json_store():
        store = get_store()
        rec = store.create_consultation(x_doctor_id or "default_doc", augmented_patient_data, response.model_dump())
        try:
            orientation = ai_analysis.therapeutic_orientation
            risks = ai_analysis.risk_alerts
            content = (
                f"Analyse enregistrée (ID {rec['id']}).\n"
                f"Orientation thérapeutique:\n{_format_any_block(orientation)}\n"
                f"Risques:\n{_format_any_block(risks)}"
            )
            store.append_chat_message(x_doctor_id or "default_doc", pid, "analysis", content)
        except Exception:
            pass
    else:
        db_consultation = ConsultationDB(
            doctor_id=x_doctor_id or "default_doc",
            patient_data=augmented_patient_data,
            analysis_result=response.model_dump()
        )
        db.add(db_consultation)
        db.commit()
        db.refresh(db_consultation)
    
    return response


class AnalysisReportPayload(BaseModel):
    patient: dict
    symptoms: dict | None = None
    labs: dict | None = None
    imaging: dict | None = None
    result: dict
    language: str = "fr"


@router.post("/consultation/report/pdf")
def export_consultation_report_pdf(
    payload: AnalysisReportPayload,
    x_doctor_id: str | None = Header(default=None),
    x_patient_id: str | None = Header(default=None),
):
    if not x_patient_id:
        raise HTTPException(status_code=400, detail="patient_id is required")
    try:
        pid = int(x_patient_id)
    except Exception:
        raise HTTPException(status_code=400, detail="invalid patient_id")
    if use_json_store():
        store = get_store()
        if not store.is_initialized():
            raise HTTPException(status_code=503, detail="JSON database not initialized. Call /api/db/init first.")
        pat = store.get_patient(pid)
        if not pat:
            raise HTTPException(status_code=404, detail="patient not found")
        if x_doctor_id and pat.get("doctor_id") != x_doctor_id:
            raise HTTPException(status_code=403, detail="patient does not belong to this doctor")
        doc = store.get_doctor(x_doctor_id or "default_doc")
        doctor_name = (doc.get("name") if doc else None) or "N/A"
        doctor_license = (doc.get("license_number") if doc else None) or "N/A"
        department = (doc.get("department") if doc else None) or ""
        stamp_path = (doc.get("stamp_path") if doc else None) or ""
    else:
        doctor_name = "N/A"
        doctor_license = "N/A"
        department = ""
        stamp_path = ""

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib.units import mm
    except Exception:
        raise HTTPException(status_code=500, detail="reportlab not installed on server")
    from io import BytesIO
    import os
    from datetime import datetime

    result = payload.result or {}
    ai_analysis = (result.get("ai_analysis") or {}) if isinstance(result, dict) else {}
    bio_flags = (result.get("biological_flags") or {}) if isinstance(result, dict) else {}
    extras = ai_analysis.get("extras") if isinstance(ai_analysis, dict) else None
    if not isinstance(extras, dict):
        extras = {}
    cost_comparisons = extras.get("cost_comparisons") or extras.get("medications_ma") or []
    if not isinstance(cost_comparisons, list):
        cost_comparisons = []

    patient = payload.patient or {}
    patient_name = patient.get("name") or patient.get("label") or f"ID: {pid}"
    patient_dob = patient.get("date_of_birth") or patient.get("dob") or ""
    patient_gender = patient.get("gender") or ""
    patient_age = patient.get("age") or ""

    def draw_wrapped(c, text: str, x: float, y: float, max_chars: int, line_h: float):
        if text is None:
            return y
        s = str(text)
        for line in s.splitlines() or [""]:
            chunk = line
            while len(chunk) > max_chars:
                c.drawString(x, y, chunk[:max_chars])
                y -= line_h
                chunk = chunk[max_chars:]
            c.drawString(x, y, chunk)
            y -= line_h
        return y

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 24 * mm
    c.setFont("Helvetica-Bold", 14)
    c.drawString(20 * mm, y, "Rapport d’analyse clinique (IA)")
    y -= 8 * mm
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, y, f"Médecin: {doctor_name}  |  N° Ordre: {doctor_license}")
    y -= 6 * mm
    if department:
        c.drawString(20 * mm, y, f"Spécialité/Service: {department}")
        y -= 6 * mm
    c.drawString(20 * mm, y, f"Patient: {patient_name}  |  ID: {pid}")
    y -= 6 * mm
    meta = []
    if patient_age != "":
        meta.append(f"Âge: {patient_age}")
    if patient_gender:
        meta.append(f"Sexe: {patient_gender}")
    if patient_dob:
        meta.append(f"Date de naissance: {patient_dob}")
    if meta:
        c.drawString(20 * mm, y, " · ".join(meta))
        y -= 8 * mm
    else:
        y -= 2 * mm

    c.setFont("Helvetica-Bold", 11)
    c.drawString(20 * mm, y, "Drapeaux biologiques")
    y -= 6 * mm
    c.setFont("Helvetica", 10)
    for k in ["inflammation", "infection_possible", "renal_risk", "liver_stress"]:
        val = bio_flags.get(k)
        c.drawString(20 * mm, y, f"- {k}: {'Oui' if val else 'Non'}")
        y -= 5 * mm

    y -= 2 * mm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(20 * mm, y, "Alertes de risque")
    y -= 6 * mm
    c.setFont("Helvetica", 10)
    y = draw_wrapped(c, _format_any_block(ai_analysis.get("risk_alerts")), 20 * mm, y, 100, 5 * mm)

    y -= 2 * mm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(20 * mm, y, "Orientation thérapeutique")
    y -= 6 * mm
    c.setFont("Helvetica", 10)
    y = draw_wrapped(c, _format_any_block(ai_analysis.get("therapeutic_orientation")), 20 * mm, y, 100, 5 * mm)

    y -= 2 * mm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(20 * mm, y, "Justification clinique")
    y -= 6 * mm
    c.setFont("Helvetica", 10)
    y = draw_wrapped(c, _format_any_block(ai_analysis.get("clinical_reasoning")), 20 * mm, y, 100, 5 * mm)

    if y < 70 * mm:
        c.showPage()
        y = height - 24 * mm

    c.setFont("Helvetica-Bold", 11)
    c.drawString(20 * mm, y, "Options thérapeutiques / coûts (indicatif)")
    y -= 6 * mm
    c.setFont("Helvetica", 9)
    for idx, opt in enumerate(cost_comparisons[:8], start=1):
        if not isinstance(opt, dict):
            continue
        cost_val = opt.get('estimatedCost', opt.get('price_mad', ''))
        line = f"{idx}. {opt.get('option','')} | {opt.get('description','')} | Coût: {cost_val} MAD | Efficacité: {opt.get('effectiveness','')}"
        y = draw_wrapped(c, line, 20 * mm, y, 110, 4.5 * mm)
        if y < 45 * mm:
            c.showPage()
            y = height - 24 * mm
            c.setFont("Helvetica", 9)

    y -= 2 * mm
    c.setFont("Helvetica", 9)
    y = draw_wrapped(c, _format_any_block(ai_analysis.get("disclaimer")), 20 * mm, y, 120, 4.5 * mm)

    c.setFont("Helvetica-Bold", 10)
    c.drawString(20 * mm, 35 * mm, "Signature et cachet du médecin")
    c.setFont("Helvetica", 10)
    c.line(20 * mm, 28 * mm, width - 80 * mm, 28 * mm)
    c.drawString(20 * mm, 23 * mm, "Signature:")
    c.drawRightString(width - 20 * mm, 23 * mm, datetime.utcnow().strftime("Date: %Y-%m-%d"))

    if stamp_path and os.path.exists(stamp_path):
        try:
            c.drawImage(stamp_path, width - 60 * mm, 18 * mm, 40 * mm, 30 * mm, preserveAspectRatio=True, mask='auto')
        except Exception:
            pass

    c.setFont("Helvetica", 9)
    c.drawRightString(width - 20 * mm, 15 * mm, datetime.utcnow().strftime("Généré le %Y-%m-%d %H:%M UTC"))
    c.showPage()
    c.save()
    pdf = buffer.getvalue()
    buffer.close()
    return Response(content=pdf, media_type="application/pdf", headers={"Content-Disposition": f"inline; filename=consultation_report_{pid}.pdf"})


@router.get("/consultation/{consultation_id}/pdf")
def export_consultation_pdf(consultation_id: int, doctor_id: str, patient_id: int, db: Session = Depends(get_db)):
    if use_json_store():
        store = get_store()
        if not store.is_initialized():
            raise HTTPException(status_code=503, detail="JSON database not initialized. Call /api/db/init first.")
        pat = store.get_patient(patient_id)
        if not pat:
            raise HTTPException(status_code=404, detail="patient not found")
        if pat.get("doctor_id") != doctor_id:
            raise HTTPException(status_code=403, detail="patient does not belong to this doctor")
        try:
            rows = store._load("consultations")
        except FileNotFoundError:
            rows = []
        rec = None
        for c in rows:
            if int(c.get("id", 0)) == int(consultation_id) and c.get("doctor_id") == doctor_id:
                rec = c
                break
        if not rec:
            raise HTTPException(status_code=404, detail="consultation not found")
        ar = rec.get("analysis_result") or {}
        doc = store.get_doctor(doctor_id)
        doctor_name = (doc.get("name") if doc else None) or "N/A"
        doctor_license = (doc.get("license_number") if doc else None) or "N/A"
        department = (doc.get("department") if doc else None) or ""
        stamp_path = (doc.get("stamp_path") if doc else None) or ""
        patient_name = f"{pat.get('first_name','')} {pat.get('last_name','')}".strip() or f"ID: {patient_id}"
        patient_dob = pat.get("date_of_birth") or ""
        patient_gender = pat.get("gender") or ""
        patient_age = ""
        try:
            if patient_dob:
                from datetime import date
                d = date.fromisoformat(patient_dob[:10])
                today = date.today()
                age = today.year - d.year - ((today.month, today.day) < (d.month, d.day))
                patient_age = str(age)
        except Exception:
            patient_age = ""
    else:
        db_rec = db.query(ConsultationDB).filter(ConsultationDB.id == consultation_id, ConsultationDB.doctor_id == doctor_id).first()
        if not db_rec:
            raise HTTPException(status_code=404, detail="consultation not found")
        ar = db_rec.analysis_result or {}
        doctor_name = "N/A"
        doctor_license = "N/A"
        department = ""
        stamp_path = ""
        patient_name = f"ID: {patient_id}"
        patient_dob = ""
        patient_gender = ""
        patient_age = ""

    try:
        from reportlab.lib.pagesizes import A4
        from reportlab.pdfgen import canvas
        from reportlab.lib.units import mm
    except Exception:
        raise HTTPException(status_code=500, detail="reportlab not installed on server")
    from io import BytesIO
    import os
    from datetime import datetime

    result = ar or {}
    ai_analysis = (result.get("ai_analysis") or {}) if isinstance(result, dict) else {}
    bio_flags = (result.get("biological_flags") or {}) if isinstance(result, dict) else {}
    extras = ai_analysis.get("extras") if isinstance(ai_analysis, dict) else None
    if not isinstance(extras, dict):
        extras = {}
    cost_comparisons = extras.get("cost_comparisons") or extras.get("medications_ma") or []
    if not isinstance(cost_comparisons, list):
        cost_comparisons = []

    def draw_wrapped(c, text: str, x: float, y: float, max_chars: int, line_h: float):
        if text is None:
            return y
        s = str(text)
        for line in s.splitlines() or [""]:
            chunk = line
            while len(chunk) > max_chars:
                c.drawString(x, y, chunk[:max_chars])
                y -= line_h
                chunk = chunk[max_chars:]
            c.drawString(x, y, chunk)
            y -= line_h
        return y

    buffer = BytesIO()
    c = canvas.Canvas(buffer, pagesize=A4)
    width, height = A4
    y = height - 24 * mm
    c.setFont("Helvetica-Bold", 14)
    c.drawString(20 * mm, y, "Rapport d’analyse clinique (IA)")
    y -= 8 * mm
    c.setFont("Helvetica", 10)
    c.drawString(20 * mm, y, f"Médecin: {doctor_name}  |  N° Ordre: {doctor_license}")
    y -= 6 * mm
    if department:
        c.drawString(20 * mm, y, f"Spécialité/Service: {department}")
        y -= 6 * mm
    c.drawString(20 * mm, y, f"Patient: {patient_name}  |  ID: {patient_id}")
    y -= 6 * mm
    meta = []
    if patient_age != "":
        meta.append(f"Âge: {patient_age}")
    if patient_gender:
        meta.append(f"Sexe: {patient_gender}")
    if patient_dob:
        meta.append(f"Date de naissance: {patient_dob}")
    if meta:
        c.drawString(20 * mm, y, " · ".join(meta))
        y -= 8 * mm
    else:
        y -= 2 * mm

    c.setFont("Helvetica-Bold", 11)
    c.drawString(20 * mm, y, "Drapeaux biologiques")
    y -= 6 * mm
    c.setFont("Helvetica", 10)
    for k in ["inflammation", "infection_possible", "renal_risk", "liver_stress"]:
        val = bio_flags.get(k)
        c.drawString(20 * mm, y, f"- {k}: {'Oui' if val else 'Non'}")
        y -= 5 * mm

    y -= 2 * mm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(20 * mm, y, "Alertes de risque")
    y -= 6 * mm
    c.setFont("Helvetica", 10)
    y = draw_wrapped(c, _format_any_block(ai_analysis.get("risk_alerts")), 20 * mm, y, 100, 5 * mm)

    y -= 2 * mm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(20 * mm, y, "Orientation thérapeutique")
    y -= 6 * mm
    c.setFont("Helvetica", 10)
    y = draw_wrapped(c, _format_any_block(ai_analysis.get("therapeutic_orientation")), 20 * mm, y, 100, 5 * mm)

    y -= 2 * mm
    c.setFont("Helvetica-Bold", 11)
    c.drawString(20 * mm, y, "Justification clinique")
    y -= 6 * mm
    c.setFont("Helvetica", 10)
    y = draw_wrapped(c, _format_any_block(ai_analysis.get("clinical_reasoning")), 20 * mm, y, 100, 5 * mm)

    if y < 70 * mm:
        c.showPage()
        y = height - 24 * mm

    c.setFont("Helvetica-Bold", 11)
    c.drawString(20 * mm, y, "Options thérapeutiques / coûts (indicatif)")
    y -= 6 * mm
    c.setFont("Helvetica", 9)
    for idx, opt in enumerate(cost_comparisons[:8], start=1):
        if not isinstance(opt, dict):
            continue
        cost_val = opt.get('estimatedCost', opt.get('price_mad', ''))
        line = f"{idx}. {opt.get('option','')} | {opt.get('description','')} | Coût: {cost_val} MAD | Efficacité: {opt.get('effectiveness','')}"
        y = draw_wrapped(c, line, 20 * mm, y, 110, 4.5 * mm)
        if y < 45 * mm:
            c.showPage()
            y = height - 24 * mm
            c.setFont("Helvetica", 9)

    y -= 2 * mm
    c.setFont("Helvetica", 9)
    y = draw_wrapped(c, _format_any_block(ai_analysis.get("disclaimer")), 20 * mm, y, 120, 4.5 * mm)

    c.setFont("Helvetica-Bold", 10)
    c.drawString(20 * mm, 35 * mm, "Signature et cachet du médecin")
    c.setFont("Helvetica", 10)
    c.line(20 * mm, 28 * mm, width - 80 * mm, 28 * mm)
    c.drawString(20 * mm, 23 * mm, "Signature:")
    c.drawRightString(width - 20 * mm, 23 * mm, datetime.utcnow().strftime("Date: %Y-%m-%d"))

    if stamp_path and os.path.exists(stamp_path):
        try:
            c.drawImage(stamp_path, width - 60 * mm, 18 * mm, 40 * mm, 30 * mm, preserveAspectRatio=True, mask='auto')
        except Exception:
            pass

    c.setFont("Helvetica", 9)
    c.drawRightString(width - 20 * mm, 15 * mm, datetime.utcnow().strftime("Généré le %Y-%m-%d %H:%M UTC"))
    c.showPage()
    c.save()
    pdf = buffer.getvalue()
    buffer.close()
    return Response(content=pdf, media_type="application/pdf", headers={"Content-Disposition": f"inline; filename=consultation_{consultation_id}.pdf"})

class ChatPayload(BaseModel):
    question: str
    context: str | None = None
    language: str = "fr"
    doctor_id: str | None = None
    patient_id: int | None = None

@router.post("/chat/ask")
def chat_ask(payload: ChatPayload):
    # If patient context is provided, validate and persist multi-turn chat
    doc_id = payload.doctor_id
    pid = payload.patient_id
    if doc_id and pid is not None:
        if use_json_store():
            store = get_store()
            pat = store.get_patient(pid)
            if not pat:
                raise HTTPException(status_code=404, detail="patient not found")
            if pat.get("doctor_id") != doc_id:
                raise HTTPException(status_code=403, detail="patient does not belong to this doctor")
            # Build contextual history
            history = store.get_chat_history(doc_id, pid)[-10:]
            context_block = {
                "history": history,
                "extra_context": payload.context or ""
            }
            res = ask_chat(payload.question, json.dumps(context_block, ensure_ascii=False), payload.language)
            # Persist turn
            store.append_chat_message(doc_id, pid, "user", payload.question)
            store.append_chat_message(doc_id, pid, "assistant", res.get("text", ""))
            return res
        else:
            # DB mode not implemented for chat in this hackathon setup
            pass
    # Fallback: stateless chat using provided context
    res = ask_chat(payload.question, payload.context or "", payload.language)
    return res

@router.get("/chat/history")
def chat_history(doctor_id: str, patient_id: int):
    if use_json_store():
        store = get_store()
        if not store.is_initialized():
            raise HTTPException(status_code=503, detail="JSON database not initialized. Call /api/db/init first.")
        pat = store.get_patient(patient_id)
        if not pat:
            raise HTTPException(status_code=404, detail="patient not found")
        if pat.get("doctor_id") != doctor_id:
            raise HTTPException(status_code=403, detail="patient does not belong to this doctor")
        return store.get_chat_history(doctor_id, patient_id)
    return []

@router.get("/consultation", response_model=list[ConsultationRecord])
def get_consultations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    consultations = db.query(ConsultationDB).offset(skip).limit(limit).all()
    # Map DB models to Pydantic models explicitly if needed, but Pydantic might handle it.
    # Given patient_data is a dict, and ConsultationRecord expects ConsultationRequest, 
    # we might need to parse it. Let's see if Pydantic does it automatically.
    # Actually, from_attributes=True usually handles object attributes.
    # If patient_data is a dict, it should work.
    return consultations

@router.get("/metrics/ai-usage")
def ai_usage_metrics(doctor_id: str | None = None, db: Session = Depends(get_db)):
    if use_json_store():
        store = get_store()
        try:
            rows = store._load("consultations")
        except FileNotFoundError:
            rows = []
        if doctor_id:
            rows = [r for r in rows if str(r.get("doctor_id") or "") == str(doctor_id)]
        total = len(rows)
        tokens_prompt = 0
        tokens_eval = 0
        durations = []
        by_day: dict[str, dict] = {}
        latest = []
        top_diseases: dict[str, int] = {}
        for c in rows:
            try:
                created_at = c.get("created_at")
                analysis = c.get("analysis_result") or {}
                ai_analysis = analysis.get("ai_analysis") or {}
                extras = ai_analysis.get("extras") or {}
                tp = extras.get("prompt_eval_count") or extras.get("prompt_tokens") or 0
                te = extras.get("eval_count") or extras.get("completion_tokens") or 0
                dur = extras.get("total_duration_ms") or 0
                tokens_prompt += int(tp)
                tokens_eval += int(te)
                if dur:
                    durations.append(float(dur))
                dp = extras.get("disease_probabilities") if isinstance(extras, dict) else None
                if isinstance(dp, list) and dp:
                    first = dp[0] if isinstance(dp[0], dict) else None
                    if isinstance(first, dict):
                        name = first.get("disease")
                        if name:
                            top_diseases[str(name)] = top_diseases.get(str(name), 0) + 1
                latest.append({
                    "id": c.get("id"),
                    "created_at": created_at,
                    "model": extras.get("model"),
                    "prompt_eval_count": tp,
                    "eval_count": te,
                    "total_duration_ms": dur,
                })
                if created_at:
                    day = created_at[:10]
                    d = by_day.get(day) or {"count": 0, "durations": []}
                    d["count"] = int(d.get("count") or 0) + 1
                    if dur:
                        d["durations"].append(float(dur))
                    by_day[day] = d
            except Exception:
                pass
        avg_duration = sum(durations) / len(durations) if durations else 0
        series = []
        for k, v in sorted(by_day.items()):
            ds = v.get("durations") or []
            avg_d = (sum(ds) / len(ds)) if ds else 0
            series.append({"date": k, "count": int(v.get("count") or 0), "avg_processing_ms": round(avg_d, 2)})
        top_list = [{"disease": k, "count": v} for k, v in sorted(top_diseases.items(), key=lambda x: x[1], reverse=True)[:10]]
        return {
            "total_consultations": total,
            "total_ai_analyses": total,
            "tokens": {
                "prompt_eval_count": tokens_prompt,
                "eval_count": tokens_eval,
                "total_tokens": tokens_prompt + tokens_eval
            },
            "avg_processing_ms": round(avg_duration, 2),
            "by_day": series,
            "top_diseases": top_list,
            "latest": sorted(latest, key=lambda x: (x["created_at"] or ""), reverse=True)[:10]
        }
    else:
        q = db.query(ConsultationDB)
        if doctor_id:
            q = q.filter(ConsultationDB.doctor_id == doctor_id)
        rows = q.all()
        total = len(rows)
        tokens_prompt = 0
        tokens_eval = 0
        durations = []
        by_day: dict[str, dict] = {}
        latest = []
        top_diseases: dict[str, int] = {}
        for c in rows:
            try:
                analysis = c.analysis_result
                extras = None
                if isinstance(analysis, dict):
                    extras = analysis.get("ai_analysis", {}).get("extras")
                if extras:
                    tp = extras.get("prompt_eval_count") or extras.get("prompt_tokens") or 0
                    te = extras.get("eval_count") or extras.get("completion_tokens") or 0
                    dur = extras.get("total_duration_ms") or 0
                    tokens_prompt += int(tp)
                    tokens_eval += int(te)
                    if dur:
                        durations.append(float(dur))
                    dp = extras.get("disease_probabilities") if isinstance(extras, dict) else None
                    if isinstance(dp, list) and dp:
                        first = dp[0] if isinstance(dp[0], dict) else None
                        if isinstance(first, dict):
                            name = first.get("disease")
                            if name:
                                top_diseases[str(name)] = top_diseases.get(str(name), 0) + 1
                    latest.append({
                        "id": c.id,
                        "created_at": c.created_at.isoformat() if c.created_at else None,
                        "model": extras.get("model"),
                        "prompt_eval_count": tp,
                        "eval_count": te,
                        "total_duration_ms": dur,
                    })
            except Exception:
                pass
            if c.created_at:
                day = c.created_at.date().isoformat()
                d = by_day.get(day) or {"count": 0, "durations": []}
                d["count"] = int(d.get("count") or 0) + 1
                if extras:
                    dur2 = extras.get("total_duration_ms") or 0
                    if dur2:
                        d["durations"].append(float(dur2))
                by_day[day] = d
        avg_duration = sum(durations) / len(durations) if durations else 0
        series = []
        for k, v in sorted(by_day.items()):
            ds = v.get("durations") or []
            avg_d = (sum(ds) / len(ds)) if ds else 0
            series.append({"date": k, "count": int(v.get("count") or 0), "avg_processing_ms": round(avg_d, 2)})
        top_list = [{"disease": k, "count": v} for k, v in sorted(top_diseases.items(), key=lambda x: x[1], reverse=True)[:10]]
        return {
            "total_consultations": total,
            "total_ai_analyses": total,
            "tokens": {
                "prompt_eval_count": tokens_prompt,
                "eval_count": tokens_eval,
                "total_tokens": tokens_prompt + tokens_eval
            },
            "avg_processing_ms": round(avg_duration, 2),
            "by_day": series,
            "top_diseases": top_list,
            "latest": sorted(latest, key=lambda x: (x["created_at"] or ""), reverse=True)[:10]
        }

@router.get("/timeline")
def patient_timeline(doctor_id: str, patient_id: int):
    if use_json_store():
        store = get_store()
        if not store.is_initialized():
            raise HTTPException(status_code=503, detail="JSON database not initialized. Call /api/db/init first.")
        pat = store.get_patient(patient_id)
        if not pat:
            raise HTTPException(status_code=404, detail="patient not found")
        if pat.get("doctor_id") != doctor_id:
            raise HTTPException(status_code=403, detail="patient does not belong to this doctor")
        try:
            cons = [c for c in store._load("consultations") if c.get("doctor_id") == doctor_id and (c.get("patient_data") or {}).get("patient_id") == patient_id]
        except FileNotFoundError:
            cons = []
        try:
            scans = [s for s in store._load("scans") if s.get("doctor_id") == doctor_id and int(s.get("patient_id", 0)) == int(patient_id)]
        except FileNotFoundError:
            scans = []
        try:
            rxs = [r for r in store._load("prescriptions") if r.get("doctor_id") == doctor_id and int(r.get("patient_id", 0)) == int(patient_id)]
        except FileNotFoundError:
            rxs = []
        chats = store.get_chat_history(doctor_id, patient_id)
        timeline = []
        for c in cons:
            ar = c.get("analysis_result") or {}
            ai = ar.get("ai_analysis") or {}
            timeline.append({
                "type": "analysis",
                "id": c.get("id"),
                "ts": c.get("created_at"),
                "orientation": ai.get("therapeutic_orientation"),
                "risks": ai.get("risk_alerts"),
                "flags": (ar.get("biological_flags") or {}),
                "clinical_reasoning": ai.get("clinical_reasoning"),
                "disclaimer": ai.get("disclaimer"),
                "extras": ai.get("extras")
            })
        for s in scans:
            timeline.append({
                "type": "scan",
                "id": s.get("id"),
                "ts": s.get("created_at"),
                "scan_type": s.get("scan_type"),
                "file_path": s.get("file_path"),
                "notes": s.get("notes")
            })
        for r in rxs:
            timeline.append({
                "type": "prescription",
                "id": r.get("id"),
                "ts": r.get("created_at"),
                "items": r.get("items"),
                "notes": r.get("notes")
            })
        for m in chats:
            timeline.append({
                "type": "chat",
                "role": m.get("role"),
                "content": m.get("content"),
                "ts": m.get("ts")
            })
        timeline.sort(key=lambda x: x.get("ts") or "")
        return timeline
    return []
