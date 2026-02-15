from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form
from sqlalchemy.orm import Session
import os
from uuid import uuid4
from backend.database.connection import get_db
from backend.models.db_models import Scan, Patient, Doctor
from backend.storage.json_store import get_store, use_json_store

router = APIRouter()

DEMO_DOCTOR_IDS = {"default_doc", "2", "3"}


@router.post("/scans/upload")
def upload_scan(
    doctor_id: str = Form(...),
    patient_id: int = Form(...),
    scan_type: str = Form("unknown"),
    notes: str = Form(""),
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    if use_json_store():
        store = get_store()
        if not store.is_initialized():
            raise HTTPException(status_code=503, detail="JSON database not initialized. Call /api/db/init first.")
        d = store.get_doctor(doctor_id)
        if not d:
            if doctor_id not in DEMO_DOCTOR_IDS:
                raise HTTPException(status_code=400, detail="Doctor not approved or not found")
        else:
            if d.get("status") != "approved":
                raise HTTPException(status_code=400, detail="Doctor not approved or not found")
        p = store.get_patient(patient_id)
        if not p or p.get("doctor_id") != doctor_id:
            raise HTTPException(status_code=400, detail="Patient not found for this doctor")
    else:
        doctor = db.query(Doctor).filter(Doctor.id == doctor_id, Doctor.status == "approved").first()
        if not doctor:
            raise HTTPException(status_code=400, detail="Doctor not approved or not found")
        patient = db.query(Patient).filter(Patient.id == patient_id, Patient.doctor_id == doctor_id).first()
        if not patient:
            raise HTTPException(status_code=400, detail="Patient not found for this doctor")
    # Save file
    os.makedirs("uploads/scans", exist_ok=True)
    filename = f"{uuid4()}_{file.filename}"
    out_path = os.path.join("uploads", "scans", filename)
    with open(out_path, "wb") as f:
        f.write(file.file.read())
    if use_json_store():
        store = get_store()
        rec = store.create_scan(doctor_id, patient_id, scan_type, out_path, notes)
        try:
            # Append an event in chat/timeline
            store.append_chat_message(doctor_id, patient_id, "event", f"Scan ajouté (type: {scan_type}) — ID {rec['id']}")
        except Exception:
            pass
        return {"id": rec["id"], "file_path": out_path}
    else:
        rec = Scan(
            doctor_id=doctor_id,
            patient_id=patient_id,
            scan_type=scan_type,
            file_path=out_path,
            notes=notes
        )
        db.add(rec)
        db.commit()
        db.refresh(rec)
        return {"id": rec.id, "file_path": out_path}
